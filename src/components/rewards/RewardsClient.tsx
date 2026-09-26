"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useState } from "react"
import { dayKey, formatDayKey } from "@/lib/streak"
import {
  statusLabel,
  type LadderItem,
  type VoucherContents,
  type VoucherStatus,
} from "@/lib/vouchers"
import { redeemVoucher } from "@/server/reward-actions"
import { ScaledVoucher } from "./ScaledVoucher"
import { ShareButton } from "./ShareButton"
import { VoucherCard } from "./VoucherCard"
import { VoucherDialog } from "./VoucherDialog"

export function RewardsClient({
  earned,
  upcoming,
  opened,
  currentStreak,
  admin,
}: {
  earned: LadderItem[]
  upcoming: LadderItem[]
  /** Copy for the vouchers she has already scratched open. */
  opened: Record<number, VoucherContents>
  currentStreak: number
  admin: boolean
}) {
  const [openMilestone, setOpenMilestone] = useState<number | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const open = earned.find((item) => item.milestone === openMilestone) ?? null

  const showToast = useCallback((message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(null), 4000)
  }, [])

  return (
    <div className="min-h-dvh">
      <header className="border-b border-line bg-gradient-to-b from-surface to-background">
        <div className="mx-auto max-w-3xl px-4 py-6">
          <Link href="/" className="text-sm text-muted hover:text-foreground">
            ← Home
          </Link>
          <p className="mt-4 text-xs uppercase tracking-[0.18em] text-muted">Regularity rewards</p>
          <h1 className="mt-1 font-serif text-3xl font-semibold tracking-tight">Your vouchers</h1>
          <p className="mt-2 text-sm text-muted">
            One voucher per milestone. Once it is yours, a broken streak never takes it back.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <section aria-labelledby="earned-heading">
          <h2 id="earned-heading" className="text-xs uppercase tracking-[0.18em] text-muted">
            Earned
          </h2>
          {earned.length === 0 ? (
            <p className="mt-3 text-sm text-muted">
              Nothing yet. The first one arrives at a five-day streak.
            </p>
          ) : (
            <ul className="mt-4 space-y-6">
              {earned.map((item) => (
                <li key={item.milestone}>
                  <EarnedCard
                    item={item}
                    contents={opened[item.milestone]}
                    admin={admin}
                    onOpen={() => setOpenMilestone(item.milestone)}
                    onToast={showToast}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="upcoming-heading" className="mt-12">
          <h2 id="upcoming-heading" className="text-xs uppercase tracking-[0.18em] text-muted">
            Coming up
          </h2>
          {upcoming.length === 0 ? (
            <p className="mt-3 text-sm text-muted">Every single one is yours. Fifty days.</p>
          ) : (
            <ul className="mt-4 divide-y divide-line rounded-2xl border border-line bg-surface">
              {upcoming.map((item) => (
                <li key={item.milestone} className="flex items-center justify-between gap-4 px-4 py-3">
                  <div className="flex items-baseline gap-3">
                    <span className="font-serif text-2xl font-semibold leading-none">
                      {item.milestone}
                    </span>
                    <span className="text-xs uppercase tracking-[0.14em] text-muted">
                      days · No. {item.number}
                    </span>
                  </div>
                  <div className="text-right text-sm text-muted">
                    {item.projectedDayKey ? (
                      <>
                        <p>
                          Unlocks in {item.unlocksInDays}{" "}
                          {item.unlocksInDays === 1 ? "day" : "days"}
                        </p>
                        <p className="text-xs">{formatDayKey(item.projectedDayKey)}</p>
                      </>
                    ) : (
                      <p>{currentStreak === 0 ? "Start a streak to begin" : "Keep the streak going"}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      {open ? <VoucherDialog voucher={open} onClose={() => setOpenMilestone(null)} /> : null}

      {toast ? (
        <div
          role="status"
          className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-sm rounded-xl border border-line bg-surface px-4 py-3 text-center text-sm shadow-lg"
        >
          {toast}
        </div>
      ) : null}
    </div>
  )
}

function EarnedCard({
  item,
  contents,
  admin,
  onOpen,
  onToast,
}: {
  item: LadderItem
  contents: VoucherContents | undefined
  admin: boolean
  onOpen: () => void
  onToast: (message: string) => void
}) {
  const router = useRouter()
  const [redeeming, setRedeeming] = useState(false)

  async function markRedeemed() {
    setRedeeming(true)
    try {
      await redeemVoucher(item.milestone)
      router.refresh()
    } catch {
      onToast("Sign in at /admin first.")
    } finally {
      setRedeeming(false)
    }
  }

  return (
    <article className="rounded-2xl border border-line bg-surface p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted">
            No. {item.number} · {item.milestone} days
          </p>
          <StatusBadge status={item.status} />
        </div>
        <VoucherDates item={item} />
      </div>

      <div className="mt-4">
        {contents ? (
          <ScaledVoucher>
            <VoucherCard
              contents={contents}
              wish={item.wish}
              claimedOn={item.claimedAt ? dayKey(item.claimedAt) : null}
            />
          </ScaledVoucher>
        ) : (
          <button
            type="button"
            onClick={onOpen}
            className="flex min-h-[9rem] w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-accent bg-[var(--heat-0)] p-6 text-center"
          >
            <span className="font-serif text-xl font-semibold text-accent">Scratch to reveal</span>
            <span className="text-sm text-muted">No. {item.number} is waiting</span>
          </button>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
        {admin && item.status === "claimed" ? (
          <button
            type="button"
            onClick={markRedeemed}
            disabled={redeeming}
            className="min-h-11 border border-line px-4 text-sm text-muted hover:border-accent hover:text-accent disabled:opacity-50"
          >
            {redeeming ? "Marking…" : "Mark redeemed"}
          </button>
        ) : null}
        {contents ? (
          <>
            {item.status === "revealed" ? (
              <button
                type="button"
                onClick={onOpen}
                className="min-h-11 bg-accent px-5 text-sm font-semibold text-white hover:bg-accent-hover"
              >
                Claim
              </button>
            ) : null}
            <ShareButton voucher={item} contents={contents} onDone={onToast} />
          </>
        ) : null}
      </div>
    </article>
  )
}

function StatusBadge({ status }: { status: VoucherStatus }) {
  const tone =
    status === "ready"
      ? "border-accent text-accent"
      : status === "redeemed"
        ? "border-line text-muted"
        : "border-line text-foreground"
  return (
    <span
      className={`mt-2 inline-block rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-wide ${tone}`}
    >
      {statusLabel(status)}
    </span>
  )
}

function VoucherDates({ item }: { item: LadderItem }) {
  const rows: Array<[string, number | null]> = [
    ["Earned", item.earnedAt],
    ["Claimed", item.claimedAt],
    ["Redeemed", item.redeemedAt],
  ]
  return (
    <dl className="text-right text-xs text-muted">
      {rows.map(([label, at]) =>
        at ? (
          <div key={label} className="flex justify-end gap-2">
            <dt className="uppercase tracking-wide">{label}</dt>
            <dd>{formatDayKey(dayKey(at))}</dd>
          </div>
        ) : null,
      )}
    </dl>
  )
}
