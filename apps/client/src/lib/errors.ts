import { ApiError } from './api/client'

/** Turns any thrown value into a message worth showing a user. . */
export function explainError(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
    if (error instanceof ApiError) {
        if (error.errors?.length) {
            return error.errors.map((e) => e.message).join(' · ')
        }
        if (error.status === 0) {
            return "Can't reach the server. Check your connection and try again."
        }
        if (error.status >= 500) {
            return fallback
        }
        if (error.message) return error.message
    }
    if (error instanceof Error && error.message) return error.message
    return fallback
}
