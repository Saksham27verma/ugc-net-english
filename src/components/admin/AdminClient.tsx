"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useActionState, useEffect } from "react"
import { logoutAdmin, uploadPaper } from "@/server/admin-actions"
import type { PaperSummary } from "@/lib/types"

export function AdminClient({
  papers,
  suggestedSetId,
}: {
  papers: PaperSummary[]
  suggestedSetId: number
}) {
  const router = useRouter()
  const [state, action, pending] = useActionState(uploadPaper, null)

  useEffect(() => {
    if (state?.ok) router.refresh()
  }, [router, state])

  return (
    <div className="min-h-dvh">
      <header className="border-b border-line bg-gradient-to-b from-surface to-background">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted">Admin</p>
            <h1 className="font-serif text-2xl font-semibold">Import paper</h1>
          </div>
          <div className="flex gap-3 text-sm">
            <Link href="/" className="text-muted hover:text-foreground">
              Home
            </Link>
            <form action={logoutAdmin}>
              <button type="submit" className="text-muted hover:text-foreground">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-8 px-4 py-8 lg:grid-cols-[1fr_20rem]">
        <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
          <h2 className="font-sans text-sm font-semibold uppercase tracking-wide text-muted">Upload Markdown</h2>
          <form action={action} className="mt-4 space-y-4">
            <label className="block text-sm">
              <span className="text-muted">.md file</span>
              <input
                type="file"
                name="file"
                accept=".md,text/markdown"
                required
                className="mt-1 block w-full text-sm"
              />
            </label>
            <label className="block text-sm">
              <span className="text-muted">Set number</span>
              <input
                type="number"
                name="setId"
                min={1}
                defaultValue={suggestedSetId}
                className="mt-1 w-full rounded-lg border border-line bg-background px-3 py-2"
              />
              <span className="mt-1 block text-xs text-muted">
                Leave as {suggestedSetId} for the next paper, or match Practice-Set-N.md.
              </span>
            </label>
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" name="replace" className="mt-1" />
              <span>Replace if this set number already exists</span>
            </label>
            {state ? (
              <p className={`text-sm ${state.ok ? "text-answered" : "text-red"}`}>{state.message}</p>
            ) : null}
            <button
              type="submit"
              disabled={pending}
              className="bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-60"
            >
              {pending ? "Parsing…" : "Import paper"}
            </button>
          </form>
        </section>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
            <h2 className="font-sans text-sm font-semibold uppercase tracking-wide text-muted">Template</h2>
            <p className="mt-2 text-sm text-muted">
              Download a complete 150-question skeleton that already passes the importer. Replace every placeholder,
              then upload.
            </p>
            <a
              href="/templates/UGC-NET-English-Practice-Set-TEMPLATE.md"
              download
              className="mt-4 inline-block rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover"
            >
              Download template
            </a>
          </section>

          <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
            <h2 className="font-sans text-sm font-semibold uppercase tracking-wide text-muted">Papers in Neon</h2>
            {papers.length === 0 ? (
              <p className="mt-2 text-sm text-muted">None yet. Import the first .md file.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {papers.map((paper) => (
                  <li key={paper.setId} className="flex items-center justify-between gap-3 border-b border-line pb-2 last:border-b-0">
                    <span>Set {paper.setId}</span>
                    <Link href={`/exam/${paper.setId}`} className="text-accent underline-offset-2 hover:underline">
                      Open
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>

        <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm lg:col-span-2">
          <h2 className="font-sans text-sm font-semibold uppercase tracking-wide text-muted">Markdown format</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted">
            <li>UTF-8 file. Prefer the name <code>UGC-NET-English-Practice-Set-N.md</code>.</li>
            <li>Exactly 150 questions, each with four options labelled <code>1.</code> <code>2.</code> <code>3.</code> <code>4.</code> in order.</li>
            <li>
              Two sections, using an em dash:{" "}
              <code># SECTION A — PAPER I : GENERAL APTITUDE (Q.1–Q.50)</code> then{" "}
              <code># SECTION B — PAPER II : ENGLISH (Q.51–Q.150)</code>.
            </li>
            <li>
              Unit headings tile 1…150 with an en dash in the range:{" "}
              <code>## Teaching Aptitude (Q.6–Q.10)</code>.
            </li>
            <li>Passages are required for Q.1–Q.5, Q.46–Q.50, Q.141–Q.145, and Q.146–Q.150 (Markdown before the first question).</li>
            <li>
              One <code># ANSWER KEY</code>, then a fenced block of 150 pairs <code>n:1-4</code>, then 150 lines{" "}
              <code>**Q.1 — (3)** explanation…</code> matching the quick key.
            </li>
          </ul>
        </section>
      </main>
    </div>
  )
}
