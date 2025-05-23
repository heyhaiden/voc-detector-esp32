import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { BottomNavigation } from "@/components/bottom-navigation"
import { WebSocketProvider } from "@/components/websocket-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "BreathBuddy - Breathalyzer App",
  description: "A Duolingo-inspired breathalyzer web application",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light">
          <WebSocketProvider>
            <div className="flex flex-col min-h-screen bg-background">
              <main className="flex-1 container max-w-md mx-auto px-4 pb-20">{children}</main>
              <BottomNavigation />
            </div>
          </WebSocketProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
