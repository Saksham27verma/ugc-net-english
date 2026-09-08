import { questionStatus } from "@/lib/status"
import type { Attempt, QuestionStatus } from "@/lib/types"

const STATUS_CLASS: Record<QuestionStatus, string> = {
  "Not Visited":
    "bg-surface text-muted border-visited-outline border",
  "Not Answered":
    "bg-not-answered text-white border-not-answered border",
  Answered: "bg-answered text-white border-answered border-2",
  "Marked for Review":
    "bg-marked text-white border-marked border border-dashed",
  "Answered & Marked":
    "bg-marked text-white border-marked border relative",
}

export function Palette({
  attempt,
  currentNo,
  onJump,
}: {
  attempt: Attempt
  currentNo: number
  onJump: (no: number) => void
}) {
  return (
    <div className="flex flex-col gap-4">
      <PaletteGroup
        label="Paper I"
        start={1}
        end={50}
        attempt={attempt}
        currentNo={currentNo}
        onJump={onJump}
      />
      <PaletteGroup
        label="Paper II"
        start={51}
        end={150}
        attempt={attempt}
        currentNo={currentNo}
        onJump={onJump}
      />
    </div>
  )
}

function PaletteGroup({
  label,
  start,
  end,
  attempt,
  currentNo,
  onJump,
}: {
  label: string
  start: number
  end: number
  attempt: Attempt
  currentNo: number
  onJump: (no: number) => void
}) {
  const buttons = []
  for (let n = start; n <= end; n += 1) {
    const status = questionStatus(attempt.responses[n])
    const current = n === currentNo
    buttons.push(
      <button
        key={n}
        type="button"
        onClick={() => onJump(n)}
        aria-label={`Question ${n}, ${status}`}
        aria-current={current ? "true" : undefined}
        className={`relative h-8 w-8 text-[11px] font-medium leading-none ${STATUS_CLASS[status]} ${
          current ? "outline outline-2 outline-offset-1 outline-accent" : ""
        }`}
      >
        {n}
        {status === "Answered & Marked" ? (
          <span
            aria-hidden="true"
            className="absolute right-0.5 top-0.5 h-1.5 w-1.5 bg-answered"
          />
        ) : null}
      </button>,
    )
  }
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{label}</h3>
      <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-5">{buttons}</div>
    </div>
  )
}

export function PaletteLegend({ counts }: { counts: Record<QuestionStatus, number> }) {
  const items: { status: QuestionStatus; hint: string }[] = [
    { status: "Not Visited", hint: "outline" },
    { status: "Not Answered", hint: "filled" },
    { status: "Answered", hint: "filled, thick border" },
    { status: "Marked for Review", hint: "dashed border" },
    { status: "Answered & Marked", hint: "dot" },
  ]
  return (
    <ul className="space-y-1.5 text-xs text-muted">
      {items.map((item) => (
        <li key={item.status} className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className={`relative inline-block h-3.5 w-3.5 shrink-0 ${STATUS_CLASS[item.status]}`}
          >
            {item.status === "Answered & Marked" ? (
              <span className="absolute right-0 top-0 h-1 w-1 bg-answered" />
            ) : null}
          </span>
          <span>
            {item.status}{" "}
            <span className="text-foreground">({counts[item.status]})</span>
          </span>
        </li>
      ))}
    </ul>
  )
}
