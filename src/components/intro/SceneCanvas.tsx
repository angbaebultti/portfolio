import { useEffect, useMemo, useRef, type RefObject } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import RetroRoom from './RetroRoom'
import CloudCluster from './CloudCluster'

function SceneSetup() {
  const { scene } = useThree()

  useEffect(() => {
    scene.background = new THREE.Color(0x000000)
    scene.fog = null

    return () => {
      scene.background = null
      scene.fog = null
    }
  }, [scene])

  return null
}

function StarField() {
  const geometry = useMemo(() => {
    const count = 2000
    const positions = new Float32Array(count * 3)

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 150
      positions[i * 3 + 1] = (Math.random() - 0.5) * 80 + 7
      positions[i * 3 + 2] = -35 - Math.random() * 220
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return geo
  }, [])

  return (
    <points geometry={geometry}>
      <pointsMaterial
        color={0xffffff}
        size={0.18}
        sizeAttenuation
        transparent
        opacity={0.86}
      />
    </points>
  )
}

function CameraRig({ scrollRef }: { scrollRef: RefObject<HTMLDivElement | null> }) {
  const { camera } = useThree()
  const targetProgress = useRef(0)
  const currentProgress = useRef(0)

  useEffect(() => {
    camera.position.set(0, 7, 12)
    camera.up.set(0, 1, 0)
    camera.lookAt(0, 7, 0)
    camera.updateProjectionMatrix()

    const trigger = scrollRef.current
    if (!trigger) return

    const onWheel = (event: WheelEvent) => {
      targetProgress.current = Math.min(
        Math.max(targetProgress.current + event.deltaY * 0.00055, 0),
        1
      )
    }

    window.addEventListener('wheel', onWheel, { passive: true })

    return () => window.removeEventListener('wheel', onWheel)
  }, [camera, scrollRef])

  useFrame((_, delta) => {
    const smoothing = 1 - Math.exp(-delta * 1.7)
    currentProgress.current += (targetProgress.current - currentProgress.current) * smoothing

    const progress = currentProgress.current
    camera.position.set(0, 7, 12 - progress * 14)
    camera.lookAt(0, 7, 0)
  })

  return null
}

export default function SceneCanvas() {
  const scrollRef = useRef<HTMLDivElement>(null)

  return (
    <>
      <Canvas
        camera={{ position: [0, 7, 12], fov: 75, near: 0.1, far: 1000 }}
        className="scene-shell"
        style={{
          position: 'fixed',
          inset: 0,
          width: '100vw',
          height: '100vh',
        }}
        gl={{ antialias: true }}
        dpr={[1, 2]}
      >
        <SceneSetup />
        <CameraRig scrollRef={scrollRef} />
        <StarField />
        <RetroRoom />
        <CloudCluster />
      </Canvas>
      <div className="void-depth-mask" aria-hidden="true" />
      <div className="crt-atmosphere" aria-hidden="true" />
      <div className="vhs-monitor-frame" aria-hidden="true">
        <div className="corner corner-tl" />
        <div className="corner corner-tr" />
        <div className="corner corner-bl" />
        <div className="corner corner-br" />
        <div className="monitor-readout readout-left">
          <span>SYS-01</span>
          <span>88:00:00</span>
          <span>GRID MODE: ACTIVE</span>
        </div>
        <div className="monitor-readout readout-right">
          <span>MEMORY CORE</span>
          <span>246B / 55536</span>
          <span>STATUS: STABLE</span>
        </div>
        <div className="terminal-strip" />
      </div>
      <div ref={scrollRef} style={{ height: '260vh', pointerEvents: 'none' }} />
    </>
  )
}
