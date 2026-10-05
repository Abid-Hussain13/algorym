import type { Ref } from "react";
import type { SessionDetail } from "@algorym/shared-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/utils/cn";

interface IntegrityCardProps {
    session: SessionDetail;
    className?: string;
    ref?: Ref<HTMLDivElement>;
}

/**
 * One exit is a misclick. Repeated exits are a pattern, and the host should be
 * able to see it without reading raw events.
 *
 * The thresholds are deliberately conservative and the wording stays factual —
 * "flagged for review" rather than an accusation. A single accidental `Esc` must
 * not label somebody a cheater, and this tool cannot actually prove intent; it
 * only proves behaviour.
 */
export function IntegrityCard({ session, className, ref }: IntegrityCardProps) {
    // Always rendered, so the host can see that integrity *is* tracked rather than
    // wondering where it went. A session with nobody in it has nothing to report.
    if (!session.candidate_participant_id) {
        return (
            <Card ref={ref} className={cn("flex flex-col", className)}>
                <CardHeader>
                    <CardTitle>Session integrity</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted">
                        Nobody joined this session, so there is nothing to report.
                    </p>
                </CardContent>
            </Card>
        );
    }

    const exits = session.candidate_fullscreen_exits ?? 0;
    const tabAways = session.candidate_tab_aways ?? 0;
    const total = exits + tabAways;

    const level =
        exits >= 3 || total >= 6 ? "flagged" : exits >= 1 || tabAways >= 3 ? "notable" : "clean";

    const tone =
        level === "flagged"
            ? { badge: "bg-danger/10 text-danger", ring: "border-danger/40", text: "text-fg" }
            : level === "notable"
              ? { badge: "bg-warning/10 text-warning", ring: "border-warning/30", text: "text-fg" }
              : { badge: "bg-success/10 text-success", ring: "border-border", text: "text-muted" };

    const headline =
        level === "flagged"
            ? "Flagged for review"
            : level === "notable" ? "Worth a question" : "Stayed in full screen";

    const summary =
        level === "flagged"
            ? "Repeatedly leaving full screen. Treat this rating with that in mind, and mention it if you follow up with the candidate."
            : level === "notable"
              ? "The candidate stepped away a few times. It may have been accidental."
              : "No departures recorded. The interview was watched in full screen throughout.";

    return (
        <Card ref={ref} className={cn("flex flex-col", className)}>
            <CardHeader>
                <CardTitle>Session integrity</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
                <div className={cn("flex flex-col gap-1.5 rounded-lg border px-3.5 py-3", tone.ring)}>
                    <span className={cn("text-sm font-medium", tone.text)}>{headline}</span>
                    <p className="text-xs leading-relaxed text-muted">{summary}</p>
                </div>

                <dl className="grid gap-4 sm:grid-cols-3">
                    <div className="flex flex-col gap-1">
                        <dt className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted">
                            Left full screen
                        </dt>
                        <dd className="flex items-baseline gap-1.5">
                            <span
                                className={cn(
                                    "font-mono text-lg font-semibold",
                                    exits > 0 ? "text-fg" : "text-muted"
                                )}
                            >
                                {exits}
                            </span>
                            <span className="text-[11px] text-muted">
                                {exits === 1 ? "time" : "times"}
                            </span>
                        </dd>
                    </div>

                    <div className="flex flex-col gap-1">
                        <dt className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted">
                            Switched tabs
                        </dt>
                        <dd className="flex items-baseline gap-1.5">
                            <span
                                className={cn(
                                    "font-mono text-lg font-semibold",
                                    tabAways > 0 ? "text-fg" : "text-muted"
                                )}
                            >
                                {tabAways}
                            </span>
                            <span className="text-[11px] text-muted">
                                {tabAways === 1 ? "time" : "times"}
                            </span>
                        </dd>
                    </div>

                    <div className="flex flex-col gap-1">
                        <dt className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted">
                            Verdict
                        </dt>
                        <dd>
                            <span
                                className={cn(
                                    "inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium",
                                    tone.badge
                                )}
                            >
                                {level}
                            </span>
                        </dd>
                    </div>
                </dl>

                <p className="text-[11px] leading-relaxed text-muted">
                    Recorded automatically while the session ran. It shows that focus was lost, not
                    why — treat it as context for your rating rather than proof of anything.
                </p>
            </CardContent>
        </Card>
    );
}
