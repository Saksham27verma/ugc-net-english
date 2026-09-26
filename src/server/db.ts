import "server-only"
import { neon, type NeonQueryFunction } from "@neondatabase/serverless"
import { configureNeonFetch } from "./neon-fetch"
import { migrate } from "./schema"

configureNeonFetch()

type Sql = NeonQueryFunction<false, false>

let sql: Sql | null = null
let migrated = false
let migrating: Promise<void> | null = null

export function hasDatabase(): boolean {
  return Boolean(process.env.DATABASE_URL)
}

export function getSql(): Sql {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error("DATABASE_URL is not set. Add the Neon connection string to .env.local.")
  }
  if (!sql) {
    sql = neon(url)
  }
  return sql
}

export async function ensureSchema(): Promise<Sql> {
  const client = getSql()
  if (migrated) return client
  if (!migrating) {
    migrating = migrate(client)
      .then(() => {
        migrated = true
      })
      .finally(() => {
        migrating = null
      })
  }
  await migrating
  return client
}
