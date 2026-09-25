import { createHmac, timingSafeEqual } from "node:crypto"
import { cookies } from "next/headers"

export const ADMIN_COOKIE = "ugcnet_admin"

function requirePassword(): string {
  const password = process.env.ADMIN_PASSWORD
  if (!password) {
    throw new Error("ADMIN_PASSWORD is not set")
  }
  return password
}

export function adminToken(password = requirePassword()): string {
  return createHmac("sha256", password).update("ugcnet-admin-v1").digest("hex")
}

function tokensMatch(left: string, right: string): boolean {
  const a = Buffer.from(left)
  const b = Buffer.from(right)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export function passwordIsValid(password: string): boolean {
  try {
    return tokensMatch(adminToken(password), adminToken())
  } catch {
    return false
  }
}

export async function isAdmin(): Promise<boolean> {
  const jar = await cookies()
  const value = jar.get(ADMIN_COOKIE)?.value
  if (!value) return false
  try {
    return tokensMatch(value, adminToken())
  } catch {
    return false
  }
}

export async function setAdminCookie(): Promise<void> {
  const jar = await cookies()
  jar.set(ADMIN_COOKIE, adminToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  })
}

export async function clearAdminCookie(): Promise<void> {
  const jar = await cookies()
  jar.delete(ADMIN_COOKIE)
}
