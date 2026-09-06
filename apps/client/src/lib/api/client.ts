import type { ApiResponse } from '@algorym/shared-types'

import { authApi } from './endpoints'

const API_BASE = import.meta.env.VITE_API_URL;

// Track refresh state to prevent race conditions
let isRefreshing = false;
let failedQueue: Array<{ resolve: (value: void | PromiseLike<void>) => void; reject: (reason?: unknown) => void }> = [];

const PUBLIC_AUTH_APIS = [
    '/api/auth/login',
    '/api/auth/signup',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
    'api/auth/verify-email'
]

function onRefreshResolve(value: void | PromiseLike<void>) {
    failedQueue.forEach(queueItem => queueItem.resolve(value));
    failedQueue = [];
}

function onRefreshReject(reason?: unknown) {
    failedQueue.forEach(queueItem => queueItem.reject(reason));
    failedQueue = [];
}

async function refreshToken(): Promise<void | null> {
    if (isRefreshing) {
        // Wait for existing refresh to complete
        return new Promise<void | null>((resolve, reject) => {
            failedQueue.push({ resolve, reject });
        });
    }

    isRefreshing = true;
    try {
        const result = await authApi.refresh();

        // Refresh successful — clear queue and retry all pending requests
        onRefreshResolve(result ?? undefined);

        // Update refresh state
        isRefreshing = false;

        return result;
    } catch {
        // Refresh failed — logout user and reject all pending requests
        const error = new Error('Refresh failed');
        console.log(error);
        onRefreshReject(error);
        isRefreshing = false;

        await authApi.logout();
        // Re-throw to propagate the error
        throw error;
    }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${API_BASE}${path}`, {
        credentials: 'include',
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    })

    if (response.status === 401) {
        if (!PUBLIC_AUTH_APIS.includes(path)) {
            // Don't refresh if we're already on the refresh endpoint
            if (path === '/api/auth/refresh') {
                throw new ApiError(401, 'Session expired, please login again. from refresh path');
            }

            // Refresh token
            try {
                await refreshToken();

                return request<T>(path, options);
            } catch {
                // For /api/auth/me, return a silent "not logged in" error
                // Other endpoints get "session expired"
                if (path === '/api/auth/me') {
                    throw new ApiError(401, 'Not authenticated');
                }
                throw new ApiError(401, 'Session expired, please login again. from catch');
            }
        }
    }

    if (!response.ok) {
        let message = `Request failed: ${response.status}`
        let errors: Array<{ field: string; message: string }> | undefined
        try {
            const body = await response.json() as { message?: string; errors?: Array<{ field: string; message: string }> }
            if (body.message) message = body.message
            if (body.errors) errors = body.errors
        } catch {
            throw new ApiError(500, "Something went wrong");
        }
        throw new ApiError(response.status, message, errors)
    }

    if (response.status === 204) return undefined as T

    const body = await response.json() as ApiResponse<T>
    if (!body.success) {
        throw new ApiError(400, body.message || 'Request failed')
    }
    return body.data
}

export class ApiError extends Error {
    status: number
    errors?: Array<{ field: string; message: string }>

    constructor(status: number, message: string, errors?: Array<{ field: string; message: string }>) {
        super(message)
        this.status = status
        this.errors = errors
        this.name = 'ApiError'
    }
}

export const http = {
    get: <T>(path: string, options?: RequestInit) =>
        request<T>(path, { ...options, method: 'GET' }),
    post: <T>(path: string, body?: unknown, options?: RequestInit) =>
        request<T>(path, { ...options, method: 'POST', body: JSON.stringify(body) }),
    patch: <T>(path: string, body?: unknown, options?: RequestInit) =>
        request<T>(path, { ...options, method: 'PATCH', body: JSON.stringify(body) }),
    put: <T>(path: string, body?: unknown, options?: RequestInit) =>
        request<T>(path, { ...options, method: 'PUT', body: JSON.stringify(body) }),
    delete: <T>(path: string, options?: RequestInit) =>
        request<T>(path, { ...options, method: 'DELETE' }),
}
