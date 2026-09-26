import type { CSSProperties } from "react"
import { formatDayKey } from "@/lib/streak"
import type { VoucherContents } from "@/lib/vouchers"

/**
 * The printed voucher, 794x559 (A5 landscape). Everything is inline so the
 * card renders identically in the app and in the PNG that html-to-image makes
 * of it. It keeps its own palette rather than the app tokens because it is a
 * printed artifact, not a piece of app chrome.
 */
export const VOUCHER_WIDTH = 794
export const VOUCHER_HEIGHT = 559

const ACCENT = "#8f355c"
const PAPER = "#fbf7f5"
const CARD = "#fffdfc"
const STUB = "#f5e3ea"
const RULE = "#e9c7d3"
const INK = "#2b2326"
const LABEL = "#6b4557"
const FINE = "#5f4a52"

const SERIF = "var(--font-stem), Georgia, 'Times New Roman', serif"
const SANS = "var(--font-ui), 'Segoe UI', Helvetica, Arial, sans-serif"

const label: CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  color: LABEL,
}

export function VoucherCard({
  contents,
  wish,
  claimedOn,
}: {
  contents: VoucherContents
  /** Voucher 006 only: what she wrote when she claimed it. */
  wish?: string | null
  /** Day key of the claim, which stamps the card. */
  claimedOn?: string | null
}) {
  const digits = String(contents.milestone).length

  return (
    <div
      style={{
        width: VOUCHER_WIDTH,
        height: VOUCHER_HEIGHT,
        boxSizing: "border-box",
        padding: 24,
        background: PAPER,
        fontFamily: SANS,
        color: INK,
        position: "relative",
      }}
    >
      <div
        style={{
          width: 746,
          height: 511,
          boxSizing: "border-box",
          border: `1.5px solid ${ACCENT}`,
          borderRadius: 16,
          background: CARD,
          display: "flex",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: 196,
            flexShrink: 0,
            boxSizing: "border-box",
            padding: digits > 2 ? "28px 18px 24px 22px" : "28px 22px 24px 26px",
            background: STUB,
            borderRight: `2px dashed ${ACCENT}`,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div style={label}>Streak reward</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div
              style={{
                fontFamily: SERIF,
                fontWeight: 700,
                fontSize: digits > 2 ? 104 : 132,
                lineHeight: 0.9,
                letterSpacing: digits > 2 ? "-0.05em" : digits > 1 ? "-0.04em" : "-0.03em",
                color: ACCENT,
              }}
            >
              {contents.milestone}
            </div>
            <div style={label}>{contents.stubCaption}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <HeartIcon filled={contents.milestone >= 50} />
            <div style={{ ...label, letterSpacing: "0.12em" }}>No. {contents.number}</div>
          </div>
        </div>

        <div
          style={{
            flexGrow: 1,
            boxSizing: "border-box",
            padding: "30px 36px 26px 36px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <div style={label}>{contents.issuedTo}</div>
          <h1
            style={{
              margin: 0,
              fontFamily: SERIF,
              fontWeight: 700,
              fontSize: 38,
              lineHeight: 1.08,
              letterSpacing: "-0.01em",
              color: ACCENT,
              textWrap: "balance",
            }}
          >
            {contents.title}
          </h1>
          <p style={{ margin: 0, fontSize: 17, lineHeight: 1.5, textWrap: "pretty" }}>
            {contents.lead}
          </p>

          {contents.wishPrompt ? (
            <WishBlock prompt={contents.wishPrompt} wish={wish} />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {contents.includes.map((line) => (
                <div
                  key={line}
                  style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 16, lineHeight: 1.4 }}
                >
                  <CheckIcon />
                  <div>{line}</div>
                </div>
              ))}
            </div>
          )}

          <div style={{ flexGrow: 1 }} />

          <p
            style={{
              margin: 0,
              fontSize: 12.5,
              lineHeight: 1.45,
              color: FINE,
              borderTop: `1px solid ${RULE}`,
              paddingTop: 12,
              textWrap: "pretty",
            }}
          >
            {contents.finePrint}
          </p>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 24 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={label}>{contents.signatureLabel}</div>
              <div
                style={{
                  fontFamily: SERIF,
                  fontStyle: "italic",
                  fontWeight: 500,
                  fontSize: 28,
                  lineHeight: 1,
                  color: ACCENT,
                }}
              >
                Chinku
              </div>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
                alignItems: "flex-end",
                textAlign: "right",
              }}
            >
              <div style={label}>Valid</div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{contents.validLine}</div>
            </div>
          </div>
        </div>
      </div>

      {claimedOn ? <ClaimedStamp day={claimedOn} /> : null}
    </div>
  )
}

function WishBlock({ prompt, wish }: { prompt: string; wish?: string | null }) {
  const written = wish?.trim() ?? ""
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 4 }}>
      <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 18, lineHeight: 1.3, color: INK }}>
        {prompt}
      </div>
      <div
        style={{
          minHeight: 40,
          borderBottom: `1.5px solid ${ACCENT}`,
          fontFamily: SERIF,
          fontStyle: "italic",
          fontSize: 22,
          lineHeight: 1.5,
          color: ACCENT,
          overflow: "hidden",
        }}
      >
        {written}
      </div>
      {written ? null : <div style={{ height: 40, borderBottom: `1.5px solid ${ACCENT}` }} />}
    </div>
  )
}

function ClaimedStamp({ day }: { day: string }) {
  return (
    <div
      style={{
        position: "absolute",
        right: 64,
        bottom: 86,
        transform: "rotate(-11deg)",
        border: `2px solid ${ACCENT}`,
        borderRadius: 6,
        padding: "6px 12px",
        color: ACCENT,
        fontSize: 13,
        fontWeight: 600,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        opacity: 0.85,
        whiteSpace: "nowrap",
      }}
    >
      Claimed · {formatDayKey(day)}
    </div>
  )
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill={filled ? ACCENT : "none"}
      stroke={ACCENT}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke={ACCENT}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}
