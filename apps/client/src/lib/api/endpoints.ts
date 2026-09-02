import { http } from '@/lib/api/client'

import type {
    CreateQuestionBody,
    CreateSessionBody,
    JoinSessionBody,
    LoginBody,
    Question,
    Session,
    SessionEvaluation,
    SessionEvent,
    SignupBody,
    User,
} from '@algorym/shared-types'

type UserSafe = Omit<User, 'password_hash'>

export const authApi = {
    signup: (body: SignupBody) => http.post<UserSafe>('/api/auth/signup', body),
    login: (body: LoginBody) => http.post<UserSafe>('/api/auth/login', body),
    refresh: () => http.post<null>('/api/auth/refresh'),
    me: () => http.get<UserSafe>('/api/auth/me'),
}

export const questionsApi = {
    list: () => http.get<{ questions: Question[] }>('/api/question'),
    get: (id: string) => http.get<{ question: Question }>(`/api/question/${id}`),
    create: (body: CreateQuestionBody) => http.post<{ question: Question }>('/api/question', body),
    update: (id: string, body: CreateQuestionBody) =>
        http.put<{ question: Question }>(`/api/question/${id}`, body),
    remove: (id: string) => http.delete<void>(`/api/question/${id}`),
}

export const sessionsApi = {
    list: () => http.get<{ sessions: Session[]; total: number; page: number; limit: number }>('/api/session'),
    get: (id: string) => http.get<{ session: Session }>(`/api/session/${id}`),
    create: (body: CreateSessionBody) => http.post<{ session: Session }>('/api/session', body),
    join: (token: string, body: JoinSessionBody) =>
        http.post<{ session: Session }>(`/api/session/join`, body, {
            headers: { 'X-Session-Token': token },
        }),
    update: (id: string, body: Partial<Session>) =>
        http.patch<{ session: Session }>(`/api/session/${id}`, body),
    remove: (id: string) => http.delete<void>(`/api/session/${id}`),
    start: (id: string) => http.patch<{ session: Session }>(`/api/session/${id}/start`),
    complete: (id: string) => http.patch<{ session: Session }>(`/api/session/${id}/complete`),
    cancel: (id: string) => http.patch<{ session: Session }>(`/api/session/${id}/cancel`),
    changeQuestion: (id: string, questionId: string) =>
        http.patch<{ session: Session }>(`/api/session/${id}/question`, { question_id: questionId }),
    saveNotes: (id: string, notes: string) =>
        http.patch<{ evaluation: SessionEvaluation }>(`/api/session/${id}/notes`, { notes }),
    evaluation: (id: string) =>
        http.get<{ evaluation: SessionEvaluation }>(`/api/session/${id}/evaluation`),
    events: (id: string) =>
        http.get<{ sessionEvents: SessionEvent[] }>(`/api/session/${id}/events`),
}

export const runApi = {
    execute: (body: { session_id: string; language: string; code: string }) =>
        http.post<{ result: unknown }>('/api/run', body),
}

export const evaluationApi = {
    evaluate: (body: {
        session_id: string
        evaluated_participant_id: string
        rating: 'weak' | 'average' | 'strong'
        notes?: string
    }) => http.post<{ result: unknown }>('/api/evaluation', body),
}
