import { AdminClient } from "@/components/admin/AdminClient"
import { isAdmin } from "@/server/admin-auth"
import { listPapers, nextSetId } from "@/server/papers"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function AdminPage() {
  if (!(await isAdmin())) {
    redirect("/admin/login")
  }
  const [papers, suggestedSetId] = await Promise.all([listPapers(), nextSetId()])
  return <AdminClient papers={papers} suggestedSetId={suggestedSetId} />
}
