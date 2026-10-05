import { useEffect, useState } from "react";

/**
 * A shared 30s clock.
 *
 * Several panels need "now" — the five-minute warning, elapsed time, the countdown.
 * Reading `Date.now()` during render is impure and never ticks on its own, so each
 * consumer would otherwise subscribe to the clock itself and drift out of step.
 */
export function useNow(intervalMs = 30_000): number {
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), intervalMs);
        return () => clearInterval(timer);
    }, [intervalMs]);

    return now;
}
