import { useEffect, useMemo, useRef, type RefObject } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import RetroRoom from './RetroRoom'
import CloudCluster from './CloudCluster'

const CAMERA_START_Z = 12
const CAMERA_END_Z = -54
const CAMERA_Y = 7
const LOOK_AHEAD_Z = 24
const ROOM_BACK_Z = -80
const LOOK_TARGET_MIN_Z = ROOM_BACK_Z + 7

function SceneSetup() {
  const { scene } = useThree()

  useEffect(() => {
    scene.background = new THREE.Color(0x000000)
    scene.fog = new THREE.FogExp2(0x080008, 0.00018)

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
    <group>
      <points geometry={geometry}>
        <pointsMaterial color={0xfff0fb} size={0.16} sizeAttenuation transparent opacity={0.82} />
      </points>
      <points geometry={geometry}>
        <pointsMaterial
          color={0x66e8ff}
          size={0.34}
          sizeAttenuation
          transparent
          opacity={0.1}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  )
}

function CameraRig({ scrollRef }: { scrollRef: RefObject<HTMLDivElement | null> }) {
  const { camera } = useThree()
  const targetProgress = useRef(0)
  const currentProgress = useRef(0)

  useEffect(() => {
    camera.position.set(0, CAMERA_Y, CAMERA_START_Z)
    camera.up.set(0, 1, 0)
    camera.lookAt(0, CAMERA_Y, CAMERA_START_Z - LOOK_AHEAD_Z)
    camera.updateProjectionMatrix()

    const trigger = scrollRef.current
    if (!trigger) return

    const updateScrollProgress = () => {
      const scrollRange = Math.max(trigger.offsetHeight - window.innerHeight, 1)
      targetProgress.current = Math.min(Math.max(window.scrollY / scrollRange, 0), 1)
    }

    updateScrollProgress()
    window.addEventListener('scroll', updateScrollProgress, { passive: true })
    window.addEventListener('resize', updateScrollProgress)

    return () => {
      window.removeEventListener('scroll', updateScrollProgress)
      window.removeEventListener('resize', updateScrollProgress)
    }
  }, [camera, scrollRef])

  useFrame((_, delta) => {
    const smoothing = 1 - Math.exp(-delta * 1.7)
    currentProgress.current += (targetProgress.current - currentProgress.current) * smoothing

    const progress = currentProgress.current
    const cameraZ = THREE.MathUtils.lerp(CAMERA_START_Z, CAMERA_END_Z, progress)
    const targetZ = Math.max(cameraZ - LOOK_AHEAD_Z, LOOK_TARGET_MIN_Z)

    camera.position.set(0, CAMERA_Y, cameraZ)
    camera.lookAt(0, CAMERA_Y, targetZ)
  })

  return null
}

interface SceneCanvasProps {
  isEmerging?: boolean
}

export default function SceneCanvas({ isEmerging = false }: SceneCanvasProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const sceneClassName = ['scene-shell', isEmerging ? 'scene-shell--emerging' : '']
    .filter(Boolean)
    .join(' ')

  return (
    <>
      <Canvas
        camera={{ position: [0, 7, 12], fov: 75, near: 0.1, far: 1000 }}
        className={sceneClassName}
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
