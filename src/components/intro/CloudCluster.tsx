import { useMemo } from 'react'
import * as THREE from 'three'

interface CloudDef {
  x: number
  y: number
  z: number
  scale: number
  opacity: number
}

interface Cloudlet {
  x: number
  y: number
  z: number
  sx: number
  sy: number
  opacity: number
  shade: number
  side: -1 | 1
}

interface ReflectionDef {
  x: number
  z: number
  sx: number
  sz: number
  opacity: number
}

const CLOUDLET_OFFSETS = [
  { x: 0, y: 0, z: 0, s: 1.24, a: 1, shade: 0.96 },
  { x: -0.18, y: -0.02, z: 0.16, s: 1.04, a: 0.9, shade: 0.64 },
  { x: 0.18, y: 0.12, z: -0.2, s: 1, a: 0.92, shade: 1.04 },
  { x: -0.02, y: 0.34, z: -0.34, s: 0.86, a: 0.84, shade: 1.12 },
  { x: 0.1, y: -0.24, z: 0.3, s: 0.92, a: 0.74, shade: 0.5 },
  { x: -0.3, y: 0.2, z: -0.08, s: 0.8, a: 0.76, shade: 0.82 },
  { x: 0.28, y: 0.02, z: 0.22, s: 0.78, a: 0.72, shade: 0.7 },
  { x: -0.08, y: -0.38, z: 0.42, s: 0.7, a: 0.58, shade: 0.42 },
  { x: 0.04, y: 0.58, z: -0.52, s: 0.7, a: 0.68, shade: 1.08 },
  { x: -0.16, y: 0.82, z: 0.12, s: 0.52, a: 0.5, shade: 1 },
  { x: 0.16, y: 1.04, z: -0.18, s: 0.46, a: 0.42, shade: 1.14 },
  { x: 0.02, y: 1.28, z: -0.34, s: 0.34, a: 0.32, shade: 1.18 },
]

const LEFT_CLOUDS: CloudDef[] = [
  { x: -11.6, y: 4.4, z: -5.2, scale: 22.5, opacity: 0.82 },
  { x: -15.2, y: 5.6, z: -6.9, scale: 27.5, opacity: 0.86 },
  { x: -20.8, y: 6.4, z: -8.5, scale: 31.5, opacity: 0.88 },
  { x: -24.0, y: 8.8, z: -10.8, scale: 34.5, opacity: 0.9 },
  { x: -18.2, y: 9.8, z: -12.8, scale: 29.0, opacity: 0.86 },
  { x: -11.5, y: 5.2, z: -14.7, scale: 23.0, opacity: 0.82 },
  { x: -22.5, y: 5.0, z: -16.8, scale: 30.0, opacity: 0.84 },
  { x: -16.0, y: 8.1, z: -18.8, scale: 26.5, opacity: 0.82 },
  { x: -24.6, y: 10.1, z: -21.0, scale: 35.5, opacity: 0.86 },
  { x: -13.4, y: 4.8, z: -23.0, scale: 22.0, opacity: 0.78 },
  { x: -19.6, y: 7.0, z: -25.2, scale: 31.0, opacity: 0.84 },
  { x: -25.0, y: 8.6, z: -27.6, scale: 35.0, opacity: 0.84 },
  { x: -14.6, y: 9.8, z: -30.4, scale: 26.0, opacity: 0.8 },
  { x: -21.2, y: 5.4, z: -33.0, scale: 29.5, opacity: 0.78 },
  { x: -11.2, y: 6.4, z: -35.4, scale: 21.0, opacity: 0.74 },
  { x: -17.4, y: 8.9, z: -38.6, scale: 28.5, opacity: 0.76 },
  { x: -23.6, y: 10.2, z: -41.4, scale: 32.0, opacity: 0.78 },
  { x: -13.0, y: 7.4, z: -44.4, scale: 23.0, opacity: 0.72 },
]

const RIGHT_CLOUDS: CloudDef[] = LEFT_CLOUDS.map(cloud => ({
  ...cloud,
  x: -cloud.x,
  z: cloud.z - 0.8,
}))

function makeTextureFromCanvas(canvas: HTMLCanvasElement) {
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.generateMipmaps = false
  return texture
}

