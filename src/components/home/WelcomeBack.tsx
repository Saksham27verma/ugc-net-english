"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import type { ComebackInfo } from "@/lib/motivation"
import { dismissWelcomeBack } from "@/server/motivation-actions"

export function WelcomeBack({ comeback }: { comeback: ComebackInfo }) {
  const router = useRouter()
  const [hiding, setHiding] = useState(false)

  async function dismiss() {
    setHiding(true)
    try {
      await dismissWelcomeBack(comeback.dayKey)
      router.refresh()
    } catch {
      setHiding(false)
    }
  }

  return (
    <section className="mt-6 rounded-2xl border border-accent bg-surface p-5 shadow-sm">
      <p className="text-xs uppercase tracking-[0.18em] text-muted">Welcome back</p>
      <h2 className="mt-1 font-serif text-xl font-semibold">Three days in a row again</h2>
      <p className="mt-2 text-sm text-muted">
        The break is behind you. I put an extra streak freeze in your pocket — use it
        the next time a day gets away from you.
      </p>
      <button
        type="button"
        onClick={dismiss}
        disabled={hiding}
        className="mt-4 min-h-11 border border-line px-4 text-sm hover:border-accent disabled:opacity-50"
      >
        {hiding ? "Closing…" : "Dismiss"}
      </button>
    </section>
  )
}
