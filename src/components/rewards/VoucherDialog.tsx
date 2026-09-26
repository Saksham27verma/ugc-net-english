"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { dayKey, formatDayKey } from "@/lib/streak"
import {
  WISH_MAX_LENGTH,
  WISH_MILESTONE,
  type VoucherContents,
  type VoucherPublic,
} from "@/lib/vouchers"
import { claimVoucher, openVoucher, revealVoucher } from "@/server/reward-actions"
import { ScaledVoucher } from "./ScaledVoucher"
import { ScratchCard } from "./ScratchCard"
import { VoucherCard } from "./VoucherCard"

async function celebrate() {
  const { default: confetti } = await import("canvas-confetti")
  void confetti({
    particleCount: 90,
    spread: 70,
    startVelocity: 38,
    origin: { y: 0.55 },
    colors: ["#8f355c", "#e9c7d3", "#f5e3ea", "#a63a6e"],
    disableForReducedMotion: true,
  })
}

export function VoucherDialog({
  voucher,
  onClose,
}: {
  voucher: VoucherPublic
  onClose: () => void
}) {
  const router = useRouter()
  const [contents, setContents] = useState<VoucherContents | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [revealed, setRevealed] = useState(voucher.status !== "ready")
  const [claimedAt, setClaimedAt] = useState<number | null>(voucher.claimedAt)
  const [wish, setWish] = useState(voucher.wish ?? "")
  const [claiming, setClaiming] = useState(false)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    let cancelled = false
    openVoucher(voucher.milestone)
      .then((loaded) => {
        if (!cancelled) setContents(loaded)
      })
      .catch(() => {
        if (!cancelled) setError("This voucher could not be opened.")
      })
    return () => {
      cancelled = true
    }
  }, [voucher.milestone])

  useEffect(() => {
    closeRef.current?.focus()
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [onClose])

  function handleRevealed() {
    setRevealed(true)
    void celebrate()
    void revealVoucher(voucher.milestone)
      .then(() => router.refresh())
      .catch(() => {
        // She has seen it either way; the next page load will catch up.
      })
  }

  async function handleClaim() {
    setClaiming(true)
    try {
      await claimVoucher(voucher.milestone, voucher.milestone === WISH_MILESTONE ? wish : null)
      setClaimedAt(Date.now())
      router.refresh()
    } catch {
      setError("That did not save. Try once more.")
    } finally {
      setClaiming(false)
    }
  }

  const wishNeeded = voucher.milestone === WISH_MILESTONE && wish.trim().length === 0
  const claimed = claimedAt !== null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-3 sm:items-center sm:p-6">
      <button
        type="button"
        className="fixed inset-0 bg-black/40"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Voucher number ${voucher.number}`}
        className="relative w-full max-w-3xl rounded-2xl border border-line bg-surface p-4 shadow-lg sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted">
              No. {voucher.number} · {voucher.milestone} days
            </p>
            <h2 className="mt-1 font-serif text-xl font-semibold">
              {revealed ? (claimed ? "Claimed" : "Yours") : "Scratch to reveal"}
            </h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="min-h-11 min-w-11 border border-line px-3 text-sm text-muted hover:text-foreground"
          >
            Close
          </button>
        </div>

        <div className="mt-4">
          {error ? (
            <p className="py-10 text-center text-sm text-red">{error}</p>
          ) : !contents ? (
            <p className="py-10 text-center text-sm text-muted">Opening…</p>
          ) : revealed ? (
            <ScaledVoucher>
              <VoucherCard
                contents={contents}
                wish={voucher.milestone === WISH_MILESTONE ? wish : null}
                claimedOn={claimedAt ? dayKey(claimedAt) : null}
              />
            </ScaledVoucher>
          ) : (
            <ScratchCard caption={`No. ${voucher.number} · Scratch me`} onComplete={handleRevealed}>
              <ScaledVoucher>
                <VoucherCard contents={contents} />
              </ScaledVoucher>
            </ScratchCard>
          )}
        </div>

        {contents && !revealed ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted">Drag across the foil with your finger.</p>
            <button
              type="button"
              onClick={handleRevealed}
              className="min-h-11 text-sm text-muted underline-offset-2 hover:text-foreground hover:underline"
            >
              Trouble scratching? Open it
            </button>
          </div>
        ) : null}

        {contents && revealed && !claimed ? (
          <div className="mt-5 flex flex-col gap-3">
            {voucher.milestone === WISH_MILESTONE ? (
              <label className="text-sm">
                <span className="text-xs uppercase tracking-[0.18em] text-muted">
                  I, Tanya, redeem this voucher for
                </span>
                <input
                  value={wish}
                  onChange={(event) => setWish(event.target.value)}
                  maxLength={WISH_MAX_LENGTH}
                  placeholder="Write it in your own words"
                  className="mt-1 min-h-11 w-full rounded-lg border border-line bg-background px-3 py-2 text-base"
                />
              </label>
            ) : null}
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleClaim}
                disabled={claiming || wishNeeded}
                className="min-h-11 bg-accent px-5 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
              >
                {claiming ? "Claiming…" : "Claim"}
              </button>
            </div>
          </div>
        ) : null}

        {claimed ? (
          <p className="mt-5 text-sm text-muted">
            Claimed on {formatDayKey(dayKey(claimedAt))}. Tell Chinku when you want it.
          </p>
        ) : null}
      </div>
    </div>
  )
}
