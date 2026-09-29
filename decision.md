# Architecture Decisions

## Session Status Lifecycle

**Date:** 2026-09-21

### Status Flow
```
scheduled → live → completed
    |          |
    +→ cancelled +→ expired
```

### Transitions
| From | To | Trigger | Implementation |
|------|-----|---------|----------------|
| (new, with scheduled_at) | `scheduled` | Session created | `createSession` service |
| (new, no scheduled_at) | `live` | Session created | `createSession` service |
| `scheduled` | `live` | `scheduled_at` time arrives | **Cron job** (every 60s) |
| `live` | `completed` | Host clicks complete | `completeSession` API |
| `live` | `expired` | `expires_at` time passes | **Cron job** (every 60s) |
| `scheduled` | `cancelled` | Host clicks cancel | `cancelSession` API |

### Implementation Details
- **Backend cron**: `node-cron` runs every 60s, auto-starts scheduled sessions and auto-expires live sessions
- **Frontend polling**: `useSessionStatusPoller` hook polls every 30s, detects status changes, shows toast on any page
- **No WebSocket for status changes**: Polling is sufficient. WebSocket will be added later for real-time collaboration (live room)
- **Cancel button**: Added to EditSessionModal with confirmation dialog

### Rationale
- Cron is simple, reliable, and doesn't require external infrastructure
- 30s polling keeps UI fresh without excessive server load
- Toast notifications on any page via global `DashboardLayout` hook
- User cannot manually expire sessions — only cancel (scheduled) or complete (live)

---

# Session Detail (Reports) Page — Data Fetching

**Date:** 2026-09-25

## Decision: Single enhanced query over multiple fetches

`GET /api/session/:id` returns everything the detail page needs in **one** query:

```sql
SELECT s.id, s.created_by, s.question_id, s.mode, s.status, s.access_token,
       s.role_context, s.language, s.scheduled_at, s.duration_minutes,
       s.started_at, s.ended_at, s.expires_at, s.created_at,
       sp.display_name AS candidate_name, sp.email AS candidate_email,
       se.rating, se.notes, q.title AS question_title
FROM sessions s
LEFT JOIN session_participants sp ON sp.session_id = s.id AND sp.role = 'guest'
LEFT JOIN session_evaluations se ON se.session_id = s.id AND se.evaluated_participant_id = sp.id
LEFT JOIN questions q ON q.id = s.question_id
WHERE s.created_by = $1 AND s.id = $2
```

Session columns are listed explicitly (not `s.*`) so the API contract is visible in code.

### Report fields
- Show: `scheduled_at`, `created_at`, `duration_minutes`, `started_at`, `ended_at`
- `started_at` / `ended_at` shown — they tell whether the session ran on time
- `expires_at` returned but **not rendered** — it's just `scheduled_at + duration` (internal cron timer), redundant on screen
- Question shown by **title only** — no description on the reports page

### Rationale
- Detail page is a single page → independent caching of sub-resources buys nothing
- One HTTP request instead of 2–3 (session + evaluation + question)
- Notes edits invalidate `['session', sessionId]` → whole page refreshes consistently

### Service separation
- **`getSessionById`** — kept unchanged (`SELECT *`), still used as ownership check by `saveNotes`, `getEvaluation`, `getSessionEvents`, `evaluateUser`
- **`getSessionDetail`** — new, used only by the `GET /api/session/:id` endpoint

### Type
`SessionDetail extends Session` adds `notes` and `questions: SessionQuestionRef[]`
(`{ id, title, position }`, ordered by `position`).
`candidate_name` / `candidate_email` / `rating` remain optional on `Session` (LEFT JOIN may be NULL).

### Notes access
- Notes live **only** on the detail page (no column/popup on the sessions table)
- Edit allowed only for `live` / `completed` sessions (backend constraint)

# Multiple Questions per Session

## Decision: `session_questions` join table

`sessions` keeps a single `question_id` for backward compatibility (CSV export, list
joins, existing reports). The ordered set of questions lives in:

```sql
create table session_questions (
    session_id uuid not null references sessions(id) on delete cascade,
    question_id uuid not null references questions(id) on delete cascade,
    position int not null default 0,
    primary key (session_id, question_id)
);
```

