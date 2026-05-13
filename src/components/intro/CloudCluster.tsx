import { useMemo } from 'react'
import * as THREE from 'three'

type Side = -1 | 1

interface CloudMass {
  side: Side
  x: number
  y: number
  z: number
  sx: number
  sy: number
  opacity: number
  seed: number
  kind: 'primary' | 'detail' | 'veil'
}

interface GroundFog {
  x: number
  z: number
  sx: number
  sz: number
  opacity: number
  seed: number
}

const PRIMARY_MASSES: CloudMass[] = [
  {
    side: -1,
    x: -24.5,
    y: 6.9,
    z: -9,
    sx: 19,
    sy: 15.8,
    opacity: 0.96,
    seed: 101,
    kind: 'primary',
  },
  {
    side: -1,
    x: -17.2,
    y: 3.6,
    z: -21,
    sx: 13.8,
    sy: 8.4,
    opacity: 0.78,
    seed: 137,
    kind: 'primary',
  },
  {
    side: -1,
    x: -26.5,
    y: 5.4,
    z: -37,
    sx: 16.5,
    sy: 12.8,
    opacity: 0.58,
    seed: 173,
    kind: 'primary',
  },
  {
    side: 1,
    x: 24.2,
    y: 6.8,
    z: -10,
    sx: 21.5,
    sy: 17.2,
    opacity: 1,
    seed: 211,
    kind: 'primary',
  },
  {
    side: 1,
    x: 15.2,
    y: 3.3,
    z: -23,
    sx: 13.5,
    sy: 8.2,
    opacity: 0.8,
    seed: 251,
    kind: 'primary',
  },
  {
    side: 1,
    x: 27,
    y: 7.9,
    z: -33,
    sx: 18.2,
    sy: 16.6,
    opacity: 0.68,
    seed: 293,
    kind: 'primary',
  },
]

const DETAIL_MASSES: CloudMass[] = [
  { side: -1, x: -21, y: 8.8, z: -7.6, sx: 9.8, sy: 7.6, opacity: 0.62, seed: 331, kind: 'detail' },
  {
    side: -1,
    x: -13.6,
    y: 4.3,
    z: -16,
    sx: 8.8,
    sy: 5.4,
    opacity: 0.48,
    seed: 367,
    kind: 'detail',
  },
  {
    side: -1,
    x: -18.4,
    y: 2.2,
    z: -29,
    sx: 10.4,
    sy: 4.6,
    opacity: 0.42,
    seed: 401,
    kind: 'detail',
  },
  {
    side: -1,
    x: -25.5,
    y: 10.2,
    z: -39,
    sx: 9.6,
    sy: 7.1,
    opacity: 0.36,
    seed: 439,
    kind: 'detail',
  },
  {
    side: 1,
    x: 22.4,
    y: 10.7,
    z: -9.2,
    sx: 10.8,
    sy: 8.8,
    opacity: 0.66,
    seed: 479,
    kind: 'detail',
  },
  { side: 1, x: 13.2, y: 4, z: -17.5, sx: 9.1, sy: 5.6, opacity: 0.48, seed: 521, kind: 'detail' },
  { side: 1, x: 19.6, y: 2.5, z: -28, sx: 11.4, sy: 5.2, opacity: 0.44, seed: 557, kind: 'detail' },
  {
    side: 1,
    x: 28.5,
    y: 12.1,
    z: -35,
    sx: 10.6,
    sy: 9.2,
    opacity: 0.42,
    seed: 593,
    kind: 'detail',
  },
]

const VEIL_MASSES: CloudMass[] = [
  { side: -1, x: -23, y: 3.1, z: -13, sx: 22, sy: 9, opacity: 0.24, seed: 631, kind: 'veil' },
  { side: -1, x: -22, y: 2.5, z: -31, sx: 21, sy: 7.2, opacity: 0.16, seed: 673, kind: 'veil' },
  { side: 1, x: 23, y: 3.2, z: -13, sx: 24, sy: 9.2, opacity: 0.25, seed: 719, kind: 'veil' },
  { side: 1, x: 23, y: 2.7, z: -31, sx: 22, sy: 7.4, opacity: 0.17, seed: 761, kind: 'veil' },
]

