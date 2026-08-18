import { useEffect, useMemo, useRef, useState } from 'react'
import { Shield, Users, Eye, FileText, Terminal, Settings, Play } from 'lucide-react'

const BEAM_COUNT = 58

interface Question {
  file: string
  lines: React.ReactNode[]
  notes: string
}

const questions: Question[] = [
  {
    file: 'question1.cpp',
    lines: [
      <>
        <span className="ty">vector</span>
        &lt;<span className="ty">int</span>&gt; <span className="fn">twoSum</span>(<span className="ty">vector</span>
        &lt;<span className="ty">int</span>&gt;&amp; <span className="op">nums</span>, <span className="ty">int</span>{' '}
        <span className="op">target</span>) {'{'}
      </>,
      <>
        {'    '}<span className="ty">unordered_map</span>&lt;<span className="ty">int</span>, <span className="ty">int</span>&gt;{' '}
        <span className="op">map</span>;
      </>,
      <>
        {'    '}<span className="kw">for</span> (<span className="ty">int</span> <span className="op">i</span> ={' '}
        <span className="nu">0</span>; <span className="op">i</span> &lt; <span className="op">nums</span>.
        <span className="fn">size</span>(); <span className="op">i</span>++) {'{'}
      </>,
      <>
        {'        '}<span className="ty">int</span> <span className="op">complement</span> = <span className="op">target</span> -{' '}
        <span className="op">nums</span>[<span className="op">i</span>];
      </>,
      <>
        {'        '}<span className="kw">if</span> (
        <span className="ed-cursor guest">
          <span className="ed-cursor-line"></span>
          <span className="ed-cursor-label">Usman</span>
        </span>
        <span className="op">map</span>.<span className="fn">find</span>(<span className="op">complement</span>) !={' '}
        <span className="op">map</span>.<span className="fn">end</span>()) {'{'}
      </>,
      <>
        {'            '}<span className="kw">return</span> {'{'}<span className="op">map</span>[<span className="op">complement</span>],{' '}
        <span className="op">i</span>{'}'};
      </>,
      <>{'        }'}</>,
      <>
        {'        '}
        <span className="ed-sel">
          <span className="op">map</span>[<span className="op">nums</span>[<span className="op">i</span>]] = <span className="op">i</span>;
        </span>
        <span className="ed-cursor host">
          <span className="ed-cursor-line"></span>
          <span className="ed-cursor-label">You (Host)</span>
        </span>
      </>,
      <>{'    }'}</>,
      <>
        {'    '}<span className="kw">return</span> {'{}'};
      </>,
      <>{'}'}</>,
    ],
    notes: 'nums = [2, 7, 11, 15], target = 9',
  },
  {
    file: 'question2.js',
    lines: [
      <>
        <span className="kw">function</span> <span className="fn">containsDuplicate</span>(<span className="op">nums</span>){' '}
        {'{'}
      </>,
      <>
        {'  '}<span className="kw">const</span> <span className="op">seen</span> = <span className="kw">new</span>{' '}
        <span className="fn">Set</span>();
      </>,
      <>
        {'  '}<span className="kw">for</span> (<span className="kw">const</span> <span className="op">num</span>{' '}
        <span className="kw">of</span> <span className="op">nums</span>) {'{'}
      </>,
      <>
        {'    '}
        <span className="ed-cursor host">
          <span className="ed-cursor-line"></span>
          <span className="ed-cursor-label">You (Host)</span>
        </span>
        <span className="kw">if</span> (<span className="op">seen</span>.<span className="fn">has</span>(
        <span className="op">num</span>)) <span className="kw">return</span> <span className="nu">true</span>;
      </>,
      <>
        {'    '}<span className="op">seen</span>.<span className="fn">add</span>(<span className="op">num</span>);
      </>,
      <>{'  }'}</>,
      <>
        {'  '}
        <span className="ed-sel">
          <span className="kw">return</span> <span className="nu">false</span>;
        </span>
        <span className="ed-cursor guest">
          <span className="ed-cursor-line"></span>
          <span className="ed-cursor-label">Usman</span>
        </span>
      </>,
      <>{'}'}</>,
    ],
    notes: 'nums = [1, 2, 3, 1] → returns true',
  },
]

function buildBeamPaths(): string[] {
  const paths: string[] = []
  for (let i = 0; i < BEAM_COUNT; i++) {
    const x = -380 + 7 * i
    const y = -189 - 8 * i
    paths.push(
      `M${x} ${y}` +
        `C${x} ${y} ${x + 68} ${y + 405} ${x + 532} ${y + 532}` +
        `C${x + 996} ${y + 659} ${x + 1064} ${y + 1064} ${x + 1064} ${y + 1064}`,
    )
  }
  return paths
}

function beamsRand(seed: number): number {
  return Math.abs(Math.sin(seed * 42.42)) % 1
}