### Invariant
`sessions.question_id ===` the row with the lowest `position` in `session_questions`.
Every write path keeps this true (`createSession`, `updateSession`, `changeQuestion`),
so readers that only have the `sessions` row still see a correct primary question.

### API contract — `question_ids`
- `question_ids: string[]` added to `CreateSessionBody` (also accepted on `PATCH /api/session/:id`)
- `undefined` → **leave questions untouched** (partial update semantics)
- `[]` → **clear** all questions, `question_id` becomes `NULL`
- `["a","b",…]` → replace, in the given order; duplicates are de-duped
- legacy `question_id: string` still accepted and mapped to a one-element list
- validation is `z.array(z.string()).max(50)` — same looseness as the legacy
  `question_id: z.string()`, because seeded/fixture ids are not RFC-4122 uuids and
  postgres accepts them anyway; stricter `z.uuid()` rejected valid app data

`syncSessionQuestions()` is a delete-and-insert (positions `0..n-1`) inside the same
transaction as the parent row for `createSession`.

## Question resolution and list pagination

`GET /api/question` is hard-paginated at **21 per page**, so a session that references
a question outside page 1 could not be rendered or round-tripped by an editor.

Added an `ids` query parameter (comma-separated, capped at 50):

```
GET /api/question?ids=<uuid>,<uuid>
```

- returns exactly those questions the caller owns, ignoring `search`/`difficulty`/paging
- invalid entries are filtered out rather than rejected
- used only by the picker to hydrate selections it cannot find in the cached page-1 list

## UI: shared `QuestionPicker`

One component (`features/sessions/components/QuestionPicker.tsx`) is used by both the
Create wizard (`StepQuestion`) and `EditSessionModal`, so create and edit can never drift:

- ordered **Selected** list (position badge, title, difficulty) with `↑ ↓ ✕` and *Clear all*
- searchable **Available** list with checkboxes
- **language union** across the selected questions; `resolveSessionLanguage()` keeps the
  current language when still valid, otherwise falls back to the preference default, then
  the first available
- silently re-fetches any selected id that is not in the loaded page (the `ids` resolver)

Selection order in the UI is the `position` order in the DB — verified end to end.

### Future work
Adding more questions **during a live session** is not built yet. `changeQuestion`
(`PATCH /api/session/:id/question`) already preserves the rest of the list and promotes
the requested question to `position 0` (it is the "current" one), which is the primitive
that flow will need.

# Database Schema — Single Source of Truth

## Decision: `src/db/schema.sql` is canonical; migrations are historical

`schema.sql` was drifting behind the migrations (`002_starter_code_jsonb`,
`003_session_questions`). It is now the authoritative definition of the database.

- **`schema.sql`** — canonical. A fresh database built from it must be structurally
  identical to production: same tables, columns **in the same order**, types,
  nullability, defaults, constraints, indexes and enums.
- **`src/db/migrations/*.sql`** — historical increments, only for databases created
  before a change. They are never the source of truth and must not diverge.

### Verification (run after every schema change)
```bash
createdb check && psql -d check -v ON_ERROR_STOP=1 -f apps/server/src/db/schema.sql
pg_dump --schema-only --no-owner --no-privileges <db>   # diff the two dumps
```
A random pg_dump `\restrict`/`\unrestrict` token is the only expected difference.

### Why column *order* is kept in lockstep
Ordinal position drifted on `sessions` (`language`, `ended_at` appended by
`ALTER TABLE`) and `users` (`email_verified`). `schema.sql` now matches the live
order rather than an idealised one, so a regenerated dump is byte-identical and
`INSERT … VALUES` without a column list behaves the same everywhere.

### Structure
`schema.sql` is ordered: extension → enum types → tables → indexes, with no
interleaving, so missing objects are easy to spot in review.

# Reporting Periods — One Shared Definition

## Problem
The dashboard and Reports measured "now" two different ways, and the dashboard's
month-over-month delta was mathematically wrong.

- Dashboard used a **calendar month** window and compared it against **all of last month**.
- Reports used **rolling** 7/30/90-day windows.

On the 1st of a month `thisMonth` held hours of data while `lastMonth` held a full 31
days, so `sessionTrend` and `durationTrend` swung to a large negative number and then
climbed back all month. The windowing was defensible; the comparison was not.

