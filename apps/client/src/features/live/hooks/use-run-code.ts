import { useMutation } from "@tanstack/react-query";
import type { RunResultPayload } from "@algorym/shared-types";
import { runApi } from '@/lib/api';

interface RunVariables {
    code: string;
    language: string;
    stdin?: string;
}

/** The caller's own run: HTTP result plus the id the WS echo will carry. . */
export interface LocalRun {
    runId: string;
    result: RunResultPayload;
}

/** Executes the candidate's code through `POST /api/run`. . */
export function useRunCode(sessionId: string, participantId: string) {
    return useMutation<LocalRun, Error, RunVariables>({
        mutationFn: ({ code, language, stdin }) => {
            const runId = crypto.randomUUID();
            return runApi
                .execute({ sessionId, participantId, code, language, stdin, runId })
                .then(({ result }) => ({ runId, result }));
        },
    });
}
