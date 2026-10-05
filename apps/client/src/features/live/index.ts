import { lazy } from 'react'

export { JoinGate } from './components/JoinGate'
export { JoinSessionForm } from './components/JoinSessionForm'
export { CollaboratorsBar } from './components/CollaboratorsBar'
export { FullscreenGate } from './components/FullscreenGate'
export { SessionTimeWarning } from './components/SessionTimeWarning'
export { useNow } from './hooks/use-now'

// Room UI
export { QuestionPanel } from './components/room/QuestionPanel'
export { EditorTabs } from './components/room/EditorTabs'

/**
 * Code-split: CodeMirror 6 plus five language modes and the Vim keymap is by far
 * the heaviest dependency in the app, and it is only ever needed inside
 * `/live/:sessionId`. Lazy-loading it here keeps the marketing pages, login and
 * dashboard from downloading an editor they will never mount.
 *
 * Consumers must render this inside a `<Suspense>` boundary.
 */
export const CodeEditor = lazy(() =>
    import('./components/room/CodeEditor').then((m) => ({ default: m.CodeEditor }))
)

export { BottomTabs } from './components/room/BottomTabs'
export { SideRail } from './components/room/SideRail'
export { PanelColumn } from './components/room/PanelColumn'
export { EditorControls } from './components/room/EditorControls'
export { AssignedQuestions } from './components/room/AssignedQuestions'
export { AllQuestionsPicker } from './components/room/AllQuestionsPicker'
export { SessionSettingsPanel } from './components/room/SessionSettingsPanel'
export { SessionEndedDialog } from './components/room/SessionEndedDialog'
export { HostNotes } from './components/room/HostNotes'
export { OutputPanel } from './components/room/OutputPanel'
export type { RailPanel } from './components/room/SideRail'

export { useJoinSession } from './hooks/use-join-session'
export { useCollaboration } from './hooks/use-collaboration'
export { useCollaborators } from './hooks/use-collaborators'
export { useFullscreen } from './hooks/use-fullscreen'
export { useLiveSession } from './hooks/use-live-session'
export { useRunCode } from './hooks/use-run-code'
export { useSessionSocket } from './hooks/use-session-socket'
export { useEditorFiles } from './hooks/use-editor-files'
export { useRoomOutput } from './hooks/use-room-output'
export { useCodeSnapshots } from './hooks/use-code-snapshots'
export { useUnloadGuard } from './hooks/use-room-guards'
export { useFullscreenGuard } from './hooks/use-fullscreen-guard'
export type { FocusGuard } from './hooks/use-fullscreen-guard'
export { useHostActions } from './hooks/use-host-actions'
export { useResizablePane } from './hooks/use-resizable-pane'

export { readParticipant, readParticipantId, writeParticipant, clearParticipant, participantStorageKey } from './lib/participant-store'
export type { LocalParticipant } from './lib/participant-store'
export { FILES_MAP_KEY } from './hooks/use-collaboration'
export {
    DEFAULT_LANGUAGE,
    SUPPORTED_LANGUAGES,
    filenameForLanguage,
    isSupportedLanguage,
} from './lib/editor-languages'
export { colorForParticipant, DEFAULT_PARTICIPANT_COLOR } from './lib/participant-colors'
export { symbolsForLanguage, libraryForLanguage } from './lib/editor-symbols'

export type { LiveSessionState } from './hooks/use-live-session'
export type { SessionSocket } from './hooks/use-session-socket'
export type { RoomOutputEntry } from './hooks/use-room-output'
export { SessionRatingForm } from "./components/room/SessionRatingForm";
export { SessionEndControls } from "./components/room/SessionEndControls";
export { useEditorPreferences, FONT_SIZES } from "./hooks/use-editor-preferences";
export type { EditorMode, EditorPreferences } from "./hooks/use-editor-preferences";
export { FullscreenGuard } from "./components/FullscreenGuard";
export { useEscapeKeyLock, supportsKeyboardLocking } from "./hooks/use-escape-key-lock";