## Decision 1 — Day-of-month alignment for the dashboard delta

The comparison window is now the **same number of elapsed days** as the current period:

```sql
-- current:  Sep 1 00:00 .. end of month
-- baseline: Aug 1 00:00 .. Aug 1 + (NOW() - Sep 1 00:00)
date_trunc('month', CURRENT_DATE - interval '1 month')
  + (NOW() - date_trunc('month', CURRENT_DATE))
```

Verified: on Sep 26 the baseline is Aug 1–26 (8 sessions), not Aug 1–31 (9 sessions),
against Sep 1–26 (20 sessions). The delta is now honest on every day of the month and
is ~0 by definition on the 1st, instead of a false collapse.

## Decision 2 — One `Period` definition on the server

`src/utils/period.ts` is the only place that turns a range into SQL. Every range-based
query — dashboard and Reports, JSON and CSV alike — goes through `getPeriod()`, so the
two features cannot drift apart again.

## Decision 3 — Reports gained calendar ranges

`ReportsRange` is now `'7d' | '30d' | '90d' | 'month' | 'year'`, and the filter shows
**7d / 30d / 90d / This month / This year**.

This exists so the two pages are reconcilable: without it a user sees Reports say 12 and
the dashboard say 3 and has no way to tell which is right.

### Bucketing
| range    | bucket                |
|----------|-----------------------|
| 7d       | day                   |
| 30d      | day                   |
| 90d      | week                  |
| month    | day                   |
| year     | month                 |

Rolling and calendar windows are deliberately **not** unified: a dashboard wants
"current period vs prior period", Reports wants "pick a range and export it". Same
vocabulary, different jobs.

# Realtime — Two Channels, One WebSocket Server

## Problem
The server had **two** `WebSocketServer` instances, each registering its own `upgrade`
listener on the same `http.Server` — one in `src/ws/index.ts` (`/ws`, JSON events), one in
`src/collab/index.ts` (`/collaboration`, Yjs binary). Working, but ~90 lines of duplicated
auth boilerplate and two socket registries. It also read as "two WebSocket servers", which
was genuinely confusing when navigating the codebase.

## Decision
**One `WebSocketServer`, one `upgrade` listener, dispatch by pathname.** `src/ws/index.ts`
now owns both; `src/collab/index.ts` is deleted and only `src/collab/auth.ts` survives (its
parser reads `sessionId` from the path segment, so it is not the same as the events parser).

```
server.on("upgrade")
  ├─ /ws                    → extractConnectionInfo     → verifyParticipant → joinRoom + handleMessage
  └─ /collaboration/<id>    → parseCollabConnectionInfo → verifyParticipant → setupWSConnection
```

## Why the channels stay separate
Two *routes* are non-negotiable — the wire protocols differ (JSON text frames vs binary Yjs
CRDT updates). The Yjs channel needs a state-vector handshake, awareness broadcasts and
incremental binary diffs; merging them onto one socket would mean reimplementing the Yjs
sync protocol by hand. Two routes, one server, one process.

## Collab sockets are deliberately kept out of the events room
`connectionManager.rooms` drives `broadcast()`, which sends **JSON** `WsMessage` frames.
A `/collaboration` socket is a `y-websocket` provider speaking a **binary** protocol.
Registering it in that room would inject JSON text frames into the CRDT stream and corrupt
it. So collab sockets get `setupWSConnection` and nothing else.

Consequence: `getRoomSize(sessionId)` counts **events-channel** members only. That is the
correct meaning — it answers "how many people are watching the event channel", not
"how many sockets exist".

## Relay version pin
`@y/websocket-server` is held at **0.1.1** (pinned, no caret). `0.1.5` hard-depends on
`yjs ^14.0.0-7`; `0.1.1` takes `yjs ^13.5.6` as a *peer*, so it uses the app's own Yjs.
Mixing majors means incompatible CRDT wire formats and silent sync failure. The v13 line
stops at `0.1.1` — do not let a range float onto `0.1.5`.

# Joining a Session

## Decision: identity source follows authentication, not the form
`POST /api/session/join` now has three identity paths:

| Visitor | Name / email | Consent |
|---|---|---|
| **Host** (owner) | from `users` | implicit `true` |
| **Authenticated guest** | from `users` — **never re-asked** | asked |
| **Anonymous guest** | asked in the form | asked |

