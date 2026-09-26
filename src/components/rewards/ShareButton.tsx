"use client"

import { useEffect, useRef, useState } from "react"
import { dayKey } from "@/lib/streak"
import type { VoucherContents, VoucherPublic } from "@/lib/vouchers"
import { VOUCHER_HEIGHT, VOUCHER_WIDTH, VoucherCard } from "./VoucherCard"

/**
 * Renders the voucher to a PNG at 2x and hands it to the native share sheet
 * where that exists, so it can go straight to WhatsApp. Everything else falls
 * back to a download. The contents are already in the page for a voucher she
 * has revealed, so the click does not wait on the network before sharing.
 */
export function ShareButton({
  voucher,
  contents,
  onDone,
}: {
  voucher: VoucherPublic
  contents: VoucherContents
  onDone: (message: string) => void
}) {
  const [busy, setBusy] = useState(false)
  const [capturing, setCapturing] = useState(false)
  const stage = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!capturing) return
    let cancelled = false

    async function run() {
      const node = stage.current
      if (!node) return
      try {
        // Let the clone lay out, and make sure the serif face is in before we
        // rasterise or the capture falls back to Georgia.
        await new Promise((resolve) => requestAnimationFrame(() => resolve(null)))
        await document.fonts.ready
        const { toPng } = await import("html-to-image")
        const dataUrl = await toPng(node, {
          pixelRatio: 2,
          width: VOUCHER_WIDTH,
          height: VOUCHER_HEIGHT,
          backgroundColor: "#fbf7f5",
          cacheBust: true,
        })
        if (cancelled) return

        const blob = await (await fetch(dataUrl)).blob()
        const file = new File([blob], `tanya-voucher-${voucher.number}.png`, { type: "image/png" })

        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], title: `Voucher No. ${voucher.number}` })
          onDone("Sent. Now go collect it.")
        } else {
          const link = document.createElement("a")
          link.href = dataUrl
          link.download = file.name
          link.click()
          onDone("Saved. Send it to Chinku.")
        }
      } catch (error) {
        // A cancelled share sheet is not a failure worth shouting about.
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          onDone("That image did not save. Try again.")
        }
      } finally {
        if (!cancelled) {
          setCapturing(false)
          setBusy(false)
        }
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [capturing, onDone, voucher.number])

  return (
    <>
      <button
        type="button"
        disabled={busy}
        onClick={() => {
          setBusy(true)
          setCapturing(true)
        }}
        className="min-h-11 border border-line px-4 text-sm font-medium hover:border-accent hover:text-accent disabled:opacity-50"
      >
        {busy ? "Preparing…" : "Share with Chinku"}
      </button>

      {capturing ? (
        <div
          aria-hidden="true"
          style={{
            position: "fixed",
            top: 0,
            left: -100000,
            width: VOUCHER_WIDTH,
            height: VOUCHER_HEIGHT,
            pointerEvents: "none",
          }}
        >
          <div ref={stage}>
            <VoucherCard
              contents={contents}
              wish={voucher.wish}
              claimedOn={voucher.claimedAt ? dayKey(voucher.claimedAt) : null}
            />
          </div>
        </div>
      ) : null}
    </>
  )
}
