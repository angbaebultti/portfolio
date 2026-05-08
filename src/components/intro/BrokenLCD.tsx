import { useEffect, useRef } from 'react'

interface Props {
  onComplete: () => void
}

interface CoverRect {
  sx: number
  sy: number
  sw: number
  sh: number
  dx: number
  dy: number
  dw: number
  dh: number
}

const BASE_IMAGE_URL = '/broken-lcd-reference.png'

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)
const randomRange = (min: number, max: number) => min + Math.random() * (max - min)

function getCoverRect(img: HTMLImageElement, width: number, height: number): CoverRect {
  const imageRatio = img.naturalWidth / img.naturalHeight
  const canvasRatio = width / height

  if (imageRatio > canvasRatio) {
    const sh = img.naturalHeight
    const sw = sh * canvasRatio
    return {
      sx: (img.naturalWidth - sw) / 2,
      sy: 0,
      sw,
      sh,
      dx: 0,
      dy: 0,
      dw: width,
      dh: height,
    }
  }

  const sw = img.naturalWidth
  const sh = sw / canvasRatio
  return {
    sx: 0,
    sy: (img.naturalHeight - sh) / 2,
    sw,
    sh,
    dx: 0,
    dy: 0,
    dw: width,
    dh: height,
  }
}

function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, rect: CoverRect) {
  ctx.drawImage(img, rect.sx, rect.sy, rect.sw, rect.sh, rect.dx, rect.dy, rect.dw, rect.dh)
}

function drawBlueScreen(ctx: CanvasRenderingContext2D, width: number, height: number, collapse: number) {
  const gradient = ctx.createLinearGradient(0, 0, 0, height)
  gradient.addColorStop(0, `rgb(${Math.floor(4 + collapse * 8)}, ${Math.floor(28 + collapse * 8)}, 76)`)
  gradient.addColorStop(1, `rgb(${Math.floor(1 + collapse * 5)}, ${Math.floor(9 + collapse * 4)}, 28)`)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)

  ctx.fillStyle = `rgba(180,220,255,${0.08 * (1 - collapse)})`
  for (let y = 0; y < height; y += 4) {
    ctx.fillRect(0, y, width, 1)
  }
}

function displaceScanlines(
  target: CanvasRenderingContext2D,
  source: HTMLCanvasElement,
  width: number,
  height: number,
  intensity: number,
  dpr: number,
) {
  const rows = Math.floor(18 + intensity * 96)

  for (let i = 0; i < rows; i++) {
    const y = randomRange(0, height)
    const h = randomRange(1, Math.random() > 0.82 ? 36 : 8) * dpr
    const shift = randomRange(-52, 52) * intensity * dpr
    const vertical = randomRange(-4, 8) * intensity * dpr
    const alpha = randomRange(0.18, 0.82) * intensity

    target.globalAlpha = alpha
    target.drawImage(source, 0, y, width, h, shift, y + vertical, width, h)
  }

  target.globalAlpha = 1
}

function stretchVerticalMemory(
  target: CanvasRenderingContext2D,
  source: HTMLCanvasElement,
  width: number,
  height: number,
  intensity: number,
  dpr: number,
) {
  const columns = Math.floor(24 + intensity * 120)

  for (let i = 0; i < columns; i++) {
    const x = randomRange(width * 0.04, width * 0.96)
    const w = randomRange(1, Math.random() > 0.86 ? 8 : 3) * dpr
    const y = randomRange(0, height * 0.72)
    const h = randomRange(height * 0.08, height * 0.42)
    const stretch = randomRange(12, height * 0.38) * intensity

    target.globalAlpha = randomRange(0.08, 0.46) * intensity
    target.drawImage(source, x, y, w, h, x + randomRange(-2, 2) * dpr, y, w, h + stretch)
  }

  target.globalAlpha = 1
}

function corruptImageData(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  intensity: number,
  elapsed: number,
) {
  if (intensity < 0.18 || Math.floor(elapsed / 48) % 3 !== 0) return

  const sampleW = Math.max(80, Math.floor(width * randomRange(0.14, 0.36)))
  const sampleH = Math.max(28, Math.floor(height * randomRange(0.05, 0.16)))
  const x = Math.floor(randomRange(0, width - sampleW))
  const y = Math.floor(randomRange(0, height - sampleH))
  const image = ctx.getImageData(x, y, sampleW, sampleH)
  const data = image.data

  for (let i = 0; i < data.length; i += 4) {
    const luminance = (data[i] + data[i + 1] + data[i + 2]) / 3
    const crushed = luminance > 134 ? 255 : luminance < 42 ? 0 : luminance * randomRange(0.28, 1.4)
    const drift = Math.random() > 0.96 ? randomRange(42, 255) : crushed

    data[i] = clamp(drift + randomRange(-26, 18) * intensity, 0, 255)
    data[i + 1] = clamp(crushed + randomRange(-10, 22) * intensity, 0, 255)
    data[i + 2] = clamp(crushed + randomRange(-4, 34) * intensity, 0, 255)
  }

  ctx.putImageData(image, x + Math.floor(randomRange(-18, 18) * intensity), y)
}

function addDecodeBlocks(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  intensity: number,
  dpr: number,
) {
  const blocks = Math.floor(10 + intensity * 58)

  for (let i = 0; i < blocks; i++) {
    const w = randomRange(12, Math.random() > 0.76 ? width * 0.28 : 110) * dpr
    const h = randomRange(1, Math.random() > 0.78 ? 42 : 9) * dpr
    const x = randomRange(0, width - w)
    const y = randomRange(0, height - h)
    const white = Math.random() > 0.68
    const tone = white ? randomRange(160, 255) : randomRange(0, 34)

    ctx.fillStyle = `rgba(${tone},${tone},${tone},${randomRange(0.04, 0.24) * intensity})`
    ctx.fillRect(x, y, w, h)
  }
}

