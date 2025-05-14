"use client"

import { useState, useEffect } from "react"
import { Loader2, FileText, AlertCircle } from "lucide-react"
import Script from "next/script"

interface PdfPreviewWrapperProps {
  file: File
  onTextSelection?: (
    text: string,
    pageNumber: number,
    position: { x: number; y: number; width: number; height: number },
  ) => void
  isPartialMode: boolean
}

export function PdfPreviewWrapper(props: PdfPreviewWrapperProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [pdfText, setPdfText] = useState<Array<{ text: string; pageNumber: number }>>([])
  const [pdfJsLoaded, setPdfJsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [scriptError, setScriptError] = useState(false)

  // Handle PDF.js script loading
  const handlePdfJsLoaded = () => {
    setPdfJsLoaded(true)
  }

  const handleScriptError = () => {
    setScriptError(true)
    setIsLoading(false)
    setError("Failed to load PDF.js library. Please try again later.")
  }

  // Extract text from PDF using PDF.js
  useEffect(() => {
    if (!pdfJsLoaded || scriptError) return

    const extractText = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Access the PDF.js library from the window object
        const pdfjsLib = (window as any).pdfjsLib
        if (!pdfjsLib) {
          throw new Error("PDF.js library not available")
        }

        // Set a timeout to prevent infinite loading
        const timeoutId = setTimeout(() => {
          setIsLoading(false)
          setError("PDF processing took too long. The file might be too large or complex.")
        }, 30000) // 30 second timeout

        // Load the PDF file
        const arrayBuffer = await props.file.arrayBuffer()
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })

        // Add error handling for the loading task
        loadingTask.onPassword = () => {
          clearTimeout(timeoutId)
          setIsLoading(false)
          setError("This PDF is password protected and cannot be processed.")
        }

        const pdf = await loadingTask.promise
        const textContent: Array<{ text: string; pageNumber: number }> = []

        // Extract text from each page
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i)
          const content = await page.getTextContent({
            normalizeWhitespace: true,
            disableCombineTextItems: false,
          })

          // Process text items with proper encoding handling
          let pageText = ""
          let lastY: number | null = null
          let lastX: number | null = null

          for (const item of content.items) {
            if ("str" in item) {
              const textItem = item as any

              // Add newline if y-position changes significantly
              if (lastY !== null && Math.abs(textItem.transform[5] - lastY) > 5) {
                pageText += "\n"
                lastX = null
              }
              // Add space if x-position indicates a new word
              else if (lastX !== null && textItem.transform[4] - lastX > 10) {
                pageText += " "
              }

              // Add the text with proper encoding
              pageText += textItem.str
              lastY = textItem.transform[5]
              lastX = textItem.transform[4] + (textItem.width || 0)
            }
          }

          // Clean up the text
          pageText = pageText
            .replace(/\s+/g, " ") // Replace multiple spaces with a single space
            .replace(/\n\s+/g, "\n") // Remove spaces after newlines
            .replace(/\n{3,}/g, "\n\n") // Replace 3+ newlines with just 2
            .trim()

          textContent.push({ text: pageText, pageNumber: i })
        }

        // Clear the timeout since processing completed
        clearTimeout(timeoutId)

        setPdfText(textContent)
        setIsLoading(false)
      } catch (error) {
        console.error("Error extracting PDF text:", error)
        setError(`Failed to extract text from PDF: ${error instanceof Error ? error.message : "Unknown error"}`)
        setIsLoading(false)
      }
    }

    extractText()
  }, [props.file, pdfJsLoaded, scriptError])

  return (
    <>
      {/* Load PDF.js from CDN */}
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"
        onLoad={handlePdfJsLoaded}
        onError={handleScriptError}
        strategy="lazyOnload"
      />

      {error ? (
        <div className="border rounded-lg p-4 bg-red-50 text-red-800">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2 mt-0.5" />
            <div>
              <h3 className="font-medium">Error Processing PDF</h3>
              <p className="text-sm mt-1">{error}</p>
              <p className="text-xs mt-2">Try with a different PDF file or contact support if the issue persists.</p>
            </div>
          </div>
        </div>
      ) : isLoading ? (
        <div className="flex flex-col items-center justify-center h-64 border rounded-lg bg-gray-50">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-2" />
          <p className="text-sm font-medium">Extracting text from PDF...</p>
          <p className="text-xs text-gray-500 mt-1">This may take a moment for large files</p>
        </div>
      ) : (
        <div className="border rounded-lg p-4 bg-white">
          <div className="flex items-center mb-4">
            <FileText className="h-6 w-6 text-blue-600 mr-2" />
            <h3 className="font-medium">PDF Preview ({pdfText.length} pages)</h3>
          </div>

          <div className="whitespace-pre-wrap text-sm max-h-96 overflow-y-auto select-text">
            {pdfText.length > 0 ? (
              pdfText.map((page, pageIndex) => (
                <div key={pageIndex} className="mb-4">
                  {pageIndex > 0 && (
                    <div className="text-xs text-gray-500 mb-2 pb-1 border-b border-gray-200">
                      Page {page.pageNumber}
                    </div>
                  )}
                  <div>
                    {page.text.split("\n").map((line, lineIndex) => (
                      <p key={lineIndex} className={lineIndex > 0 ? "mt-1" : ""}>
                        {line || "\u00A0"}
                      </p>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 italic">No text content could be extracted from this PDF.</p>
            )}
          </div>
        </div>
      )}
    </>
  )
}
