export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export type SessionMode = 'interview' | 'practice';

export type SessionStatus = 'scheduled' | 'live' | 'completed' | 'cancelled' | 'expired';

export type EventType = 'code_snapshot' | 'run_result' | 'question_change' | 'session_started' | 'session_completed' | 'session_cancelled';

export type EvaluationRating = 'weak' | 'average' | 'strong';

export type ParticipantRole = 'host' | 'guest';

export interface User {
    id: string;
    name: string;
    email: string;
    password_hash: string;
    email_verified: boolean;
    created_at: string;
}

export interface Question {
    id: string;
    owner_id: string;
    title: string;
    description: string;
    languages: string[];
    difficulty: DifficultyLevel;
    starter_code: string | null;
    created_at: string;
}

export interface Session {
    id: string;
    created_by: string;
    question_id: string | null;
    mode: SessionMode;
    status: SessionStatus;
    access_token: string;
    role_context: string | null;
    scheduled_at: string | null;
    duration_minutes: number | null;
    started_at: string | null;
    expires_at: string | null;
    created_at: string;
}

export interface SessionParticipant {
    id: string;
    session_id: string;
    user_id: string | null;
    email: string;
    display_name: string | null;
    role: ParticipantRole;
    consent_to_contact: boolean;
    consent_timestamp: string | null;
    joined_at: string;
}

export interface SessionEvent {
    id: string;
    session_id: string;
    actor_participant_id: string | null;
    event_type: EventType;
    payload: Record<string, unknown>;
    created_at: string;
}

export interface SessionEvaluation {
    id: string;
    session_id: string;
    evaluator_participant_id: string;
    evaluated_participant_id: string;
    rating: EvaluationRating | null;
    notes: string | null;
    created_at: string;
}

export interface Notification {
    id: string;
    user_id: string;
    type: string;
    content: string;
    related_session_id: string | null;
    is_read: boolean;
    created_at: string;
}

export interface SignupBody {
    name: string;
    email: string;
    password: string;
}

export interface LoginBody {
    email: string;
    password: string;
}

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message: string;
}

export type AuthResponse = { user: Omit<User, 'password_hash'> };

export interface ApiErrorResponse {
    success: false;
    message: string;
    statusCode: number;
    errors?: Array<{ field: string; message: string }>;
}


export interface CreateQuestionBody {
    title: string;
    description: string;
    languages: string[];
    difficulty: DifficultyLevel;
    starter_code?: string;
}

export interface CreateSessionBody {
    mode: SessionMode;
    duration_minutes?: number;
    question_id?: string;
    role_context?: string;
    scheduled_at?: string;
}

export interface JoinSessionBody {
    email: string;
    display_name?: string;
    consent_to_contact: boolean;
}

export interface CodeSnapshotPayload {
    code: string;
}

export type RunStatus = 'accepted' | 'wrong_answer' | 'time_limit_exceeded' |
    'compile_error' | 'runtime_error' | 'internal_error' | 'error';

export interface RunResultPayload {
    language: string;
    stdout: string;
    stderr: string;
    compile_output: string;
    time: number | null;      // seconds
    memory: number | null;    // KB
    status: RunStatus;
    exit_code: number | null;
}

export interface QuestionChangePayload {
    question_id: string;
    title: string;
    description: string;
    starter_code: string;
    languages: string[];
}

export interface SessionStatePayload {
    session: Session;
}

export interface CollaboratorPresence {
    participantId: string;
    displayName: string;
    color: string;
    cursor?: { line: number; ch: number };
    selection?: { from: number; to: number };
}

export type WsMessage =
    | { type: 'code_snapshot'; payload: CodeSnapshotPayload }
    | { type: 'run_result'; payload: RunResultPayload }
    | { type: 'question_change'; payload: QuestionChangePayload }
    | { type: 'session_started'; payload: SessionStatePayload }
    | { type: 'session_completed'; payload: SessionStatePayload }
    | { type: 'session_cancelled'; payload: SessionStatePayload }
    | { type: 'join'; payload: Record<string, never> }
    | { type: 'leave'; payload: Record<string, never> };