const GROUND_FOG: GroundFog[] = [
  { x: -18, z: -9, sx: 24, sz: 17, opacity: 0.17, seed: 811 },
  { x: 18, z: -9, sx: 27, sz: 18, opacity: 0.18, seed: 853 },
  { x: -18, z: -27, sx: 26, sz: 22, opacity: 0.11, seed: 887 },
  { x: 18, z: -27, sx: 28, sz: 22, opacity: 0.12, seed: 929 },
  { x: 0, z: -29, sx: 31, sz: 31, opacity: 0.055, seed: 967 },
]

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

function seeded(seed: number) {
  let value = seed

  return () => {
    value = (value * 1664525 + 1013904223) >>> 0
    return value / 4294967295
  }
}

function makeTexture(canvas: HTMLCanvasElement) {
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.generateMipmaps = false
  return texture
}

function drawEllipticalPuff(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
  alpha: number
) {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, Math.max(rx, ry))
  gradient.addColorStop(0, `rgba(255,255,255,${alpha})`)
  gradient.addColorStop(0.44, `rgba(255,255,255,${alpha * 0.9})`)
  gradient.addColorStop(0.76, `rgba(255,255,255,${alpha * 0.34})`)
  gradient.addColorStop(1, 'rgba(255,255,255,0)')

  ctx.save()
  ctx.translate(x, y)
  ctx.scale(rx / Math.max(rx, ry), ry / Math.max(rx, ry))
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(0, 0, Math.max(rx, ry), 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function drawCloudSilhouette(
  ctx: CanvasRenderingContext2D,
  size: number,
  side: Side,
  seed: number
) {
  const rand = seeded(seed)
  const baseY = size * 0.68
  const sideBias = side < 0 ? -1 : 1

  drawEllipticalPuff(ctx, size * 0.5, baseY, size * 0.34, size * 0.2, 0.96)
  drawEllipticalPuff(ctx, size * 0.36, baseY * 0.92, size * 0.23, size * 0.18, 0.9)
  drawEllipticalPuff(ctx, size * 0.65, baseY * 0.9, size * 0.25, size * 0.2, 0.9)
  drawEllipticalPuff(ctx, size * 0.46, size * 0.46, size * 0.24, size * 0.25, 0.94)
  drawEllipticalPuff(ctx, size * 0.62, size * 0.4, size * 0.2, size * 0.23, 0.9)
  drawEllipticalPuff(ctx, size * 0.32, size * 0.52, size * 0.18, size * 0.19, 0.82)

  for (let i = 0; i < 34; i += 1) {
    const ridge = i / 33
    const edgeSide = rand() > 0.48 ? -1 : 1
    const x = size * (0.5 + edgeSide * (0.15 + rand() * 0.29)) + sideBias * rand() * size * 0.035
    const y = size * (0.26 + Math.pow(rand(), 0.85) * 0.5)
    const radius = size * (0.045 + rand() * 0.105) * (1 - ridge * 0.16)
    drawEllipticalPuff(
      ctx,
      x,
      y,
      radius * (0.9 + rand() * 0.7),
      radius * (0.8 + rand() * 0.62),
      0.58
    )
  }

  ctx.globalCompositeOperation = 'destination-out'
  for (let i = 0; i < 11; i += 1) {
    const x = size * (0.22 + rand() * 0.56)
    const y = size * (0.28 + rand() * 0.48)
    const radius = size * (0.035 + rand() * 0.09)
    drawEllipticalPuff(ctx, x, y, radius * 1.35, radius, 0.42)
  }
  ctx.globalCompositeOperation = 'source-over'
}

function addBakedLighting(ctx: CanvasRenderingContext2D, size: number, side: Side, seed: number) {
  const rand = seeded(seed + 1009)

  ctx.globalCompositeOperation = 'source-atop'

  const shade = ctx.createLinearGradient(0, size * 0.1, size, size)
  shade.addColorStop(0, 'rgba(255,220,255,0.98)')
  shade.addColorStop(0.18, 'rgba(205,154,226,0.94)')
  shade.addColorStop(0.42, 'rgba(90,56,130,0.96)')
  shade.addColorStop(0.7, 'rgba(22,18,58,0.98)')
  shade.addColorStop(1, 'rgba(3,4,18,1)')
  ctx.fillStyle = shade
  ctx.fillRect(0, 0, size, size)

  const upperGlow = ctx.createRadialGradient(
    side < 0 ? size * 0.78 : size * 0.22,
    size * 0.16,
    0,
    side < 0 ? size * 0.7 : size * 0.3,
    size * 0.24,
    size * 0.56
  )
  upperGlow.addColorStop(0, 'rgba(255,184,126,0.8)')
  upperGlow.addColorStop(0.26, 'rgba(255,88,205,0.46)')
  upperGlow.addColorStop(0.58, 'rgba(92,92,190,0.18)')
  upperGlow.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = upperGlow
  ctx.fillRect(0, 0, size, size)

  const lowerShadow = ctx.createLinearGradient(0, size * 0.42, 0, size)
  lowerShadow.addColorStop(0, 'rgba(0,0,0,0)')
  lowerShadow.addColorStop(0.55, 'rgba(8,6,34,0.42)')
  lowerShadow.addColorStop(1, 'rgba(0,0,10,0.86)')
  ctx.fillStyle = lowerShadow
  ctx.fillRect(0, 0, size, size)

  for (let i = 0; i < 26; i += 1) {
    const x = size * (0.18 + rand() * 0.64)
    const y = size * (0.2 + rand() * 0.6)
    const radius = size * (0.035 + rand() * 0.12)
    const isLight = rand() > 0.52
    const pocket = ctx.createRadialGradient(x, y, 0, x, y, radius)
    pocket.addColorStop(0, isLight ? 'rgba(255,232,255,0.2)' : 'rgba(0,0,24,0.48)')
    pocket.addColorStop(0.58, isLight ? 'rgba(255,118,220,0.08)' : 'rgba(20,8,42,0.18)')
    pocket.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = pocket
    ctx.fillRect(0, 0, size, size)
  }

  ctx.globalCompositeOperation = 'source-over'
}

function softenAlpha(ctx: CanvasRenderingContext2D, size: number) {
  const image = ctx.getImageData(0, 0, size, size)
  const data = image.data

  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3]
    if (alpha < 3) continue

    const softness = alpha / 255
    data[i] = clamp(data[i] * (0.82 + softness * 0.2), 0, 255)
    data[i + 1] = clamp(data[i + 1] * (0.72 + softness * 0.16), 0, 255)
    data[i + 2] = clamp(data[i + 2] * (0.98 + softness * 0.12), 0, 255)
    data[i + 3] = clamp(Math.pow(alpha / 255, 0.92) * 255, 0, 255)
  }

  ctx.putImageData(image, 0, 0)
}

