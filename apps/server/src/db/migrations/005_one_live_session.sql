-- One live interview per interviewer.
--
-- The application already refuses to start a second live session, but that check
-- is a read-then-write: two requests arriving together can both read "no live
-- session" and both insert. This partial unique index makes the database the
-- final arbiter, so the invariant holds even under a race or a direct query.
--
-- Partial, because the constraint only applies while a session is live. Scheduled,
-- completed, cancelled and expired sessions are all unconstrained, which is what
-- allows a host to keep a full history.
create unique index if not exists idx_sessions_one_live_per_user
    on sessions (created_by)
    where status = 'live';
