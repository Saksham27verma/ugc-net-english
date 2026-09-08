import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3">
      <p className="font-serif text-2xl">Page not found</p>
      <Link href="/" className="text-sm text-accent underline-offset-2 hover:underline">
        Return home
      </Link>
    </div>
  )
}
