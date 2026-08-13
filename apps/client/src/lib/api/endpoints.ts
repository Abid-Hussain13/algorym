import { http } from '@/lib/api/client'

import type {
  AuthResponse,
  CreateQuestionBody,
  CreateSessionBody,
  JoinSessionBody,
  LoginBody,
  Question,
  Session,
  SessionEvaluation,
  SessionEvent,
  SignupBody,
} from '@algorym/shared-types'

export const authApi = {
  signup: (body: SignupBody) => http.post<AuthResponse>('/auth/signup', body),
  login: (body: LoginBody) => http.post<AuthResponse>('/auth/login', body),
  refresh: () => http.post<AuthResponse>('/auth/refresh'),
  me: () => http.get<AuthResponse['user']>('/auth/me'),
}

export const questionsApi = {
  list: () => http.get<Question[]>('/question'),
  get: (id: string) => http.get<Question>(`/question/${id}`),
  create: (body: CreateQuestionBody) => http.post<Question>('/question', body),
  update: (id: string, body: CreateQuestionBody) =>
    http.put<Question>(`/question/${id}`, body),
  remove: (id: string) => http.delete<void>(`/question/${id}`),
}

export const sessionsApi = {
  list: () => http.get<Session[]>('/session'),
  get: (id: string) => http.get<Session>(`/session/${id}`),
  create: (body: CreateSessionBody) => http.post<Session>('/session', body),
  join: (token: string, body: JoinSessionBody) =>
    http.post<{ session: Session }>(`/session/join`, body, {
      headers: { 'X-Session-Token': token },
    }),
  update: (id: string, body: Partial<Session>) =>
    http.patch<Session>(`/session/${id}`, body),
  remove: (id: string) => http.delete<void>(`/session/${id}`),
  start: (id: string) => http.patch<Session>(`/session/${id}/start`),
  complete: (id: string) => http.patch<Session>(`/session/${id}/complete`),
  cancel: (id: string) => http.patch<Session>(`/session/${id}/cancel`),
  changeQuestion: (id: string, questionId: string) =>
    http.patch<Session>(`/session/${id}/question`, { question_id: questionId }),
  saveNotes: (id: string, notes: string) =>
    http.patch<{ notes: string }>(`/session/${id}/notes`, { notes }),
  evaluation: (id: string) =>
    http.get<SessionEvaluation>(`/session/${id}/evaluation`),
  events: (id: string) =>
    http.get<SessionEvent[]>(`/session/${id}/events`),
}

export const runApi = {
  execute: (body: { session_id: string; language: string; code: string }) =>
    http.post('/run', body),
}

export const evaluationApi = {
  evaluate: (body: {
    session_id: string
    evaluated_participant_id: string
    rating: 'weak' | 'average' | 'strong'
    notes?: string
  }) => http.post('/evaluation', body),
}