Previously every non-host fell through one branch, so a signed-in candidate was made to
retype a name and email the system already held. Any `display_name` / `email` sent by an
authenticated guest is **ignored** — the account is authoritative (covered by a test).
`joinSessionSchema` needed no change: both fields were already optional, and the
"required" rule only ever existed in the service.

**Consent is asked on every session and never carried over.** A new `session_participant`
row is created per session, and a given session may have a different host, so inheriting
consent across sessions would be the riskier behaviour. It is stored exactly as given —
`consent_to_contact: false` is never defaulted to `true`.

## Decision: WebSocket auth reads the cookie
The access token is httpOnly, so browser JS cannot read it to place in a query string, and
no endpoint returns a token to JS. A same-origin `ws://` upgrade **does** carry the
`Cookie` header, so both WS parsers resolve:

```
token = ?token=…  ??  cookie.accessToken
```

An explicit `?token=` still wins, which keeps scripted clients and tests working and makes
a bad query token fail closed rather than silently falling back to the cookie. Side
benefit: no JWT in URLs, so it stops leaking into browser history, server logs and
`Referer`.

`cookie-parser` is **not** usable here — its default export is the Express middleware and
it exports no `parse`, and the `upgrade` event never runs Express middleware. Hence
`src/utils/parse-cookie.ts`, a ~20-line reader for a `Cookie` header.

## Decision: the live room is gated, host detection by probe
`/live/:sessionId` renders `JoinGate`, which resolves in this order:

1. `authStatus` still `idle` → wait (prevents a form flash for signed-in users)
2. `participantId` in `sessionStorage` → straight to the room
3. `GET /api/session/:id` → 200 means **host**, so skip the form entirely
4. otherwise → `JoinSessionForm`

The host still needs a `participantId` for the WebSocket URLs, so `SessionDetail` gained
`host_participant_id`, read from a sub-select. That endpoint is owner-scoped
(`WHERE s.created_by = $1`), so only the host can ever see it — no new endpoint, no leak.

`participantId` lives in `sessionStorage` keyed by session id, so a refresh or accidental
tab close mid-interview does not strand a guest outside the room. The invite token is
stripped from the URL with `history.replaceState` after a successful join.

## Known gap (not fixed here)
Anonymous guests have no identity, so the duplicate-join guard cannot apply to them — one
person may join the same session repeatedly. A rate limit or per-session cap is a
follow-up.

## Resolved: `live → cancelled` is now allowed
`cancelSession` previously accepted only `scheduled`, so a running session could only be
**completed** — yet the status-flow diagrams in `decision.md` and `frontend-decisions.md`
both showed `live → cancelled`, and the live-room design exposes **both** Cancel and
Complete to the host. The code now matches the documented flow:

- `scheduled → cancelled` — `ended_at` stays `NULL` (it never ran)
- `live → cancelled` — `ended_at` is stamped, so the timeline records when the session was
  really abandoned rather than pretending it never started
- anything already closed (`completed` / `cancelled` / `expired`) is still rejected

`completeSession` is unchanged: `live → completed` only.


# Getting into a Live Session

## Decision: the invite is a full URL, never a bare token
The create-session success step used to show only `access_token` and label it *"Share this
link with participants"* — a host could not actually paste anything useful, because the
raw token is not a URL. It now shows the complete link:

```
<origin>/live/<sessionId>?token=<accessToken>
```

Built in `lib/session-urls.ts` from `window.location.origin`, so the same code is correct
on localhost, a preview deploy and production with **no environment variable** and no
second source of truth for the host name. One copy button copies the whole URL.

## Decision: the host enters a live session from the sessions list
`JoinGate` can identify the host (owner-scoped `GET /api/session/:id` returns 200), but
that only helps once the host is already on `/live/:id` — there was no way *in*.

An "enter live session" control appears **only while `status === "live'`**, in three
places: the sessions table row, the mobile session card, and the session detail header
(there as a filled primary button, since that is the page a host naturally lands on). It
is deliberately absent for scheduled/completed/cancelled/expired sessions, because joining
is rejected for those anyway.

Note this is a **navigation** link for the host only — it carries no `?token=`, since the
host is authenticated and resolved by the cookie-backed probe.

