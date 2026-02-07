import React from "react"
import type { Metadata, Viewport } from "next"
import { Syne, Manrope } from "next/font/google"
import "./globals.css"

const _syne = Syne({ subsets: ["latin"], variable: "--font-syne" })
const _manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" })

export const metadata: Metadata = {
  title: "ShiftSwap | Trade Shifts Instantly",
  description:
    "The shift trading platform for hourly workers. Post, claim, and approve shift swaps in seconds.",
}

export const viewport: Viewport = {
  themeColor: "#0A0A0A",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${_syne.variable} ${_manrope.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
