import "server-only"
import type { Milestone, VoucherContents } from "@/lib/vouchers"
import { voucherNumber } from "@/lib/vouchers"

/**
 * The surprise lives here and nowhere else. Nothing in this file may be
 * imported by a client component, re-exported through a shared module, or
 * returned from a route that has not first checked the milestone was earned.
 * scripts/assert-no-key-leak.ts fails the build if any of this copy turns up
 * under .next/static.
 */

const CONTENTS: Record<Milestone, VoucherContents> = {
  5: {
    milestone: 5,
    number: voucherNumber(5),
    issuedTo: "Issued to Tanya · for five days in a row",
    stubCaption: "days in a row",
    title: "A date at NSP",
    lead: "Five days in a row deserves an evening out. Netaji Subhash Place, your pick of the place, and the bill is mine.",
    includes: [
      "Dinner wherever you point at",
      "Dessert on the walk back",
      "Zero syllabus talk after 7 pm",
    ],
    finePrint:
      "Valid for one evening, any day of the week. Chinku reserves the right to hold your hand the entire time. Non-transferable, obviously.",
    signatureLabel: "Issued by",
    validLine: "Any day you like · No expiry",
    wishPrompt: null,
  },
  10: {
    milestone: 10,
    number: voucherNumber(10),
    issuedTo: "Issued to Tanya · for ten days in a row",
    stubCaption: "days in a row",
    title: "Seafood night",
    lead: "Ten straight days. That's prawns, crab, fish curry, whatever you've been craving, at a proper seafood place, on me.",
    includes: [
      "Starters, mains, and the one you can't decide on",
      "Chinku ordering something he can't pronounce",
      "Stealing from his plate: permitted",
    ],
    finePrint:
      "Valid for one dinner. No calorie talk at the table. If you say \u201cyou pick\u201d, I pick the most expensive thing on the menu for you.",
    signatureLabel: "Issued by",
    validLine: "Any day you like · No expiry",
    wishPrompt: null,
  },
  15: {
    milestone: 15,
    number: voucherNumber(15),
    issuedTo: "Issued to Tanya · for fifteen days in a row",
    stubCaption: "days in a row",
    title: "Nykaa or Myntra, your call",
    lead: "Fifteen days. Fill a cart on Nykaa or Myntra, up to ₹3,500, and hand me your phone at checkout.",
    includes: [
      "One cart, one checkout, my card",
      "Not a single \u201cdo you really need that?\u201d",
      "Unboxing together, if you want an audience",
    ],
    finePrint:
      "Nykaa, Myntra, or split across both. Valid once. \u201cIt was on sale\u201d is not required as a justification, but is always welcome.",
    signatureLabel: "Issued by",
    validLine: "Any day you like · No expiry",
    wishPrompt: null,
  },
  20: {
    milestone: 20,
    number: voucherNumber(20),
    issuedTo: "Issued to Tanya · for twenty days in a row",
    stubCaption: "days in a row",
    title: "The full-hour massage",
    lead: "Twenty days of showing up. Sixty minutes of a proper full-body massage: warm oil, dim lights, your playlist, and you don't lift a finger.",
    includes: [
      "Head, shoulders, back, feet: the full route",
      "Your playlist, your pace, your pressure",
      "A hot drink after, made by me",
    ],
    finePrint:
      "Valid for one 60-minute session. Saying \u201cokay, that's enough\u201d before the hour is up will be politely ignored. Falling asleep counts as a five-star review.",
    signatureLabel: "Issued by",
    validLine: "Any evening you like · No expiry",
    wishPrompt: null,
  },
  30: {
    milestone: 30,
    number: voucherNumber(30),
    issuedTo: "Issued to Tanya · for thirty days in a row",
    stubCaption: "days · one full month",
    title: "A night that's all about you",
    lead: "Thirty days. Door locked, phones face-down, candles lit. One whole night with my undivided attention, and you set the agenda.",
    includes: [
      "Chinku, entirely yours, till morning",
      "Whatever you want, for as long as you want it",
      "Breakfast in bed the next morning",
    ],
    finePrint:
      "Redeemable on any night of your choosing. What happens after redemption stays strictly between the two of us. No questions asked, and none answered, except yours.",
    signatureLabel: "Issued by",
    validLine: "Any night you like · No expiry",
    wishPrompt: null,
  },
  50: {
    milestone: 50,
    number: voucherNumber(50),
    issuedTo: "Issued to Tanya · for fifty days in a row",
    stubCaption: "days in a row",
    title: "You write this one",
    lead: "Fifty days in a row. There's no reward I could print that would match it, so the line below is yours to fill in.",
    includes: [],
    finePrint:
      "Anything within reason, and my definition of reason is very generous. Not valid for \u201cskip the exam\u201d. Signed in advance, so there's no backing out.",
    signatureLabel: "Pre-signed by",
    validLine: "Whenever you say · No expiry",
    wishPrompt: "I, Tanya, redeem this voucher for",
  },
}

export function voucherContents(milestone: Milestone): VoucherContents {
  return CONTENTS[milestone]
}
