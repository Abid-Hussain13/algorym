import { ApiError } from "@/lib/api/client";
import { useElementHeight } from "@/lib/hooks/use-element-height";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import { useSessionDetail } from "../../hooks/use-session-detail";
import { SessionHeader } from "./SessionHeader";
import { SessionInfoCard } from "./SessionInfoCard";
import { NotesCard } from "./NotesCard";
import { ReplayPlaceholder } from "./ReplayPlaceholder";
import { SessionDetailSkeleton } from "./SessionDetailSkeleton";
import { SessionDetailError } from "./SessionDetailError";

interface SessionDetailProps {
    sessionId: string | undefined;
}

export function SessionDetail({ sessionId }: SessionDetailProps) {
    const { data, isLoading, error, refetch } = useSessionDetail(sessionId);
    const { ref: infoCardRef, height: infoCardHeight } = useElementHeight<HTMLDivElement>();
    const isTwoColumn = useMediaQuery("(min-width: 1024px)");

    if (!sessionId) {
        return <SessionDetailError error={new ApiError(404, "Session not found")} />;
    }

    if (isLoading) return <SessionDetailSkeleton />;

    if (error) {
        return <SessionDetailError error={error} onRetry={() => void refetch()} />;
    }

    const session = data?.session;
    if (!session) return <SessionDetailSkeleton />;

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="animate-rise">
                <SessionHeader session={session} />
            </div>

            <div className="grid items-start gap-5 lg:grid-cols-2">
                <SessionInfoCard
                    ref={infoCardRef}
                    session={session}
                    className="animate-rise [animation-delay:80ms]"
                />
                <NotesCard
                    session={session}
                    className="animate-rise [animation-delay:140ms]"
                    height={isTwoColumn ? infoCardHeight || undefined : undefined}
                />
            </div>

            <ReplayPlaceholder className="animate-rise [animation-delay:200ms]" />
        </div>
    );
}
