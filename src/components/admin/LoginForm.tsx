"use client"

import { useActionState } from "react"
import { loginAdmin } from "@/server/admin-actions"

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAdmin, null)

  return (
    <form action={action} className="mt-6 space-y-4">
      <label className="block text-sm">
        <span className="text-muted">Password</span>
        <input
          type="password"
          name="password"
          required
          autoComplete="current-password"
          className="mt-1 w-full rounded-lg border border-line bg-background px-3 py-2"
        />
      </label>
      {state?.error ? <p className="text-sm text-red">{state.error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  )
}
