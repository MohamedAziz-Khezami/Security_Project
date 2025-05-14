"use client"

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Lock, Unlock, FileDigit } from "lucide-react"
import { useCallback } from "react"

interface ActionSelectorProps {
  action: "encrypt" | "decrypt" | "hash"
  onChange: (action: "encrypt" | "decrypt" | "hash") => void
}

export function ActionSelector({ action, onChange }: ActionSelectorProps) {
  const handleValueChange = useCallback((value: string) => {
    if (value !== action) {
      onChange(value as "encrypt" | "decrypt" | "hash")
    }
  }, [action, onChange])

  return (
    <RadioGroup
      defaultValue={action}
      value={action}
      onValueChange={handleValueChange}
      className="flex flex-col sm:flex-row gap-4"
    >
      <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-all duration-300 flex-1 hover:shadow-md">
        <RadioGroupItem value="encrypt" id="encrypt" className="sr-only" />
        <Label
          htmlFor="encrypt"
          className={`flex items-center gap-3 cursor-pointer w-full ${
            action === "encrypt" ? "text-blue-600 font-medium" : ""
          }`}
        >
          <div className={`p-2 rounded-full ${action === "encrypt" ? "bg-blue-100" : "bg-gray-100"}`}>
            <Lock className={`h-5 w-5 ${action === "encrypt" ? "text-blue-600" : "text-gray-500"}`} />
          </div>
          <span>Encrypt</span>
        </Label>
      </div>

      <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-all duration-300 flex-1 hover:shadow-md">
        <RadioGroupItem value="decrypt" id="decrypt" className="sr-only" />
        <Label
          htmlFor="decrypt"
          className={`flex items-center gap-3 cursor-pointer w-full ${
            action === "decrypt" ? "text-blue-600 font-medium" : ""
          }`}
        >
          <div className={`p-2 rounded-full ${action === "decrypt" ? "bg-blue-100" : "bg-gray-100"}`}>
            <Unlock className={`h-5 w-5 ${action === "decrypt" ? "text-blue-600" : "text-gray-500"}`} />
          </div>
          <span>Decrypt</span>
        </Label>
      </div>

      <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-all duration-300 flex-1 hover:shadow-md">
        <RadioGroupItem value="hash" id="hash" className="sr-only" />
        <Label
          htmlFor="hash"
          className={`flex items-center gap-3 cursor-pointer w-full ${
            action === "hash" ? "text-blue-600 font-medium" : ""
          }`}
        >
          <div className={`p-2 rounded-full ${action === "hash" ? "bg-blue-100" : "bg-gray-100"}`}>
            <FileDigit className={`h-5 w-5 ${action === "hash" ? "text-blue-600" : "text-gray-500"}`} />
          </div>
          <span>Hash</span>
        </Label>
      </div>
    </RadioGroup>
  )
}
