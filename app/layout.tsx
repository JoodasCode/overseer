import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { SupabaseAuthProvider } from "@/lib/auth/supabase-auth-provider"
import { Toaster } from "@/components/ui/toaster"

export const metadata: Metadata = {
  title: "AGENTS OS - Build your AI team",
  description: "Run your company like a game with AI agents",
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <SupabaseAuthProvider>
          {children}
          <Toaster />
        </SupabaseAuthProvider>
      </body>
    </html>
  )
}
