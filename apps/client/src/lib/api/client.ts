import type { ApiResponse } from '@algorym/shared-types'

const API_BASE = import.meta.env.VITE_API_URL;

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${API_BASE}${path}`, {
        credentials: 'include',
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    })

    if (!response.ok) {
        let message = `Request failed: ${response.status}`
        let errors: Array<{ field: string; message: string }> | undefined
        try {
            const body = await response.json() as { message?: string; errors?: Array<{ field: string; message: string }> }
            if (body.message) message = body.message
            if (body.errors) errors = body.errors
        } catch {
            /* noop */
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
