import { useState } from 'react'
import ErrorScreen from './ErrorScreen'
import BrokenLCD from './BrokenLCD'
import SpaceScene from './SpaceScene'

type Phase = 'error' | 'lcd' | 'space'

export default function IntroSequence() {
  const [phase, setPhase] = useState<Phase>('error')

  return (
    <>
      {phase === 'error' && <ErrorScreen onComplete={() => setPhase('lcd')} />}
      {phase === 'lcd' && <BrokenLCD onComplete={() => setPhase('space')} />}
      {phase === 'space' && <SpaceScene />}
    </>
  )
}