export default function BrokenLCD({ onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let raf = 0
    let completed = false
    let disposed = false
    const img = new Image()
    img.src = BASE_IMAGE_URL

    const startRender = () => {
      if (disposed) return

      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const cssW = window.innerWidth
      const cssH = window.innerHeight
      const width = Math.floor(cssW * dpr)
      const height = Math.floor(cssH * dpr)

      canvas.width = width
      canvas.height = height
      canvas.style.width = `${cssW}px`
      canvas.style.height = `${cssH}px`

      const ctx = canvas.getContext('2d', { alpha: false })
      if (!ctx) return

      const base = document.createElement('canvas')
      base.width = width
      base.height = height
      const bctx = base.getContext('2d', { alpha: false })!

      const frame = document.createElement('canvas')
      frame.width = width
      frame.height = height
      const fctx = frame.getContext('2d', { alpha: false })!

      const memory = document.createElement('canvas')
      memory.width = width
      memory.height = height
      const mctx = memory.getContext('2d', { alpha: false })!

      const scratch = document.createElement('canvas')
      scratch.width = width
      scratch.height = height
      const sctx = scratch.getContext('2d', { alpha: false })!

      const cover = getCoverRect(img, width, height)
      drawCover(bctx, img, cover)

      mctx.fillStyle = '#001a50'
      mctx.fillRect(0, 0, width, height)

      const start = performance.now()
      const total = 3350
      const imageStart = 520
      const collapseStart = 920
      const voidStart = 2660

      const render = (now: number) => {
        const elapsed = now - start
        const t = clamp(elapsed / total, 0, 1)
        const signal = clamp((elapsed - imageStart) / 760, 0, 1)
        const collapse = clamp((elapsed - collapseStart) / 1160, 0, 1)
        const voidFade = clamp((elapsed - voidStart) / (total - voidStart), 0, 1)
        const instability = clamp(signal * 0.42 + collapse * 0.76, 0, 1)
        const skipFrame = collapse > 0.28 && Math.floor(elapsed / 92) % 5 === 0

        if (!skipFrame) {
          fctx.globalCompositeOperation = 'source-over'
          drawBlueScreen(fctx, width, height, signal)

          fctx.globalAlpha = signal * 0.94
          fctx.drawImage(base, 0, 0)
          fctx.globalAlpha = 1

          fctx.globalAlpha = 0.26 + collapse * 0.42
          fctx.drawImage(memory, randomRange(-4, 4) * dpr * instability, randomRange(1, 12) * dpr * instability)
          fctx.globalAlpha = 1

          sctx.globalCompositeOperation = 'source-over'
          sctx.drawImage(frame, 0, 0)

          displaceScanlines(fctx, scratch, width, height, instability, dpr)
          stretchVerticalMemory(fctx, scratch, width, height, collapse, dpr)
          addDecodeBlocks(fctx, width, height, instability, dpr)
          corruptImageData(fctx, width, height, collapse, elapsed)
        }

        mctx.globalCompositeOperation = 'source-over'
        mctx.globalAlpha = 0.82
        mctx.drawImage(frame, 0, randomRange(1, 8) * dpr * (0.4 + collapse))
        mctx.globalAlpha = 0.18 + collapse * 0.16
        mctx.drawImage(frame, randomRange(-6, 6) * dpr * instability, 0)
        mctx.globalAlpha = 1

        ctx.globalCompositeOperation = 'source-over'
        ctx.fillStyle = '#000'
        ctx.fillRect(0, 0, width, height)
        ctx.drawImage(frame, 0, 0)

        ctx.save()
        ctx.globalCompositeOperation = 'lighter'
        ctx.globalAlpha = 0.1 * instability
        ctx.drawImage(frame, 1.5 * dpr, 0)
        ctx.globalAlpha = 0.07 * instability
        ctx.drawImage(frame, -2 * dpr, 0)
        ctx.restore()

        for (let y = 0; y < height; y += Math.max(2, Math.floor(3 * dpr))) {
          ctx.fillStyle = y % 12 === 0 ? 'rgba(255,255,255,0.028)' : 'rgba(0,0,0,0.12)'
          ctx.fillRect(0, y, width, Math.max(1, dpr))
        }

        const vignette = ctx.createRadialGradient(width * 0.5, height * 0.48, height * 0.1, width * 0.5, height * 0.5, height * 0.82)
        vignette.addColorStop(0, 'rgba(0,0,0,0)')
        vignette.addColorStop(0.58, 'rgba(0,0,0,0.16)')
        vignette.addColorStop(1, 'rgba(0,0,0,0.9)')
        ctx.fillStyle = vignette
        ctx.fillRect(0, 0, width, height)

        if (voidFade > 0) {
          ctx.fillStyle = `rgba(0,0,0,${voidFade})`
          ctx.fillRect(0, 0, width, height)
        }

        if (t < 1) {
          raf = requestAnimationFrame(render)
        } else if (!completed) {
          completed = true
          onCompleteRef.current()
        }
      }

      raf = requestAnimationFrame(render)
    }

    img.onload = startRender
    img.onerror = () => {
      const ctx = canvas.getContext('2d', { alpha: false })
      if (ctx) {
        ctx.fillStyle = '#000'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }
      window.setTimeout(() => onCompleteRef.current(), 3350)
    }

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        display: 'block',
        background: '#000',
        zIndex: 90,
      }}
    />
  )
}
