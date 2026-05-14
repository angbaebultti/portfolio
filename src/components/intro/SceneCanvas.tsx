import { useEffect, useMemo, useRef, type MutableRefObject, type RefObject } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import * as THREE from 'three'
import RetroRoom from './RetroRoom'
import CloudCluster from './CloudCluster'

const CAMERA_START_Z = 12
const CAMERA_END_Z = -104
const CAMERA_Y = 7
const LOOK_AHEAD_Z = 34
const ROOM_BACK_Z = -160
const LOOK_TARGET_MIN_Z = ROOM_BACK_Z + 7

gsap.registerPlugin(ScrollTrigger)

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

function CameraRig({
  scrollRef,
  scrollProgressRef,
}: {
  scrollRef: RefObject<HTMLDivElement | null>
  scrollProgressRef: MutableRefObject<number>
}) {
  const { camera, invalidate } = useThree()

  useEffect(() => {
    camera.position.set(0, CAMERA_Y, CAMERA_START_Z)
    camera.up.set(0, 1, 0)
    camera.lookAt(0, CAMERA_Y, CAMERA_START_Z - LOOK_AHEAD_Z)
    camera.updateProjectionMatrix()

    const trigger = scrollRef.current
    if (!trigger) return

    const applyCameraProgress = (progress: number) => {
      const cameraZ = THREE.MathUtils.lerp(CAMERA_START_Z, CAMERA_END_Z, progress)
      const targetZ = Math.max(cameraZ - LOOK_AHEAD_Z - progress * 18, LOOK_TARGET_MIN_Z)

      scrollProgressRef.current = progress
      camera.position.set(0, CAMERA_Y - progress * 1.8, cameraZ)
      camera.lookAt(0, CAMERA_Y - progress * 1.2, targetZ)

      const perspectiveCamera = camera as THREE.PerspectiveCamera
      perspectiveCamera.fov = 65
      perspectiveCamera.updateProjectionMatrix()
      invalidate()
    }

    const scrollTrigger = ScrollTrigger.create({
      trigger,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: self => applyCameraProgress(self.progress),
      onRefresh: self => applyCameraProgress(self.progress),
    })

    applyCameraProgress(scrollTrigger.progress)

    return () => {
      scrollTrigger.kill()
    }
  }, [camera, invalidate, scrollProgressRef, scrollRef])

  return null
}

interface SceneCanvasProps {
  isEmerging?: boolean
}

export default function SceneCanvas({ isEmerging = false }: SceneCanvasProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const scrollProgressRef = useRef(0)
  const sceneClassName = ['scene-shell', isEmerging ? 'scene-shell--emerging' : '']
    .filter(Boolean)
    .join(' ')

  return (
    <>
      <Canvas
        camera={{ position: [0, 7, 12], fov: 65, near: 0.1, far: 1000 }}
        className={sceneClassName}
        frameloop="demand"
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
        <CameraRig scrollRef={scrollRef} scrollProgressRef={scrollProgressRef} />
        <StarField />
        <RetroRoom scrollProgressRef={scrollProgressRef} />
        <CloudCluster scrollProgressRef={scrollProgressRef} />
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
