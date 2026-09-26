"use client"

import { useState } from "react"
import { VoucherDialog } from "@/components/rewards/VoucherDialog"
import { formatDayKey } from "@/lib/streak"
import { isEarned, statusLabel, type LadderItem } from "@/lib/vouchers"

/**
 * The always-visible ladder. Locked cards know the milestone and the voucher
 * number and nothing else — the copy behind them never reaches the browser
 * until the milestone has been earned.
 */
export function RewardLadder({ items }: { items: LadderItem[] }) {
  const [openMilestone, setOpenMilestone] = useState<number | null>(null)
  const open = items.find((item) => item.milestone === openMilestone) ?? null

  return (
    <section aria-labelledby="ladder-heading" className="mt-6">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="ladder-heading" className="text-xs uppercase tracking-[0.18em] text-muted">
          Streak rewards
        </h2>
        <p className="text-xs text-muted">One voucher per milestone · yours to keep once earned</p>
      </div>

      <div className="-mx-4 mt-3 overflow-x-auto px-4 pb-1">
        <ul className="flex min-w-fit gap-3">
          {items.map((item) => (
            <li key={item.milestone} className="shrink-0">
              <LadderCard item={item} onOpen={() => setOpenMilestone(item.milestone)} />
            </li>
          ))}
        </ul>
      </div>

      {open ? <VoucherDialog voucher={open} onClose={() => setOpenMilestone(null)} /> : null}
    </section>
  )
}

function LadderCard({ item, onOpen }: { item: LadderItem; onOpen: () => void }) {
  const earned = isEarned(item.status)
  const ready = item.status === "ready"

  const body = (
    <>
      <div className="flex items-baseline gap-1.5">
        <span className={`font-serif text-3xl font-semibold leading-none ${earned ? "text-accent" : ""}`}>
          {item.milestone}
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">days</span>
      </div>

      <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
        No. {item.number}
      </p>

      <div className="mt-3 text-sm">
        {earned ? (
          <p className={ready ? "font-semibold text-accent" : "text-muted"}>
            {ready ? "Scratch to reveal" : statusLabel(item.status)}
          </p>
        ) : item.projectedDayKey ? (
          <>
            <p className="text-muted">
              Unlocks in {item.unlocksInDays} {item.unlocksInDays === 1 ? "day" : "days"}
            </p>
            <p className="mt-0.5 text-xs text-muted">{formatDayKey(item.projectedDayKey)}</p>
          </>
        ) : (
          <p className="text-muted">Unlocks at a {item.milestone}-day streak</p>
        )}
      </div>
    </>
  )

  const shell = `flex h-full w-[10.5rem] flex-col rounded-2xl border p-4 text-left shadow-sm ${
    ready
      ? "border-accent bg-surface shadow-[0_0_0_4px_var(--heat-1)]"
      : earned
        ? "border-line bg-surface"
        : "border-line bg-[var(--heat-0)]"
  }`

  if (!earned) {
    return <article className={shell}>{body}</article>
  }

  return (
    <button type="button" onClick={onOpen} className={`${shell} hover:border-accent`}>
      {body}
    </button>
  )
}
