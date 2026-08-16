const LINES = [
  {
    n: '1',
    code: (
      <>
        <span className="text-syn-keyword">function</span> <span className="text-syn-fn">twoSum</span>(
        <span className="op">...</span>) {'{'}
      </>
    ),
  },
  {
    n: '2',
    code: (
      <>
        {'  '}
        <span className="text-syn-keyword">const</span> map = <span className="text-syn-keyword">new</span>{' '}
        <span className="text-syn-fn">Map</span>();
      </>
    ),
  },
  {
    n: '3',
    code: (
      <>
        {'  '}
        <span className="text-syn-keyword">for</span> (<span className="text-syn-keyword">let</span> i ={' '}
        <span className="op">0</span>; ...) {'{'}
      </>
    ),
  },
  {
    n: '4',
    code: (
      <>
        {'    '}
        <span className="text-syn-keyword">if</span> (map.<span className="text-syn-fn">has</span>(
        <span className="op">...</span>)) {'{'}
      </>
    ),
  },
  {
    n: '5',
    code: (
      <>
        {'      '}
        <span className="text-syn-keyword">return</span> [map.<span className="text-syn-fn">get</span>(
        <span className="op">...</span>), i];
      </>
    ),
  },
  {
    n: '6',
    code: <>    {'}'}</>,
  },
]

export function EditorResultCard() {
  return (
    <div className="il-card c2 animate-card-2 absolute right-2 top-11 z-20 w-[170px] overflow-hidden rounded-md border border-border bg-surface opacity-0 shadow-md pointer-events-none">
      <div className="flex border-b border-border bg-inset">
        <div className="flex-1 border-b-2 border-accent px-2 py-1.5 text-center text-[9px] font-semibold tracking-[0.02em] text-fg">
          Editor
        </div>
        <div className="flex-1 border-b-2 border-transparent px-2 py-1.5 text-center text-[9px] font-semibold tracking-[0.02em] text-muted">
          Output
        </div>
      </div>
      <div className="min-h-[70px] border-b border-border px-3 py-2.5 font-mono text-[9px] leading-[1.7] text-muted">
        {LINES.map((line) => (
          <div key={line.n} className="flex gap-2">
            <span className="min-w-[12px] select-none text-right text-faint">{line.n}</span>
            <span>{line.code}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-[5px]">
          <span className="h-[7px] w-[7px] rounded-full bg-p-teal" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.03em] text-p-teal">
            Accepted
          </span>
        </div>
        <span className="font-mono text-[9px] text-muted">0.18s</span>
      </div>
    </div>
  )
}