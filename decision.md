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

# Phase 5 — The Room UI

## Layout
```
question panel (left, always visible — both sides must read the problem)
│
├── EditorTabs        ── over the shared files Y.Map
├── CodeEditor        ── CodeMirror 6, lazily loaded
├── RunToolbar        ── language (host-only) + stdin + Run
├── BottomTabs        ── Output (everyone) │ Notes (HOST ONLY)
└── RightRail         ── assigned questions │ all questions │ settings (host-only for the first two)
```

## Decisions

**The question sits in a permanent left column, not a tab.** Both the interviewer and the
candidate need to read the problem continuously. Burying it behind a toggle means one of them
loses their place.

**Notes is the only host-only tab — and it is not rendered at all for a candidate.** Not
disabled: *absent*. Even a greyed-out "Notes" tells a candidate they are being assessed, which
is exactly the thing interviewers do not want revealed mid-session. The verdict block lives in
the rail for the same reason, and the rail's two question buttons are omitted entirely rather
than shown disabled.

**Verdict offers three ratings, not ✓/✕.** The schema is `weak | average | strong`
(`evaluationApi` already declared it). A pass/fail pair would silently discard "average", which
is the most common honest answer. The buttons are disabled with the reason shown, because the
server enforces two rules the UI cannot fake: the session must be **completed** and the mode
must be **interview**. Showing an enabled button that 409s would be worse than showing why.

**Closing a tab deletes the buffer for the whole room.** Tabs are keys in a shared CRDT map, not
local UI. This is stated in the tooltip rather than confirmed with a dialog, because the host and
candidate share the files equally.

**Starter code seeds only when the map is empty, and only once the question has loaded.**
`useEditorFiles` takes an explicit `isReady` flag. Without it there is a race: the room mounts,
the question is still in flight over HTTP, the map is empty, so an *empty* buffer gets created —
and then it will never be filled, because the map is no longer empty. This was a real bug caught
by driving two browsers; `tsc`, the build and all 101 tests were green while it was broken.

Switching question deliberately does **not** re-seed: wiping a candidate's in-progress solution
because the interviewer advanced would be far worse than carrying an old file forward. `closeFile`
is the explicit way to start fresh.

**`minimalSetup`, not `basicSetup`.** `basicSetup` bundles CodeMirror's own `history()`, which
records *remote* edits as if the local user typed them — undo would then walk other people's
changes and fight the Yjs `UndoManager`. `minimalSetup` omits it and `yUndoManagerKeymap` supplies
undo that only touches your own edits. Using `basicSetup` here would have been a genuinely
confusing bug: undo appearing to delete a colleague's code.

## Per-person colours (fixes the hardcoded `#f4702c`)
`lib/participant-colors.ts` derives a stable colour from the participantId by hashing, so every
client independently agrees on a person's colour and it survives reconnect and refresh.

The colour is published on awareness as a **`user`** field — `{ name, color }` — which is what
`y-codemirror.next` reads. That is the entire integration: **remote cursors and selections now
render in each peer's own colour for free**, and `CollaboratorsBar` tints avatars from the same
value. One source of truth, two consumers, zero extra wiring.

## Bundle: the editor is code-split, and the first attempt failed
CodeMirror plus five language modes is the heaviest dependency in the app and is only needed
inside `/live/:sessionId`. `CodeEditor` is exported from the feature barrel as a `lazy()` wrapper,
so the marketing pages, login and dashboard never download it.

**The first attempt did nothing** — the main chunk stayed at 2,553 kB. Two causes, both worth
recording because they are invisible in the source:

1. `RunToolbar` and `AllQuestionsPicker` both needed `isSupportedLanguage`, which lived in the
   same module as the five `import { python } from "@codemirror/lang-python"` calls. So two eager
   components dragged the whole editor in. Fixed by splitting the pure language data
   (`editor-languages.ts`) from the CodeMirror extensions (`editor-language-extensions.ts`).
2. The barrel exported `useCodeEditor`, which imports CodeMirror — and the barrel is eagerly
   imported by the page. An internal implementation detail leaked the heavy chunk back in.

Only after both was the split real:

| | before | after |
|---|---|---|
| main chunk | 2,553 kB (708 kB gz) | **1,884 kB (478 kB gz)** |
| editor chunk | — | 630 kB (222 kB gz), room only |

