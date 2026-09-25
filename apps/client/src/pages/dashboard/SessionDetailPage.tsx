import { useParams } from "react-router-dom";
import { SessionDetail } from "@/features/sessions";

export function SessionDetailPage() {
    const { sessionId } = useParams<{ sessionId: string }>();

    return <SessionDetail sessionId={sessionId} />;
}
