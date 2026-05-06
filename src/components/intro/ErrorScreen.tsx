import { useEffect, useRef, useState } from 'react'

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

interface Props {
  onComplete: () => void
}

export default function ErrorScreen({ onComplete }: Props) {
  const [typedCount, setTypedCount] = useState(0)
  const [cursorOn, setCursorOn] = useState(true)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  // Blinking cursor
  useEffect(() => {
    const id = setInterval(() => setCursorOn(v => !v), 530)
    return () => clearInterval(id)
  }, [])

  // Typing animation
  useEffect(() => {
    if (typedCount >= TYPING_FULL.length) {
      const id = setTimeout(() => onCompleteRef.current(), 1000)
      return () => clearTimeout(id)
    }
    const id = setTimeout(() => setTypedCount(c => c + 1), 48)
    return () => clearTimeout(id)
  }, [typedCount])

  const displayLines = TYPING_FULL.slice(0, typedCount).split('\n')

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#0000FF',
        color: '#FFFFFF',
        fontFamily: '"Courier New", Courier, monospace',
        fontSize: 'clamp(10px, 1.4vw, 14px)',
        lineHeight: 1.65,
        padding: 'clamp(20px, 5vh, 60px) clamp(16px, 6vw, 80px)',
        overflowY: 'auto',
        zIndex: 100,
      }}
    >
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
  )
}