function makeCloudTexture(side: Side, seed: number, kind: CloudMass['kind']) {
  const size = kind === 'primary' ? 768 : 512
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!

  ctx.clearRect(0, 0, size, size)
  drawCloudSilhouette(ctx, size, side, seed)
  addBakedLighting(ctx, size, side, seed)

  if (kind === 'veil') {
    ctx.globalCompositeOperation = 'destination-in'
    const veil = ctx.createRadialGradient(
      size * 0.5,
      size * 0.55,
      0,
      size * 0.5,
      size * 0.55,
      size * 0.48
    )
    veil.addColorStop(0, 'rgba(255,255,255,0.42)')
    veil.addColorStop(0.48, 'rgba(255,255,255,0.24)')
    veil.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = veil
    ctx.fillRect(0, 0, size, size)
    ctx.globalCompositeOperation = 'source-over'
  }

  ctx.filter = kind === 'primary' ? 'blur(0.8px)' : 'blur(1.2px)'
  ctx.drawImage(canvas, 0, 0)
  ctx.filter = 'none'
  softenAlpha(ctx, size)

  return makeTexture(canvas)
}

function makeRimTexture(side: Side, seed: number) {
  const size = 512
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!

  drawCloudSilhouette(ctx, size, side, seed)
  ctx.globalCompositeOperation = 'source-in'

  const rim = ctx.createLinearGradient(
    side < 0 ? size : 0,
    size * 0.1,
    side < 0 ? 0 : size,
    size * 0.76
  )
  rim.addColorStop(0, 'rgba(255,220,176,0.96)')
  rim.addColorStop(0.16, 'rgba(255,94,196,0.58)')
  rim.addColorStop(0.38, 'rgba(120,112,255,0.22)')
  rim.addColorStop(0.72, 'rgba(0,0,0,0.02)')
  rim.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = rim
  ctx.fillRect(0, 0, size, size)
  ctx.globalCompositeOperation = 'source-over'
  ctx.filter = 'blur(1.6px)'
  ctx.drawImage(canvas, 0, 0)
  ctx.filter = 'none'

  return makeTexture(canvas)
}

