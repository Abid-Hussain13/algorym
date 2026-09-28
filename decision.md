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
