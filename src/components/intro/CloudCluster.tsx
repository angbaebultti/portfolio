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
}

const CLOUDLET_OFFSETS = [
  { x: 0, y: 0, z: 0, s: 1, a: 1, shade: 1 },
  { x: -0.34, y: -0.12, z: 0.16, s: 0.74, a: 0.74, shade: 0.72 },
  { x: 0.28, y: 0.16, z: -0.2, s: 0.68, a: 0.8, shade: 0.92 },
  { x: -0.08, y: 0.36, z: -0.44, s: 0.52, a: 0.66, shade: 1 },
  { x: 0.18, y: -0.32, z: 0.38, s: 0.58, a: 0.58, shade: 0.58 },
  { x: -0.52, y: 0.2, z: -0.08, s: 0.46, a: 0.52, shade: 0.84 },
  { x: 0.48, y: -0.02, z: 0.24, s: 0.5, a: 0.48, shade: 0.64 },
  { x: -0.22, y: -0.46, z: 0.5, s: 0.42, a: 0.45, shade: 0.42 },
  { x: 0.06, y: 0.54, z: -0.62, s: 0.38, a: 0.5, shade: 0.96 },
]

function makeCloudTexture() {
  const size = 512
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size

  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, size, size)

  const puff = (x: number, y: number, radius: number, alpha: number) => {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
    gradient.addColorStop(0, `rgba(255,255,255,${alpha})`)
    gradient.addColorStop(0.16, `rgba(244,248,255,${alpha * 0.92})`)
    gradient.addColorStop(0.34, `rgba(184,196,216,${alpha * 0.52})`)
    gradient.addColorStop(0.56, `rgba(82,94,116,${alpha * 0.26})`)
    gradient.addColorStop(0.76, `rgba(20,24,34,${alpha * 0.1})`)
    gradient.addColorStop(1, 'rgba(255,255,255,0)')

    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fillStyle = gradient
    ctx.fill()
  }

  const puffs = [
    [246, 306, 132, 0.96],
    [156, 296, 102, 0.9],
    [358, 286, 106, 0.92],
    [214, 222, 88, 0.88],
    [314, 216, 78, 0.84],
    [116, 342, 72, 0.76],
    [420, 330, 70, 0.74],
    [254, 168, 64, 0.72],
    [156, 228, 54, 0.7],
    [382, 230, 56, 0.68],
    [214, 380, 58, 0.62],
    [324, 374, 54, 0.62],
  ] as const

  puffs.forEach(([x, y, radius, alpha]) => puff(x, y, radius, alpha))

  for (let i = 0; i < 140; i++) {
    const x = Math.random() * size
    const y = Math.random() * size
    const radius = 6 + Math.random() * 22
    const alpha = Math.random() > 0.48 ? 0.055 : 0.035
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
    gradient.addColorStop(0, `rgba(255,255,255,${alpha})`)
    gradient.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fill()
  }

  const image = ctx.getImageData(0, 0, size, size)
  const data = image.data
  for (let i = 0; i < data.length; i += 4) {
    const grain = Math.random()
    const noise = 0.62 + grain * 0.68
    data[i] = Math.min(255, data[i] * noise)
    data[i + 1] = Math.min(255, data[i + 1] * noise)
    data[i + 2] = Math.min(255, data[i + 2] * noise)
    if (data[i + 3] > 8 && grain > 0.968) data[i + 3] *= 0.18
    if (data[i + 3] > 18 && grain < 0.14) {
      data[i] *= 0.45
      data[i + 1] *= 0.48
      data[i + 2] *= 0.54
    }
  }
  ctx.putImageData(image, 0, 0)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

