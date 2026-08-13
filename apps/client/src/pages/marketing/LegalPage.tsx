export function LegalPage({ variant }: { variant: 'terms' | 'privacy' }) {
  return <div className="p-6 font-body text-fg">{variant}</div>
}