**Two dependencies were also missing.** `@codemirror/language` and `@lezer/highlight` were only
transitive, and pnpm's `node_modules` is strict, so importing them undeclared would have failed
at build time on a fresh clone. They are now explicit. Same trap avoided for `y-protocols`: rather
than add it, the `Awareness` type is derived from `y-websocket` — the pattern `use-collaborators`
already used.

## Editor theme: no JavaScript state at all
`lib/editor-theme.ts` references the app's existing `--color-syn-*`, `--font-mono`, `--color-bg`
and `--color-border` custom properties. Because the app toggles `data-theme="dark"` on `:root`,
the editor follows light/dark automatically — no theme subscription in React, and no re-mounting
the editor (which would drop the cursor and the CRDT binding). The `--color-syn-*` tokens already
existed in both themes and had never been used; this is what they were for.

## A second latent API bug, same family as `runApi`
`evaluationApi.evaluate` sent `{ session_id, evaluated_participant_id }` while
`evaluatedUserSchema` validates camelCase — so it would have **400'd on every call**. Like the
`runApi` one in Phase 4, it was referenced only by a re-export, so nothing caught it. Fixed
before wiring the verdict UI.

**Worth a standing rule: any endpoint the room consumes gets its payload shape checked against
the zod schema before it is wired up.** Two out of two endpoints this project had never been
called by real code were both wrong.

## Known limitations, stated plainly
- **Question changes are not broadcast.** The host sees a switch immediately (the mutation
  invalidates `["session-room"]`); the candidate picks it up on their next 30s poll. Fixing this
  properly is Phase 7's `question_change` broadcast, not more polling.
- **Changing language does not re-seed the buffer**, for the same non-destructive reason as
  switching question. A fresh buffer needs `closeFile`.
- **Yjs documents are in-memory on the server.** Rooms survive client reconnects but not a server
  restart, and nothing is persisted (replay rebuilds from `session_events` instead). This was the
  Phase 0 decision; it is worth remembering that "the code is gone if the server restarts".
- **Elapsed time ticks only every 30s** and starts from `started_at`, not from when the room
  opened.

# Room Layout Revision

Six layout/behaviour corrections from using the room for real.

## 1. The "candidate sees different colours" report — not a bug
Investigated with two browser profiles carrying different saved themes:

| saved | `data-theme` | `--color-bg` |
|---|---|---|
| `light` | `light` | `oklch(0.985 0.004 90)` |
| `dark` | `dark` | `oklch(0.185 0.004 80)` |

Each profile keeps its own `algorym-theme` in `localStorage`, so host and candidate render
in whatever theme each browser prefers. `App.tsx` already calls `useTheme()` at the root, so
every route honours it — including the editor, which reads the same `--color-*` tokens. Working
as intended.

**But a real flaw surfaced next to it:** `index.html` hardcoded `data-theme="light"`, and
`useTheme()` only corrects it in an effect *after* React mounts. So anyone whose saved theme is
dark got a visible **flash of the light theme** on every page load — almost certainly what was
actually noticed. An inline script in `<head>` now sets the attribute before first paint.

Not changed: the room still respects the viewer's own preference. Forcing one theme on
candidates would be a product decision, not a bug fix — and would override an explicit choice
somebody made on purpose.

## 2. New file appeared on the LEFT of the current tab
`useEditorFiles` sorted the file list alphabetically:

```ts
const names = Array.from(files.keys()).sort();   // removed
```

`'solution-2.js' < 'solution.js'` because `'-'` (0x2D) sorts before `'.'` (0x2E) — so every new
file jumped to the far left. A `Y.Map` already preserves insertion order, which is exactly what a
tab strip wants. Sorting removed; new tabs now land to the right.

Worth remembering: **alphabetical sorting is wrong for anything ordered.** It is only correct
for a picker list where alphabetical is the intent.

## 3. Rail moved to the extreme left — and renamed
`RightRail` → `SideRail`, docked to the left edge, before the question panel. Renamed rather
than kept as `RightRail`, because leaving the name would be a lie that misleads the next reader.

## 4. Panels are layout columns, not overlays
`SlideInPanel` (fixed-position overlay with a dimming backdrop) is replaced by `PanelColumn`, a
real flex child. Opening the question list no longer dims or covers the editor.

This was a genuine usability point, not only a preference: the host switches question while the
candidate is reading the code. An overlay would hide the code at the exact moment the candidate
needs to see it, and reflowing the layout would move the editor under their cursor.

