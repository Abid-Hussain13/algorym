import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { sessionsApi } from "@/lib/api/endpoints";
import { selectAuthStatus, selectUser } from "@/stores/auth-slice";
import { useAppSelector } from "@/stores/hooks";
import { Spinner } from "@/components/ui/Spinner";
import { JoinSessionForm } from "./JoinSessionForm";
import { readParticipantId, writeParticipantId } from "../lib/participant-store";

interface JoinGateProps {
    sessionId: string;
    /** Rendered once the visitor is a confirmed participant. */
    children: (participantId: string) => React.ReactNode;
}

export function JoinGate({ sessionId, children }: JoinGateProps) {
    const [searchParams] = useSearchParams();
    const accessToken = searchParams.get("token");
    const status = useAppSelector(selectAuthStatus);
    const user = useAppSelector(selectUser);

    const [participantId, setParticipantId] = useState<string | null>(() => readParticipantId(sessionId));

    const isAuthResolved = status === "authenticated" || status === "unauthenticated";

    // Host probe: GET /api/session/:id is owner-scoped, so a 200 proves the
    // visitor is the host (who is never sent through the join form).
    const { data: hostProbe, isLoading: probing } = useQuery({
        queryKey: ["session", sessionId],
        queryFn: () => sessionsApi.get(sessionId),
        enabled: isAuthResolved && !participantId,
        retry: false,
    });

    const isHost = status === "authenticated" && hostProbe?.session !== undefined;

    // The host is never sent through the join form, but still needs a
    // participantId for the WebSocket URLs — recover theirs from the detail
    // response (which is owner-scoped, so only they can read it).
    useEffect(() => {
        const hostId = hostProbe?.session?.host_participant_id;
        if (!isHost || participantId || !hostId) return;

        writeParticipantId(sessionId, hostId);
        setParticipantId(hostId);
    }, [hostProbe, isHost, participantId, sessionId]);

    const handleJoined = useCallback(
        (id: string) => {
            writeParticipantId(sessionId, id);
            setParticipantId(id);

            // Drop the invite token so it stops living in history / shared links.
            if (accessToken) {
                const url = new URL(window.location.href);
                url.searchParams.delete("token");
                window.history.replaceState({}, "", url.toString());
            }
        },
        [accessToken, sessionId]
    );

    if (participantId) return <>{children(participantId)}</>;

    if (!isAuthResolved) {
        return (
            <div className="flex min-h-svh items-center justify-center bg-bg">
                <Spinner size="lg" />
            </div>
        );
    }

    if (!isHost && probing) {
        return (
            <div className="flex min-h-svh items-center justify-center bg-bg">
                <Spinner size="lg" />
            </div>
        );
    }

    if (!accessToken) {
        return (
            <div className="flex min-h-svh items-center justify-center bg-bg p-6">
                <div className="max-w-sm text-center">
                    <h1 className="font-display text-lg font-semibold text-fg">This link is incomplete</h1>
                    <p className="mt-2 text-sm text-muted">
                        Ask the interviewer to resend the invitation — the session link is missing its access
                        token.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <JoinSessionForm
            sessionId={sessionId}
            accessToken={accessToken}
            user={user}
            onJoined={handleJoined}
        />
    );
}
