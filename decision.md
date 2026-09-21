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