# Presence — Who Is In The Room

## Decision: Yjs awareness, not `join`/`leave` events
The room shows who else is connected using **Yjs awareness**, which rides on the existing
`/collaboration` socket. The `/ws` channel already broadcasts `join` / `leave`, but that was
not used for presence:

- awareness is keyed **per client connection**, so a tab killed without a clean close
  simply expires from the roster instead of leaving a permanent ghost
- it needs no extra server code, and in Phase 5 it also carries **remote cursors** for free
- it survives reconnects with backoff, which `join`/`leave` does not

Every client publishes `awareness.setLocalStateField("participant", …)` with its
`participantId`, `displayName` and `role`; `useCollaborators` reads `getStates()` and
re-renders on `change` / `add` / `remove`.

`CollaboratorPresence` in `shared-types` (previously unused) is what the roster renders.

## Two bugs this exposed

**1. There was no dev proxy, so the WS URL was wrong.** `useCollaboration` originally built
`ws://<window.location.host>/collaboration` — which in development is the **Vite port
(5173)**, not the API port (3000), so the socket never opened and presence silently stayed
empty. `lib/session-urls.ts` now resolves the origin from `VITE_API_URL`, falling back to
`window.location.origin` for same-origin production. This is also why the pre-existing
`lib/ws/socket.ts` `buildWsUrl` must use the same helper.

**2. Creating the provider during render breaks under StrictMode.** The first version built
the `WebsocketProvider` in a `useMemo` guarded by a ref and destroyed it in the effect
cleanup. React's StrictMode mounts → unmounts → remounts in development, so the cleanup
destroyed the provider while the memo never re-ran, and the second mount reused a **dead
socket**. Creation now happens *inside* the effect, so setup and teardown are symmetric.

Both were invisible to unit tests and to `tsc` — only driving two real browsers caught them.

## Known behaviour: a hard tab close takes ~30s to clear
If a participant closes the tab or loses connectivity abruptly, the awareness removal message
never reaches the server, so the ghost stays until Yjs's awareness timeout (~30s). A clean
in-app exit clears immediately. A faster path is to send a `leave` event on `beforeunload` in
Phase 6, which will shorten but not eliminate the window.

# Live Room — Staying In The Room

## Decision: two layers, honest about what each can do
The room has **zero app chrome** (the `/live/*` route sits outside `DashboardLayout`, and
`LiveLayout` is `h-svh overflow-hidden`), so there is nothing to click out to. That was
already true from the route design in `frontend-decisions.md` §6.

On top of that, `FullscreenGuard` adds a thin warning strip with a **Go full screen**
button, which also hides the browser's own address bar and tabs.

**A browser cannot stop a candidate leaving.** Fullscreen exits on ESC, a new tab always
works, and JS can be disabled. So this is deterrence plus evidence — the host's recording
shows the gap — not lock-down. The docs already called these "security walls"; the word
"walls" is doing real work there.

## Simplicity choices
- **A strip, not a modal.** It never blocks the room, so a candidate on a browser that
  refuses fullscreen is not trapped behind an overlay.
- **Dismissable, and it returns.** Dismissing hides it for the session; leaving fullscreen
  brings it back, because that is exactly the moment the warning matters.
- **`requestFullscreen` is only ever called from the click handler.** Browsers reject it
  without a user gesture, so auto-triggering would be a silent no-op *and* hostile UX —
  `frontend-decisions.md` §6 rule 4 says never auto-trigger, and that still holds.
- **No new dependency.** `useFullscreen` is ~40 lines wrapping the platform API and
  listening to `fullscreenchange`.

## Verified with a real trusted click
`Runtime.evaluate` cannot enter fullscreen (it is not a user gesture), so the check was done
with `Input.dispatchMouseEvent` — a real mouse event:

- `document.fullscreenElement` becomes `HTML` after clicking **Go full screen**
- the strip hides on entering, returns on exiting

# Phase 4 — The Data Layer (three hooks, one new endpoint)

## The gap this phase had to close
`GET /api/session/:id` is owner-scoped **and** behind `protect`. An anonymous
candidate has no account and no owner rights, so the room had *no* way to load the
session or the question. The `join` response returns only the raw `sessions` row
(`question_id`, `language`, `status`) — never the question's text or starter code.