Both the panel and the drawer use `useResizablePane` — Pointer Events **with pointer capture**,
so the drag keeps working once the cursor leaves the 2px handle. A plain `mousemove` bound to the
handle stalls as soon as you move off it, which is the usual failure of hand-rolled resizers.
Sizes persist in `localStorage`. Escape closes the panel; keyboard resizing is deliberately not
implemented, since the collapse toggle and rail buttons already provide the non-drag path.

## 5. stdin became a tab; the Run toolbar row is gone
The bottom drawer is now **Output | Input | Notes** and `RunToolbar` is deleted. Its two
remaining controls moved into the tab strip as `EditorControls`, with the language picker last
at the extreme right:

```
[ solution.js ][ solution-2.js ][ + ]        [ Run ][ JavaScript ▾ ]
```

That removes a whole 40px row from a full-screen room. Measured: the select's top (124px) sits
within 1px of the tab row's top (123px), and its right edge (1592px) is 8px from the row's right
edge (1600px) — i.e. right-aligned to the `pr-2` padding, with Run immediately to its left.

## 6. Bottom drawer expands upward
Drag the top edge up to grow it (240px default, 120–640px clamp), or collapse to just the tab
strip (37px) with the chevron. `aria-orientation` and `role="separator"` are set on both handles.

## Removed
`RightRail.tsx`, `SlideInPanel.tsx`, `RunToolbar.tsx` — all three superseded. Nothing else
imported them.

## A testing trap worth recording
Three separate "failures" in the two-browser pass were **my probe's fault, not the app's**:
1. `sel.closest('div[role=tablist]')` returned `null` because the controls are a *sibling* of the
   tablist, not descendants — the probe threw and reported "missing".
2. Clicking an already-active rail button toggles the panel **closed**. That is the intended
   toggle behaviour; the test asserted the panel stayed open.
3. `document.querySelectorAll('section').pop()` was selecting **Sonner's toast container**, not
   the drawer — a second, empty `<section>` is appended after it. The drawer was correctly
   `height: 240px` the whole time.

Lesson applied generally: assert against a **stable identifying hook** (`aria-label`,
`role`, a known class), never document order or a bare tag name. Two of these looked like real
product bugs and would have sent me editing working code.

# Editor Autocomplete, Question Panel, Session Actions

## Autocomplete: `override`, not the language-data facet
Sources are wired with `autocompletion({ override: [...] })` rather than
`language.data.of({ autocomplete })`.

The facet route **silently did nothing here**: `editorCompletions` was built with a
valid language and one built-in source, `autocompletion()` was in the extension list,
`closeBrackets()` from the same function worked — and yet the completion source was
*never called* and no popup ever appeared, not even on explicit Ctrl-Space. A temporary
`console.log` probe confirmed the source was constructed and then never invoked. The
language itself was fine (Lezer token classes were present, highlighting worked), which
ruled out the obvious explanation.

`override` bypasses `state.languageDataAt("autocomplete", pos)` resolution entirely and
declares the source list explicitly, so it does not depend on facet resolution order.
Cost: sources provided by a language's own data facet that we do not list are bypassed —
acceptable, because every source we want is now listed by hand.

## Two real bugs found by driving a real keyboard
**`$0` placeholders were typed literally.** Templates use `$0` for "cursor here". A plain
string insert writes the characters `$0`. CodeMirror's `snippetCompletion()` expands these,
but it cannot be combined with a custom `apply`. Fixed by stripping `$0` and placing the
selection at that offset — a single cursor stop is all these templates need.

**One ChangeSet cannot hold both the import and the usage.** Inserting the import at offset
0 while replacing the usage range that also starts at 0 collided:
`RangeError: Invalid change range 13 to 17 (in doc of length 4)`. A `ChangeSet` validates
every position against the **original** document, so shifting the usage range to account for
the import is invalid. Naively combining them in one set swallowed the newline and produced
`import "fmt"fmt.Printf(…)`, because an insert at 0 and a replace starting at 0 are the same
position.

Resolution: **two dispatches** — the import first, then the usage at coordinates valid for the
already-updated document. Yjs groups the two writes into one undo step.

