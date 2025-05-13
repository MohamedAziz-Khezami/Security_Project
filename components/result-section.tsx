"use client"

import { AlertCircle, Check, Copy, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"

interface ResultSectionProps {
  result: {
    success: boolean
    message: string
    hash?: string
    downloadUrl?: string
    fileName?: string
    fileContent?: string | ArrayBuffer
  }
  action: "encrypt" | "decrypt" | "hash"
}

export function ResultSection({ result, action }: ResultSectionProps) {
  const [copied, setCopied] = useState(false)

  // Add cleanup for object URLs
  useEffect(() => {
    return () => {
      if (result.downloadUrl && result.downloadUrl.startsWith("blob:")) {
        URL.revokeObjectURL(result.downloadUrl)
      }
    }
  }, [result.downloadUrl])

  const handleCopy = () => {
    if (result.hash) {
      navigator.clipboard.writeText(result.hash)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Add real download functionality
  const handleDownload = () => {
    if (result.downloadUrl) {
      const a = document.createElement("a")
      a.href = result.downloadUrl
      a.download = result.fileName || `${action === "encrypt" ? "encrypted" : "decrypted"}_file`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }
  }

  // Add hover effects to buttons
  return (
    <section
      className={`p-6 rounded-xl border ${
        result.success
          ? "bg-gradient-to-r from-green-50 to-green-100 border-green-200"
          : "bg-gradient-to-r from-red-50 to-red-100 border-red-200"
      } shadow-md transition-all duration-300 hover:shadow-lg`}
    >
      <div className="flex items-start">
        <div className={`p-2 rounded-full ${result.success ? "bg-green-100" : "bg-red-100"} mr-3`}>
          {result.success ? (
            <Check className="h-5 w-5 text-green-600" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-600" />
          )}
        </div>
        <div className="flex-1">
          <h3 className={`font-medium ${result.success ? "text-green-800" : "text-red-800"}`}>{result.message}</h3>

          {result.success && action === "hash" && result.hash && (
            <div className="mt-3">
              <div className="flex items-center">
                <p className="text-sm text-gray-500 mb-1">Hash:</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-6 ml-auto transition-colors ${
                    copied ? "bg-green-100 text-green-600" : "hover:bg-green-100"
                  }`}
                  onClick={handleCopy}
                >
                  {copied ? (
                    <span className="text-xs text-green-600">Copied!</span>
                  ) : (
                    <>
                      <Copy className="h-3 w-3 mr-1" />
                      <span className="text-xs">Copy</span>
                    </>
                  )}
                </Button>
              </div>
              <div className="p-2 bg-white rounded font-mono text-xs break-all border border-green-200">
                {result.hash}
              </div>
            </div>
          )}

          {result.success && (action === "encrypt" || action === "decrypt") && result.downloadUrl && (
            <div className="mt-3">
              <Button
                className="w-full transition-all duration-200 hover:bg-green-600 hover:scale-[1.02] bg-gradient-to-r from-green-500 to-green-600"
                size="sm"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4 mr-2" />
                Download {action === "encrypt" ? "Encrypted" : "Decrypted"} File
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
