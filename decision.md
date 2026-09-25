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
