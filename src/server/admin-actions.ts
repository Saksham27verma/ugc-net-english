"use server"

import { EXAMS, isExamId, type ExamId } from "@/lib/exams"
import { PaperParseError, examFromFilename, parseMarkdownPaper } from "@/lib/parse-paper"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { clearAdminCookie, isAdmin, passwordIsValid, setAdminCookie } from "./admin-auth"
import { findSetId, nextSetId, nextSetNumber, upsertPaper } from "./papers"

const MAX_UPLOAD_BYTES = 2_000_000

export type UploadState = {
  ok: boolean
  message: string
  setId?: number
}

function paperLabel(exam: ExamId, setNumber: number): string {
  return `${EXAMS[exam].label} Set ${setNumber}`
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
  const rawExam = String(formData.get("exam") ?? "").trim()
  let exam: ExamId = isExamId(rawExam) ? rawExam : "ugc-net"
  const next = {
    "ugc-net": await nextSetNumber("ugc-net"),
    uppsc: await nextSetNumber("uppsc"),
  }
  const rawSetNumber = String(formData.get("setNumber") ?? "").trim()
  let setNumber = rawSetNumber ? Number(rawSetNumber) : next[exam]
  const fromFile = examFromFilename(file.name)
  if (fromFile) {
    const leftDefaults = exam === "ugc-net" && setNumber === next["ugc-net"]
    if (leftDefaults) {
      exam = fromFile.exam
      setNumber = fromFile.setNumber
    } else if (fromFile.exam === exam && setNumber === next[exam]) {
      setNumber = fromFile.setNumber
    }
  }
  if (!Number.isInteger(setNumber) || setNumber < 1) {
    return { ok: false, message: "Set number must be a positive integer." }
  }

  const existingId = await findSetId(exam, setNumber)
  if (existingId != null && !replace) {
    return {
      ok: false,
      message: `${paperLabel(exam, setNumber)} already exists. Tick “Replace if this set number already exists” to overwrite it.`,
      setId: existingId,
    }
  }

  let source: string
  try {
    source = await file.text()
  } catch {
    return { ok: false, message: "Could not read the uploaded file as UTF-8 text." }
  }

  try {
    const setId = existingId ?? (await nextSetId())
    const parsed = parseMarkdownPaper(source, setId, exam, setNumber)
    await upsertPaper({
      paper: parsed.paper,
      key: parsed.key,
      sourceFilename: file.name,
    })
    revalidatePath("/")
    revalidatePath("/admin")
    revalidatePath(`/exam/${setId}`)
    const label = paperLabel(exam, setNumber)
    return {
      ok: true,
      setId,
      message: existingId != null
        ? `Replaced ${label}: ${parsed.paper.title}`
        : `Imported ${label}: ${parsed.paper.title}`,
    }
  } catch (error) {
    const message = error instanceof PaperParseError || error instanceof Error ? error.message : "Parse failed."
    return { ok: false, message }
  }
}