**Imports land in the header block, not at line 1.** `headerInsertOffset()` walks the
contiguous run of blank or import-ish lines from the top, so a Go import goes *after*
`package main`, and a second C++ `#include` groups with the first. Every symbol carrying an
import also carries an `importMarker`, so accepting the same completion twice inserts nothing.

## What each language actually gets
| Language | Source |
|---|---|
| Python | package's `globalCompletion` (real built-ins) + our keywords/library |
| JavaScript | package `snippets` + ours |
| Go | package `snippets` + ours |
| Java | **ours only — the package ships no completion source** |
| C++ | **ours only — the package ships no completion source** |

That asymmetry is why `editor-symbols.ts` carries a full standard-library table (with import
lines) rather than a keyword list: for Java and C++ it *is* the whole experience. Honest
limitation: these are curated symbol lists, not a language server. There is no type
inference — a symbol is offered because it exists in the language's standard library, not
because it type-checks at the call site.

Also added: `closeBrackets()` (typing `(` or `"` inserts the pair, Backspace removes both)
and `Ctrl-Space` / `Escape` keymaps. The popup is themed from the app's own tokens.

## Question is now a peer panel, not a permanent column
It moved into the rail as the first item, so the editor gets the full width until someone asks
for it, and it behaves exactly like the other panels — same column, same resizer, same toggle.
Removed the always-on `w-72` column.

## Panel state was already per-user — verified, not assumed
Concern that opening a panel on one side would open it for everyone. Two browsers, side by
side: host had **Question** open while the guest had **nothing** open; the guest then opened
**Session** and the host stayed on **Question**. Themes differed too (host `dark`, guest
`light`), as did panel widths.

This works because `rail` is plain `useState` in `LiveRoomShell` and theme/panel sizes live in
each browser's own `localStorage`. **Nothing about view-only state crosses the CRDT or the
socket** — that is worth preserving deliberately, since it is the property that lets two people
work in the same room without being forced into the same view.

## Ending a session has its own page
Complete / Cancel moved out of the shared panel footer to a dedicated **Session actions** rail
panel, host-only, shown only while the session can still be ended. Rationale: these are
irreversible, and they should never be one stray click away from the question list a host
opens while thinking about content. Cancelling requires confirmation; completing does not.

The verdict block lives there too, for the same reason — rating and ending belong together and
nowhere else.

# Fixing the Three Reported Breakages

## 1. `solution.txt` — root cause was a session with no language
The filename comes from `filenameForLanguage(session.language)`. The old version returned a
**fallback `"solution.txt"`** for anything unrecognised, which quietly hid the real problem:
three live sessions (and one legacy `typescript`) have `language = NULL` in the database.

Two changes:

- `filenameForLanguage` now returns **`null`** for an unknown language instead of inventing a
  plausible-looking filename. A `solution.txt` tab was a symptom being presented as a feature.
- `useEditorFiles` seeds only when the language is **supported**, and **renames a lone legacy
  `solution.txt`** to the correct name once the language is known — so rooms created before
  this fix heal without being recreated.

Yjs documents live in server memory keyed by session id, so a wrongly-named tab could never be
corrected: the map was already non-empty, so seeding never re-ran.

## 2. No output from `console.log` — a silent `return`
`handleRun` began with `if (!language) return;`. For a null-language session that produced
**no output, no toast, and no error** — indistinguishable from a broken executor, which is
exactly how it read.

Now every guard speaks. Run is disabled with a tooltip naming the cause, the tab row shows a
**"No language"** badge instead of a dropdown that would do nothing, and the host gets a banner
with an **Assign a question** shortcut. The executor itself was never at fault: `stdout` came
back `hello\n`, `accepted`, in 0.4s.

## 3. Ending a session and rating are now one two-step flow
Rewritten to the specified sequence:

1. **End the session** — Complete or Cancel, and nothing else.
2. **After completing**, an **Evaluate candidate** form appears: rating (weak / average /
   strong) plus notes **pre-filled** with whatever the host wrote during the session.

Asking for a verdict before the interview ends invites a snap judgement, and the server rejects
evaluation until the session is completed anyway. Notes stay editable during the session and
are carried into the form. Cancelling asks for confirmation; completing does not.

`HostVerdict` is deleted — the new panel owns the whole flow, so keeping a second, differently
behaved copy of the same UI was a trap.

## A real gap found while testing: rating someone who left
`candidateId` came only from the awareness roster — people **currently connected**. A candidate
who joined, closed their tab, and was then rated by the host came back as "No candidate joined
this session, so there is nobody to rate."

