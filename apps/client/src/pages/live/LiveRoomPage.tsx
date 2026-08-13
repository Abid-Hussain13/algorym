import { useParams } from 'react-router-dom'

export function LiveRoomPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  return <div className="p-6 font-body text-fg">Live room {sessionId}</div>
}