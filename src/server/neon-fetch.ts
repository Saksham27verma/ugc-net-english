import https from "node:https"
import { neonConfig } from "@neondatabase/serverless"

function headerRecord(headers: HeadersInit | undefined): Record<string, string> {
  if (!headers) return {}
  if (headers instanceof Headers) {
    const out: Record<string, string> = {}
    headers.forEach((value, key) => {
      out[key] = value
    })
    return out
  }
  if (Array.isArray(headers)) {
    return Object.fromEntries(headers)
  }
  return { ...headers }
}

export function ipv4Fetch(input: string | URL, init: RequestInit = {}): Promise<Response> {
  const url = new URL(String(input))
  const body = init.body
  const payload =
    body == null ? undefined : typeof body === "string" || Buffer.isBuffer(body) ? body : String(body)

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: url.hostname,
        path: `${url.pathname}${url.search}`,
        method: init.method ?? "GET",
        port: Number(url.port || 443),
        family: 4,
        servername: url.hostname,
        headers: headerRecord(init.headers),
        timeout: 30_000,
      },
      (res) => {
        const chunks: Buffer[] = []
        res.on("data", (chunk: Buffer) => chunks.push(chunk))
        res.on("end", () => {
          resolve(
            new Response(Buffer.concat(chunks), {
              status: res.statusCode ?? 500,
              statusText: res.statusMessage,
              headers: res.headers as HeadersInit,
            }),
          )
        })
      },
    )
    req.on("error", reject)
    req.on("timeout", () => {
      req.destroy(new Error("Neon IPv4 connect timed out"))
    })
    if (payload !== undefined) req.write(payload)
    req.end()
  })
}

let configured = false

export function configureNeonFetch(): void {
  if (configured) return
  configured = true
  neonConfig.fetchFunction = ipv4Fetch
}
