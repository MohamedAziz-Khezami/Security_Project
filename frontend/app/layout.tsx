import type React from "react"
import type { Metadata } from "next"
import { ThemeProvider } from "@/components/theme-provider"
import { Header } from "@/components/header"
import "./globals.css"


export const metadata: Metadata = {
  title: "SecureTransfer",
  description: "Encrypt and Decrypt your files, and images seamlessly",
  icons: {
    icon: "/apple-touch-icon.png",
    shortcut: "/apple-touch-icon.png",
    apple: "/apple-touch-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Header />
          <main className="container mx-auto px-4 py-6">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  )
}
