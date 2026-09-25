import { LoginForm } from "@/components/admin/LoginForm"
import { isAdmin } from "@/server/admin-auth"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function AdminLoginPage() {
  if (await isAdmin()) {
    redirect("/admin")
  }
  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <div className="w-full max-w-md border border-line bg-surface p-6">
        <p className="text-xs uppercase tracking-[0.18em] text-muted">Admin</p>
        <h1 className="mt-1 font-serif text-2xl font-semibold">Import a paper</h1>
        <p className="mt-2 text-sm text-muted">Sign in with the admin password to upload Markdown papers.</p>
        <LoginForm />
      </div>
    </div>
  )
}
