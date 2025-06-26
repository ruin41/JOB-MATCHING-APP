import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metaData: Metadata = {
  title: "JobMatch - あなたに合った企業と、スワイプで出会おう",
  description:
    "直感的なスワイプUIで、理想の転職先を見つけよう。企業と求職者が簡単・スピーディに相互理解できる新しい転職体験。",
    generator: 'v0.dev'
}

// Make environment variables available to the client
export const runtime = "nodejs"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <head>
        {/* Add meta tags to expose environment variables to the client */}
        <meta name="supabase-url" content={process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ""} />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
