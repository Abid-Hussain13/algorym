import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { sessionsApi } from '@/lib/api';
import { selectAuthStatus, selectUser } from "@/stores/auth-slice";
import { useAppSelector } from "@/stores/hooks";
import { Spinner } from "@/components/ui/Spinner";
import { JoinSessionForm } from "./JoinSessionForm";
import { readParticipant, writeParticipant } from "../lib/participant-store";
import type { LocalParticipant } from "../lib/participant-store";

interface JoinGateProps {
    sessionId: string;
    /** Rendered once the visitor is a confirmed participant. */
    children: (participant: LocalParticipant) => React.ReactNode;
}

export function JoinGate({ sessionId, children }: JoinGateProps) {
    const [searchParams] = useSearchParams();
    const accessToken = searchParams.get("token");
    const status = useAppSelector(selectAuthStatus);
    const user = useAppSelector(selectUser);

    /** Set only by the join form or by a previous visit (sessionStorage). */
    const [joined, setJoined] = useState<LocalParticipant | null>(() => readParticipant(sessionId));

    const isAuthResolved = status === "authenticated" || status === "unauthenticated";

    // Host probe: GET /api/session/:id is owner-scoped, so a 200 proves the
    // visitor is the host (who is never sent through the join form).
    const { data: hostProbe, isLoading: probing } = useQuery({
        queryKey: ["session", sessionId],
        queryFn: () => sessionsApi.get(sessionId),
        enabled: isAuthResolved && !joined,
        retry: false,
    });

    const isHost = status === "authenticated" && hostProbe?.session !== undefined;

    // The host is never sent through the join form, but still needs a
    // participantId for the WebSocket URLs — recover theirs from the detail
    // response (which is owner-scoped, so only they can read it). Derived during
    // render rather than pushed into state from an effect.
    const hostParticipant = useMemo<LocalParticipant | null>(() => {
        const hostId = hostProbe?.session?.host_participant_id;
        if (!isHost || !hostId) return null;

        return { id: hostId, displayName: user?.name || "Host", role: "host" };
    }, [hostProbe, isHost, user?.name]);

    const participant = joined ?? hostParticipant;

    // The only thing that genuinely needs an effect is persisting the host's
    // participantId so a refresh does not re-run the probe.
    useEffect(() => {
        if (!hostParticipant || joined) return;
        writeParticipant(sessionId, hostParticipant);
    }, [hostParticipant, joined, sessionId]);

    const handleJoined = useCallback(
        (record: LocalParticipant) => {
            writeParticipant(sessionId, record);
            setJoined(record);

            // Drop the invite token so it stops living in history / shared links.
            if (accessToken) {
                const url = new URL(window.location.href);
                url.searchParams.delete("token");
                window.history.replaceState({}, "", url.toString());
            }
        },
        [accessToken, sessionId]
    );

    if (participant) return <>{children(participant)}</>;

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
