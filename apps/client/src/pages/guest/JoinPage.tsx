import { useParams } from 'react-router-dom'

export function JoinPage() {
  const { token } = useParams<{ token: string }>()
  return <div className="p-6 font-body text-fg">Join session {token}</div>
}