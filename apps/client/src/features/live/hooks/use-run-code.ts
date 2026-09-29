import { useMutation } from "@tanstack/react-query";
import type { RunResultPayload } from "@algorym/shared-types";
import { runApi } from "@/lib/api/endpoints";

interface RunVariables {
    code: string;
    language: string;
    stdin?: string;
}

/**
 * Executes the candidate's code through `POST /api/run`.
 *
 * Returns `RunResultPayload` directly (the envelope's `{ result }` is unwrapped
 * here) so callers never touch `data.result`.
 *
 * Note this is the *caller's* result. Everyone else in the room learns about it
 * through the `run_result` broadcast, which arrives separately over
 * `useSessionSocket` — the two are intentionally not the same object.
 */
export function useRunCode(sessionId: string, participantId: string) {
    return useMutation<RunResultPayload, Error, RunVariables>({
        mutationFn: ({ code, language, stdin }) =>
            runApi
                .execute({ sessionId, participantId, code, language, stdin })
                .then(({ result }) => result),
    });
}
