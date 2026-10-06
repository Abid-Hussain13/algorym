import type { ReactNode } from "react";

/**
 * A message inside the dialog that stays until you act on it.
 *
 * The whole reason this exists: toasts are wrong for form failures. A toast lives four
 * seconds in a corner, so a user who clicks **Create Session** and sees nothing happen has
 * genuinely been given no information — and a server error that also *closed* the dialog
 * took their half-finished form with it.
 *
 * For anything blocking the action, the message has to be inline, persistent, and sitting
 * right next to the button that was pressed.
 */
export function FormAlert({
    tone = "error",
    title,
    children,
    action,
}: {
    tone?: "error" | "warning" | "pending";
    title: string;
    children?: ReactNode;
    action?: ReactNode;
}) {
    const styles = {
        error: "border-danger/40 bg-danger/10 text-danger",
        warning: "border-warning/40 bg-warning/10 text-warning",
        pending: "border-border bg-surface-2/60 text-muted",
    } as const;

    return (
        <div
            role="alert"
            aria-live="assertive"
            className={`flex items-start gap-2.5 rounded-lg border px-3 py-2.5 ${styles[tone]}`}
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.7}
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`mt-px size-4 shrink-0 ${tone === "pending" ? "animate-spin" : ""}`}
                aria-hidden="true"
            >
                {tone === "pending" ? (
                    <>
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </>
                ) : (
                    <>
                        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
                        <path d="M12 9v4M12 17h.01" />
                    </>
                )}
            </svg>

            <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold leading-relaxed">{title}</p>
                {children && (
                    <div className="mt-1 text-[11px] leading-relaxed opacity-90">{children}</div>
                )}
            </div>

            {action && <div className="shrink-0">{action}</div>}
        </div>
    );
}