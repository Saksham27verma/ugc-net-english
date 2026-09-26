import { existsSync, readFileSync } from "node:fs"
import { join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { neon } from "@neondatabase/serverless"
import { MILESTONES } from "../src/lib/vouchers"
import { configureNeonFetch } from "../src/server/neon-fetch"
import { migrate } from "../src/server/schema"

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)))
const LEARNER_ID = "shared"

function loadEnv(): void {
  for (const name of [".env.local", ".env"]) {
    const path = join(ROOT, name)
    if (!existsSync(path)) continue
    for (const line of readFileSync(path, "utf8").split("\n")) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith("#")) continue
      const eq = trimmed.indexOf("=")
      if (eq < 1) continue
      const key = trimmed.slice(0, eq)
      let value = trimmed.slice(eq + 1)
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }
      if (!process.env[key]) process.env[key] = value
    }
  }
}

async function main(): Promise<void> {
  loadEnv()
  configureNeonFetch()
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error("DATABASE_URL is not set")
  }

  const sql = neon(url)
  await migrate(sql)

  // Only ever adds missing rows: an earned voucher is never reset by seeding.
  await sql`
    INSERT INTO voucher_state (learner_id, milestone, status)
    SELECT ${LEARNER_ID}, milestone, 'locked'
    FROM unnest(${[...MILESTONES]}::int[]) AS m(milestone)
    ON CONFLICT (learner_id, milestone) DO NOTHING
  `

  const rows = await sql`
    SELECT milestone, status
    FROM voucher_state
    WHERE learner_id = ${LEARNER_ID}
    ORDER BY milestone
  `
  for (const row of rows) {
    console.log(`Milestone ${String(row.milestone).padStart(3)} — ${row.status}`)
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
