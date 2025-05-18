"use client"

import Link from "next/link"
import { ThemeSelector } from "@/components/theme-selector"
import { ModeToggle } from "@/components/mode-toggle"
import { Button } from "@/components/ui/button"
import { FileText, ImageIcon,LockIcon } from "lucide-react"

export function Header() {
  return (
    <header className="border-b">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          
          <Link href="/" className="font-semibold text-lg  flex items-center gap-2">
          <LockIcon className="h-8 w-8 text-black-500" />
            SecureTransfer
          </Link>

        </div>
        <div className="flex items-center gap-2">
          <ThemeSelector />
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}
