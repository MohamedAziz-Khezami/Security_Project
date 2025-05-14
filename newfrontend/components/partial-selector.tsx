"use client"

import type React from "react"

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import type { FileInfo } from "./secure-transfer"
import { Square, Copy, Save, Trash2, Plus } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { DocumentTextExtractor } from "./document-text-extractor"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface PartialSelectorProps {
  applyTo: "full" | "partial"
  onChange: (applyTo: "full" | "partial") => void
  fileInfo: FileInfo
  inputMode: "file" | "text"
  inputText: string
}

export function PartialSelector({ applyTo, onChange, fileInfo, inputMode, inputText }: PartialSelectorProps) {
  // State for text selections
  const [textSelections, setTextSelections] = useState<
    {
      text: string
      start: number
      end: number
      length: number
    }[]
  >([])

  // State for image selections
  const [imageSelections, setImageSelections] = useState<{ x: number; y: number; width: number; height: number }[]>([])

  // State for manual coordinate input
  const [manualCoords, setManualCoords] = useState({ x: 0, y: 0, width: 100, height: 100 })

  // State for rectangle selection
  const [isSelecting, setIsSelecting] = useState(false)
  const [startPos, setStartPos] = useState({ x: 0, y: 0 })
  const [currentRect, setCurrentRect] = useState({ x: 0, y: 0, width: 0, height: 0 })

  // State for document selections
  const [documentSelections, setDocumentSelections] = useState<
    Array<{
      text: string
      pageNumber?: number
      position?: any
      startIndex?: number
      endIndex?: number
      length?: number
    }>
  >([])

  // State for copied coordinates
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  // State for saved selections
  const [selectionsSaved, setSelectionsSaved] = useState(false)

  // Refs
  const imageRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLDivElement>(null)

  // Handle text selection
  const handleTextSelection = () => {
    if (applyTo !== "partial") return

    const selection = window.getSelection()
    if (selection && selection.toString().trim()) {
      const text = selection.toString().trim()
      if (!text) return

      // Determine the content source based on the input mode
      let content: string
      if (inputMode === "text") {
        content = inputText
      } else {
        content = fileInfo.content?.toString() || ""
      }

      // Calculate start and end positions
      const start = content.indexOf(text)
      if (start >= 0) {
        const end = start + text.length
        const length = text.length

        // Check if this selection already exists to prevent duplication
        const isDuplicate = textSelections.some((sel) => sel.start === start && sel.end === end && sel.text === text)

        if (!isDuplicate) {
          // Append the new selection to existing ones (don't replace)
          setTextSelections([...textSelections, { text, start, end, length }])
        }
      }
    }
  }

  // Handle removing a text selection
  const handleRemoveTextSelection = (index: number) => {
    const newSelections = [...textSelections]
    newSelections.splice(index, 1)
    setTextSelections(newSelections)
  }

  // Handle copying text
  const handleCopyText = (index: number) => {
    const selection = textSelections[index]
    navigator.clipboard.writeText(selection.text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  // Handle document text selection
  const handleDocumentTextSelection = (
    selections: Array<{
      text: string
      pageNumber?: number
      position?: any
      startIndex?: number
      endIndex?: number
      length?: number
    }>,
  ) => {
    // Update the document selections state - append, don't replace
    setDocumentSelections(selections)
  }

  // Handle rectangle selection start
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!imageRef.current || applyTo !== "partial") return

    const rect = imageRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setStartPos({ x, y })
    setIsSelecting(true)
    setCurrentRect({ x, y, width: 0, height: 0 })
  }

  // Handle rectangle selection movement
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isSelecting || !imageRef.current) return

    const rect = imageRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setCurrentRect({
      x: Math.min(startPos.x, x),
      y: Math.min(startPos.y, y),
      width: Math.abs(x - startPos.x),
      height: Math.abs(y - startPos.y),
    })
  }

  // Handle rectangle selection end
  const handleMouseUp = () => {
    if (isSelecting && currentRect.width > 5 && currentRect.height > 5) {
      // Round coordinates to integers for cleaner display
      const roundedRect = {
        x: Math.round(currentRect.x),
        y: Math.round(currentRect.y),
        width: Math.round(currentRect.width),
        height: Math.round(currentRect.height),
      }

      // Check for duplicate selection
      const isDuplicate = imageSelections.some(
        (sel) =>
          sel.x === roundedRect.x &&
          sel.y === roundedRect.y &&
          sel.width === roundedRect.width &&
          sel.height === roundedRect.height,
      )

      if (!isDuplicate) {
        // Append the new selection to existing ones (don't replace)
        setImageSelections([...imageSelections, roundedRect])
      }
    }
    setIsSelecting(false)
  }

  // Handle removing an image selection
  const handleRemoveImageSelection = (index: number) => {
    const newSelections = [...imageSelections]
    newSelections.splice(index, 1)
    setImageSelections(newSelections)
    setCopiedIndex(null)
  }

  // Handle copying coordinates
  const handleCopyCoordinates = (index: number) => {
    const selection = imageSelections[index]
    const coordsText = `x: ${selection.x}, y: ${selection.y}, width: ${selection.width}, height: ${selection.height}`
    navigator.clipboard.writeText(coordsText)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  // Handle saving all selections
  const handleSaveSelections = () => {
    // In a real app, this would save to a database or file
    // For now, we'll just set a state to indicate they've been "saved"
    setSelectionsSaved(true)
    setTimeout(() => setSelectionsSaved(false), 3000)
  }

  // Handle manual coordinate input change
  const handleManualCoordsChange = (field: "x" | "y" | "width" | "height", value: string) => {
    const numValue = Number.parseInt(value, 10) || 0
    setManualCoords({
      ...manualCoords,
      [field]: numValue,
    })
  }

  // Handle adding manual coordinates
  const handleAddManualCoords = () => {
    // Validate coordinates
    if (manualCoords.width <= 0 || manualCoords.height <= 0) {
      return // Don't add invalid coordinates
    }

    // Check for duplicate selection
    const isDuplicate = imageSelections.some(
      (sel) =>
        sel.x === manualCoords.x &&
        sel.y === manualCoords.y &&
        sel.width === manualCoords.width &&
        sel.height === manualCoords.height,
    )

    if (!isDuplicate) {
      // Append the new selection to existing ones (don't replace)
      setImageSelections([...imageSelections, { ...manualCoords }])
    }

    // Reset width and height but keep x and y for convenience
    setManualCoords({
      ...manualCoords,
      width: 100,
      height: 100,
    })
  }

  // Clear all text selections
  const handleClearAllTextSelections = () => {
    setTextSelections([])
  }

  // Add effect for global mouse up
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsSelecting(false)
    }

    window.addEventListener("mouseup", handleGlobalMouseUp)
    return () => {
      window.removeEventListener("mouseup", handleGlobalMouseUp)
    }
  }, [])

  // Add event listener for text selection
  useEffect(() => {
    const handleMouseUp = () => {
      if (applyTo === "partial") {
        handleTextSelection()
      }
    }

    if (textRef.current) {
      textRef.current.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      if (textRef.current) {
        textRef.current.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [applyTo, textRef.current, inputMode, inputText, fileInfo.content, textSelections])

  // Render document content preview
  const renderDocumentContent = () => {
    if (!fileInfo.file) return null

    return (
      <div className="space-y-4">
        <DocumentTextExtractor
          file={fileInfo.file}
          isPartialMode={applyTo === "partial"}
          onTextSelection={applyTo === "partial" ? handleDocumentTextSelection : undefined}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <RadioGroup
        value={applyTo}
        onValueChange={(value) => onChange(value as "full" | "partial")}
        className="flex flex-col sm:flex-row gap-4"
      >
        <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors flex-1">
          <RadioGroupItem value="full" id="full" className="sr-only" />
          <Label
            htmlFor="full"
            className={`flex items-center gap-3 cursor-pointer w-full ${
              applyTo === "full" ? "text-blue-600 font-medium" : ""
            }`}
          >
            <span>Full {inputMode === "file" ? "File" : "Text"}</span>
          </Label>
        </div>

        <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors flex-1">
          <RadioGroupItem value="partial" id="partial" className="sr-only" />
          <Label
            htmlFor="partial"
            className={`flex items-center gap-3 cursor-pointer w-full ${
              applyTo === "partial" ? "text-blue-600 font-medium" : ""
            }`}
          >
            <span>Partial (select sections)</span>
          </Label>
        </div>
      </RadioGroup>

      {/* Document Preview - Show for both Full and Partial */}
      {inputMode === "file" && (fileInfo.type === "pdf" || fileInfo.type === "docx") && fileInfo.file && (
        <div className="mt-4 border rounded-lg p-4">
          <h3 className="text-sm font-medium mb-3">Document Preview & Text Selection</h3>
          {renderDocumentContent()}
        </div>
      )}

      {applyTo === "partial" && (
        <div className="mt-4 border rounded-lg p-4">
          {/* Text selection UI - Improved for TXT files */}
          {((inputMode === "text" && inputText) ||
            (inputMode === "file" && fileInfo.type === "text" && fileInfo.content)) && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Select text to process:</p>
                <p className="text-xs text-gray-500">
                  Highlight text and release mouse to select. Multiple selections allowed.
                </p>
              </div>

              <div
                ref={textRef}
                className="p-4 bg-gray-50 rounded border text-sm font-mono whitespace-pre-wrap max-h-60 overflow-y-auto"
              >
                {/* Render text with highlighted selections */}
                {(() => {
                  const content = inputMode === "text" ? inputText : fileInfo.content?.toString() || ""
                  if (textSelections.length === 0) {
                    return content
                  }

                  // Sort selections by start position
                  const sortedSelections = [...textSelections].sort((a, b) => a.start - b.start)

                  // Create an array of text chunks and highlighted selections
                  const chunks = []
                  let lastEnd = 0

                  for (const selection of sortedSelections) {
                    // Add text before this selection
                    if (selection.start > lastEnd) {
                      chunks.push(<span key={`text-${lastEnd}`}>{content.substring(lastEnd, selection.start)}</span>)
                    }

                    // Add the highlighted selection
                    chunks.push(
                      <span
                        key={`selection-${selection.start}`}
                        className="bg-blue-200 rounded px-1 transition-colors hover:bg-blue-300"
                      >
                        {content.substring(selection.start, selection.end)}
                      </span>,
                    )

                    lastEnd = selection.end
                  }

                  // Add any remaining text
                  if (lastEnd < content.length) {
                    chunks.push(<span key={`text-${lastEnd}`}>{content.substring(lastEnd)}</span>)
                  }

                  return chunks
                })()}
              </div>

              {textSelections.length > 0 && (
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">Selected sections ({textSelections.length}):</p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleClearAllTextSelections}
                        className="h-7 text-xs text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Clear All
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSaveSelections}
                        className="h-7 text-xs"
                        disabled={selectionsSaved}
                      >
                        <Save className="h-3 w-3 mr-1" />
                        {selectionsSaved ? "Saved!" : "Save Selections"}
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                    {textSelections.map((selection, index) => (
                      <div
                        key={index}
                        className="flex items-start p-2 bg-blue-50 border border-blue-200 rounded transition-all hover:shadow-sm"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                            <span>
                              Position: {selection.start}-{selection.end} ({selection.length} chars)
                            </span>
                          </div>
                          <div className="font-mono text-xs break-all">
                            {selection.text.length > 50 ? `${selection.text.substring(0, 50)}...` : selection.text}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyText(index)}
                            className={`h-6 ${
                              copiedIndex === index
                                ? "text-green-600 bg-green-50"
                                : "text-gray-500 hover:text-blue-500 hover:bg-blue-50"
                            }`}
                          >
                            {copiedIndex === index ? (
                              <span className="text-xs text-green-600">Copied!</span>
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveTextSelection(index)}
                            className="h-6 text-gray-500 hover:text-red-500 hover:bg-red-50"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Image selection UI - With manual coordinate input */}
          {inputMode === "file" && fileInfo.type === "image" && fileInfo.content && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium">Select areas to process:</p>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Square className="h-3 w-3" />
                  <span>Rectangle selection</span>
                </div>
              </div>

              <p className="text-xs text-gray-500 mb-2">
                Click and drag to create rectangular selections, or enter coordinates manually below.
              </p>

              {/* Manual coordinate input */}
              <Card className="bg-gray-50 border-gray-200">
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium">Manual Coordinate Input</CardTitle>
                </CardHeader>
                <CardContent className="py-3">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                    <div>
                      <Label htmlFor="x-coord" className="text-xs mb-1 block">
                        X Position
                      </Label>
                      <Input
                        id="x-coord"
                        type="number"
                        min="0"
                        value={manualCoords.x}
                        onChange={(e) => handleManualCoordsChange("x", e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="y-coord" className="text-xs mb-1 block">
                        Y Position
                      </Label>
                      <Input
                        id="y-coord"
                        type="number"
                        min="0"
                        value={manualCoords.y}
                        onChange={(e) => handleManualCoordsChange("y", e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="width-coord" className="text-xs mb-1 block">
                        Width
                      </Label>
                      <Input
                        id="width-coord"
                        type="number"
                        min="1"
                        value={manualCoords.width}
                        onChange={(e) => handleManualCoordsChange("width", e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="height-coord" className="text-xs mb-1 block">
                        Height
                      </Label>
                      <Input
                        id="height-coord"
                        type="number"
                        min="1"
                        value={manualCoords.height}
                        onChange={(e) => handleManualCoordsChange("height", e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleAddManualCoords}
                    size="sm"
                    className="w-full"
                    disabled={manualCoords.width <= 0 || manualCoords.height <= 0}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Zone
                  </Button>
                </CardContent>
              </Card>

              <div
                className="relative border rounded overflow-hidden cursor-crosshair mt-4"
                ref={imageRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
              >
                {/* Image display */}
                <div
                  className="w-full h-64 bg-gray-200 flex items-center justify-center"
                  style={{
                    backgroundImage: `url(${fileInfo.content.toString()})`,
                    backgroundSize: "contain",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                  }}
                ></div>

                {/* Current rectangle selection */}
                {isSelecting && currentRect.width > 5 && currentRect.height > 5 && (
                  <div
                    className="absolute border-2 border-blue-500 bg-blue-500 bg-opacity-20 pointer-events-none"
                    style={{
                      left: `${currentRect.x}px`,
                      top: `${currentRect.y}px`,
                      width: `${currentRect.width}px`,
                      height: `${currentRect.height}px`,
                    }}
                  ></div>
                )}

                {/* Existing selections */}
                {imageSelections.map((selection, index) => (
                  <div
                    key={index}
                    className="absolute border-2 border-green-500 bg-green-500 bg-opacity-20"
                    style={{
                      left: `${selection.x}px`,
                      top: `${selection.y}px`,
                      width: `${selection.width}px`,
                      height: `${selection.height}px`,
                    }}
                  >
                    <Badge variant="outline" className="absolute -top-3 -left-3 bg-white text-xs px-1 py-0 h-5">
                      {index + 1}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveImageSelection(index)}
                      className="absolute -top-3 -right-3 h-6 w-6 p-0 rounded-full bg-white text-red-500 hover:bg-red-50 border border-gray-200"
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>

              {imageSelections.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium">Selected Zones ({imageSelections.length}):</h3>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setImageSelections([])}
                        className="h-7 text-xs text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Clear All
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSaveSelections}
                        className="h-7 text-xs"
                        disabled={selectionsSaved}
                      >
                        <Save className="h-3 w-3 mr-1" />
                        {selectionsSaved ? "Saved!" : "Save Selections"}
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 max-h-60 overflow-y-auto">
                    {imageSelections.map((selection, index) => (
                      <div
                        key={index}
                        className="flex items-center p-2 bg-gray-50 border rounded text-sm transition-all hover:shadow-sm"
                      >
                        <Badge className="mr-2 bg-green-100 text-green-800 border-green-200">{index + 1}</Badge>
                        <div className="flex-1 font-mono text-xs">
                          x: {selection.x}, y: {selection.y}, w: {selection.width}, h: {selection.height}
                        </div>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCopyCoordinates(index)}
                                className={`h-6 ${
                                  copiedIndex === index
                                    ? "text-green-600 bg-green-50"
                                    : "text-gray-500 hover:text-blue-500 hover:bg-blue-50"
                                }`}
                              >
                                {copiedIndex === index ? (
                                  <span className="text-xs text-green-600">Copied!</span>
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Copy coordinates</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {inputMode === "file" && fileInfo.type === "other" && (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500">
                Partial processing is only available for text, image, PDF, and DOCX files
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
