"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useActionState, useEffect, useState } from "react"
import { EXAMS, type ExamId } from "@/lib/exams"
import { paperShortTitle } from "@/lib/paper"
import { logoutAdmin, uploadPaper } from "@/server/admin-actions"
import type { PaperSummary } from "@/lib/types"

export function AdminClient({
  papers,
  suggested,
}: {
  papers: PaperSummary[]
  suggested: Record<ExamId, number>
}) {
  const router = useRouter()
  const [state, action, pending] = useActionState(uploadPaper, null)
  const [exam, setExam] = useState<ExamId>("ugc-net")
  const [setNumber, setSetNumber] = useState(suggested["ugc-net"])
  const [setTouched, setSetTouched] = useState(false)

  useEffect(() => {
    if (state?.ok) router.refresh()
  }, [router, state])

  useEffect(() => {
    if (!setTouched) setSetNumber(suggested[exam])
  }, [exam, setTouched, suggested])

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
              <span className="text-muted">Exam</span>
              <select
                name="exam"
                value={exam}
                onChange={(event) => {
                  const next = event.target.value as ExamId
                  setExam(next)
                  if (!setTouched) setSetNumber(suggested[next])
                }}
                className="mt-1 w-full rounded-lg border border-line bg-background px-3 py-2"
              >
                <option value="ugc-net">UGC NET</option>
                <option value="uppsc">UPPSC Assistant Professor</option>
              </select>
            </label>
            <label className="block text-sm">
              <span className="text-muted">Set number</span>
              <input
                type="number"
                name="setNumber"
                min={1}
                value={setNumber}
                onChange={(event) => {
                  setSetTouched(true)
                  setSetNumber(Number(event.target.value))
                }}
                className="mt-1 w-full rounded-lg border border-line bg-background px-3 py-2"
              />
              <span className="mt-1 block text-xs text-muted">
                {EXAMS[exam].label} numbers its own sets. Leave this as {suggested[exam]} for the next{" "}
                {EXAMS[exam].label} paper. A file named Practice-Set-N.md fills the number when you have not changed it.
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
            <h2 className="font-sans text-sm font-semibold uppercase tracking-wide text-muted">Templates</h2>
            <p className="mt-2 text-sm text-muted">
              Each skeleton already passes the importer. Replace every placeholder, then upload it under the matching
              exam.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <a
                href="/templates/UGC-NET-English-Practice-Set-TEMPLATE.md"
                download
                className="inline-block rounded-lg bg-accent px-4 py-2 text-center text-sm font-semibold text-white hover:bg-accent-hover"
              >
                UGC NET template
              </a>
              <a
                href="/templates/UPPSC-Assistant-Professor-Practice-Set-TEMPLATE.md"
                download
                className="inline-block rounded-lg border border-accent px-4 py-2 text-center text-sm font-semibold text-accent hover:bg-[var(--option-selected)]"
              >
                UPPSC template
              </a>
            </div>
          </section>

          <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
            <h2 className="font-sans text-sm font-semibold uppercase tracking-wide text-muted">Papers in Neon</h2>
            {papers.length === 0 ? (
              <p className="mt-2 text-sm text-muted">None yet. Import the first .md file.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {papers.map((paper) => (
                  <li key={paper.setId} className="flex items-center justify-between gap-3 border-b border-line pb-2 last:border-b-0">
                    <span>{paperShortTitle(paper)}</span>
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
            <li>
              UTF-8 file. Prefer <code>UGC-NET-English-Practice-Set-N.md</code> or{" "}
              <code>UPPSC-Assistant-Professor-Practice-Set-N.md</code>.
            </li>
            <li>
              UGC NET: 150 questions, 180 minutes, +2 and no penalty. Paper I is Q.1–Q.50 and Paper II is Q.51–Q.150.
              Passages are required for Q.1–Q.5, Q.46–Q.50, Q.141–Q.145, and Q.146–Q.150.
            </li>
            <li>
              UPPSC: 120 questions, 120 minutes, +3 and −1. Paper I is Q.1–Q.30 and Paper II is Q.31–Q.120. Unit names
              are yours. Passages are optional.
            </li>
            <li>
              Two sections, using an em dash: <code># SECTION A — …</code> then <code># SECTION B — …</code>. Unit
              headings use an en dash: <code>## Teaching Aptitude (Q.6–Q.10)</code>.
            </li>
            <li>Each question has four options labelled <code>1.</code> <code>2.</code> <code>3.</code> <code>4.</code> in order.</li>
            <li>
              One <code># ANSWER KEY</code>, then a fenced block of <code>n:1-4</code> pairs, then one line per question{" "}
              <code>**Q.1 — (3)** explanation…</code> matching the quick key.
            </li>
            <li>Set numbers start again for each exam, so both can have a Set 1.</li>
          </ul>
        </section>
      </main>
    </div>
  )
}