So the data layer had no data source. One endpoint was added rather than
complicating the client.

## `GET /api/session/:id/room?participantId=…`
Returns `{ session, question }` and is gated by `verifyParticipant` — the *same*
check `/api/run` already uses — instead of `protect`. That is what lets a logged-out
candidate read the room: their proof of membership is the participantId issued at
join, not a session cookie.

Three deliberate choices:
- **It 403s, never 404s, for an unknown session.** The participant check runs first
  and fails, so the response does not reveal whether a session id exists. Matches how
  `/api/run` already behaves.
- **`access_token` is deliberately excluded** (`RoomSession` is its own narrower
  type, not `Session`). The invite secret is not something to hand a candidate back.
- **Same endpoint for host and guest.** The host has a richer owner-scoped payload
  (`["session", id]` — notes, question list) which the dashboard already uses, so
  there is no need for a host-only branch here.

## `runApi.execute` was wrong and silently so
It sent `{ session_id, language, code }`. The server validates `runCodeSchema`,
which wants `sessionId`, `participantId`, `code`, `language` — so every call would
have been a **400**. It was never caught because the function is currently
referenced only by a re-export; the first real caller in Phase 5 would have hit it.
Fixed, and the return type is now `RunResultPayload` instead of `unknown`.

## `useSessionSocket` — subscribing, not "last message"
It deliberately does **not** expose `lastMessage`. Two identical `run_result`s in a
row would collapse into one `useState` update and be dropped, and every consumer
would be forced to filter messages it does not care about. Instead:

```ts
socket.subscribe(msg => { if (msg.type === 'run_result') setResult(msg.payload) })
```

Each part of the room takes only what it needs. As with `useCollaboration`, the
`WsClient` is constructed *inside* the effect — creating it during render strands a
dead socket under StrictMode's mount/unmount/remount.

## Heartbeat: why the client needs one
A browser cannot send protocol-level WebSocket pings, and a half-open connection can
sit there for minutes while the UI confidently reports "connected". So the client
asks in-band every 60s and treats 120s of total silence as death, then reconnects.
This is a **client-side liveness check only** — the server's own zombie-socket
cleanup (protocol ping / terminate) is a separate concern and is *not* implemented
yet; it is a known follow-up, not an oversight.

`ping`/`pong` are new `WsMessage` / `WsClientMessage` variants, and the client and
server directions are now **separate types** so browser code cannot accidentally
construct a broadcast.

## Also fixed: the duplicated, wrong `buildWsUrl`
`lib/ws/socket.ts` exported its own `buildWsUrl(path, token)` built from
`window.location.host` — the same port bug that silently broke presence, still
sitting in the file waiting to be used. It was unreachable dead code. Deleted; the
socket now uses `lib/session-urls.ts`, and the `token` parameter is gone because the
cookie authenticates the upgrade automatically.

## Noted for Phase 7 (not done here)
`question_change`, `session_started`, `session_completed` and `session_cancelled`
are declared in `WsMessage` and are **never broadcast** — only `run_result`, `join`
and `leave` are. So the room cannot currently react to the host switching question
or completing the session. `useLiveSession` papers over this with a 30s refetch,
which is a placeholder, not the design.

# Codebase Layout — Tidying Pass

Goal: a newcomer should be able to predict where a file lives. The rules below are now
enforced by convention (there is no linter for structure).

## The layout
```
src/
  app/          routing + layouts only — no business logic
  pages/        one file per route, thin; composes features/
  features/<name>/
      components/   presentational, feature-specific
      hooks/        data + behaviour
      lib/          feature-local helpers
      index.ts      the only public surface
  components/   cross-feature: ui/ primitives, icons/, shared/ layout-ish, marketing/, motion/
  lib/          infrastructure: api/, ws/, utils/, query-client, session-urls
  stores/       redux
```

**A feature is only importable through its `index.ts`.** That is what keeps `features/live`
from becoming a dumping ground, and it is why the barrels are worth maintaining.

## Decisions

**`components/ui/` is now all PascalCase.** It was a mix: `Button.tsx`/`Card.tsx` (ours)
next to `badge.tsx`/`stat-card.tsx`/`not-found-shared.tsx` (shadcn). The export symbols
were already PascalCase — only the filenames had drifted — so this was a pure rename with
`git mv` to preserve history. Note this deliberately diverges from shadcn's own
convention: a future `npx shadcn add` will re-introduce lowercase files, and they should be
re-cased to match. Export *names* must stay identical either way or imports break.

