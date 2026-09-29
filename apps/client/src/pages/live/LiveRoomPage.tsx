import { useParams } from "react-router-dom";
import {
    JoinGate,
    useCollaboration,
    useCollaborators,
    useLiveSession,
    useSessionSocket,
    CollaboratorsBar,
    FullscreenGuard,
} from "@/features/live";
import type { LocalParticipant } from "@/features/live";

export function LiveRoomPage() {
    const { sessionId } = useParams<{ sessionId: string }>();

    if (!sessionId) {
        return <div className="p-6 font-body text-fg">no sessionId can't enter room</div>;
    }

    return (
        <JoinGate sessionId={sessionId}>
            {(participant) => <LiveRoomShell sessionId={sessionId} participant={participant} />}
        </JoinGate>
    );
}

function LiveRoomShell({
    sessionId,
    participant,
}: {
    sessionId: string;
    participant: LocalParticipant;
}) {
    const collaboration = useCollaboration(sessionId, participant);
    const { collaborators, connected } = useCollaborators(
        collaboration?.provider.awareness ?? null,
        participant.id,
        collaboration?.isConnected ?? false
    );

    // Phase 4 data layer: session state + question, and the /ws event channel.
    const { session, question, isLoading } = useLiveSession(sessionId, participant.id);
    const socket = useSessionSocket(sessionId, participant.id);

    return (
        <div className="flex h-svh flex-col overflow-hidden bg-bg text-fg">
            <FullscreenGuard isHost={participant.role === "host"} />

            <header className="flex shrink-0 items-center justify-between gap-4 border-b border-border px-5 py-3">
                <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="truncate font-display text-sm font-semibold">
                        Live session
                    </span>
                    <span className="truncate text-xs text-muted">
                        {sessionId.slice(0, 8)} · you are {participant.displayName} (
                        {participant.role})
                    </span>
                </div>
                <CollaboratorsBar collaborators={collaborators} connected={connected} />
            </header>

            <main className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 p-6">
                {isLoading && (
                    <p className="text-sm text-muted">Loading session…</p>
                )}

                {session && (
                    <p className="text-sm text-muted">
                        status <span className="font-medium text-fg">{session.status}</span>
                        {session.language && (
                            <>
                                {" "}· language{" "}
                                <span className="font-medium text-fg">{session.language}</span>
                            </>
                        )}
                        {" "}· events{" "}
                        <span
                            className={`font-medium ${
                                socket.isConnected ? "text-success" : "text-warning"
                            }`}
                        >
                            {socket.isConnected ? "connected" : "reconnecting"}
                        </span>
                    </p>
                )}

                <p className="text-center text-sm text-muted">
                    {question
                        ? `Question: ${question.title}`
                        : "Editor, output and question panels land in Phase 5."}
                </p>
            </main>
        </div>
    );
}
