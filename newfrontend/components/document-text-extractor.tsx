"use client"

import { useState, useEffect, useRef } from "react"
import { Loader2, CheckCircle2, AlertCircle, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { Toggle } from "@/components/ui/toggle"
import Script from "next/script"

// Custom TextSelect icon since it's not in lucide-react
const TextSelect = (props: any) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M5 3a2 2 0 0 0-2 2" />
    <path d="M19 3a2 2 0 0 1 2 2" />
    <path d="M21 19a2 2 0 0 1-2 2" />
    <path d="M5 21a2 2 0 0 1-2-2" />
    <path d="M9 3h1" />
    <path d="M9 21h1" />
    <path d="M14 3h1" />
    <path d="M14 21h1" />
    <path d="M3 9v1" />
    <path d="M21 9v1" />
    <path d="M3 14v1" />
    <path d="M21 14v1" />
    <path d="M7 8h10" />
    <path d="M7 12h10" />
    <path d="M7 16h10" />
  </svg>
)

interface DocumentTextExtractorProps {
  file: File
  isPartialMode: boolean
  onTextSelection?: (
    selections: Array<{
      text: string
      pageNumber?: number
      position?: any
      startIndex?: number
      endIndex?: number
      length?: number
    }>,
  ) => void
}

export function DocumentTextExtractor({ file, isPartialMode, onTextSelection }: DocumentTextExtractorProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [extractedText, setExtractedText] = useState<Array<{ text: string; pageNumber: number }>>([])
  const [selectedTextRanges, setSelectedTextRanges] = useState<
    Array<{
      text: string
      pageNumber: number
      position?: any
      startIndex?: number
      endIndex?: number
      length?: number
    }>
  >([])
  const [isTextSelectionMode, setIsTextSelectionMode] = useState(isPartialMode)
  const [totalPages, setTotalPages] = useState(0)
  const [pdfJsLoaded, setPdfJsLoaded] = useState(false)
  const [fullDocumentText, setFullDocumentText] = useState("")
  const [docxContent, setDocxContent] = useState<string>("")

  const textContainerRef = useRef<HTMLDivElement>(null)

  // Handle PDF.js script loading
  const handlePdfJsLoaded = () => {
    setPdfJsLoaded(true)
  }

  // Extract text from PDF using PDF.js
  const extractTextFromPdf = async () => {
    try {
      setIsLoading(true)
      setError(null)

      if (!pdfJsLoaded) {
        throw new Error("PDF.js library not loaded yet. Please wait or refresh the page.")
      }

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
      const arrayBuffer = await file.arrayBuffer()
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })

      // Add error handling for the loading task
      loadingTask.onPassword = () => {
        clearTimeout(timeoutId)
        setIsLoading(false)
        setError("This PDF is password protected and cannot be processed.")
      }

      const pdf = await loadingTask.promise
      setTotalPages(pdf.numPages)

      const textContent: Array<{ text: string; pageNumber: number }> = []
      let completeText = ""
      let currentOffset = 0
      const pageOffsets: number[] = [0]

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

        // Update complete text and track offsets
        completeText += (i > 1 ? "\n\n" : "") + pageText
        currentOffset += pageText.length + (i > 1 ? 2 : 0) // +2 for the "\n\n" separator
        pageOffsets.push(currentOffset)
      }

      // Clear the timeout since processing completed
      clearTimeout(timeoutId)

      setExtractedText(textContent)
      setFullDocumentText(completeText)
      setIsLoading(false)
    } catch (error) {
      console.error("Error extracting text from PDF:", error)
      setError(`Failed to extract text from PDF: ${error instanceof Error ? error.message : "Unknown error"}`)
      setIsLoading(false)
    }
  }

  // Extract text from DOCX
  const extractTextFromDocx = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Dynamically import mammoth
      const mammothModule = await import("mammoth")
      const mammoth = mammothModule.default || mammothModule

      const arrayBuffer = await file.arrayBuffer()
      const result = await mammoth.extractRawText({ arrayBuffer })

      // Store the complete document text for position calculations
      const completeText = result.value
      setDocxContent(completeText)
      setFullDocumentText(completeText)

      // Split text into paragraphs
      const paragraphs = result.value.split("\n\n")
      const textContent = paragraphs.map((text: string, index: number) => ({
        text,
        pageNumber: 1, // DOCX doesn't have pages in the same way as PDF
      }))

      setExtractedText(textContent)
      setTotalPages(1)
      setIsLoading(false)
    } catch (error) {
      console.error("Error extracting text from DOCX:", error)
      setError("Failed to extract text from DOCX. Please try another file.")
      setIsLoading(false)
    }
  }

  // Process file when it changes
  useEffect(() => {
    if (!file) return

    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
    const isDocx =
      file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.name.toLowerCase().endsWith(".docx")

    if (isPdf) {
      if (!pdfJsLoaded) {
        return // Wait for PDF.js to load
      }
      extractTextFromPdf()
    } else if (isDocx) {
      extractTextFromDocx()
    }
  }, [file, pdfJsLoaded])

  // Handle text selection
  const handleTextSelection = () => {
    if (!isTextSelectionMode || !isPartialMode) return

    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0 || !selection.toString().trim()) return

    const text = selection.toString().trim()
    if (!text) return

    // Find which page the selection is on
    if (!textContainerRef.current) return

    const range = selection.getRangeAt(0)
    const startNode = range.startContainer.parentElement

    // Find the closest page container
    let pageElement = startNode
    let pageNumber = 1

    while (pageElement && !pageElement?.hasAttribute("data-page-number")) {
      pageElement = pageElement.parentElement
    }

    if (pageElement && pageElement.hasAttribute("data-page-number")) {
      pageNumber = Number.parseInt(pageElement.getAttribute("data-page-number") || "1", 10)
    }

    // Get position information for highlighting
    const rangeRect = range.getBoundingClientRect()
    const containerRect = textContainerRef.current.getBoundingClientRect()

    const position = {
      x: rangeRect.left - containerRect.left,
      y: rangeRect.top - containerRect.top,
      width: rangeRect.width,
      height: rangeRect.height,
    }

    // Calculate text indices
    const isDocx =
      file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.name.toLowerCase().endsWith(".docx")

    const contentToSearch = isDocx ? docxContent : fullDocumentText
    const startIndex = contentToSearch.indexOf(text)
    const endIndex = startIndex + text.length
    const length = text.length

    // Check if this selection already exists to prevent duplication
    const isDuplicate = selectedTextRanges.some(
      (existing) =>
        existing.text === text &&
        existing.pageNumber === pageNumber &&
        existing.startIndex === (startIndex >= 0 ? startIndex : undefined),
    )

    if (isDuplicate) return

    // Add to selected text ranges
    const newSelection = {
      text,
      pageNumber,
      position,
      startIndex: startIndex >= 0 ? startIndex : undefined,
      endIndex: startIndex >= 0 ? endIndex : undefined,
      length,
    }

    // Append the new selection to the existing ones (don't replace)
    const updatedSelections = [...selectedTextRanges, newSelection]
    setSelectedTextRanges(updatedSelections)

    // Call the callback if provided
    if (onTextSelection) {
      onTextSelection(updatedSelections)
    }
  }

  // Remove a text selection
  const handleRemoveTextSelection = (indexToRemove: number) => {
    // Create a new array without the item at the specified index
    const updatedSelections = selectedTextRanges.filter((_, index) => index !== indexToRemove)

    // Update the local state
    setSelectedTextRanges(updatedSelections)

    // Call the callback with updated selections if provided
    if (onTextSelection) {
      onTextSelection(updatedSelections)
    }
  }

  // Clear all selections
  const handleClearAllSelections = () => {
    setSelectedTextRanges([])

    if (onTextSelection) {
      onTextSelection([])
    }
  }

  // Select all text
  const handleSelectAllText = () => {
    if (!isPartialMode || extractedText.length === 0) return

    const allTextSelections = extractedText.map(({ text, pageNumber }, index) => {
      // Calculate text indices
      const isDocx =
        file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        file.name.toLowerCase().endsWith(".docx")

      const contentToSearch = isDocx ? docxContent : fullDocumentText
      const startIndex = contentToSearch.indexOf(text)
      const endIndex = startIndex + text.length
      const length = text.length

      return {
        text,
        pageNumber,
        position: null,
        startIndex,
        endIndex,
        length,
      }
    })

    setSelectedTextRanges(allTextSelections)

    if (onTextSelection) {
      onTextSelection(allTextSelections)
    }
  }

  // Add event listener for text selection
  useEffect(() => {
    const handleMouseUp = () => {
      if (isTextSelectionMode && isPartialMode) {
        handleTextSelection()
      }
    }

    document.addEventListener("mouseup", handleMouseUp)
    return () => {
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isTextSelectionMode, isPartialMode, fullDocumentText, docxContent])

  // Determine if this is a DOCX file
  const isDocx =
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    file.name.toLowerCase().endsWith(".docx")

  return (
    <>
      {/* Load PDF.js from CDN */}
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"
        onLoad={handlePdfJsLoaded}
        strategy="lazyOnload"
      />

      {error ? (
        <div className="flex flex-col items-center justify-center p-8 border rounded-lg bg-red-50">
          <AlertCircle className="h-8 w-8 text-red-600 mb-2" />
          <p className="text-sm font-medium text-red-800">{error}</p>
          <p className="text-xs text-gray-700 mt-2">
            Try with a different file or contact support if the issue persists.
          </p>
        </div>
      ) : isLoading ? (
        <div className="flex flex-col items-center justify-center p-8 border rounded-lg bg-gray-50">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-2" />
          <p className="text-sm font-medium">Extracting text from document...</p>
          <p className="text-xs text-gray-500 mt-1">This may take a moment for large files</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Controls */}
          <div className="flex flex-wrap gap-2 justify-between items-center bg-gray-50 p-3 rounded-lg border">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                {file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf") ? "PDF" : "DOCX"}
              </Badge>
              <span className="text-sm">
                {totalPages} page{totalPages !== 1 ? "s" : ""}
              </span>
            </div>

            {isPartialMode && (
              <div className="flex items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Toggle
                        pressed={isTextSelectionMode}
                        onPressedChange={setIsTextSelectionMode}
                        className={`h-8 ${isTextSelectionMode ? "bg-blue-100 text-blue-700" : ""}`}
                        aria-label="Toggle text selection mode"
                      >
                        <TextSelect className="h-4 w-4 mr-1" />
                        <span className="text-xs">Text Select</span>
                      </Toggle>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Enable to select text portions</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSelectAllText}
                        className="h-8 text-xs"
                        disabled={!isPartialMode}
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Select All
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Select all text in document</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                {selectedTextRanges.length > 0 && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleClearAllSelections}
                          className="h-8 text-xs text-red-500 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Clear
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Clear all selections</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            )}
          </div>

          {/* Text Content */}
          <div
            ref={textContainerRef}
            className={`relative border rounded-lg p-4 bg-white max-h-96 overflow-y-auto ${
              isTextSelectionMode && isPartialMode ? "cursor-text select-text" : "cursor-default select-none"
            }`}
          >
            {extractedText.length > 0 ? (
              extractedText.map(({ text, pageNumber }, index) => (
                <div
                  key={index}
                  className={`mb-4 ${index < extractedText.length - 1 ? "pb-4 border-b border-gray-200" : ""}`}
                  data-page-number={pageNumber}
                >
                  {pageNumber > 1 && (
                    <div className="text-xs text-gray-500 mb-2 pb-1 border-b border-gray-100">Page {pageNumber}</div>
                  )}
                  <div className="whitespace-pre-wrap text-sm">
                    {text.split("\n").map((line, lineIndex) => (
                      <p key={lineIndex} className={lineIndex > 0 ? "mt-1" : ""}>
                        {line || "\u00A0"}
                      </p>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 italic text-center py-8">
                No text content could be extracted from this document.
              </p>
            )}
          </div>

          {/* Selected Text Sections */}
          {isPartialMode && selectedTextRanges.length > 0 && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Selected Text Sections:</h3>
                <span className="text-xs text-gray-500">{selectedTextRanges.length} selection(s)</span>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {selectedTextRanges.map((selection, index) => (
                  <div key={index} className="flex items-start p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                    <div className="flex-1">
                      <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                        {(file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) && (
                          <span>Page {selection.pageNumber}</span>
                        )}
                        <span className="ml-auto text-xs text-gray-500">
                          Position: {selection.startIndex !== undefined ? selection.startIndex : "N/A"}-
                          {selection.endIndex !== undefined ? selection.endIndex : "N/A"} (
                          {selection.length !== undefined ? selection.length : "N/A"} chars)
                        </span>
                      </div>
                      <div className="font-mono text-xs break-all">
                        {selection.text.length > 100 ? `${selection.text.substring(0, 100)}...` : selection.text}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveTextSelection(index)}
                      className="h-6 text-gray-500 hover:text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )
}
