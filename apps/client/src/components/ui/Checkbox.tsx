import { useId } from "react";
import type { InputHTMLAttributes, ReactNode, Ref } from "react";
import { cn } from "@/lib/utils/cn";

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
    ref?: Ref<HTMLInputElement>;
    label?: ReactNode;
    description?: ReactNode;
}

export function Checkbox({ className, label, description, id, ref, ...props }: CheckboxProps) {
    const generatedId = useId();
    const inputId = id ?? generatedId;

    return (
        <div className="flex items-start gap-2.5">
            <input
                id={inputId}
                type="checkbox"
                ref={ref}
                className={cn(
                    "mt-0.5 size-4 shrink-0 cursor-pointer appearance-none rounded border border-border-strong bg-surface transition-colors",
                    "checked:border-accent checked:bg-accent",
                    "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                    className
                )}
                {...props}
            />
            {label && (
                <label htmlFor={inputId} className="cursor-pointer select-none text-sm leading-snug text-fg">
                    {label}
                    {description ? <span className="mt-0.5 block text-xs text-muted">{description}</span> : null}
                </label>
            )}
        </div>
    );
}