function drawCumulusMask(ctx: CanvasRenderingContext2D, size: number) {
  const puffs = [
    [256, 300, 142, 0.98],
    [150, 306, 118, 0.88],
    [366, 292, 124, 0.9],
    [218, 224, 102, 0.86],
    [320, 218, 92, 0.84],
    [106, 360, 84, 0.76],
    [430, 344, 82, 0.74],
    [252, 152, 74, 0.72],
    [142, 232, 66, 0.68],
    [392, 226, 64, 0.66],
    [206, 394, 72, 0.62],
    [326, 392, 70, 0.62],
    [264, 90, 46, 0.48],
    [176, 156, 52, 0.52],
    [356, 154, 56, 0.52],
  ] as const

  puffs.forEach(([x, y, radius, alpha]) => {
    const gradient = ctx.createRadialGradient(x, y, radius * 0.04, x, y, radius)
    gradient.addColorStop(0, `rgba(255,255,255,${alpha})`)
    gradient.addColorStop(0.36, `rgba(255,255,255,${alpha * 0.86})`)
    gradient.addColorStop(0.68, `rgba(255,255,255,${alpha * 0.38})`)
    gradient.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fill()
  })

  ctx.filter = 'blur(7px)'
  ctx.globalAlpha = 0.44
  for (let i = 0; i < 24; i += 1) {
    const x = 90 + Math.random() * 340
    const y = 90 + Math.random() * 320
    const radius = 24 + Math.random() * 54
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
    gradient.addColorStop(0, 'rgba(255,255,255,0.44)')
    gradient.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1
  ctx.filter = 'none'

  const floorFade = ctx.createLinearGradient(0, size * 0.62, 0, size)
  floorFade.addColorStop(0, 'rgba(0,0,0,0)')
  floorFade.addColorStop(0.72, 'rgba(0,0,0,0.12)')
  floorFade.addColorStop(1, 'rgba(0,0,0,0.55)')
  ctx.globalCompositeOperation = 'destination-out'
  ctx.fillStyle = floorFade
  ctx.fillRect(0, 0, size, size)
  ctx.globalCompositeOperation = 'source-over'
}

function makeCloudBodyTexture() {
  const size = 512
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size

  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, size, size)
  drawCumulusMask(ctx, size)

  ctx.globalCompositeOperation = 'source-atop'

  const volume = ctx.createRadialGradient(
    size * 0.54,
    size * 0.26,
    18,
    size * 0.5,
    size * 0.54,
    size * 0.58
  )
  volume.addColorStop(0, 'rgba(255,214,255,0.9)')
  volume.addColorStop(0.28, 'rgba(210,112,236,0.84)')
  volume.addColorStop(0.58, 'rgba(88,58,136,0.86)')
  volume.addColorStop(1, 'rgba(18,14,44,0.9)')
  ctx.fillStyle = volume
  ctx.fillRect(0, 0, size, size)

  const shadow = ctx.createLinearGradient(0, size * 0.16, 0, size)
  shadow.addColorStop(0, 'rgba(255,190,242,0.1)')
  shadow.addColorStop(0.48, 'rgba(28,24,72,0.3)')
  shadow.addColorStop(1, 'rgba(0,0,12,0.62)')
  ctx.fillStyle = shadow
  ctx.fillRect(0, 0, size, size)

  ctx.filter = 'blur(9px)'
  ctx.globalAlpha = 0.52
  for (let i = 0; i < 18; i += 1) {
    const x = 82 + Math.random() * 360
    const y = 170 + Math.random() * 250
    const radius = 28 + Math.random() * 70
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
    gradient.addColorStop(0, 'rgba(18,12,42,0.5)')
    gradient.addColorStop(1, 'rgba(18,12,42,0)')
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.globalAlpha = 0.5
  for (let i = 0; i < 24; i += 1) {
    const x = 80 + Math.random() * 360
    const y = 70 + Math.random() * 250
    const radius = 18 + Math.random() * 46
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
    gradient.addColorStop(0, 'rgba(255,162,238,0.22)')
    gradient.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.filter = 'none'
  ctx.globalAlpha = 1
  ctx.globalCompositeOperation = 'source-over'

  return makeTextureFromCanvas(canvas)
}

function makeRimTexture(direction: 'left' | 'right') {
  const size = 512
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, size, size)
  drawCumulusMask(ctx, size)

  ctx.globalCompositeOperation = 'source-in'
  const rim = ctx.createLinearGradient(
    direction === 'left' ? 0 : size,
    0,
    direction === 'left' ? size : 0,
    0
  )
  rim.addColorStop(0, 'rgba(255,255,255,0)')
  rim.addColorStop(0.38, 'rgba(120,88,255,0.08)')
  rim.addColorStop(0.7, 'rgba(255,74,214,0.34)')
  rim.addColorStop(1, 'rgba(255,218,250,0.68)')
  ctx.fillStyle = rim
  ctx.fillRect(0, 0, size, size)

  ctx.globalCompositeOperation = 'lighter'
  ctx.filter = 'blur(8px)'
  ctx.globalAlpha = 0.8
  const bloom = ctx.createLinearGradient(
    direction === 'left' ? 0 : size,
    0,
    direction === 'left' ? size : 0,
    0
  )
  bloom.addColorStop(0, 'rgba(255,255,255,0)')
  bloom.addColorStop(0.58, 'rgba(56,218,255,0.1)')
  bloom.addColorStop(0.82, 'rgba(255,58,202,0.24)')
  bloom.addColorStop(1, 'rgba(255,218,248,0.46)')
  ctx.fillStyle = bloom
  ctx.fillRect(0, 0, size, size)

  ctx.filter = 'none'
  ctx.globalAlpha = 1
  ctx.globalCompositeOperation = 'source-over'

  return makeTextureFromCanvas(canvas)
}

function makeFloorHazeTexture() {
  const size = 768
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, size, size)

  const fog = ctx.createRadialGradient(
    size * 0.5,
    size * 0.55,
    0,
    size * 0.5,
    size * 0.55,
    size * 0.68
  )
  fog.addColorStop(0, 'rgba(255,136,236,0.018)')
  fog.addColorStop(0.26, 'rgba(255,76,214,0.07)')
  fog.addColorStop(0.56, 'rgba(132,82,255,0.09)')
  fog.addColorStop(0.82, 'rgba(38,210,255,0.035)')
  fog.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = fog
  ctx.fillRect(0, 0, size, size)

  for (let y = size * 0.46; y < size * 0.92; y += 16 + Math.random() * 20) {
    const alpha = 0.018 + Math.random() * 0.035
    ctx.fillStyle = `rgba(255,120,226,${alpha * 0.7})`
    ctx.fillRect(0, y, size, 2 + Math.random() * 4)
  }

  ctx.filter = 'blur(20px)'
  for (let i = 0; i < 18; i += 1) {
    const x =
      Math.random() > 0.5
        ? size * (0.08 + Math.random() * 0.22)
        : size * (0.7 + Math.random() * 0.22)
    const y = size * (0.42 + Math.random() * 0.34)
    const radiusX = 54 + Math.random() * 130
    const radiusY = 18 + Math.random() * 52
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, Math.max(radiusX, radiusY))
    gradient.addColorStop(0, 'rgba(255,96,226,0.075)')
    gradient.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(radiusX / radiusY, 1)
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(0, 0, radiusY, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  ctx.filter = 'none'
  const centerClear = ctx.createLinearGradient(0, 0, size, 0)
  centerClear.addColorStop(0, 'rgba(0,0,0,0)')
  centerClear.addColorStop(0.38, 'rgba(0,0,0,0.7)')
  centerClear.addColorStop(0.62, 'rgba(0,0,0,0.7)')
  centerClear.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.globalCompositeOperation = 'destination-out'
  ctx.fillStyle = centerClear
  ctx.fillRect(0, 0, size, size)
  ctx.globalCompositeOperation = 'source-over'

  return makeTextureFromCanvas(canvas)
}

function makeReflectionTexture() {
  const size = 512
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, size, size)

  const reflection = ctx.createRadialGradient(
    size * 0.5,
    size * 0.36,
    0,
    size * 0.5,
    size * 0.42,
    size * 0.58
  )
  reflection.addColorStop(0, 'rgba(255,72,218,0.24)')
  reflection.addColorStop(0.28, 'rgba(255,144,236,0.14)')
  reflection.addColorStop(0.5, 'rgba(82,214,255,0.075)')
  reflection.addColorStop(0.72, 'rgba(124,70,255,0.04)')
  reflection.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = reflection
  ctx.fillRect(0, 0, size, size)

  ctx.filter = 'blur(16px)'
  for (let i = 0; i < 10; i += 1) {
    const x = 90 + Math.random() * 330
    const y = 100 + Math.random() * 240
    const radius = 34 + Math.random() * 82
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
    gradient.addColorStop(0, 'rgba(255,84,224,0.1)')
    gradient.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.filter = 'none'
  for (let y = 0; y < size; y += 11) {
    ctx.fillStyle = 'rgba(0,0,0,0.08)'
    ctx.fillRect(0, y, size, 2)
  }

  return makeTextureFromCanvas(canvas)
}

function expandClouds(clouds: CloudDef[]) {
  const cloudlets: Cloudlet[] = []

  clouds.forEach((cloud, cloudIndex) => {
    CLOUDLET_OFFSETS.forEach((offset, offsetIndex) => {
      const side = cloud.x < 0 ? -1 : 1
      const variance = (cloudIndex % 3) * 0.2 + offsetIndex * 0.06
      const scale = cloud.scale * offset.s
      const x = cloud.x + offset.x * scale * 0.13 * side
      const centerSafeX = side < 0 ? Math.min(x, -9.8) : Math.max(x, 9.8)
      const distanceFade = Math.max(0.68, 1 + cloud.z / 95)

      cloudlets.push({
        x: centerSafeX,
        y: cloud.y + offset.y * scale * 0.3,
        z: cloud.z + offset.z * scale * 0.36 + variance,
        sx: scale * 0.86,
        sy: scale * (1.0 + offsetIndex * 0.04),
        opacity: cloud.opacity * offset.a * distanceFade,
        shade: offset.shade * (0.82 + distanceFade * 0.24),
        side,
      })
    })
  })

  return cloudlets.sort((a, b) => a.z - b.z)
}

function makeReflections(clouds: CloudDef[]): ReflectionDef[] {
  return clouds
    .filter((_, index) => index % 2 === 0)
    .map(cloud => ({
      x: cloud.x * 0.96,
      z: cloud.z + 1.8,
      sx: cloud.scale * 0.96,
      sz: cloud.scale * 1.28,
      opacity: cloud.opacity * 0.18,
    }))
}

export default function CloudCluster() {
  const {
    cloudTexture,
    leftRimTexture,
    rightRimTexture,
    hazeTexture,
    reflectionTexture,
    cloudlets,
    reflections,
  } = useMemo(() => {
    const clouds = [...LEFT_CLOUDS, ...RIGHT_CLOUDS]

    return {
      cloudTexture: makeCloudBodyTexture(),
      leftRimTexture: makeRimTexture('left'),
      rightRimTexture: makeRimTexture('right'),
      hazeTexture: makeFloorHazeTexture(),
      reflectionTexture: makeReflectionTexture(),
      cloudlets: expandClouds(clouds),
      reflections: makeReflections(clouds),
    }
  }, [])

  return (
    <group>
      {reflections.map((reflection, index) => (
        <mesh
          key={`reflection-${index}`}
          position={[reflection.x, 0.035, reflection.z]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[reflection.sx, reflection.sz]} />
          <meshBasicMaterial
            map={reflectionTexture}
            transparent
            opacity={reflection.opacity}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ))}

      <mesh position={[0, 0.08, -31]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[70, 96]} />
        <meshBasicMaterial
          map={hazeTexture}
          transparent
          opacity={0.34}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {cloudlets.map((cloud, index) => {
        const rimTexture = cloud.side < 0 ? leftRimTexture : rightRimTexture
        const rimOffset = cloud.side < 0 ? 0.28 : -0.28

        return (
          <group key={index}>
            <sprite position={[cloud.x, cloud.y, cloud.z]} scale={[cloud.sx, cloud.sy, 1]}>
              <spriteMaterial
                map={cloudTexture}
                color={new THREE.Color(cloud.shade * 0.95, cloud.shade * 0.5, cloud.shade * 1.08)}
                transparent
                opacity={cloud.opacity * 0.82}
                alphaTest={0.035}
                blending={THREE.NormalBlending}
                depthWrite={false}
                toneMapped={false}
              />
            </sprite>
            <sprite
              position={[cloud.x + rimOffset, cloud.y + cloud.sy * 0.012, cloud.z + 0.03]}
              scale={[cloud.sx * 1.05, cloud.sy * 1.04, 1]}
            >
              <spriteMaterial
                map={rimTexture}
                color={new THREE.Color(1.55, 0.52, 1.42)}
                transparent
                opacity={cloud.opacity * 0.36}
                alphaTest={0.015}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
                toneMapped={false}
              />
            </sprite>
          </group>
        )
      })}
    </group>
  )
}
