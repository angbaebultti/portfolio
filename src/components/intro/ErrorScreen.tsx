import { useEffect, useRef, useState } from 'react'

type FailurePhase = 'typing' | 'stretch' | 'corrupt'

const STATIC_LINES = [
  '404 ERROR - PAGE NOT FOUND',
  'AUTOSAVED // PAGE RETRIEVAL FAILURE',
  'LOT ART: ATTEMPTED TO LOAD RESOURCE (/M PAGE)',
  'SYSTEM TRACE:',
  '0033 LOAD /HOME',
  '0042 RUN /ABOUT',
  '0051 RUN /WORKS',
  'IF LOST == TRUE THEN',
  '  PRINT "ART IS NEVER LOST - ONLY MISPLACED"',
  'EXCEPTION MALLOC',
  'HEAP MEMORY NOT ALLOCATED',
  'REDIRECT PATH UNDEFINED',
  '0091 ALLOCATE MEMORY BLOCK (PAGE_DATA)',
  '0092 DATA STREAM EMPTY',
  '0093 CONNECTION TIMEOUT (TIMEOUT)',
  '009F CACHE FLUSHED BY ANON',
  '00A5 ARTIFACT DETECTED',
  'ERROR 4P41F: RESOURCE NOT FOUND',
  'CAUSE: UNKNOWN',
  'LEVEL: CRITICAL',
  'PAGE CORRUPTED',
  'RECOVERY STEPS:',
]

const TYPING_LINES = ['TRY ABORT', 'TRY RETRY', 'TRY IGNORE → FAILED', 'SYSTEM HALT...']
const TYPING_FULL = TYPING_LINES.join('\n')
const FAILURE_LINES = [...STATIC_LINES, ...TYPING_LINES]
const SMEAR_SOURCE_LINES = FAILURE_LINES.slice(-9)
const CORRUPT_CHARS = ['#', '%', '&', '/', '\\', '|', '!', '0', '1', '?', '=', '+', ':']

function corruptLine(line: string, seed: number, intensity: number) {
  return line
    .split('')
    .map((char, index) => {
      if (char === ' ') return Math.sin((index + seed) * 1.8) > 0.72 ? '.' : char
      const wave = Math.sin((index + 1) * 12.9898 + seed * 78.233) * 43758.5453
      const noise = wave - Math.floor(wave)

      if (noise < intensity) {
        return CORRUPT_CHARS[(index + seed) % CORRUPT_CHARS.length]
      }

      if (noise > 1 - intensity * 0.55) {
        return `${char}${CORRUPT_CHARS[(index * 3 + seed) % CORRUPT_CHARS.length]}`
      }

      return char
    })
    .join('')
}

function repeatedSmear(line: string, seed: number, repeats: number, intensity: number) {
  const source = line.trim() || 'SYSTEM HALT'
  return Array.from({ length: repeats }, (_, index) =>
    corruptLine(source, seed + index * 7, intensity + index * 0.015)
  ).join('\n')
}

interface Props {
  onComplete: () => void
}

