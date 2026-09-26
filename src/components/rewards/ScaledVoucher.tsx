"use client"

import { useLayoutEffect, useRef, useState, type ReactNode } from "react"
import { VOUCHER_HEIGHT, VOUCHER_WIDTH } from "./VoucherCard"

/**
 * Scales the whole 794x559 voucher down to the available width instead of
 * reflowing it, so a phone shows the same printed card, just smaller.
 */
export function ScaledVoucher({ children }: { children: ReactNode }) {
  const frame = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useLayoutEffect(() => {
    const node = frame.current
    if (!node) return
    const update = () => setScale(Math.min(1, node.clientWidth / VOUCHER_WIDTH))
    update()
    const observer = new ResizeObserver(update)
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={frame} style={{ width: "100%", height: VOUCHER_HEIGHT * scale, position: "relative" }}>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: VOUCHER_WIDTH,
          height: VOUCHER_HEIGHT,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        {children}
      </div>
    </div>
  )
}
