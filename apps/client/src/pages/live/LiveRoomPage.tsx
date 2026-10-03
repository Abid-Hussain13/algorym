import { Suspense, useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import {
    JoinGate,
    useCollaboration,
    useCollaborators,
    useLiveSession,
    useSessionSocket,
    useEditorFiles,
    useRoomOutput,
    useRunCode,
    useHostActions,
    useResizablePane,
    CollaboratorsBar,
    FullscreenGuard,
    QuestionPanel,
    EditorTabs,
    EditorControls,
    CodeEditor,
    BottomTabs,
    SideRail,
    PanelColumn,
    AssignedQuestions,
    AllQuestionsPicker,
    SessionSettingsPanel,
    HostVerdict,
} from "@/features/live";
import type { LocalParticipant, RailPanel } from "@/features/live";
import { useSessionDetail } from "@/features/sessions";
import { buildInviteUrl } from "@/lib/session-urls";
import type { EvaluationRating } from "@algorym/shared-types";

export function LiveRoomPage() {
    const { sessionId } = useParams<{ sessionId: string }>();

    if (!sessionId) {
        return <div className="p-6 font-body text-fg">no sessionId can't enter room</div>;
    }

    return (
        <JoinGate sessionId={sessionId}>
            {(participant) => <LiveRoomShell sessionId={sessionId} participant={participant} />}
        </JoinGate>
    );
}

const PANEL_TITLES: Record<Exclude<RailPanel, null>, string> = {
    questions: "Assigned questions",
    browse: "All questions",
    settings: "Session",
};

function LiveRoomShell({
    sessionId,
    participant,
}: {
    sessionId: string;
    participant: LocalParticipant;
}) {
    const isHost = participant.role === "host";
    const [rail, setRail] = useState<RailPanel>(null);
    const [stdin, setStdin] = useState("");

    // ── Channel: collaboration (the shared code, and presence rides along) ──
    const collaboration = useCollaboration(sessionId, participant);
    const { collaborators, connected } = useCollaborators(
        collaboration?.provider.awareness ?? null,
        participant.id,
        collaboration?.isConnected ?? false
    );

    // ── Channel: HTTP (session + question, and running code) ───────────────
    const { session, question, isLoading } = useLiveSession(sessionId, participant.id);
    const runCode = useRunCode(sessionId, participant.id);

    // ── Channel: events (what everyone else ran) ───────────────────────────
    const socket = useSessionSocket(sessionId, participant.id);
    const outputEntries = useRoomOutput(socket, participant.id);

    // ── The shared files, keyed inside the CRDT ────────────────────────────
    const language = session?.language ?? null;
    const starterCode = language ? question?.starter_code?.[language] ?? null : null;

    const { fileNames, activeName, activeText, setActiveName, addFile, closeFile } = useEditorFiles(
        collaboration?.files ?? null,
        starterCode,
        language,
        !isLoading
    );

    // Host-only: the owner-scoped payload carrying the question list and notes.
    // Guests get `undefined`, so the query stays disabled for them.
    const { data: hostDetail } = useSessionDetail(isHost ? sessionId : undefined);
    const hostActions = useHostActions(sessionId);

    // The side panel is a layout column, so Escape should dismiss it.
    useEffect(() => {
        if (!rail) return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") setRail(null);
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [rail]);

    const panel = useResizablePane({
        initial: 320,
        min: 240,
        max: 560,
        axis: "vertical",
        storageKey: "algorym:room:panel-width",
    });

    const candidateId = collaborators.find((c) => c.role === "guest")?.participantId ?? null;

    const nameFor = useCallback(
        (participantId: string) =>
            collaborators.find((c) => c.participantId === participantId)?.displayName ?? "Someone",
        [collaborators]
    );

    const handleRun = useCallback(() => {
        const code = activeText?.toString() ?? "";
        if (!code.trim()) {
            toast.error("Nothing to run — the active file is empty");
            return;
        }
        if (!language) return;

        runCode.mutate(
            { code, language, stdin: stdin || undefined },
            { onError: (error) => toast.error(error.message || "Run failed") }
        );
    }, [activeText, language, stdin, runCode]);

    const handleSelectQuestion = useCallback(
        (questionId: string, nextLanguage?: string) => {
            hostActions.changeQuestion.mutate(
                { questionId, language: nextLanguage ?? language ?? "javascript" },
                { onSuccess: () => setRail(null) }
            );
        },
        [hostActions.changeQuestion, language]
    );

    const handleCopyInvite = useCallback(async () => {
        const accessToken = hostDetail?.session.access_token;
        if (!accessToken) {
            toast.error("Couldn't build the invite link");
            return;
        }

        try {
            await navigator.clipboard.writeText(buildInviteUrl(sessionId, accessToken));
            toast.success("Invite link copied");
        } catch {
            toast.error("Clipboard blocked by the browser");
        }
    }, [hostDetail?.session.access_token, sessionId]);

    const questionLanguages = question?.languages ?? [];
    const availableLanguages = questionLanguages.length > 0 ? questionLanguages : language ? [language] : [];

    return (
        <div className="flex h-svh flex-col overflow-hidden bg-bg text-fg">
            <FullscreenGuard isHost={isHost} />

            <header className="flex shrink-0 items-center justify-between gap-4 border-b border-border px-5 py-2.5">
                <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="truncate font-display text-sm font-semibold">
                        {question?.title ?? "Live session"}
                    </span>
                    <span className="truncate text-xs text-muted">
                        {sessionId.slice(0, 8)} · you are {participant.displayName} ({participant.role})
                    </span>
                </div>
                <CollaboratorsBar collaborators={collaborators} connected={connected} />
            </header>

            <div className="flex min-h-0 flex-1">
                <SideRail isHost={isHost} active={rail} onSelect={setRail} />

                {rail && (
                    <PanelColumn
                        title={PANEL_TITLES[rail]}
                        onClose={() => setRail(null)}
                        width={panel.size}
                        handleProps={panel.handleProps}
                        footer={
                            isHost ? (
                                <HostVerdict
                                    sessionId={sessionId}
                                    candidateId={candidateId}
                                    mode={session?.mode ?? "interview"}
                                    status={session?.status ?? "scheduled"}
                                    existingRating={(hostDetail?.session.rating as EvaluationRating) ?? null}
                                    onCompleteSession={() => hostActions.completeSession.mutate()}
                                    isCompleting={hostActions.completeSession.isPending}
                                />
                            ) : undefined
                        }
                    >
                        {rail === "questions" && (
                            <AssignedQuestions
                                questions={hostDetail?.session.questions ?? []}
                                currentQuestionId={session?.question_id ?? null}
                                isLoading={!hostDetail}
                                isSwitching={hostActions.changeQuestion.isPending}
                                onSelect={(id) => handleSelectQuestion(id)}
                            />
                        )}

                        {rail === "browse" && (
                            <AllQuestionsPicker
                                currentQuestionId={session?.question_id ?? null}
                                assignedIds={(hostDetail?.session.questions ?? []).map((q) => q.id)}
                                onSelect={handleSelectQuestion}
                            />
                        )}

                        {rail === "settings" && (
                            <SessionSettingsPanel
                                session={session}
                                collaboratorCount={collaborators.length}
                                isHost={isHost}
                                onCopyInvite={isHost ? handleCopyInvite : undefined}
                            />
                        )}
                    </PanelColumn>
                )}

                {/* Both sides need to read the problem, so it is always visible. */}
                <aside className="w-72 shrink-0 overflow-y-auto border-r border-border">
                    <QuestionPanel question={question} language={language} isLoading={isLoading} />
                </aside>

                <main className="flex min-w-0 flex-1 flex-col">
                    <div className="flex min-h-0 flex-1 flex-col">
                        <EditorTabs
                            fileNames={fileNames}
                            activeName={activeName}
                            onSelect={setActiveName}
                            onAdd={addFile}
                            onClose={closeFile}
                            toolbar={
                                <EditorControls
                                    language={language}
                                    availableLanguages={availableLanguages}
                                    onLanguageChange={(next) => {
                                        // Re-assigning the current question with a
                                        // different language is how the server
                                        // models a language change.
                                        if (session?.question_id) {
                                            handleSelectQuestion(session.question_id, next);
                                        }
                                    }}
                                    onRun={handleRun}
                                    isRunning={runCode.isPending}
                                    canRun={Boolean(activeText) && Boolean(language)}
                                    canChangeLanguage={isHost}
                                />
                            }
                        />
                        <div className="min-h-0 flex-1">
                            <Suspense
                                fallback={
                                    <div className="grid h-full place-items-center text-xs text-muted">
                                        Loading editor…
                                    </div>
                                }
                            >
                                <CodeEditor
                                    yText={activeText}
                                    awareness={collaboration?.provider.awareness ?? null}
                                    language={language}
                                />
                            </Suspense>
                        </div>
                    </div>

                    <BottomTabs
                        entries={outputEntries}
                        localResult={runCode.data ?? null}
                        isRunning={runCode.isPending}
                        nameFor={nameFor}
                        stdin={stdin}
                        onStdinChange={setStdin}
                        isHost={isHost}
                        sessionId={sessionId}
                        initialNotes={hostDetail?.session.notes ?? null}
                        notesEnabled={session?.status === "live" || session?.status === "completed"}
                    />
                </main>
            </div>
        </div>
    );
}
