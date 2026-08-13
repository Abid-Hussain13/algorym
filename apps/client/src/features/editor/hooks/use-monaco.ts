import { useEffect, useRef } from 'react'

export interface EditorRef {
  getValue: () => string
  setValue: (value: string) => void
}

/**
 * Monaco editor integration shell. Monaco will be wired here (lazy-loaded,
 * y-monaco sync via Yjs awareness). This stub exposes a stable API so the
 * live room and replay surfaces can build against it.
 */
export function useMonaco() {
  const ref = useRef<EditorRef | null>(null)

  useEffect(() => {
    // TODO(editor): lazy-load monaco + @monaco-editor/react, mount into container,
    // connect y-websocket room with the session token, wire awareness cursors.
  }, [])

  return { ref }
}