function makeGroundFogTexture(seed: number) {
  const rand = seeded(seed)
  const size = 512
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!

  ctx.clearRect(0, 0, size, size)

  for (let i = 0; i < 9; i += 1) {
    const x = size * (0.16 + rand() * 0.68)
    const y = size * (0.42 + rand() * 0.18)
    const rx = size * (0.22 + rand() * 0.24)
    const ry = size * (0.09 + rand() * 0.08)
    drawEllipticalPuff(ctx, x, y, rx, ry, 0.22)
  }

  ctx.globalCompositeOperation = 'source-atop'
  const color = ctx.createLinearGradient(0, 0, size, size)
  color.addColorStop(0, 'rgba(255,112,210,0.26)')
  color.addColorStop(0.46, 'rgba(94,72,188,0.2)')
  color.addColorStop(1, 'rgba(6,4,22,0.02)')
  ctx.fillStyle = color
  ctx.fillRect(0, 0, size, size)
  ctx.globalCompositeOperation = 'source-over'
  ctx.filter = 'blur(3px)'
  ctx.drawImage(canvas, 0, 0)
  ctx.filter = 'none'

  return makeTexture(canvas)
}

export default function CloudCluster() {
  const { bodyTextures, rimTextures, groundFogTextures } = useMemo(() => {
    const masses = [...VEIL_MASSES, ...PRIMARY_MASSES, ...DETAIL_MASSES]

    return {
      bodyTextures: masses.map(mass => makeCloudTexture(mass.side, mass.seed, mass.kind)),
      rimTextures: masses.map(mass => makeRimTexture(mass.side, mass.seed + 17)),
      groundFogTextures: GROUND_FOG.map(fog => makeGroundFogTexture(fog.seed)),
    }
  }, [])

  const masses = [...VEIL_MASSES, ...PRIMARY_MASSES, ...DETAIL_MASSES].sort((a, b) => a.z - b.z)

  return (
    <group>
      <pointLight position={[-26, 17, -9]} color={0xff7a54} intensity={0.8} distance={34} />
      <pointLight position={[26, 17, -9]} color={0xff67c8} intensity={0.9} distance={36} />
      <pointLight position={[0, 5, -26]} color={0x5030ff} intensity={0.34} distance={42} />

      {GROUND_FOG.map((fog, index) => (
        <mesh
          key={`ground-fog-${fog.seed}`}
          position={[fog.x, 0.09, fog.z]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[fog.sx, fog.sz]} />
          <meshBasicMaterial
            map={groundFogTextures[index]}
            transparent
            opacity={fog.opacity}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ))}

      {masses.map((mass, sortedIndex) => {
        const textureIndex = [...VEIL_MASSES, ...PRIMARY_MASSES, ...DETAIL_MASSES].findIndex(
          item => item.seed === mass.seed
        )
        const rimPush = mass.side < 0 ? 0.42 : -0.42
        const isVeil = mass.kind === 'veil'

        return (
          <group key={`${mass.kind}-${mass.seed}`}>
            <sprite position={[mass.x, mass.y, mass.z]} scale={[mass.sx, mass.sy, 1]}>
              <spriteMaterial
                map={bodyTextures[textureIndex]}
                color={
                  isVeil ? new THREE.Color(0.76, 0.46, 1.04) : new THREE.Color(1.04, 0.74, 1.16)
                }
                transparent
                opacity={mass.opacity}
                alphaTest={0.035}
                blending={THREE.NormalBlending}
                depthWrite={false}
                depthTest={sortedIndex > 1}
                toneMapped={false}
              />
            </sprite>
            <sprite
              position={[mass.x + rimPush, mass.y + mass.sy * 0.025, mass.z + 0.04]}
              scale={[mass.sx * 1.04, mass.sy * 1.03, 1]}
            >
              <spriteMaterial
                map={rimTextures[textureIndex]}
                color={new THREE.Color(1.62, 0.74, 1.28)}
                transparent
                opacity={mass.opacity * (isVeil ? 0.1 : 0.28)}
                alphaTest={0.02}
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
