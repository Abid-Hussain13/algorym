export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export type SessionMode = 'interview' | 'practice';

export type SessionStatus = 'scheduled' | 'live' | 'completed' | 'cancelled' | 'expired';

export type EventType = 'code_snapshot' | 'run_result' | 'question_change' | 'session_started' | 'session_completed' | 'session_cancelled' | 'focus_event';

/**
 * Why a focus event was recorded. Both are integrity signals the host reviews
 * after the session: leaving full screen is the stronger one, because the room
 * explicitly asks the candidate to stay in it.
 */
export type FocusEventKind = 'fullscreen_exit' | 'tab_away';

export interface FocusEventPayload {
    kind: FocusEventKind;
    /** How long they were out, in seconds. Null for an exit we never saw end. */
    durationSeconds?: number | null;
}

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
    starter_code: Record<string, string> | null;
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
    language: string | null;
    scheduled_at: string | null;
    duration_minutes: number | null;
    started_at: string | null;
    ended_at: string | null;
    expires_at: string | null;
    created_at: string;
    candidate_name?: string | null;
    candidate_email?: string | null;
    rating?: string | null;
}

export interface SessionQuestionRef {
    id: string;
    title: string;
    position: number;
}

export interface SessionDetail extends Session {
    notes: string | null;
    questions: SessionQuestionRef[];
    /** Owner-scoped endpoint, so only the host ever receives this. */
    host_participant_id: string | null;
    /**
     * First guest who joined. Lets the host rate a candidate who has already left
     * the room — the awareness roster only knows about people still connected.
     */
    candidate_participant_id: string | null;
    /** Integrity signals recorded against the candidate during the session. */
    candidate_fullscreen_exits: number;
    candidate_tab_aways: number;
}

/**
 * What a participant needs to render the live room. Deliberately does NOT
 * include `access_token` — the invite secret is not something a candidate
 * should be handed back.
 */
export interface RoomSession {
    id: string;
    question_id: string | null;
    mode: SessionMode;
    status: SessionStatus;
    role_context: string | null;
    language: string | null;
    scheduled_at: string | null;
    duration_minutes: number | null;
    started_at: string | null;
    ended_at: string | null;
    expires_at: string | null;
    created_at: string;
}

/** Response of `GET /api/session/:id/room`. */
export interface SessionRoom {
    session: RoomSession;
    question: Question | null;
    /**
     * Every question assigned to this session, in order. Visible to candidates so
     * they know what is coming; only the host can actually switch.
     */
    questions: SessionQuestionRef[];
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
    starter_code?: Record<string, string>;
}

export interface QuestionListParams {
    search?: string;
    difficulty?: string;
    sort_by?: string;
    page?: number;
    ids?: string;
}

export interface QuestionListResponse {
    questions: Question[];
    pagination: Pagination;
}

export interface CreateSessionBody {
    mode: SessionMode;
    duration_minutes?: number;
    question_id?: string;
    question_ids?: string[];
    language?: string;
    role_context?: string;
    scheduled_at?: string;
}

export interface JoinSessionBody {
    access_token: string;
    email?: string;
    display_name?: string;
    consent_to_contact: boolean;
}

export interface SessionListParams {
    search?: string;
    mode?: string;
    sort_by?: string;
    page?: number;
}

export interface SessionListItem {
    id: string;
    role_context: string | null;
    mode: string;
    status: string;
    created_at: string;
    candidate_name: string | null;
    candidate_email: string | null;
    language: string | null;
    rating: string | null;
}

export interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface SessionListResponse {
    sessions: SessionListItem[];
    pagination: Pagination;
}

export interface CodeSnapshotPayload {
    code: string;
    /** Which buffer this is, so replay can tell a .py from a .js. */
    filename?: string;
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
    starter_code: Record<string, string>;
    languages: string[];
    language: string;
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
    | { type: 'run_result'; payload: RunResultPayload; actorParticipantId: string }
    | { type: 'question_change'; payload: QuestionChangePayload }
    | { type: 'session_started'; payload: SessionStatePayload }
    | { type: 'session_completed'; payload: SessionStatePayload }
    | { type: 'session_cancelled'; payload: SessionStatePayload }
    | { type: 'session_expired'; payload: SessionStatePayload }
    | { type: 'join'; payload: Record<string, never> }
    | { type: 'leave'; payload: Record<string, never> }
    | { type: 'pong'; payload: Record<string, never> };

/** Events the browser sends to `/ws`. Kept separate so client code cannot
 *  accidentally construct a broadcast message. */
export type WsClientMessage =
    | { type: 'code_snapshot'; payload: CodeSnapshotPayload }
    | { type: 'focus_event'; payload: FocusEventPayload }
    | { type: 'ping' };


export type ReportsRange = '7d' | '30d' | '90d' | 'month' | 'year';

export interface ReportsStats {
    totalSessions: number;
    avgDurationMinutes: number | null;
    completionRate: number;
}

export interface SessionsOverTimePoint {
    date: string;
    count: number;
}

export interface LanguageDistributionItem {
    language: string;
    count: number;
    percentage: number;
}

export interface EvaluationDistributionItem {
    rating: EvaluationRating;
    count: number;
    percentage: number;
}

export interface ReportsResponse {
    stats: ReportsStats;
    sessionsOverTime: SessionsOverTimePoint[];
    languageDistribution: LanguageDistributionItem[];
    evaluationDistribution: EvaluationDistributionItem[];
}

export interface dashboardStatsType {
    stats: {
        sessions: number,
        sessionTrend: number,
        avgDurationThisMonth: number | null,
        durationTrend: number | null,
        completionPercentage: number,
        thisMonthCompletedSessions: number
    },
    sessions: Array<{
        id: string,
        title: string,
        status: SessionStatus,
        date: string,
        name: string
    }>,
    evaluation: {
        date: string,
        totalCandidates: number,
        buckets: Array<{
            label: string,
            count: number
        }>
    }
}

export type ThemePreference = 'light' | 'dark' | 'system';

export interface UserPreferences {
    theme: ThemePreference;
    default_language: string | null;
    default_duration_minutes: number | null;
}

export interface UpdatePreferencesBody {
    theme?: ThemePreference;
    default_language?: string | null;
    default_duration_minutes?: number | null;
}

export interface ChangePasswordBody {
    current_password: string;
    new_password: string;
}

export interface GenerateQuestionBody {
    title: string;
    languages: string[];
}

export interface GenerateQuestionResponse {
    description: string;
    starter_code: Record<string, string>;
}

