import { useState } from "react";
import type { FormEvent } from "react";
import { toast } from "sonner";
import type { JoinSessionBody } from "@algorym/shared-types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";
import { Card, CardContent } from "@/components/ui/Card";
import { useJoinSession } from "../hooks/use-join-session";
import type { UserSafe } from "@/stores/auth-slice";
import type { LocalParticipant } from "../lib/participant-store";

interface JoinSessionFormProps {
    sessionId: string;
    accessToken: string;
    user: UserSafe | null;
    onJoined: (participant: LocalParticipant) => void;
}

export function JoinSessionForm({ sessionId, accessToken, user, onJoined }: JoinSessionFormProps) {
    const [displayName, setDisplayName] = useState("");
    const [email, setEmail] = useState("");
    const [consent, setConsent] = useState(false);
    const [nameError, setNameError] = useState<string>();
    const [emailError, setEmailError] = useState<string>();

    const joinSession = useJoinSession(sessionId);

    const isAuthenticated = !!user;

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault();

        let valid = true;

        if (!isAuthenticated) {
            const trimmedName = displayName.trim();
            const trimmedEmail = email.trim();

            if (!trimmedName) {
                setNameError("Name is required");
                valid = false;
            } else {
                setNameError(undefined);
            }

            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
                setEmailError("Enter a valid email address");
                valid = false;
            } else {
                setEmailError(undefined);
            }

            if (!valid) return;
        }

        if (!consent) {
            toast.error("Please confirm whether we may contact you about this session");
            return;
        }

        const body: JoinSessionBody = {
            access_token: accessToken,
            consent_to_contact: consent,
        };

        if (!isAuthenticated) {
            body.display_name = displayName.trim();
            body.email = email.trim();
        }

        joinSession.mutate(
            { accessToken, body },
            {
                onSuccess: (data) =>
                    onJoined({
                        id: data.participant.id,
                        displayName: data.participant.display_name || "Guest",
                        role: data.participant.role,
                    }),
                onError: (err) => {
                    toast.error(err instanceof Error ? err.message : "Could not join this session");
                },
            }
        );
    };

    return (
        <div className="flex min-h-svh items-center justify-center bg-bg p-6">
            <Card className="w-full max-w-md">
                <CardContent className="p-6">
                    <div className="mb-6 flex flex-col gap-1.5">
                        <h1 className="font-display text-xl font-semibold tracking-tight text-fg">
                            Join interview session
                        </h1>
                        <p className="text-sm text-muted">
                            {isAuthenticated
                                ? "You're signed in, so we already have your name and email. Just confirm and you're in."
                                : "Tell us who's joining so the interviewer knows who they're speaking with."}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        {isAuthenticated ? (
                            <div className="flex flex-col gap-1.5 rounded-lg border border-border bg-surface px-3 py-2.5">
                                <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted">
                                    Joining as
                                </span>
                                <span className="text-sm font-medium text-fg">
                                    {user?.name}
                                    <span className="ml-2 font-normal text-muted">{user?.email}</span>
                                </span>
                            </div>
                        ) : (
                            <>
                                <Input
                                    label="Your name"
                                    placeholder="e.g. Hassan Ali"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    error={nameError}
                                    autoComplete="name"
                                    required
                                />
                                <Input
                                    label="Email"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    error={emailError}
                                    autoComplete="email"
                                    required
                                />
                            </>
                        )}

                        <Checkbox
                            checked={consent}
                            onChange={(e) => setConsent(e.target.checked)}
                            label="You may contact me about this session"
                            description={
                                isAuthenticated
                                    ? "Asked on every session — we never reuse a previous answer."
                                    : undefined
                            }
                        />

                        <Button
                            type="submit"
                            variant="primary"
                            loading={joinSession.isPending}
                            className="mt-1 w-full"
                        >
                            Join session
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
