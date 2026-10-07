import { AdminClient } from "@/components/admin/AdminClient"
import { isAdmin } from "@/server/admin-auth"
import { listPapers, nextSetNumber } from "@/server/papers"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function AdminPage() {
  if (!(await isAdmin())) {
    redirect("/admin/login")
  }
  const [papers, ugcNet, uppsc] = await Promise.all([
    listPapers(),
    nextSetNumber("ugc-net"),
    nextSetNumber("uppsc"),
  ])
  return <AdminClient papers={papers} suggested={{ "ugc-net": ugcNet, uppsc }} />
}