`SessionDetail` now also carries `candidate_participant_id` (first guest, owner-scoped, next to
the existing `host_participant_id`), and the client prefers whoever is in the room but falls
back to it. Verified: rating and notes persisted — `strong`, session `completed`.

## Testing note
Three of the checks in the first pass failed on my own assertions, not the app: CSS
`text-transform: uppercase` makes rendered `innerText` uppercase (so `"Notes in progress"` was
never found), and I looked for `"success"` in a class before realising the button was correctly
`disabled` — because `candidateId` was genuinely null, which is how the last bug was found.

# Ending A Session — Broadcast, Candidate Notice, Then Rating

## The missing broadcast
`completeSession` and `cancelSession` logged a `session_events` row but never told the room. The
candidate therefore sat in a finished session with a live editor and no idea anything had
happened — the only change visible to them was nothing at all.

Both now `broadcast(session.id, { type: "session_completed" | "session_cancelled", payload: {
session } })`. Those two variants already existed in `WsMessage` and had simply never been sent
— the same gap that kept `question_change` unwired, and the reason `useLiveSession` was polling
every 30s.

## Only the candidate gets the notice
The host already knows: they pressed the button. Showing them a "session ended" dialog would be
noise at best. `LiveRoomShell` therefore gates the dialog on `role !== "host"`, and it is
deliberately **not dismissable by accident** — the session is over and there is nothing left to
edit, so the only ways forward are the two buttons.

**Exit full screen** is offered prominently, and only when actually in full screen. The room puts
people in full screen to stop them wandering off mid-interview; the courtesy of switching it back
off when the interview is genuinely over matters, and `Esc` is not something a non-technical
candidate will try.

The name in the message comes from the **presence roster**, not the host-scoped session detail —
a candidate has no access to that endpoint, so the obvious prop would always have been empty.

## The actions panel is now strictly two steps
**Step 1 — End session.** *Only* Complete and Cancel. The notes block and the rating controls
were removed from here: while a session is live the host's attention belongs on the interview,
and a rating form one click away invites a snap judgement. Notes stay in the Notes tab where
they were written.

**Step 2 — Evaluate candidate.** Appears only after completing. Rating (weak / average / strong)
plus notes **pre-filled** from what the host wrote during the session and freely editable.

Two exits, because rating is optional and must not feel mandatory:

- **Done** — saves the evaluation, then navigates to `/app/sessions`
- **Rate later** — skips the rating, still persists any edited notes, then navigates to
  `/app/sessions`

Both land on the sessions page: the room has nothing left to do, and an unrated session stays
reachable from session detail. `rateLater` writes notes best-effort on the way out so a typed
thought is never silently discarded by skipping.

## Run is disabled once the session ends
The server rejects runs unless the session is live, so the button was offering an action that
could only ever produce a 400. It is now disabled with a tooltip naming the status, and the
handler explains rather than returning silently — the same class of bug as the missing-language
guard.

# Notes Could Not Save — Root Cause Was Never the Connection

## Reproduced
Saving notes on a session with no candidate yet:

```
PATCH /api/session/:id/notes
→ 400 "No candidate has joined this session yet"
```

The same request after a guest joins returns **200**. So the save was never a network problem.

## Why the server refuses
Notes are stored in `session_evaluations`, whose upsert key is
`(session_id, evaluated_participant_id)` and whose `evaluated_participant_id` is
`uuid not null references session_participants(id)`. There is nowhere to put a note without a
candidate to attach it to, and `getCandidateParticipant` throws a 400 when there is none.

**The bug was the error message, not the request.** The client caught every failure and toasted
*"Couldn't save notes — check your connection"*, sending the host hunting for a network fault that
did not exist — the same class of defect as the silent `if (!language) return` on Run.

## Fixes
1. **The real reason is shown.** Failures now surface the server's own message, so "no candidate
   yet" and "you are offline" are distinguishable.
2. **The textarea stays editable.** A host who wants to jot something down before the candidate
   connects can. The draft is kept locally and marked **"Draft — not saved yet"**, with an inline
   explanation instead of a toast.
3. **The draft saves itself later.** `canSave` is in the debounce effect's dependencies, so the
   moment a candidate appears the pending text is written automatically — no lost keystrokes, no
   need to remember to retype it.
