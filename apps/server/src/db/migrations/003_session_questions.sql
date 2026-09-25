-- Migration: many-to-many session ↔ questions
-- Run: psql -U postgres -d algorym -f apps/server/src/db/migrations/003_session_questions.sql

CREATE TABLE IF NOT EXISTS session_questions (
    session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    question_id uuid NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    position int NOT NULL DEFAULT 0,
    PRIMARY KEY (session_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_session_questions_session ON session_questions(session_id);
CREATE INDEX IF NOT EXISTS idx_session_questions_question ON session_questions(question_id);

-- Backfill existing sessions from the single sessions.question_id
INSERT INTO session_questions (session_id, question_id, position)
SELECT id, question_id, 0
FROM sessions
WHERE question_id IS NOT NULL
ON CONFLICT DO NOTHING;