function easeInOut(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

export function EditorShowcase() {
  const beamsRef = useRef<SVGSVGElement>(null)
  const paths = useMemo(() => buildBeamPaths(), [])
  const [activeTab, setActiveTab] = useState(0)

  const question = questions[activeTab]

  useEffect(() => {
    const svg = beamsRef.current
    if (!svg) return

    const grads: {
      el: SVGGradientElement
      y2: number
      dur: number
      del: number
      t: number
    }[] = []

    svg.querySelectorAll<SVGLinearGradientElement>('linearGradient[id^="beams-lg-"]').forEach((lg, j) => {
      grads.push({
        el: lg,
        y2: 93 + beamsRand(j + 1) * 8,
        dur: beamsRand(j + 2) * 10 + 10,
        del: beamsRand(j + 3) * 10,
        t: 0,
      })
    })

    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      grads.forEach((g) => {
        g.el.setAttribute('x1', '55%')
        g.el.setAttribute('x2', '52%')
        g.el.setAttribute('y1', '70%')
        g.el.setAttribute('y2', `${g.y2 * 0.7}%`)
      })
      return
    }

    let raf = 0
    let last = performance.now()

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1)
      last = now
      for (let g = 0; g < grads.length; g++) {
        const gr = grads[g]
        gr.t += dt
        const cycle = gr.dur + gr.del
        if (gr.t > cycle) gr.t -= Math.floor(gr.t / cycle) * cycle
        const t = gr.t - gr.del
        const e = t <= 0 ? 0 : t >= gr.dur ? 1 : easeInOut(t / gr.dur)
        gr.el.setAttribute('x1', `${e * 100}%`)
        gr.el.setAttribute('x2', `${e * 95}%`)
        gr.el.setAttribute('y1', `${e * 100}%`)
        gr.el.setAttribute('y2', `${e * gr.y2}%`)
      }
      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <section className="editor-sec" data-od-id="editor-showcase">
      <div className="beams" aria-hidden="true">
        <svg
          ref={beamsRef}
          width="100%"
          height="100%"
          viewBox="0 0 696 316"
          fill="none"
        >
          <defs>
            {paths.map((_, j) => (
              <linearGradient
                key={j}
                id={`beams-lg-${j}`}
                x1="0%"
                x2="0%"
                y1="0%"
                y2="0%"
              >
                <stop stopColor="var(--color-p-amber)" stopOpacity="0" />
                <stop stopColor="var(--color-p-amber)" />
                <stop offset="32.5%" stopColor="var(--color-accent)" />
                <stop offset="100%" stopColor="var(--color-p-rose)" stopOpacity="0" />
              </linearGradient>
            ))}
            <radialGradient
              id="beams-bg-grad"
              cx="0"
              cy="0"
              r="1"
              gradientUnits="userSpaceOnUse"
              gradientTransform="translate(352 34) rotate(90) scale(555 1560.62)"
            >
              <stop offset="0.0666667" stopColor="var(--color-faint)" />
              <stop offset="0.243243" stopColor="var(--color-faint)" />
              <stop offset="0.43594" stopColor="var(--color-faint)" stopOpacity="0" />
            </radialGradient>
          </defs>
          <path d={paths.join('')} stroke="url(#beams-bg-grad)" strokeOpacity="0.05" strokeWidth="0.5" />
          {paths.map((d, j) => (
            <path
              key={j}
              d={d}
              stroke={`url(#beams-lg-${j})`}
              strokeOpacity="0.4"
              strokeWidth="0.5"
            />
          ))}
        </svg>
      </div>

      <div className="editor-inner">
        <div className="editor-head">
          <h2>A real editor, not a toy</h2>
          <p>Syntax highlighting, live cursors, and instant code execution. Everything two people need to conduct a serious interview.</p>
        </div>

        <div className="editor-wrap">
          <div className="ed-float f1">
            <Shield aria-hidden="true" />
            Encrypted in transit
          </div>
          <div className="ed-float f2">
            <Users aria-hidden="true" />
            Live presence
          </div>
          <div className="ed-float f3">
            <Eye aria-hidden="true" />
            Private notes
          </div>

          <div className="ed-chrome">
            <div className="ed-topbar">
              <div className="ed-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <div className="ed-tabs" role="tablist" aria-label="Session questions">
                {questions.map((q, i) => (
                  <button
                    key={q.file}
                    type="button"
                    className={`ed-tab ${activeTab === i ? 'active' : ''}`}
                    role="tab"
                    aria-selected={activeTab === i}
                    aria-controls={`ed-pane-${i}`}
                    id={`ed-tab-${i}`}
                    tabIndex={activeTab === i ? 0 : -1}
                    onClick={() => setActiveTab(i)}
                  >
                    <FileText aria-hidden="true" />
                    {q.file}
                  </button>
                ))}
              </div>
              <div className="ed-topbar-right">
                <button className="ed-run" type="button">
                  <Play aria-hidden="true" />
                  Run
                </button>
              </div>
            </div>

            <div className="ed-body" id={`ed-pane-${activeTab}`} data-q={activeTab} role="tabpanel" aria-labelledby={`ed-tab-${activeTab}`}>
              <div className="ed-sidebar">
                <FileText className="active" aria-hidden="true" />
                <Terminal aria-hidden="true" />
                <Settings aria-hidden="true" />
              </div>

              <div className="ed-gutter">
                {Array.from({ length: question.lines.length }, (_, i) => (
                  <span className="ln" key={i}>
                    {i + 1}
                  </span>
                ))}
              </div>

              <div className="ed-code">
                {question.lines.map((line, i) => (
                  <span className="ln" key={i}>
                    {line}
                  </span>
                ))}
              </div>
            </div>

            <div className="ed-bottom">
              <div className="ed-bottom-tabs">
                <div className="ed-bottom-tab active">Input</div>
                <div className="ed-bottom-tab">Output</div>
                <div className="ed-bottom-tab">Notes</div>
              </div>
              <div className="ed-bottom-content">
                <span className="ed-notes">{question.notes}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
