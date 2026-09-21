export function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section>
            <h2 className="font-display text-[22px] font-semibold tracking-[-0.015em] leading-[1.15] text-fg">
                {title}
            </h2>
            <div className="mt-3 text-[15px] leading-[1.65] text-muted">
                {children}
            </div>
        </section>
    );
}

export function Subheading({ children }: { children: React.ReactNode }) {
    return (
        <h3 className="mt-5 mb-2 font-display text-[16px] font-semibold tracking-[-0.01em] text-fg">
            {children}
        </h3>
    );
}
