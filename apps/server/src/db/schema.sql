create extension if not exists "pgcrypto";

create type difficulty_level as enum ('easy', 'medium', 'hard');
create type session_mode as enum ('interview', 'practice');
create type session_status as enum ('scheduled', 'live', 'completed', 'cancelled', 'expired');
create type event_type as enum ('code_snapshot', 'run_result', 'question_change', 'session_started', 'session_completed', 'session_cancelled');
create type evaluation_rating as enum ('weak', 'average', 'strong');
create type participant_role as enum ('host', 'guest');

create table users (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    email text not null unique,
    password_hash text not null,
    created_at timestamptz not null default now()
);

create table questions (
    id uuid primary key default gen_random_uuid(),
    owner_id uuid not null references users(id) on delete cascade,
    title text not null,
    description text not null,
    languages text[] not null,
    difficulty difficulty_level not null,
    starter_code text,
    created_at timestamptz not null default now()
);

create table sessions (
    id uuid primary key default gen_random_uuid(),
    created_by uuid not null references users(id) on delete cascade,
    question_id uuid references questions(id) on delete set null,
    mode session_mode not null,
    status session_status not null default 'scheduled',
    access_token text not null unique,
    role_context text,
    scheduled_at timestamptz,
    duration_minutes integer,
    started_at timestamptz,
    expires_at timestamptz,
    created_at timestamptz not null default now()
);

create table session_participants (
    id uuid primary key default gen_random_uuid(),
    session_id uuid not null references sessions(id) on delete cascade,
    user_id uuid references users(id) on delete set null,
    email text,
    display_name text,
    role participant_role not null,
    consent_to_contact boolean not null default false,
    consent_timestamp timestamptz,
    joined_at timestamptz not null default now()
);

create table session_events ( id uuid primary key default gen_random_uuid(),
    session_id uuid not null references sessions(id) on delete cascade,
    actor_participant_id uuid references session_participants(id) on delete set null,
    event_type event_type not null,
    payload jsonb not null default '{}',
    created_at timestamptz not null default now()
);

create table session_evaluations (
    id uuid primary key default gen_random_uuid(),
    session_id uuid not null references sessions(id) on delete cascade,
    evaluator_participant_id uuid not null references session_participants(id) on delete cascade,
    evaluated_participant_id uuid not null references session_participants(id) on delete cascade,
    rating evaluation_rating,
    notes text,
    created_at timestamptz not null default now()
);

create index idx_questions_owner on questions(owner_id);
create index idx_sessions_created_by on sessions(created_by);
create index idx_participants_session on session_participants(session_id);
create index idx_events_session on session_events(session_id);
create unique index idx_evaluations_session_candidate
    on session_evaluations(session_id, evaluated_participant_id);
