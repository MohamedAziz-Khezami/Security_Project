"use client"

import { useState, useRef, useEffect } from "react"
import { Document, Page, pdfjs } from "react-pdf"
import { Loader2, ChevronLeft, ChevronRight, Search, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Toggle } from "@/components/ui/toggle"

// Initialize PDF.js worker
// This needs to be done only once in your application
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`

interface PdfPreviewProps {
  file: File
  onTextSelection?: (
    text: string,
    pageNumber: number,
    position: { x: number; y: number; width: number; height: number },
  ) => void
  isPartialMode: boolean
}

export function PdfPreview({ file, onTextSelection, isPartialMode }: PdfPreviewProps) {
  const [numPages, setNumPages] = useState<number | null>(null)
  const [pageNumber, setPageNumber] = useState<number>(1)
  const [scale, setScale] = useState<number>(1.0)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [isTextSelectionMode, setIsTextSelectionMode] = useState<boolean>(isPartialMode)
  const [selectedTextRanges, setSelectedTextRanges] = useState<
    Array<{
      text: string
      pageNumber: number
      position: { x: number; y: number; width: number; height: number }
    }>
  >([])

  const containerRef = useRef<HTMLDivElement>(null)
  const pdfContainerRef = useRef<HTMLDivElement>(null)

  // Function to handle document loading success
  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setIsLoading(false)
  }

  // Function to handle text selection
  const handleTextSelection = () => {
    if (!isTextSelectionMode || !isPartialMode) return

    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0 || !selection.toString().trim()) return

    const text = selection.toString().trim()
    if (!text) return

    // Get the range and its bounding rect
    const range = selection.getRangeAt(0)
    const rangeRect = range.getBoundingClientRect()

    // Get the container's position
    if (!pdfContainerRef.current) return
    const containerRect = pdfContainerRef.current.getBoundingClientRect()

    // Calculate position relative to the container
    const position = {
      x: rangeRect.left - containerRect.left,
      y: rangeRect.top - containerRect.top,
      width: rangeRect.width,
      height: rangeRect.height,
    }

    // Add to selected text ranges
    const newSelection = {
      text,
      pageNumber,
      position,
    }

    setSelectedTextRanges((prev) => [...prev, newSelection])

    // Call the callback if provided
    if (onTextSelection) {
      onTextSelection(text, pageNumber, position)
    }
  }

  // Function to remove a text selection
  const removeTextSelection = (index: number) => {
    setSelectedTextRanges((prev) => prev.filter((_, i) => i !== index))
  }

  // Function to clear all selections
  const clearAllSelections = () => {
    setSelectedTextRanges([])
  }

  // Function to navigate to previous page
  const goToPrevPage = () => {
    setPageNumber((prev) => Math.max(prev - 1, 1))
  }

  // Function to navigate to next page
  const goToNextPage = () => {
    if (numPages) {
      setPageNumber((prev) => Math.min(prev + 1, numPages))
    }
  }

  // Function to zoom in
  const zoomIn = () => {
    setScale((prev) => Math.min(prev + 0.2, 2.0))
  }

  // Function to zoom out
  const zoomOut = () => {
    setScale((prev) => Math.max(prev - 0.2, 0.6))
  }

  // Function to reset zoom
  const resetZoom = () => {
    setScale(1.0)
  }

  // Function to handle search
  const handleSearch = () => {
    if (!searchQuery.trim()) return
    // Implement PDF search functionality here
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
  }, [isTextSelectionMode, isPartialMode, pageNumber])

  return (
    <div className="pdf-preview space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap gap-2 justify-between items-center bg-gray-50 p-3 rounded-lg border">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToPrevPage} disabled={pageNumber <= 1} className="h-8 w-8 p-0">
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous page</span>
          </Button>

          <span className="text-sm">
            Page {pageNumber} of {numPages || "?"}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={goToNextPage}
            disabled={numPages === null || pageNumber >= numPages}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Next page</span>
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={zoomOut} className="h-8 px-2">
            -
          </Button>
          <span className="text-sm">{Math.round(scale * 100)}%</span>
          <Button variant="outline" size="sm" onClick={zoomIn} className="h-8 px-2">
            +
          </Button>
          <Button variant="outline" size="sm" onClick={resetZoom} className="h-8 px-2 text-xs">
            Reset
          </Button>
        </div>

        {isPartialMode && (
          <div className="flex items-center gap-2">
            <Toggle
              pressed={isTextSelectionMode}
              onPressedChange={setIsTextSelectionMode}
              className={`h-8 ${isTextSelectionMode ? "bg-blue-100 text-blue-700" : ""}`}
              aria-label="Toggle text selection mode"
            >
              <Eye className="h-4 w-4 mr-1" />
              <span className="text-xs">Text Select</span>
            </Toggle>

            {selectedTextRanges.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllSelections}
                className="h-8 text-xs text-red-500 hover:bg-red-50"
              >
                Clear All
              </Button>
            )}
          </div>
        )}

        <div className="flex items-center gap-2">
          <Input
            type="text"
            placeholder="Search in PDF..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 text-sm w-40"
          />
          <Button variant="outline" size="sm" onClick={handleSearch} className="h-8">
            <Search className="h-4 w-4" />
            <span className="sr-only">Search</span>
          </Button>
        </div>
      </div>

      {/* PDF Viewer */}
      <div ref={containerRef} className="border rounded-lg overflow-hidden bg-white" style={{ minHeight: "400px" }}>
        {isLoading && (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2">Loading PDF...</span>
          </div>
        )}

        <div
          ref={pdfContainerRef}
          className={`pdf-container ${isTextSelectionMode && isPartialMode ? "text-selection-enabled" : ""}`}
          style={{
            cursor: isTextSelectionMode && isPartialMode ? "text" : "default",
            userSelect: isTextSelectionMode && isPartialMode ? "text" : "none",
          }}
        >
          <Document
            file={file}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={(error) => console.error("Error loading PDF:", error)}
            className="pdf-document"
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              renderTextLayer={true}
              renderAnnotationLayer={true}
              className="pdf-page"
              customTextRenderer={({ str }) => str}
            />
          </Document>
        </div>
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
                    <span>Page {selection.pageNumber}</span>
                  </div>
                  <div className="font-mono text-xs break-all">
                    {selection.text.length > 100 ? `${selection.text.substring(0, 100)}...` : selection.text}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeTextSelection(index)}
                  className="h-6 text-gray-500 hover:text-red-500 hover:bg-red-50"
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default PdfPreview