function makeFloorHazeTexture() {
  const size = 512
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!

  const gradient = ctx.createRadialGradient(size * 0.5, size * 0.64, 0, size * 0.5, size * 0.62, size * 0.62)
  gradient.addColorStop(0, 'rgba(255,255,255,0)')
  gradient.addColorStop(0.28, 'rgba(255,255,255,0.015)')
  gradient.addColorStop(0.54, 'rgba(255,255,255,0.085)')
  gradient.addColorStop(0.74, 'rgba(255,255,255,0.035)')
  gradient.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)

  for (let y = 300; y < 452; y += 9 + Math.random() * 7) {
    const alpha = 0.02 + Math.random() * 0.035
    ctx.fillStyle = `rgba(255,255,255,${alpha})`
    ctx.fillRect(0, y, size, 1 + Math.random() * 1.5)
  }

  const centerClear = ctx.createLinearGradient(0, 0, size, 0)
  centerClear.addColorStop(0, 'rgba(0,0,0,0)')
  centerClear.addColorStop(0.4, 'rgba(0,0,0,0.82)')
  centerClear.addColorStop(0.6, 'rgba(0,0,0,0.82)')
  centerClear.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.globalCompositeOperation = 'destination-out'
  ctx.fillStyle = centerClear
  ctx.fillRect(0, 0, size, size)
  ctx.globalCompositeOperation = 'source-over'

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

const LEFT_CLOUDS: CloudDef[] = [
  { x: -13.0, y: 3.0, z: -5.5, scale: 13.5, opacity: 0.76 },
  { x: -16.0, y: 4.0, z: -7.5, scale: 17.2, opacity: 0.8 },
  { x: -20.0, y: 4.8, z: -8.6, scale: 18.8, opacity: 0.82 },
  { x: -21.5, y: 6.7, z: -11.5, scale: 20.5, opacity: 0.84 },
  { x: -17.2, y: 7.6, z: -13.6, scale: 16.5, opacity: 0.78 },
  { x: -12.4, y: 3.5, z: -15.8, scale: 13.8, opacity: 0.74 },
  { x: -20.8, y: 3.2, z: -17.5, scale: 17.6, opacity: 0.78 },
  { x: -15.6, y: 6.1, z: -20.2, scale: 15.2, opacity: 0.74 },
  { x: -21.8, y: 8.5, z: -22.2, scale: 19.4, opacity: 0.78 },
  { x: -12.0, y: 3.2, z: -24.6, scale: 12.8, opacity: 0.7 },
]

const RIGHT_CLOUDS: CloudDef[] = LEFT_CLOUDS.map(cloud => ({
  ...cloud,
  x: -cloud.x,
  z: cloud.z - 0.8,
}))

function expandClouds(clouds: CloudDef[]) {
  const cloudlets: Cloudlet[] = []

  clouds.forEach((cloud, cloudIndex) => {
    CLOUDLET_OFFSETS.forEach((offset, offsetIndex) => {
      const side = cloud.x < 0 ? -1 : 1
      const variance = (cloudIndex % 3) * 0.08 + offsetIndex * 0.03
      const scale = cloud.scale * offset.s

      cloudlets.push({
        x: cloud.x + offset.x * scale * 0.34 * side,
        y: cloud.y + offset.y * scale * 0.22,
        z: cloud.z + offset.z * scale * 0.22 + variance,
        sx: scale,
        sy: scale * (0.62 + offsetIndex * 0.025),
        opacity: cloud.opacity * offset.a,
        shade: offset.shade,
      })
    })
  })

  return cloudlets
}

export default function CloudCluster() {
  const { cloudTexture, hazeTexture, cloudlets } = useMemo(() => {
    return {
      cloudTexture: makeCloudTexture(),
      hazeTexture: makeFloorHazeTexture(),
      cloudlets: expandClouds([...LEFT_CLOUDS, ...RIGHT_CLOUDS]),
    }
  }, [])

  return (
    <group>
      <mesh position={[0, 0.12, -27]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[58, 74]} />
        <meshBasicMaterial
          map={hazeTexture}
          transparent
          opacity={0.42}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {cloudlets.map((cloud, index) => (
        <sprite key={index} position={[cloud.x, cloud.y, cloud.z]} scale={[cloud.sx, cloud.sy, 1]}>
          <spriteMaterial
            map={cloudTexture}
            color={new THREE.Color(cloud.shade, cloud.shade, cloud.shade)}
            transparent
            opacity={cloud.opacity}
            alphaTest={0.082}
            blending={THREE.NormalBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </sprite>
      ))}
    </group>
  )
}
