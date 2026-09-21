import { useEffect, useRef, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { sessionsApi } from "@/lib/api/endpoints";
import type { Session, SessionStatus } from "@algorym/shared-types";

const STATUS_LABELS: Record<SessionStatus, string> = {
    scheduled: "Scheduled",
    live: "Live",
    completed: "Completed",
    cancelled: "Cancelled",
    expired: "Expired",
};

export function useSessionStatusPoller() {
    const queryClient = useQueryClient();
    const prevStatuses = useRef<Map<string, SessionStatus>>(new Map());

    const { data } = useQuery({
        queryKey: ["sessionStatusPoll"],
        queryFn: () => sessionsApi.list({ page: 1, sort_by: "date_desc" }),
        refetchInterval: 30_000,
        refetchIntervalInBackground: true,
    });

    const sessions = data?.sessions ?? [];

    const detectChanges = useCallback(() => {
        const next = new Map<string, SessionStatus>();
        for (const s of sessions) {
            next.set(s.id, s.status);
        }

        for (const [id, status] of next) {
            const prev = prevStatuses.current.get(id);
            if (prev && prev !== status) {
                const session = sessions.find((s) => s.id === id);
                const title = session?.role_context || "Session";
                const label = STATUS_LABELS[status];

                if (status === "live") {
                    toast.success(`"${title}" is now live`);
                } else if (status === "expired") {
                    toast.warning(`"${title}" has ended`);
                } else if (status === "completed") {
                    toast.success(`"${title}" completed`);
                } else if (status === "cancelled") {
                    toast.info(`"${title}" was cancelled`);
                } else {
                    toast.info(`"${title}" is now ${label}`);
                }

                queryClient.invalidateQueries({ queryKey: ["sessions"] });
                queryClient.invalidateQueries({ queryKey: ["dashboard"] });
            }
        }

        prevStatuses.current = next;
    }, [sessions, queryClient]);

    useEffect(() => {
        detectChanges();
    }, [detectChanges]);
}
