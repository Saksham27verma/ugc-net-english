"use server"

import { PaperParseError, parseMarkdownPaper, setIdFromFilename } from "@/lib/parse-paper"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { clearAdminCookie, isAdmin, passwordIsValid, setAdminCookie } from "./admin-auth"
import { nextSetId, paperExists, upsertPaper } from "./papers"

const MAX_UPLOAD_BYTES = 2_000_000

export type UploadState = {
  ok: boolean
  message: string
  setId?: number
}

export async function loginAdmin(_prev: { error: string } | null, formData: FormData) {
  const password = String(formData.get("password") ?? "")
  if (!passwordIsValid(password)) {
    return { error: "Incorrect password." }
  }
  await setAdminCookie()
  redirect("/admin")
}

export async function logoutAdmin(): Promise<void> {
  await clearAdminCookie()
  redirect("/admin/login")
}

export async function uploadPaper(_prev: UploadState | null, formData: FormData): Promise<UploadState> {
  if (!(await isAdmin())) {
    return { ok: false, message: "You are not signed in as admin." }
  }

  const file = formData.get("file")
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Choose a .md file to upload." }
  }
  if (!file.name.toLowerCase().endsWith(".md")) {
    return { ok: false, message: "Upload a Markdown file ending in .md." }
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, message: "File is larger than 2 MB." }
  }

  const replace = formData.get("replace") === "on"
  const rawSetId = String(formData.get("setId") ?? "").trim()
  let setId = rawSetId ? Number(rawSetId) : setIdFromFilename(file.name)
  if (setId == null || Number.isNaN(setId)) {
    setId = await nextSetId()
  }
  if (!Number.isInteger(setId) || setId < 1) {
    return { ok: false, message: "Set number must be a positive integer." }
  }

  const exists = await paperExists(setId)
  if (exists && !replace) {
    return {
      ok: false,
      message: `Set ${setId} already exists. Tick “Replace if this set number already exists” to overwrite it.`,
      setId,
    }
  }

  let source: string
  try {
    source = await file.text()
  } catch {
    return { ok: false, message: "Could not read the uploaded file as UTF-8 text." }
  }

  try {
    const parsed = parseMarkdownPaper(source, setId)
    await upsertPaper({
      paper: parsed.paper,
      key: parsed.key,
      sourceFilename: file.name,
    })
    revalidatePath("/")
    revalidatePath("/admin")
    revalidatePath(`/exam/${setId}`)
    return {
      ok: true,
      setId,
      message: exists
        ? `Replaced Set ${setId}: ${parsed.paper.title}`
        : `Imported Set ${setId}: ${parsed.paper.title}`,
    }
  } catch (error) {
    const message = error instanceof PaperParseError || error instanceof Error ? error.message : "Parse failed."
    return { ok: false, message }
  }
}