4. **`notesCanSave` is derived from real state** — `candidateId` (presence roster, falling back to
   the DB) plus a live-or-completed session — and the exact blocker is passed through as
   `notesBlockedReason` so the message is specific rather than generic.

Note that this only affects **notes during a session**. The rating form saves through
`POST /api/evaluation`, which has the same underlying requirement and is only reachable after a
candidate exists.

# Phase 6 Guardrails + Closing the Wiring Gaps

## Phase 6 — Guardrails (was 0 of 3, now complete)

**Both are deliberately passive.** There is no reliable way to stop a candidate switching tabs,
and a client that fights back — nagging modals, repeated toasts — reads as surveillance and sours
the interview. These make an accident *visible* rather than trying to prevent it.

### `useUnloadGuard` — browser-level "are you sure?"
Applies to **both** roles while the session is live, because losing an interview to an accidental
refresh is expensive for the host too. It is skipped once the session ends, where leaving is the
expected next action.

The copy cannot be customised — browsers only allow a plain `beforeunload` prompt. That is also
why this is kept light rather than replaced with a custom dialog we would have to style blind.

### `useAwaySignal` — tab-away, published on **awareness**, not a new message
The first design returned a callback and would have needed a new `WsClientMessage` type, a server
handler and a broadcast. Instead it writes `awareness.setLocalStateField("focus", { away, since })`.

That is better on every axis:
- awareness **already** flows to everyone in the room and carries per-user state
- it **expires on its own** if the tab dies, so an away participant who never returns disappears
  instead of lingering as a ghost
- no new protocol surface

`CollaboratorsBar` shows a small amber dot plus "· away" in the summary line. Information for the
host, not a warning aimed at the candidate.

`visibilitychange` is used rather than `blur`, because `blur` also fires for devtools and sibling
windows, whereas `visibility` only flips when the document genuinely becomes hidden.

### Also: a candidate reloading into an ended session
Previously the "session ended" dialog depended entirely on a broadcast. A candidate who reloaded
*after* the host finished got no dialog and landed in a dead room. The outcome is now also derived
from the freshly-fetched status, so the dialog appears on mount. This closes a real path that the
broadcast-only version could not.

## The three wiring gaps — closed

### 1. Candidate sees the assigned questions (read-only)
`GET /:id/room` now returns `questions: SessionQuestionRef[]` alongside the current question.
Riding on the existing endpoint means no new route, no extra request, and it stays fresh through
the same 30s poll. The candidate's list was previously an **eternal "Loading…"** — `useSessionDetail`
is owner-scoped, so `hostDetail` was permanently `undefined` for a guest.

**Read-only, not full control.** Both parties share **one** code buffer (`files` is a single
`Y.Map`). Letting the candidate switch questions independently would mean two people writing
different solutions into the same buffer, and would make the rating ("strong on the whole set")
incomparable across candidates. Visibility without control gives the transparency without
breaking the shared editor. The panel says so explicitly: *"Only the interviewer can switch."*

Note `changeQuestion` rotates the chosen question to the front, so the candidate's list visibly
reshuffles as the host advances — progress is legible, which is arguably useful.

### 2. `code_snapshot` capture
**This could not be retrofitted.** Yjs documents live in server memory, so once a session is over
and the server has restarted the code is simply gone. Capture during the session is the only moment
the data exists.

`useCodeSnapshots` observes the active `Y.Text` (so remote edits are captured too), debounces 5s
trailing, skips text identical to what was last sent, and flushes on tab switch and unmount so the
last edit before a change is never dropped. `filename` is recorded alongside `code` — without it a
future replay could not tell a `.py` from a `.js`.

Measured: a short test session produced 6 rows, one per real edit, no duplicates while idle.
A 45-minute interview lands in the **40–120 row** range, roughly 100–600 KB per session.

### 3. `question_change` broadcast
The last unwired `WsMessage`. The candidate's highlighted question now moves with the host's
instead of lagging up to 30s — which matters *more* now that they can see the list, because the
highlight is how they know where they are. The client simply refetches the room payload on
receipt, so both sides land on the same question through one code path.

`session_started` was **deliberately left unwired**: a candidate joining a `scheduled` session sees
Run disabled, which is the same self-explanatory signal, and a broadcast would not change what they
can do.

## Tests
+2 server tests on the `/room` response (ordered list with positions; empty list is not an error).
**101 → 103.**