**One import path per module: `@/lib/api`.** There were three ways to reach the same
object — `@/lib/api`, `@/lib/api/endpoints`, and a `@/lib` barrel that existed only to
re-export `@/lib/api`. The barrel was also **incomplete**: `lib/api/index.ts` exported 5 of
the 8 API groups, so anyone trusting it would have hit a missing-export error on
`dashboardApi`, `reportsApi` or `userApi`. Completed it and deleted `lib/index.ts`;
the three import styles are now one.

**Placeholder feature folders are kept, but stop lying.** `presence/`, `evaluation/`,
`replay/`, `marketing/`, `editor/` and `settings/` are kept (decided), but each
`index.ts` is now a comment saying what belongs there and — critically — **that it is a
marker, not code**. `presence` in particular now states that presence lives in
`features/live`, because leaving it looking like a home for presence code is exactly the
trap that made a second, wrong module look reasonable. `editor` now says CodeMirror 6,
not Monaco.

**`use-monaco.ts` was deleted, not moved.** It was a stub for a library this project never
adopted. Keeping it would have been the most expensive kind of placeholder — an
almost-working module pointing at the wrong technology. `calendar.tsx` and
`use-local-storage.ts` went with it as genuinely unreferenced.

Caution for the future: `use-dashboard.ts` and `EvaluationCard.tsx` *looked* dead to a
filename scan but are not — they export `useDashboardStats` and `MonthlyEvaluation`.
Check the exported symbol, not the filename, before deleting a hook.

**`/live` is a redirect now.** The index route rendered a stub that said "live room comming
soom" (typo included). A room is meaningless without a session id, so `/live` now
redirects to `/app/sessions` and the stub is gone.

**Server: `collab/` moved under `ws/`.** `src/collab/auth.ts` had exactly one importer —
`src/ws/index.ts` — and existed only to serve the collaboration socket. A top-level folder
for a single WebSocket auth helper implied more scope than it had. It is now
`src/ws/collab/auth.ts`.

**Server: `ai.controller.ts` folded into `questions.controller.ts`.** It contained a
single handler, `generateQuestion`, which is mounted at `POST /api/question/generate` — so
it is a questions controller by any measure. Controllers are grouped by *resource*; the AI
concern stays in `services/ai.service.ts`, where it belongs. Its sibling `ai.router.ts`
was a **0-byte file**, never imported and never registered — deleted.

## Fixed while in there: 4 real lint errors in live-room code
`pnpm run lint` had **20 errors**, all pre-existing, but four were in Phase 3/4 code and
were not going to be left behind:

- `use-fullscreen` — took a `target` ref parameter that **nobody passed**, and reading
  `target.current` inside a `useCallback` made React Compiler bail out
  ("could not preserve existing manual memoization"). Dropped the parameter; fullscreen
  always targets `document.documentElement`.
- `use-collaborators` — was calling `setCollaborators([])` in an effect to handle "no
  provider yet". That is a derivable case, so it is now `awareness ? roster : []`.
- `JoinGate` — was syncing the host's participantId from a query result into `useState`
  inside an effect, a classic cascading-render antipattern. The host record is now
  **derived during render** with `useMemo`; the effect only persists to sessionStorage,
  which is a genuine external side effect.
- `use-collaboration` — keeps its `setState`-in-effect, because a `Y.Doc` and
  `WebsocketProvider` cannot be constructed during render (that is exactly what broke
  under StrictMode). It now carries a one-line comment saying why.

Down to **16 errors, 7 warnings** — all in `features/sessions`, `features/questions` and
`components/ui`, all pre-existing. Left alone deliberately: they are `set-state-in-effect`
and `exhaustive-deps` findings in the create/edit session modals, which are behavioural
refactors with real regression risk, and they are unrelated to the live room.

## Not done, on purpose
**Quote style is still mixed** (single vs double) across the client. No prettier config and
eslint does not enforce it, so normalising it would have produced a large diff touching
almost every file for zero behaviour change. Worth a `prettier` config when there is time,
not worth a risky sweep now.
