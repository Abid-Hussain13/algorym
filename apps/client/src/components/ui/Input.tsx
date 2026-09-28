import { useId } from "react";
import type { InputHTMLAttributes, Ref } from "react";
import { cn } from "@/lib/utils/cn";

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
    ref?: Ref<HTMLInputElement>;
    label?: string;
    error?: string;
    hint?: string;
}

export function Input({ className, label, error, hint, id, ref, ...props }: InputProps) {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

    return (
        <div className="flex flex-col gap-1.5">
            {label && (
                <label htmlFor={inputId} className="text-xs font-medium text-muted">
                    {label}
                </label>
            )}
            <input
                id={inputId}
                ref={ref}
                aria-invalid={error ? true : undefined}
                aria-describedby={describedBy}
                className={cn(
                    "h-9 w-full rounded-lg border bg-surface px-3 text-sm text-fg placeholder:text-muted transition-colors focus:outline-none focus:ring-1",
                    error
                        ? "border-danger focus:border-danger focus:ring-danger/25"
                        : "border-border focus:border-accent focus:ring-accent",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                    className
                )}
                {...props}
            />
            {error ? (
                <p id={`${inputId}-error`} className="text-xs text-danger">
                    {error}
                </p>
            ) : hint ? (
                <p id={`${inputId}-hint`} className="text-xs text-muted">
                    {hint}
                </p>
            ) : null}
        </div>
    );
}