export default function ErrorScreen({ onComplete }: Props) {
  const [typedCount, setTypedCount] = useState(0)
  const [cursorOn, setCursorOn] = useState(true)
  const [failurePhase, setFailurePhase] = useState<FailurePhase>('typing')
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  // Blinking cursor
  useEffect(() => {
    const id = setInterval(() => setCursorOn(v => !v), 530)
    return () => clearInterval(id)
  }, [])

  // Typing animation, followed by stretch and corruption phases before BrokenLCD.
  useEffect(() => {
    if (typedCount >= TYPING_FULL.length) {
      setFailurePhase('stretch')
      const corruptId = setTimeout(() => setFailurePhase('corrupt'), 500)
      const completeId = setTimeout(() => onCompleteRef.current(), 1000)
      return () => {
        clearTimeout(corruptId)
        clearTimeout(completeId)
      }
    }
    const id = setTimeout(() => setTypedCount(c => c + 1), 48)
    return () => clearTimeout(id)
  }, [typedCount])

  const displayLines = TYPING_FULL.slice(0, typedCount).split('\n')
  const isStretching = failurePhase === 'stretch' || failurePhase === 'corrupt'
  const isCorrupting = failurePhase === 'corrupt'

  return (
    <div
      className={`error-screen error-screen--${failurePhase}`}
      style={{
        position: 'fixed',
        inset: 0,
        background: '#0000FF',
        color: '#FFFFFF',
        fontFamily: '"Courier New", Courier, monospace',
        fontSize: 'clamp(10px, 1.4vw, 14px)',
        lineHeight: 1.65,
        padding: 'clamp(20px, 5vh, 60px) clamp(16px, 6vw, 80px)',
        overflow: 'hidden',
        zIndex: 100,
      }}
    >
      <style>{`
        .error-screen {
          text-shadow: 0 0 6px rgba(255, 255, 255, 0.45);
          isolation: isolate;
        }

        .error-screen::before,
        .error-screen::after {
          position: fixed;
          inset: 0;
          z-index: 2;
          content: '';
          pointer-events: none;
          opacity: 0;
        }

        .error-screen::before {
          background:
            repeating-linear-gradient(
              to bottom,
              rgba(255, 255, 255, 0.18) 0,
              rgba(255, 255, 255, 0.18) 1px,
              transparent 1px,
              transparent 5px
            ),
            linear-gradient(
              90deg,
              transparent 0 14%,
              rgba(0, 255, 255, 0.18) 14% 14.7%,
              transparent 14.7% 48%,
              rgba(255, 0, 64, 0.2) 48% 49%,
              transparent 49% 72%,
              rgba(255, 255, 255, 0.16) 72% 72.5%,
              transparent 72.5% 100%
            );
          mix-blend-mode: screen;
        }

        .error-screen::after {
          background:
            linear-gradient(
              to bottom,
              transparent 0 17%,
              rgba(0, 38, 255, 0.88) 17% 20%,
              transparent 20% 41%,
              rgba(0, 0, 120, 0.64) 41% 43%,
              transparent 43% 62%,
              rgba(24, 206, 255, 0.18) 62% 63%,
              transparent 63% 100%
            );
          transform: translate3d(0, 0, 0);
        }

        .error-screen--stretch {
          animation: error-blue-breath 0.12s steps(2, end) infinite;
        }

        .error-screen--stretch::before {
          opacity: 0.22;
        }

        .error-screen--corrupt {
          animation: error-screen-corrupt 0.09s steps(2, end) infinite;
        }

        .error-screen--corrupt::before {
          opacity: 0.58;
          animation: error-scan-tear 0.16s steps(3, end) infinite;
        }

        .error-screen--corrupt::after {
          opacity: 0.82;
          animation: error-row-tear 0.18s steps(2, end) infinite;
        }

        .error-screen__content {
          position: relative;
          z-index: 1;
        }

        .error-screen--corrupt .error-screen__content {
          animation: error-text-rgb 0.08s steps(2, end) infinite;
        }

        .error-screen__smear {
          position: absolute;
          right: clamp(16px, 6vw, 80px);
          bottom: clamp(20px, 5vh, 60px);
          left: clamp(16px, 6vw, 80px);
          z-index: 3;
          overflow: hidden;
          white-space: pre;
          pointer-events: none;
          opacity: 0;
          transform-origin: 50% 0;
          filter: blur(0.2px);
          text-shadow:
            2px 0 rgba(255, 0, 60, 0.7),
            -2px 0 rgba(0, 255, 255, 0.65),
            0 0 8px rgba(255, 255, 255, 0.55);
        }

        .error-screen--stretch .error-screen__smear {
          opacity: 0.82;
          max-height: 56vh;
          animation: error-smear-grow 0.5s cubic-bezier(0.12, 0.88, 0.26, 1) forwards;
        }

        .error-screen--corrupt .error-screen__smear {
          opacity: 1;
          max-height: 70vh;
          animation: error-smear-break 0.11s steps(2, end) infinite;
        }

        .error-screen__smear-line {
          display: block;
          height: 1.18em;
          transform-origin: 0 0;
        }

        .error-screen__smear-line:nth-child(3n + 1) {
          transform: translateX(-0.45em) scaleY(1.8);
        }

        .error-screen__smear-line:nth-child(3n + 2) {
          transform: translateX(0.72em) scaleY(2.45);
        }

        .error-screen__smear-line:nth-child(3n) {
          transform: translateX(0.18em) scaleY(3.25);
        }

        @keyframes error-blue-breath {
          0% { background-color: #0000ff; }
          50% { background-color: #001fff; }
          100% { background-color: #0000db; }
        }

        @keyframes error-screen-corrupt {
          0% {
            background-color: #0000ff;
            transform: translateX(0);
            filter: saturate(1.4) contrast(1.2);
          }
          35% {
            background-color: #0018df;
            transform: translateX(-6px);
            filter: saturate(2.1) contrast(1.45);
          }
          70% {
            background-color: #0700ff;
            transform: translateX(4px);
            filter: saturate(1.65) contrast(1.75);
          }
          100% {
            background-color: #0000a8;
            transform: translateX(0);
            filter: saturate(2.2) contrast(1.3);
          }
        }

        @keyframes error-smear-grow {
          0% {
            clip-path: inset(0 0 92% 0);
            transform: translateY(0) scaleY(0.35);
          }
          100% {
            clip-path: inset(0 0 0 0);
            transform: translateY(0.5em) scaleY(1.75);
          }
        }

        @keyframes error-smear-break {
          0% {
            clip-path: inset(0 0 0 0);
            transform: translate(-2px, 0.4em) scaleY(1.95);
          }
          50% {
            clip-path: inset(7% 0 2% 0);
            transform: translate(8px, 0.7em) scaleY(2.35);
          }
          100% {
            clip-path: inset(1% 0 6% 0);
            transform: translate(-5px, 0.2em) scaleY(2.1);
          }
        }

        @keyframes error-text-rgb {
          0% {
            transform: translateX(0);
            text-shadow:
              3px 0 rgba(255, 0, 50, 0.74),
              -3px 0 rgba(0, 255, 255, 0.72),
              0 0 9px rgba(255, 255, 255, 0.55);
          }
          100% {
            transform: translateX(5px);
            text-shadow:
              -4px 0 rgba(255, 0, 50, 0.76),
              4px 0 rgba(0, 255, 255, 0.7),
              0 0 12px rgba(255, 255, 255, 0.72);
          }
        }

        @keyframes error-scan-tear {
          0% { transform: translateY(-1%); }
          40% { transform: translate(12px, 1%); }
          100% { transform: translate(-8px, 0); }
        }

        @keyframes error-row-tear {
          0% { transform: translateX(-10px) skewY(-1deg); }
          50% { transform: translateX(16px) skewY(0.6deg); }
          100% { transform: translateX(-4px) skewY(-0.4deg); }
        }
      `}</style>
      <div className="error-screen__content">
        {STATIC_LINES.map((line, i) => (
          <div key={i} style={{ whiteSpace: 'pre' }}>
            {line}
          </div>
        ))}
        {displayLines.map((line, i) => (
          <div key={`t-${i}`} style={{ whiteSpace: 'pre' }}>
            {line}
            {i === displayLines.length - 1 && typedCount < TYPING_FULL.length && (
              <span style={{ opacity: cursorOn ? 1 : 0 }}>_</span>
            )}
          </div>
        ))}
      </div>
      {isStretching && (
        <div className="error-screen__smear" aria-hidden="true">
          {SMEAR_SOURCE_LINES.map((line, index) => (
            <span key={`${line}-${index}`} className="error-screen__smear-line">
              {isCorrupting
                ? repeatedSmear(line, index + 17, 4, 0.42)
                : repeatedSmear(line, index + 5, 2, 0.2)}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
