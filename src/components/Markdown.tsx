import type { Components } from "react-markdown"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

const blockComponents: Components = {
  table: ({ children }) => (
    <div className="overflow-x-auto my-3">
      <table>{children}</table>
    </div>
  ),
}

const inlineComponents: Components = {
  p: ({ children }) => <span>{children}</span>,
  table: ({ children }) => (
    <div className="overflow-x-auto my-2">
      <table>{children}</table>
    </div>
  ),
}

export function Markdown({
  children,
  inline = false,
  className = "",
}: {
  children: string
  inline?: boolean
  className?: string
}) {
  return (
    <div className={inline ? `inline-md ${className}` : `prose-exam measure ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={inline ? inlineComponents : blockComponents}>
        {children}
      </ReactMarkdown>
    </div>
  )
}
