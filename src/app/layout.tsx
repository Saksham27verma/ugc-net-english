import type { Metadata } from "next"
import { IBM_Plex_Mono, Source_Sans_3, Source_Serif_4 } from "next/font/google"
import "./globals.css"

const sans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-ui",
  display: "swap",
})

const serif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-stem",
  display: "swap",
})

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-timer",
  display: "swap",
})

export const metadata: Metadata = {
  title: "UGC NET and UPPSC — Mock Tests",
  description: "Full-length mock tests for UGC NET English and UPPSC Assistant Professor.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${serif.variable} ${mono.variable} antialiased`}>
        {children}
      </body>
    </html>
  )
}
