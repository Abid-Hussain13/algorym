-- Migration: focus / integrity events
-- Adds a `focus_event` event type so the room can record when a candidate left
-- full screen or switched tabs. Reuses the existing session_events audit log
-- rather than a denormalised counter, so the timestamps survive too — which is
-- what actually evidences the behaviour.
--
-- Run: psql -U postgres -d algorym -f apps/server/src/db/migrations/004_focus_events.sql

-- ALTER TYPE ... ADD VALUE cannot run inside a transaction block on older
-- PostgreSQL, so keep this file to a single statement per run.
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'focus_event';