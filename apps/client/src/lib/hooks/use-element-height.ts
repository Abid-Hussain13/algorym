import { useCallback, useRef, useState } from "react";

export function useElementHeight<T extends HTMLElement>() {
    const [height, setHeight] = useState(0);
    const observerRef = useRef<ResizeObserver | null>(null);

    const ref = useCallback((element: T | null) => {
        observerRef.current?.disconnect();
        observerRef.current = null;

        if (!element) return;

        const update = () => setHeight(element.getBoundingClientRect().height);

        update();
        const observer = new ResizeObserver(update);
        observer.observe(element);
        observerRef.current = observer;
    }, []);

    return { ref, height };
}
