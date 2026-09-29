import { useMutation } from "@tanstack/react-query";
import { sessionsApi } from "@/lib/api/endpoints";
import type { JoinSessionBody } from "@algorym/shared-types";
import { writeParticipant } from "../lib/participant-store";

interface JoinVariables {
    accessToken: string;
    body: JoinSessionBody;
}

export function useJoinSession(sessionId: string) {
    return useMutation({
        mutationFn: ({ accessToken, body }: JoinVariables) => sessionsApi.join(accessToken, body),
        onSuccess: (data) => {
            writeParticipant(sessionId, {
                id: data.participant.id,
                displayName: data.participant.display_name || "Guest",
                role: data.participant.role,
            });
        },
    });
}
