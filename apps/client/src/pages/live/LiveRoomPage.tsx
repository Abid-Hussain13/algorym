import { useParams } from "react-router-dom";
import { JoinGate } from "@/features/live";

export function LiveRoomPage() {
    const { sessionId } = useParams<{ sessionId: string }>();

    if (!sessionId) {
        return <div className="p-6 font-body text-fg">Live room</div>;
    }

    return (
        <JoinGate sessionId={sessionId}>
            {(participantId) => (
                <div className="p-6 font-body text-fg">
                    Live room {sessionId} — participant {participantId.slice(0, 8)}
                </div>
            )}
        </JoinGate>
    );
}
