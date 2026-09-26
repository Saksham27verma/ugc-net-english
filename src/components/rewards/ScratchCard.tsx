"use client"

import { useCallback, useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react"

const BRUSH_RADIUS = 14
const SAMPLE_EVERY = 10
const CLEARED_THRESHOLD = 0.55
const FADE_MS = 420

/**
 * A pink foil overlay on top of whatever it wraps. Scratching cuts holes in
 * the canvas with destination-out; once 55% of it is gone the rest fades and
 * onComplete fires. Pointer events cover mouse and touch alike.
 */
export function ScratchCard({
  caption,
  onComplete,
  children,
}: {
  caption: string
  onComplete: () => void
  children: ReactNode
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const lastPoint = useRef<{ x: number; y: number } | null>(null)
  const moves = useRef(0)
  const finished = useRef(false)
  const [fading, setFading] = useState(false)
  const [gone, setGone] = useState(false)

  const paintFoil = useCallback(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap || finished.current) return
    const width = wrap.clientWidth
    const height = wrap.clientHeight
    if (width === 0 || height === 0) return

    const ratio = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = Math.round(width * ratio)
    canvas.height = Math.round(height * ratio)
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
    ctx.globalCompositeOperation = "source-over"
    ctx.clearRect(0, 0, width, height)

    const foil = ctx.createLinearGradient(0, 0, width, height)
    foil.addColorStop(0, "#e7b9cd")
    foil.addColorStop(0.35, "#f5e3ea")
    foil.addColorStop(0.62, "#deaac3")
    foil.addColorStop(1, "#efd2df")
    ctx.fillStyle = foil
    ctx.fillRect(0, 0, width, height)

    // Speckle, so the foil reads as foil rather than a flat pink rectangle.
    for (let i = 0; i < Math.round((width * height) / 240); i += 1) {
      const x = Math.random() * width
      const y = Math.random() * height
      const alpha = 0.04 + Math.random() * 0.12
      ctx.fillStyle = Math.random() > 0.5 ? `rgba(255,255,255,${alpha})` : `rgba(143,53,92,${alpha})`
      ctx.fillRect(x, y, 1.4, 1.4)
    }

    ctx.strokeStyle = "rgba(143,53,92,0.35)"
    ctx.setLineDash([6, 6])
    ctx.lineWidth = 1.5
    ctx.strokeRect(10, 10, width - 20, height - 20)
    ctx.setLineDash([])

    const size = Math.max(13, Math.min(20, width / 26))
    ctx.fillStyle = "rgba(143,53,92,0.62)"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.font = `600 ${size}px var(--font-ui), system-ui, sans-serif`
    ctx.letterSpacing = "0.18em"
    ctx.fillText(caption.toUpperCase(), width / 2, height / 2)
  }, [caption])

  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    paintFoil()
    const observer = new ResizeObserver(() => paintFoil())
    observer.observe(wrap)
    return () => observer.disconnect()
  }, [paintFoil])

  const finish = useCallback(() => {
    if (finished.current) return
    finished.current = true
    setFading(true)
    window.setTimeout(() => setGone(true), FADE_MS)
    onComplete()
  }, [onComplete])

  /** Reads the alpha channel on a coarse grid; a full read every stroke is wasteful. */
  const measureCleared = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d", { willReadFrequently: true })
    if (!canvas || !ctx) return
    const { width, height } = canvas
    const image = ctx.getImageData(0, 0, width, height).data
    const step = 8
    let total = 0
    let cleared = 0
    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        total += 1
        if (image[(y * width + x) * 4 + 3] < 24) cleared += 1
      }
    }
    if (total > 0 && cleared / total >= CLEARED_THRESHOLD) finish()
  }, [finish])

  function pointAt(event: PointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    return { x: event.clientX - rect.left, y: event.clientY - rect.top }
  }

  function scratchTo(x: number, y: number) {
    const ctx = canvasRef.current?.getContext("2d")
    if (!ctx) return
    ctx.globalCompositeOperation = "destination-out"
    ctx.lineWidth = BRUSH_RADIUS * 2
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    const from = lastPoint.current
    ctx.beginPath()
    if (from) {
      ctx.moveTo(from.x, from.y)
      ctx.lineTo(x, y)
      ctx.stroke()
    }
    ctx.beginPath()
    ctx.arc(x, y, BRUSH_RADIUS, 0, Math.PI * 2)
    ctx.fill()
    lastPoint.current = { x, y }
  }

  function onPointerDown(event: PointerEvent<HTMLCanvasElement>) {
    if (finished.current) return
    event.currentTarget.setPointerCapture(event.pointerId)
    lastPoint.current = null
    const { x, y } = pointAt(event)
    scratchTo(x, y)
  }

  function onPointerMove(event: PointerEvent<HTMLCanvasElement>) {
    if (finished.current) return
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return
    const { x, y } = pointAt(event)
    scratchTo(x, y)
    moves.current += 1
    if (moves.current % SAMPLE_EVERY === 0) measureCleared()
  }

  function onPointerUp(event: PointerEvent<HTMLCanvasElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    lastPoint.current = null
    if (!finished.current) measureCleared()
  }

  return (
    <div ref={wrapRef} className="relative">
      {children}
      {gone ? null : (
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="absolute inset-0 h-full w-full cursor-grab rounded-xl transition-opacity"
          style={{
            touchAction: "none",
            opacity: fading ? 0 : 1,
            transitionDuration: `${FADE_MS}ms`,
          }}
        />
      )}
    </div>
  )
}
