import { useEffect, useRef } from 'react'

interface Props {
  onComplete: () => void
}

export default function BrokenLCD({ onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  useEffect(() => {
    const canvas = canvasRef.current!
    const W = window.innerWidth
    const H = window.innerHeight
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext('2d')!

    const DURATION = 1800
    const BLOCK = 3      // 3×3px 블록 단위로 노이즈 그림
    const DENSITY = 0.30 // 30% 밀도 — 숨통 트이게
    const BG = 0xff0a0a0a
    const startTime = performance.now()
    let raf: number
    let completed = false

    const imageData = ctx.createImageData(W, H)
    const data32 = new Uint32Array(imageData.data.buffer)
    const rowBuf = new Uint32Array(W)

    const draw = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / DURATION, 1)

      // 어두운 배경으로 초기화
      data32.fill(BG)

      // 3×3 블록 단위 그레이 노이즈 (80~190 범위, 어두운 톤 주체)
      for (let by = 0; by < H; by += BLOCK) {
        for (let bx = 0; bx < W; bx += BLOCK) {
          if (Math.random() >= DENSITY) continue
          const gray = 80 + Math.floor(Math.random() * 110)
          const color = 0xff000000 | (gray << 16) | (gray << 8) | gray
          const endY = Math.min(by + BLOCK, H)
          const endX = Math.min(bx + BLOCK, W)
          for (let y = by; y < endY; y++) {
            const row = y * W
            for (let x = bx; x < endX; x++) {
              data32[row + x] = color
            }
          }
        }
      }

      // 가로 줄 떨림 (horizontal scan glitch)
      const numBands = 3 + Math.floor(Math.random() * 6)
      for (let g = 0; g < numBands; g++) {
        if (Math.random() > 0.6) continue
        const bandTop = Math.floor(Math.random() * H)
        const bandH = 1 + Math.floor(Math.random() * Math.max(1, H * 0.05))
        const shift = Math.floor((Math.random() - 0.5) * W * 0.3)
        for (let row = bandTop; row < Math.min(bandTop + bandH, H); row++) {
          const rs = row * W
          rowBuf.set(data32.subarray(rs, rs + W))
          for (let x = 0; x < W; x++) {
            data32[rs + x] = rowBuf[((x - shift) % W + W) % W]
          }
        }
      }

      ctx.putImageData(imageData, 0, 0)

      // 마지막 20% 페이드 아웃
      if (progress > 0.8) {
        const alpha = (progress - 0.8) / 0.2
        ctx.fillStyle = `rgba(0,0,0,${alpha.toFixed(3)})`
        ctx.fillRect(0, 0, W, H)
      }

      if (progress < 1) {
        raf = requestAnimationFrame(draw)
      } else if (!completed) {
        completed = true
        onCompleteRef.current()
      }
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        display: 'block',
        zIndex: 90,
      }}
    />
  )
}
