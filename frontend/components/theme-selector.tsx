"use client"

import { useState, useEffect } from "react"
import { Check, Palette } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

type Theme = {
  name: string
  id: string
  description: string
}

const themes: Theme[] = [
  {
    name: "Default Blue",
    id: "default",
    description: "Professional blue theme with excellent contrast",
  },
  {
    name: "Emerald Green",
    id: "emerald-green",
    description: "Calming green theme that promotes focus and clarity",
  },
  {
    name: "Royal Purple",
    id: "royal-purple",
    description: "Creative and sophisticated purple theme",
  },
  {
    name: "Sunset Orange",
    id: "sunset-orange",
    description: "Warm and energetic orange theme",
  },
  {
    name: "Ocean Blue",
    id: "ocean-blue",
    description: "Calm and trustworthy teal-blue theme",
  },
  {
    name: "Monochrome",
    id: "monochrome",
    description: "Clean, minimal grayscale theme",
  },
]

export function ThemeSelector() {
  const [theme, setTheme] = useState<string>("default")

  useEffect(() => {
    // Get saved theme from localStorage or use default
    const savedTheme = localStorage.getItem("app-theme") || "default"
    setTheme(savedTheme)
    applyTheme(savedTheme)
  }, [])

  const applyTheme = (themeId: string) => {
    // Remove any existing theme stylesheets
    document.querySelectorAll("link[data-theme-stylesheet]").forEach((el) => el.remove())

    // Don't add stylesheet for default theme
    if (themeId !== "default") {
      const link = document.createElement("link")
      link.rel = "stylesheet"
      link.href = `/themes/${themeId}.css`
      link.setAttribute("data-theme-stylesheet", "true")
      document.head.appendChild(link)
    }

    // Save to localStorage
    localStorage.setItem("app-theme", themeId)
  }

  const handleThemeChange = (themeId: string) => {
    setTheme(themeId)
    applyTheme(themeId)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="h-9 w-9 rounded-full">
          <Palette className="h-4 w-4" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {themes.map((t) => (
          <DropdownMenuItem
            key={t.id}
            onClick={() => handleThemeChange(t.id)}
            className="flex items-center justify-between"
          >
            <div>
              <div>{t.name}</div>
              <p className="text-xs text-muted-foreground">{t.description}</p>
            </div>
            {theme === t.id && <Check className="h-4 w-4 ml-2" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
