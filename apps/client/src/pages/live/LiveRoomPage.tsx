import { Suspense, useCallback, useEffect, useRef, useState } from "react";
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
    useCodeSnapshots,
    useUnloadGuard,
    useFullscreenGuard,
    useEscapeKeyLock,
    useEditorPreferences,
    useRunCode,
    useHostActions,
    useResizablePane,
    CollaboratorsBar,
    FullscreenGate,
    FullscreenGuard,
    SessionTimeWarning,
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
    SessionEndedDialog,
} from "@/features/live";
import type { LocalParticipant, RailPanel } from "@/features/live";
import { useSessionDetail } from "@/features/sessions";
import { buildInviteUrl } from "@/lib/session-urls";
import { isSupportedLanguage } from "@/features/live";
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
    question: "Question",
    questions: "Assigned questions",
    browse: "All questions",
    settings: "Settings",
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
    const [endedOutcome, setEndedOutcome] = useState<"completed" | "cancelled" | "expired" | null>(null);

    // ── Channel: collaboration (the shared code, and presence rides along) ──
    const collaboration = useCollaboration(sessionId, participant);
    const { collaborators, connected } = useCollaborators(
        collaboration?.provider.awareness ?? null,
        participant.id,
        collaboration?.isConnected ?? false
    );

    // ── Channel: HTTP (session + question, and running code) ───────────────
    const {
        session,
        question,
        questions: roomQuestions,
        isLoading,
        refetch: refetchRoom,
    } = useLiveSession(sessionId, participant.id);

    // The server refuses runs unless the session is live, so do not offer it.
    const isLive = session?.status === "live";
    const runCode = useRunCode(sessionId, participant.id);

    // ── Channel: events (what everyone else ran) ───────────────────────────
    const socket = useSessionSocket(sessionId, participant.id);
    const outputEntries = useRoomOutput(socket, participant.id);

    // Server-pushed events. `question_change` needs no handling of its own — the
    // room payload is refetched below, so both sides land on the same question.
    const { subscribe, isConnected } = socket;

    useEffect(
        () =>
            subscribe((message) => {
                if (message.type === "session_completed") setEndedOutcome("completed");
                if (message.type === "session_cancelled") setEndedOutcome("cancelled");
                if (message.type === "session_expired") setEndedOutcome("expired");

                if (
                    message.type === "question_change" ||
                    message.type === "session_started" ||
                    // The host does not see the ended dialog, so a status change
                    // pushed from outside — the expiry cron, or another tab —
                    // would otherwise leave them on a stale "live" room with no
                    // rating form. Refetching is what makes the form appear.
                    message.type === "session_completed" ||
                    message.type === "session_cancelled" ||
                    message.type === "session_expired"
                ) {
                    void refetchRoom();
                }
            }),
        [subscribe, refetchRoom]
    );

    // A candidate who refreshes into a finished session gets no broadcast, so
    // seed the outcome from what we just fetched. The host is excluded because
    // they already have the rating form waiting.
    const ENDED_STATUSES = ["completed", "cancelled", "expired"] as const;
    const endedFromStatus =
        !isHost &&
        !isLoading &&
        session &&
        (ENDED_STATUSES as readonly string[]).includes(session.status)
            ? (session.status as "completed" | "cancelled" | "expired")
            : null;
    /**
     * The host is deliberately excluded from the blocking ended dialog.
     *
     * It used to show for both roles, and that broke two things at once: it
     * covered the room, so the Settings panel — which is where the rating form
     * lives — was unreachable, and its "leave" button pushed the host to `/`,
     * which is the marketing page. The host has work left to do after ending a
     * session: rate the candidate. So they stay put and the panel does its job.
     */
    /**
     * Open Settings for the host the moment the session ends.
     *
     * Completing a session is only half the job — the rating is the other half,
     * and it lives in the Settings panel. Requiring the host to go looking for it
     * is how sessions end up permanently unrated. Tracked on the live → ended
     * transition only, so it never fights the host for control of the sidebar
     * after that.
     */
    const sessionEnded = session?.status === "completed" || session?.status === "cancelled";
    const wasLive = useRef(session?.status === "live");

    useEffect(() => {
        if (wasLive.current && sessionEnded) setRail("settings");
        wasLive.current = session?.status === "live";
    }, [sessionEnded, session?.status]);

    const candidateOutcome = endedFromStatus ?? (isHost ? null : endedOutcome);
    const outcome = candidateOutcome;

    // ── The shared files, keyed inside the CRDT ────────────────────────────
    const language = session?.language ?? null;
    const starterCode = isSupportedLanguage(language)
        ? question?.starter_code?.[language] ?? null
        : null;

    const { fileNames, activeName, activeText, setActiveName, addFile, closeFile } = useEditorFiles(
        collaboration?.files ?? null,
        starterCode,
        language,
        !isLoading
    );

    // Phase 6 guardrails. Passive by design: they make an accident *visible*
    // rather than trying to prevent it, because browsers do not allow that.
    // The unload prompt applies to both roles; the full screen gate and the exit
    // count apply to the candidate only — the host manages their own screen.
    useUnloadGuard(isLive);

    // Single writer of awareness `focus` — full screen AND tab-away live here.
    // Vim needs Escape to mean "normal mode". Chrome binds that key to leaving
    // full screen, so it has to be locked away while both are true.
    const { mode: editorMode } = useEditorPreferences();
    const editorIsFullscreen = typeof document !== "undefined" && document.fullscreenElement !== null;
    useEscapeKeyLock(editorMode === "vim" && editorIsFullscreen);

    const focusGuard = useFullscreenGuard({
        awareness: collaboration?.provider.awareness ?? null,
        socket,
        enabled: isLive && !isHost,
    });

    // Replay data. Only while the session can accept runs, since a snapshot of a
    // finished session has nothing left to record.
    useCodeSnapshots({
        socket,
        yText: activeText,
        filename: activeName,
        enabled: isLive && isConnected,
    });

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

    // Prefer whoever is in the room right now, but fall back to the first guest
    // who ever joined — otherwise a candidate who closed their tab before the
    // host completed the session could not be rated at all.
    const candidateId =
        collaborators.find((c) => c.role === "guest")?.participantId ??
        hostDetail?.session.candidate_participant_id ??
        null;

    // Notes live in `session_evaluations`, which requires an
    // `evaluated_participant_id` — so the server refuses them until a candidate
    // exists. The host is told that plainly instead of seeing a save "fail".
    const notesCanSave =
        Boolean(candidateId) && (session?.status === "live" || session?.status === "completed");

    const nameFor = useCallback(
        (participantId: string) =>
            collaborators.find((c) => c.participantId === participantId)?.displayName ?? "Someone",
        [collaborators]
    );

    const hasLanguage = isSupportedLanguage(language);

    const handleRun = useCallback(() => {
        if (!isLive) {
            toast.error(`This session is ${session?.status ?? "not live"} — code can no longer be run`);
            return;
        }

        // Both guards must say something. An earlier revision returned silently
        // when the language was missing, so the room just sat there with no
        // output and no error — indistinguishable from a broken executor.
        if (!hasLanguage) {
            toast.error("This session has no language set — the host needs to assign a question first");
            return;
        }

        const code = activeText?.toString() ?? "";
        if (!code.trim()) {
            toast.error("Nothing to run — the active file is empty");
            return;
        }

        runCode.mutate(
            { code, language: language!, stdin: stdin || undefined },
            { onError: (error) => toast.error(error.message || "Run failed") }
        );
    }, [activeText, hasLanguage, isLive, language, session?.status, stdin, runCode]);

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
        <div className="relative flex h-svh flex-col overflow-hidden bg-bg text-fg">

            {/* Candidate only — the host is never guarded and never nagged. */}
            {!isHost && <FullscreenGate guard={focusGuard} exitCount={focusGuard.exitCount} />}

            {/* Both roles benefit from knowing the clock. */}
            <SessionTimeWarning session={session} />

            {/* Host only — a persistent read on whether the candidate is present. */}
            {/* Host-only strip. The candidate's equivalent is FullscreenGate above:
                no dismiss, escalates to a blurred editor. */}
            {isHost && isLive && <FullscreenGuard />}

            <header className="flex shrink-0 items-center justify-between gap-4 border-b border-border px-5 py-2.5">
                <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="truncate font-display text-sm font-semibold">
                        {question?.title ?? "Live session"}
                    </span>
                    <span className="truncate text-xs text-muted">
                        {sessionId.slice(0, 8)} · you are {participant.displayName} ({participant.role})
                    </span>
                </div>
                <CollaboratorsBar collaborators={collaborators} connected={connected} isHost={isHost} />
            </header>

            {/* relative: below md the side panel overlays this row rather than
                taking layout width from the editor. */}
            <div className="relative flex min-h-0 flex-1">
                <SideRail isHost={isHost} active={rail} onSelect={setRail} />

                {rail && (
                    <PanelColumn
                        title={PANEL_TITLES[rail]}
                        onClose={() => setRail(null)}
                        width={panel.size}
                        handleProps={panel.handleProps}
                    >
                        {rail === "question" && (
                            <QuestionPanel question={question} language={language} isLoading={isLoading} />
                        )}

                        {rail === "questions" && (
                            <AssignedQuestions
                                /* From /room, so a candidate can read this too. The
                                   host-only owner payload is no longer the source. */
                                questions={roomQuestions}
                                currentQuestionId={session?.question_id ?? null}
                                isLoading={isLoading}
                                isSwitching={hostActions.changeQuestion.isPending}
                                onSelect={(id) => handleSelectQuestion(id)}
                                readOnly={!isHost}
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
                                collaborators={collaborators}
                                isHost={isHost}
                                sessionId={sessionId}
                                candidateId={candidateId}
                                existingRating={
                                    (hostDetail?.session.rating as EvaluationRating) ?? null
                                }
                                existingNotes={hostDetail?.session.notes ?? null}
                                onComplete={() => hostActions.completeSession.mutate()}
                                onCancel={() => hostActions.cancelSession.mutate()}
                                isCompleting={hostActions.completeSession.isPending}
                                isCancelling={hostActions.cancelSession.isPending}
                                onCopyInvite={isHost ? handleCopyInvite : undefined}
                            />
                        )}
                    </PanelColumn>
                )}

                <main className="flex min-w-0 flex-1 flex-col">
                    {!hasLanguage && (
                        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-warning/30 bg-warning/10 px-4 py-2">
                            <p className="text-xs text-fg">
                                <span className="font-semibold">No language on this session.</span>{" "}
                                {isHost
                                    ? "Pick a question to set one — code cannot be run until then."
                                    : "The interviewer has not set a language yet."}
                            </p>
                            {isHost && (
                                <button
                                    type="button"
                                    onClick={() => setRail("browse")}
                                    className="shrink-0 rounded border border-warning/40 px-2 py-1 text-xs font-medium text-warning transition-colors hover:bg-warning/15"
                                >
                                    Assign a question
                                </button>
                            )}
                        </div>
                    )}

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
                                    canRun={Boolean(activeText) && hasLanguage && isLive}
                                    canChangeLanguage={isHost}
                                    blockedReason={
                                        !hasLanguage
                                            ? "This session has no language set"
                                            : !isLive
                                              ? `This session is ${session?.status ?? "not live"} — code can no longer be run`
                                              : "Waiting for the shared editor…"
                                    }
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
                        notesCanSave={notesCanSave}
                        notesBlockedReason={
                            !candidateId
                                ? "Notes are saved against the candidate, so they cannot be written until someone joins."
                                : session?.status !== "live" && session?.status !== "completed"
                                  ? `Notes can only be saved while a session is live or completed (this one is ${session?.status}).`
                                  : null
                        }
                    />
                </main>
            </div>

            {outcome && (
                <SessionEndedDialog
                    outcome={outcome}
                    hostName={collaborators.find((c) => c.role === "host")?.displayName ?? ""}
                    isHost={false}
                    onDismiss={() => setEndedOutcome(null)}
                />
            )}
        </div>
    );
}
