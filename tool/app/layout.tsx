import type React from "react"
import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "夏目安安bot - Meme 生成器",
  description: "素描本上写着什么的夏目安安",
  icons: {
    icon: "./images/img-3923.jpeg",
  },
  generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh">
      <body className={`font-sans antialiased`}>{children}</body>
    </html>
  )
}
