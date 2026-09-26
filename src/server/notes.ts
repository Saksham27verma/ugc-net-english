import "server-only"
import { dayKey } from "@/lib/streak"
import { ensureSchema, hasDatabase } from "./db"
import { LEARNER_ID } from "./learner"

/**
 * Short notes from Chinku. Edit the array; the picker cycles through unused
 * ones and only ever runs after a day is done (the result screen).
 */
const NOTES = [
  "That was a proper sitting. Close the tab and let it settle.",
  "You showed up. That is the whole assignment for today.",
  "Paper II rewards the people who keep coming back. That is you.",
  "If a unit felt messy, write the name down and leave it until tomorrow.",
  "I am proud of the quiet hour you just gave this.",
  "Accuracy will move. Regularity is what we can count on tonight.",
  "Drink some water. The questions will still be here in the morning.",
  "One set a day is how a syllabus becomes familiar instead of frightening.",
  "You do not have to feel ready. You only have to finish today's paper.",
  "If you guessed, that is information. Look at those items on the review.",
  "The exam is a long walk. Today was another honest mile.",
  "I like how seriously you take a Tuesday night with a timer.",
  "Weak units are not a verdict. They are a reading list.",
  "Leave the score on the table and come back to me.",
  "Tomorrow's paper does not need tonight's worry.",
  "You sat with 150 questions. That takes more nerve than people admit.",
  "When a passage dragged, you stayed. That is the skill.",
  "I will keep the evening quiet if you want the notes to yourself.",
  "A mid-range score with a finished paper beats a perfect plan.",
  "Mark the units that stole time. We can steal it back later.",
  "You are allowed to be tired and still call this a good day.",
  "The grid lit up because you sat down. That is not a small thing.",
  "If the timer ran long, we practise the clock next, not the panic.",
  "I am not grading you. I am keeping you company.",
  "Close the review when your eyes blur. The explanations will wait.",
  "A hundred days starts with evenings exactly like this one.",
  "You chose the paper over the easier thing. I noticed.",
  "Let the band sit. The next attempt is a different conversation.",
  "I packed no advice tonight. Just this: you did the day's work.",
  "Come back tomorrow. I will be here, and so will the next set.",
] as const

export const NOTE_COUNT = NOTES.length

function hashDay(key: string): number {
  let n = 0
  for (let i = 0; i < key.length; i += 1) n = (n * 33 + key.charCodeAt(i)) >>> 0
  return n
}

export async function noteForCompletedDay(submittedAt: number): Promise<string | null> {
  if (!hasDatabase()) return null
  const key = dayKey(submittedAt)
  const sql = await ensureSchema()

  const existing = await sql`
    SELECT note_index
    FROM notes_shown
    WHERE learner_id = ${LEARNER_ID} AND day_key = ${key}
    LIMIT 1
  `
  if (existing.length > 0) {
    return NOTES[Number(existing[0].note_index) % NOTE_COUNT] ?? null
  }

  const used = await sql`
    SELECT note_index
    FROM notes_shown
    WHERE learner_id = ${LEARNER_ID}
  `
  let unused = NOTES.map((_, index) => index).filter(
    (index) => !used.some((row) => Number(row.note_index) === index),
  )
  if (unused.length === 0) unused = NOTES.map((_, index) => index)

  const pick = unused[hashDay(key) % unused.length]
  await sql`
    INSERT INTO notes_shown (learner_id, day_key, note_index)
    VALUES (${LEARNER_ID}, ${key}, ${pick})
    ON CONFLICT (learner_id, day_key) DO NOTHING
  `
  const stored = await sql`
    SELECT note_index
    FROM notes_shown
    WHERE learner_id = ${LEARNER_ID} AND day_key = ${key}
    LIMIT 1
  `
  const index = Number(stored[0]?.note_index ?? pick)
  return NOTES[index % NOTE_COUNT] ?? null
}
