import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export default function SpaceScene() {
  const triggerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const trigger = triggerRef.current!
    const canvas = canvasRef.current!
    const W = window.innerWidth
    const H = window.innerHeight

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x000000)
    scene.fog = new THREE.Fog(0x000000, 100, 450)

    const camera = new THREE.PerspectiveCamera(72, W / H, 0.1, 2000)
    camera.position.set(0, 10, 150)

    const lookTarget = new THREE.Vector3(0, 3, -150)
    camera.lookAt(lookTarget)

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
    renderer.setSize(W, H, false)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    // --- Stars ---
    const STAR_COUNT = 4000
    const starPos = new Float32Array(STAR_COUNT * 3)
    for (let i = 0; i < STAR_COUNT; i++) {
      starPos[i * 3] = (Math.random() - 0.5) * 800
      starPos[i * 3 + 1] = (Math.random() - 0.5) * 600
      starPos[i * 3 + 2] = (Math.random() - 0.5) * 800
    }
    const starGeo = new THREE.BufferGeometry()
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3))
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.8, sizeAttenuation: true })
    const stars = new THREE.Points(starGeo, starMat)
    scene.add(stars)

    // --- Grid floor ---
    const gridHelper = new THREE.GridHelper(800, 60, 0x00aaff, 0x001533)
    gridHelper.position.y = -4
    scene.add(gridHelper)

    const gridHelper2 = new THREE.GridHelper(800, 20, 0x0066cc, 0x000a1a)
    gridHelper2.position.y = -4.05
    scene.add(gridHelper2)

    // --- Camera entrance ---
    const entranceTween = gsap.to(camera.position, {
      z: 25,
      y: 6,
      duration: 2.5,
      ease: 'power2.inOut',
      onUpdate: () => camera.lookAt(lookTarget),
    })

    // --- Scroll-driven flythrough ---
    ScrollTrigger.refresh()
    const st = ScrollTrigger.create({
      trigger,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1.5,
      onUpdate: self => {
        camera.position.z = 25 - self.progress * 125
        camera.position.y = 6 - self.progress * 3
        lookTarget.z = camera.position.z - 150
        camera.lookAt(lookTarget)
      },
    })

    // --- Resize ---
    const onResize = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h, false)
    }
    window.addEventListener('resize', onResize)

    // --- Render loop ---
    let raf: number
    const animate = () => {
      raf = requestAnimationFrame(animate)
      stars.rotation.y += 0.00008
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      entranceTween.kill()
      st.kill()
      starGeo.dispose()
      starMat.dispose()
      gridHelper.geometry.dispose()
      ;(gridHelper.material as THREE.Material).dispose()
      gridHelper2.geometry.dispose()
      ;(gridHelper2.material as THREE.Material).dispose()
      renderer.dispose()
    }
  }, [])

  return (
    <>
      <canvas ref={canvasRef} className="scene-shell" />

      {/* Overlay UI — placeholder */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: 'clamp(24px, 5vw, 64px)',
          pointerEvents: 'none',
        }}
      >
        <p
          style={{
            fontFamily: '"Courier New", Courier, monospace',
            fontSize: 'clamp(11px, 1.2vw, 13px)',
            color: 'rgba(0,170,255,0.55)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}
        >
          scroll to explore
        </p>
      </div>

      {/* Scroll driver */}
      <div ref={triggerRef} style={{ height: '300vh' }} />
    </>
  )
}
