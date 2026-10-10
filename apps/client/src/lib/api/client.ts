import type { ApiResponse } from '@algorym/shared-types'

import { authApi } from './endpoints'

/**
 * Baked in at **build** time, so changing it needs a rebuild, not a restart.
 *
 * Failing loudly here beats the alternative: with no value, every request went to
 * `undefined/api/...`, which fails in the browser with a confusing CORS or network
 * error that looks like a server problem rather than a missing env var. Vite
 * replaces `import.meta.env.*` at build time, so `import.meta.env.DEV` is `false`
 * in production and this stays a ~40 byte string in the shipped bundle.
 */
const API_BASE: string =
    import.meta.env.VITE_API_URL ||
    (import.meta.env.DEV ? "http://localhost:3000" : "");

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

/** Cheap, side-effect-free probe. Used to wake a cold server. */
const WARMUP_PATH = "/health";

/**
 * Backoff schedule, ~15s total — comfortably longer than Render's ~50s cold
 * start in practice, without leaving the user staring at a spinner.
 */
const WARMUP_DELAYS_MS = [0, 500, 1000, 2000, 4000, 8000];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Waits for the API to answer again.
 *
 * **Why this is a `GET /health` and not just "retry the request":** on a free
 * tier the original request never reached the app, so retrying is safe — but
 * that is only *probably* true for a mutation, and a retried `POST /question`
 * could land twice. `/health` has no side effects at all, so it can be polled
 * until the server is awake and the original request is then sent for the first
 * time. Safe for every verb.
 *
 * Single-flighted so twenty components mounting at once share one wake-up rather
 * than each starting their own.
 */
let warming: Promise<boolean> | null = null;

function waitForApi(): Promise<boolean> {
    if (warming) return warming;

    warming = (async () => {
        for (const delay of WARMUP_DELAYS_MS) {
            if (delay) await sleep(delay);
            try {
                const res = await fetch(`${API_BASE}${WARMUP_PATH}`, {
                    method: "GET",
                    cache: "no-store",
                });
                if (res.ok) return true;
            } catch {
                // Still cold. Keep going.
            }
        }
        return false;
    })().finally(() => {
        warming = null;
    });

    return warming;
}

/**
 * One message for "the request never arrived".
 *
 * A bare `Failed to fetch` is useless — it cannot tell you whether the network
 * is down, the server is asleep, or the browser blocked the response. Naming all
 * three costs a sentence and saves a debugging session.
 */
function unreachableMessage(cause: unknown): string {
    return (
        `Can't reach the server at ${API_BASE}. ` +
        `It may be asleep and starting up, offline, or the server's CLIENT_URL may not ` +
        `match this site's origin (which blocks the request in the browser). ` +
        `Nothing was saved. Try again in a moment. ` +
        `(Original error: ${cause instanceof Error ? cause.message : String(cause)})`
    );
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    let response: Response;

    const init: RequestInit = {
        credentials: 'include',
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    };

    const send = () => fetch(`${API_BASE}${path}`, init);

    try {
        response = await send();
    } catch (cause) {
        /**
         * A free-tier host sleeps after ~15 minutes idle and takes the better
         * part of a minute to boot. A request that lands in that window is
         * dropped before the app ever sees it, which the browser reports as a
         * CORS failure with `Status code: (null)` — no status at all, because
         * there was no response to have one.
         *
         * So before giving up: wait for the server to come back, then send the
         * original request once. The wait polls `/health`, so nothing is
         * duplicated even for a POST.
         */
        const woke = await waitForApi();
        if (woke) {
            try {
                response = await send();
            } catch (retryCause) {
                throw new ApiError(0, unreachableMessage(retryCause));
            }
        } else {
            throw new ApiError(0, unreachableMessage(cause));
        }
    }


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
    getText: async (path: string): Promise<string> => {
        const response = await fetch(`${API_BASE}${path}`, {
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) throw new ApiError(response.status, `Request failed: ${response.status}`);
        return response.text();
    },
}
