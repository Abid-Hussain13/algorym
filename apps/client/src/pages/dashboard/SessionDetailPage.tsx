import { useParams } from 'react-router-dom'

export function SessionDetailPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  return <div className="p-6 font-body text-fg">Session {sessionId}</div>
}