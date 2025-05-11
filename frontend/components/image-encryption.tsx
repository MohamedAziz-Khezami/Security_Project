"use client"

import type React from "react"

import { useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Lock,
  Unlock,
  ImageIcon,
  Trash2,
  Info,
  ZoomIn,
  ZoomOut,
  Move,
  Pencil,
  X,
  HelpCircle,
  Undo,
  Redo,
  Eye,
  CheckCircle,
  AlertCircle,
  Download,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"

type Rectangle = {
  id: string
  x: number
  y: number
  width: number
  height: number
}

type SelectionMode = "create" | "edit" | "delete" | "move" | "zoom" | "resize"

type ResizeHandle = {
  position: "top-left" | "top-middle" | "top-right" | "right-middle" | "bottom-right" | "bottom-middle" | "bottom-left" | "left-middle"
  rect: Rectangle
}

type Result = {
  success: boolean;
  message: string;
  processed_image?: string;
}

type RectangleInput = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isEditing?: boolean;
}

export default function ImageEncryption() {
  const [operation, setOperation] = useState<"encrypt" | "decrypt">("encrypt")
  const [password, setPassword] = useState("")
  const [image, setImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [rectangles, setRectangles] = useState<Rectangle[]>([])
  const [currentRect, setCurrentRect] = useState<Rectangle | null>(null)
  const [algorithm, setAlgorithm] = useState("aes")
  const [selectionMode, setSelectionMode] = useState<SelectionMode>("create")
  const [selectedRectId, setSelectedRectId] = useState<string | null>(null)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 })
  const [showHelp, setShowHelp] = useState(false)
  const [progress, setProgress] = useState(0)
  const [history, setHistory] = useState<Rectangle[][]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [activeStep, setActiveStep] = useState(1)
  const [showPreview, setShowPreview] = useState(false)
  const [editingRect, setEditingRect] = useState<RectangleInput | null>(null)

  // Algorithm-specific parameters
  const [aesKeySize, setAesKeySize] = useState("256")
  const [aesMode, setAesMode] = useState("gcm")
  const [aesIv, setAesIv] = useState("")

  const [chachaMode, setChachaMode] = useState("chacha20-poly1305")
  const [chachaNonce, setChachaNonce] = useState("")

  const [rc4Key, setRc4Key] = useState("")

  const [logisticInitialValue, setLogisticInitialValue] = useState("0.4")
  const [logisticParameter, setLogisticParameter] = useState("3.99")

  const [resizeHandle, setResizeHandle] = useState<ResizeHandle | null>(null)
  const [isResizing, setIsResizing] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const selectionCanvasRef = useRef<HTMLCanvasElement>(null)
  const previewCanvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)

  useEffect(() => {
    // Reset algorithm-specific fields when algorithm changes
    if (algorithm === "aes") {
      setAesIv("")
    } else if (algorithm === "chacha20") {
      setChachaNonce("")
    } else if (algorithm === "rc4") {
      setRc4Key("")
    } else if (algorithm === "logistic") {
      setLogisticInitialValue("0.4")
      setLogisticParameter("3.99")
    }
  }, [algorithm])

  // Save to history when rectangles change
  useEffect(() => {
    if (rectangles.length > 0 && (historyIndex === -1 || JSON.stringify(rectangles) !== JSON.stringify(history[historyIndex]))) {
      const newHistory = historyIndex === -1 ? [] : history.slice(0, historyIndex + 1);
      setHistory([...newHistory, [...rectangles]]);
      setHistoryIndex(newHistory.length);
    }
  }, [rectangles]);

  // Handle file selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const reader = new FileReader()

      reader.onload = (event) => {
        if (event.target?.result) {
          const imageData = event.target.result as string
          setImage(imageData)
          setResult(null)
          setRectangles([])
          setHistory([])
          setHistoryIndex(-1)
          setZoomLevel(1)
          setPanOffset({ x: 0, y: 0 })
          setActiveStep(2)

          // Load image to get dimensions
          const img = new Image()
          img.crossOrigin = "anonymous"
          img.onload = () => {
            imageRef.current = img
            initializeCanvas()
          }
          img.src = imageData
        }
      }

      reader.readAsDataURL(file)
    }
  }

  // Initialize canvas with image
  const initializeCanvas = () => {
    if (!canvasRef.current || !selectionCanvasRef.current || !imageRef.current) return

    const canvas = canvasRef.current
    const selectionCanvas = selectionCanvasRef.current
    const img = imageRef.current

    // Set canvas dimensions to match image
    canvas.width = img.width
    canvas.height = img.height
    selectionCanvas.width = img.width
    selectionCanvas.height = img.height

    // Initialize preview canvas if it exists
    if (previewCanvasRef.current) {
      previewCanvasRef.current.width = img.width
      previewCanvasRef.current.height = img.height
    }

    // Draw image on main canvas
    const ctx = canvas.getContext("2d")
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)
    }

    // Clear selection canvas
    const selectionCtx = selectionCanvas.getContext("2d")
    if (selectionCtx) {
      selectionCtx.clearRect(0, 0, selectionCanvas.width, selectionCanvas.height)
    }

    // Draw rectangles if any exist
    drawRectangles()
  }

  // Add a new effect to reinitialize canvas when operation changes
  useEffect(() => {
    if (image && canvasRef.current && selectionCanvasRef.current && imageRef.current) {
      initializeCanvas()
    }
  }, [operation])

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!selectionCanvasRef.current) return { x: 0, y: 0 }

    const canvas = selectionCanvasRef.current
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width / zoomLevel
    const scaleY = canvas.height / rect.height / zoomLevel

    return {
      x: (e.clientX - rect.left) * scaleX - panOffset.x / zoomLevel,
      y: (e.clientY - rect.top) * scaleY - panOffset.y / zoomLevel
    }
  }

  const getResizeHandle = (e: React.MouseEvent<HTMLCanvasElement>, rect: Rectangle): ResizeHandle | null => {
    const coords = getCanvasCoordinates(e)
    const handleSize = 8 / zoomLevel
    
    // Define handle positions
    const handles = [
      { position: "top-left" as const, x: rect.x, y: rect.y },
      { position: "top-middle" as const, x: rect.x + rect.width / 2, y: rect.y },
      { position: "top-right" as const, x: rect.x + rect.width, y: rect.y },
      { position: "right-middle" as const, x: rect.x + rect.width, y: rect.y + rect.height / 2 },
      { position: "bottom-right" as const, x: rect.x + rect.width, y: rect.y + rect.height },
      { position: "bottom-middle" as const, x: rect.x + rect.width / 2, y: rect.y + rect.height },
      { position: "bottom-left" as const, x: rect.x, y: rect.y + rect.height },
      { position: "left-middle" as const, x: rect.x, y: rect.y + rect.height / 2 }
    ]

    // Check if mouse is over any handle
    for (const handle of handles) {
      if (
        Math.abs(coords.x - handle.x) <= handleSize &&
        Math.abs(coords.y - handle.y) <= handleSize
      ) {
        return { position: handle.position, rect }
      }
    }

    return null
  }

  // Handle mouse events on canvas
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoordinates(e)

    if (selectionMode === "move") {
      setIsPanning(true)
      setLastPanPoint({ x: e.clientX, y: e.clientY })
      return
    }

    if (selectionMode === "delete") {
      const clickedRectIndex = rectangles.findIndex(rect => 
        coords.x >= rect.x && 
        coords.x <= rect.x + rect.width && 
        coords.y >= rect.y && 
        coords.y <= rect.y + rect.height
      )
      
      if (clickedRectIndex !== -1) {
        const newRectangles = [...rectangles]
        newRectangles.splice(clickedRectIndex, 1)
        setRectangles(newRectangles)
      }
      return
    }

    if (selectionMode === "edit") {
      // Check for resize handles first
      for (const rect of rectangles) {
        const handle = getResizeHandle(e, rect)
        if (handle) {
          setResizeHandle(handle)
          setIsResizing(true)
          setSelectedRectId(rect.id)
          return
        }
      }

      // If no resize handle, check for rectangle selection
      const clickedRectIndex = rectangles.findIndex(rect => 
        coords.x >= rect.x && 
        coords.x <= rect.x + rect.width && 
        coords.y >= rect.y && 
        coords.y <= rect.y + rect.height
      )
      
      if (clickedRectIndex !== -1) {
        setSelectedRectId(rectangles[clickedRectIndex].id)
      }
      return
    }

    if (selectionMode === "create") {
      setIsDrawing(true)
      const newRect: Rectangle = {
        id: Date.now().toString(),
        x: coords.x,
        y: coords.y,
        width: 0,
        height: 0
      }
      setCurrentRect(newRect)
    }
  }

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanning && selectionMode === "move") {
      const dx = e.clientX - lastPanPoint.x
      const dy = e.clientY - lastPanPoint.y
      
      setPanOffset(prev => ({
        x: prev.x + dx,
        y: prev.y + dy
      }))
      
      setLastPanPoint({ x: e.clientX, y: e.clientY })
      return
    }

    if (isResizing && resizeHandle) {
      const coords = getCanvasCoordinates(e)
      const rect = resizeHandle.rect
      let newRect = { ...rect }

      switch (resizeHandle.position) {
        case "top-left":
          newRect.width = rect.x + rect.width - coords.x
          newRect.height = rect.y + rect.height - coords.y
          newRect.x = coords.x
          newRect.y = coords.y
          break
        case "top-middle":
          newRect.height = rect.y + rect.height - coords.y
          newRect.y = coords.y
          break
        case "top-right":
          newRect.width = coords.x - rect.x
          newRect.height = rect.y + rect.height - coords.y
          newRect.y = coords.y
          break
        case "right-middle":
          newRect.width = coords.x - rect.x
          break
        case "bottom-right":
          newRect.width = coords.x - rect.x
          newRect.height = coords.y - rect.y
          break
        case "bottom-middle":
          newRect.height = coords.y - rect.y
          break
        case "bottom-left":
          newRect.width = rect.x + rect.width - coords.x
          newRect.height = coords.y - rect.y
          newRect.x = coords.x
          break
        case "left-middle":
          newRect.width = rect.x + rect.width - coords.x
          newRect.x = coords.x
          break
      }

      // Ensure minimum size
      if (newRect.width >= 5 && newRect.height >= 5) {
        setRectangles(prev => prev.map(r => 
          r.id === rect.id ? newRect : r
        ))
      }
      return
    }

    if (!isDrawing || !currentRect || selectionMode !== "create") return

    const coords = getCanvasCoordinates(e)
    
    const updatedRect = {
      ...currentRect,
      width: coords.x - currentRect.x,
      height: coords.y - currentRect.y
    }

    setCurrentRect(updatedRect)
  }

  const handleCanvasMouseUp = () => {
    if (isPanning) {
      setIsPanning(false)
      return
    }

    if (isResizing) {
      setIsResizing(false)
      setResizeHandle(null)
      return
    }

    if (!isDrawing || !currentRect || selectionMode !== "create") {
      setIsDrawing(false)
      return
    }

    if (Math.abs(currentRect.width) > 5 && Math.abs(currentRect.height) > 5) {
      const normalizedRect = normalizeRectangle(currentRect)
      setRectangles([...rectangles, normalizedRect])
    }

    setIsDrawing(false)
    setCurrentRect(null)
  }

  const normalizeRectangle = (rect: Rectangle): Rectangle => {
    let { x, y, width, height } = rect

    if (width < 0) {
      x = x + width
      width = Math.abs(width)
    }

    if (height < 0) {
      y = y + height
      height = Math.abs(height)
    }

    return { ...rect, x, y, width, height }
  }

  const drawRectangles = () => {
    if (!selectionCanvasRef.current) return

    const canvas = selectionCanvasRef.current
    const ctx = canvas.getContext("2d")

    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      ctx.save()
      ctx.translate(panOffset.x, panOffset.y)
      ctx.scale(zoomLevel, zoomLevel)

      if (selectionMode === "create") {
        ctx.strokeStyle = "rgba(0, 150, 255, 0.5)"
        ctx.setLineDash([5, 5])
        ctx.lineWidth = 1
        ctx.strokeRect(0, 0, canvas.width, canvas.height)
        ctx.setLineDash([])
      }

      rectangles.forEach((rect) => {
        const isSelected = rect.id === selectedRectId

        ctx.strokeStyle = isSelected ? "rgba(255, 165, 0, 0.8)" : "rgba(255, 0, 0, 0.8)"
        ctx.lineWidth = isSelected ? 3 : 2
        ctx.strokeRect(rect.x, rect.y, rect.width, rect.height)

        ctx.fillStyle = isSelected ? "rgba(255, 165, 0, 0.2)" : "rgba(255, 0, 0, 0.2)"
        ctx.fillRect(rect.x, rect.y, rect.width, rect.height)

        if (isSelected && selectionMode === "edit") {
          const handleSize = 8 / zoomLevel
          ctx.fillStyle = "white"
          ctx.strokeStyle = "black"
          ctx.lineWidth = 1

          const handles = [
            { x: rect.x, y: rect.y },
            { x: rect.x + rect.width / 2, y: rect.y },
            { x: rect.x + rect.width, y: rect.y },
            { x: rect.x + rect.width, y: rect.y + rect.height / 2 },
            { x: rect.x + rect.width, y: rect.y + rect.height },
            { x: rect.x + rect.width / 2, y: rect.y + rect.height },
            { x: rect.x, y: rect.y + rect.height },
            { x: rect.x, y: rect.y + rect.height / 2 }
          ]

          handles.forEach(handle => {
            ctx.beginPath()
            ctx.arc(handle.x, handle.y, handleSize, 0, Math.PI * 2)
            ctx.fill()
            ctx.stroke()
          })
        }

        const rectIndex = rectangles.findIndex(r => r.id === rect.id)
        if (rectIndex !== -1) {
          ctx.fillStyle = "white"
          ctx.strokeStyle = "black"
          ctx.lineWidth = 1
          ctx.font = `${12 / zoomLevel}px sans-serif`
          ctx.textAlign = "center"
          ctx.textBaseline = "middle"
          
          const label = `${rectIndex + 1}`
          const textWidth = ctx.measureText(label).width
          const padding = 4 / zoomLevel
          
          ctx.fillStyle = isSelected ? "rgba(255, 165, 0, 0.9)" : "rgba(255, 0, 0, 0.9)"
          ctx.fillRect(
            rect.x + rect.width / 2 - textWidth / 2 - padding,
            rect.y + rect.height / 2 - 6 / zoomLevel - padding,
            textWidth + padding * 2,
            12 / zoomLevel + padding * 2
          )
          
          ctx.fillStyle = "white"
          ctx.fillText(label, rect.x + rect.width / 2, rect.y + rect.height / 2)
        }
      })

      if (currentRect && isDrawing) {
        ctx.strokeStyle = "rgba(0, 150, 255, 0.8)"
        ctx.lineWidth = 2
        ctx.strokeRect(currentRect.x, currentRect.y, currentRect.width, currentRect.height)

        ctx.fillStyle = "rgba(0, 150, 255, 0.2)"
        ctx.fillRect(currentRect.x, currentRect.y, currentRect.width, currentRect.height)
      }

      ctx.restore()
    }
  }

  const clearSelections = () => {
    setRectangles([])
    setSelectedRectId(null)

    if (!selectionCanvasRef.current) return
    const canvas = selectionCanvasRef.current
    const ctx = canvas.getContext("2d")
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
  }

  const deleteSelectedRect = () => {
    if (!selectedRectId) return
    
    const newRectangles = rectangles.filter(rect => rect.id !== selectedRectId)
    setRectangles(newRectangles)
    setSelectedRectId(null)
  }

  const generateRandomHex = (length: number) => {
    const characters = "0123456789abcdef"
    let result = ""
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length))
    }
    return result
  }

  const generateIV = () => {
    if (algorithm === "aes") {
      switch (aesMode) {
        case "ctr":
          // 16 bytes (128 bits) for AES-CTR
          setAesIv(generateRandomHex(32))
          break
        case "cbc":
          // 16 bytes (128 bits) for AES-CBC
          setAesIv(generateRandomHex(32))
          break
        case "gcm":
          // 12 bytes (96 bits) for AES-GCM
          setAesIv(generateRandomHex(24))
          break
        default:
          // ECB mode doesn't need IV
          setAesIv("")
      }
    } else if (algorithm === "chacha20") {
      // 12 bytes (96 bits) for ChaCha20-Poly1305
      setChachaNonce(generateRandomHex(24))
    }
  }

  const getAlgorithmDescription = () => {
    switch (algorithm) {
      case "aes":
        return "AES (Advanced Encryption Standard) - Symmetric block cipher with key sizes of 128, 192, or 256 bits."
      case "chacha20":
        return "ChaCha20 - High-speed stream cipher designed for software implementation without special hardware."
      case "rc4":
        return "RC4 - Simple and fast stream cipher. Note: Not considered secure for sensitive applications."
      case "logistic":
        return "Logistic XOR - Chaos-based encryption using the logistic map with XOR operation."
      default:
        return ""
    }
  }

  const renderAlgorithmOptions = () => {
    switch (algorithm) {
      case "aes":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="aes-key-size">Key Size</Label>
              <Select value={aesKeySize} onValueChange={setAesKeySize}>
                <SelectTrigger id="aes-key-size">
                  <SelectValue placeholder="Select key size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="128">128 bits (10 rounds)</SelectItem>
                  <SelectItem value="192">192 bits (12 rounds)</SelectItem>
                  <SelectItem value="256">256 bits (14 rounds)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="aes-mode">Mode of Operation</Label>
              <Select value={aesMode} onValueChange={setAesMode}>
                <SelectTrigger id="aes-mode">
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cbc">CBC (Cipher Block Chaining) - Requires IV</SelectItem>
                  <SelectItem value="ctr">CTR (Counter) - Requires nonce</SelectItem>
                  <SelectItem value="gcm">GCM (Galois/Counter Mode) - Authenticated encryption</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {aesMode !== "ecb" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="aes-iv">
                    {aesMode === "gcm" || aesMode === "ctr" ? "Nonce" : "Initialization Vector (IV)"}
                  </Label>
                  <Button type="button" variant="outline" size="sm" onClick={generateIV}>
                    Generate Random
                  </Button>
                </div>
                <Input
                  id="aes-iv"
                  value={aesIv}
                  onChange={(e) => setAesIv(e.target.value)}
                  placeholder={`Enter ${aesMode === "gcm" || aesMode === "ctr" ? "nonce" : "IV"} (hex format)`}
                />
                <p className="text-xs text-gray-500">
                  {aesMode === "gcm" || aesMode === "ctr"
                    ? "Nonce must be unique for each encryption with the same key"
                    : "IV should be random and unique for each encryption"}
                </p>
              </div>
            )}
          </div>
        )

      case "chacha20":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="chacha-mode">Variant</Label>
              <Select value={chachaMode} onValueChange={setChachaMode}>
                <SelectTrigger id="chacha-mode">
                  <SelectValue placeholder="Select variant" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="chacha20">ChaCha20 (Original)</SelectItem>
                  <SelectItem value="chacha20-poly1305">ChaCha20-Poly1305 (Authenticated)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="chacha-nonce">Nonce</Label>
                <Button type="button" variant="outline" size="sm" onClick={generateIV}>
                  Generate Random
                </Button>
              </div>
              <Input
                id="chacha-nonce"
                value={chachaNonce}
                onChange={(e) => setChachaNonce(e.target.value)}
                placeholder="Enter nonce (hex format)"
              />
              <p className="text-xs text-gray-500">
                {chachaMode === "chacha20-poly1305"
                  ? "96-bit nonce (12 bytes) for ChaCha20-Poly1305"
                  : "64-bit nonce (8 bytes) for original ChaCha20"}
              </p>
            </div>
          </div>
        )

      case "rc4":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rc4-key">RC4 Key</Label>
              <Input
                id="rc4-key"
                value={rc4Key}
                onChange={(e) => setRc4Key(e.target.value)}
                placeholder="Enter RC4 key (any length, typically 5-16 bytes)"
              />
              <p className="text-xs text-gray-500">
                RC4 uses a variable-length key, typically between 5-16 bytes (40-128 bits). Longer keys provide better
                security.
              </p>
            </div>
          </div>
        )

      case "logistic":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="logistic-initial">Initial Value (x₀)</Label>
              <Input
                id="logistic-initial"
                type="number"
                min="0"
                max="1"
                step="0.0001"
                value={logisticInitialValue}
                onChange={(e) => setLogisticInitialValue(e.target.value)}
                placeholder="Enter initial value (between 0 and 1)"
              />
              <p className="text-xs text-gray-500">
                Initial value for the logistic map, must be between 0 and 1, excluding 0, 0.5, and 1.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="logistic-parameter">Control Parameter (r)</Label>
              <Input
                id="logistic-parameter"
                type="number"
                min="3.57"
                max="4"
                step="0.001"
                value={logisticParameter}
                onChange={(e) => setLogisticParameter(e.target.value)}
                placeholder="Enter control parameter (between 3.57 and 4)"
              />
              <p className="text-xs text-gray-500">
                Control parameter for the logistic map, typically between 3.57 and 4 for chaotic behavior.
              </p>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev * 1.2, 5))
  }

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev / 1.2, 0.5))
  }

  const handleZoomReset = () => {
    setZoomLevel(1)
    setPanOffset({ x: 0, y: 0 })
  }

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setRectangles([...history[historyIndex - 1]]);
    }
  }

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setRectangles([...history[historyIndex + 1]]);
    }
  }

  const generatePreview = () => {
    if (!canvasRef.current || !previewCanvasRef.current || rectangles.length === 0) return;
    
    const sourceCanvas = canvasRef.current;
    const previewCanvas = previewCanvasRef.current;
    const sourceCtx = sourceCanvas.getContext('2d');
    const previewCtx = previewCanvas.getContext('2d');
    
    if (!sourceCtx || !previewCtx) return;
    
    // Copy the original image to the preview canvas
    previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
    previewCtx.drawImage(sourceCanvas, 0, 0);
    
    // Apply simulated encryption effect to the selected areas
    rectangles.forEach(rect => {
      const imageData = previewCtx.getImageData(rect.x, rect.y, rect.width, rect.height);
      
      // Apply different visual effects based on the algorithm to simulate encryption
      for (let i = 0; i < imageData.data.length; i += 4) {
        if (operation === "encrypt") {
          switch (algorithm) {
            case "aes":
              // Pixelation effect for AES
              imageData.data[i] = Math.floor(imageData.data[i] / 30) * 30;
              imageData.data[i + 1] = Math.floor(imageData.data[i + 1] / 30) * 30;
              imageData.data[i + 2] = Math.floor(imageData.data[i + 2] / 30) * 30;
              break;
            case "chacha20":
              // Color shift effect for ChaCha20
              imageData.data[i] = (imageData.data[i] + 50) % 256;
              imageData.data[i + 1] = (imageData.data[i + 1] + 100) % 256;
              imageData.data[i + 2] = (imageData.data[i + 2] + 150) % 256;
              break;
            case "rc4":
              // Noise effect for RC4
              imageData.data[i] = (imageData.data[i] + Math.floor(Math.random() * 50)) % 256;
              imageData.data[i + 1] = (imageData.data[i + 1] + Math.floor(Math.random() * 50)) % 256;
              imageData.data[i + 2] = (imageData.data[i + 2] + Math.floor(Math.random() * 50)) % 256;
              break;
            case "logistic":
              // Inversion effect for Logistic XOR
              imageData.data[i] = 255 - imageData.data[i];
              imageData.data[i + 1] = 255 - imageData.data[i + 1];
              imageData.data[i + 2] = 255 - imageData.data[i + 2];
              break;
          }
        } else {
          // Simple color inversion for decryption
          imageData.data[i] = 255 - imageData.data[i];
          imageData.data[i + 1] = 255 - imageData.data[i + 1];
          imageData.data[i + 2] = 255 - imageData.data[i + 2];
        }
      }
      
      previewCtx.putImageData(imageData, rect.x, rect.y);
    });
    
    setShowPreview(true);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!image) {
      setResult({
        success: false,
        message: "Please select an image.",
      })
      return
    }

    if (rectangles.length === 0) {
      setResult({
        success: false,
        message: "Please select at least one area of the image to process.",
      })
      return
    }

    // Algorithm-specific validation
    if (algorithm === "aes") {
      if (!password) {
        setResult({
          success: false,
          message: "Please enter a password for AES encryption.",
        })
        return
      }
      if (aesMode !== "ecb" && !aesIv) {
        setResult({
          success: false,
          message: `Please provide an ${aesMode === "gcm" || aesMode === "ctr" ? "nonce" : "IV"} for AES ${aesMode.toUpperCase()} mode.`,
        })
        return
      }
    } else if (algorithm === "chacha20") {
      if (!password) {
        setResult({
          success: false,
          message: "Please enter a password for ChaCha20 encryption.",
        })
        return
      }
      if (!chachaNonce) {
        setResult({
          success: false,
          message: "Please provide a nonce for ChaCha20.",
        })
        return
      }
    } else if (algorithm === "rc4") {
      if (!rc4Key) {
        setResult({
          success: false,
          message: "Please provide a key for RC4 encryption.",
        })
        return
      }
    } else if (algorithm === "logistic") {
      const x0 = Number.parseFloat(logisticInitialValue)
      const r = Number.parseFloat(logisticParameter)

      console.log("Logistic parameters:", { x0, r, logisticInitialValue, logisticParameter })

      if (isNaN(x0) || x0 <= 0 || x0 >= 1 || x0 === 0.5) {
        setResult({
          success: false,
          message: "Initial value must be between 0 and 1, excluding 0, 0.5, and 1.",
        })
        return
      }

      if (isNaN(r) || r < 3.57 || r > 4) {
        setResult({
          success: false,
          message: "Control parameter must be between 3.57 and 4.",
        })
        return
      }
    }

    setIsProcessing(true)
    setProgress(0)
    setResult(null) // Clear any previous result

    try {
      // Create FormData for the request
      const formData = new FormData()
      
      // Add the image data (remove the data:image/... prefix)
      const base64Image = image.split(',')[1]
      formData.append('image_content', base64Image)
      
      // Add operation and algorithm
      formData.append('operation', operation)
      formData.append('algorithm', algorithm)
      
      // Add regions
      const regions = rectangles.map(rect => 
        `${Math.round(rect.x)},${Math.round(rect.y)},${Math.round(rect.width)},${Math.round(rect.height)}`
      ).join(';')
      formData.append('regions', regions)
      
      // Add algorithm-specific parameters
      if (algorithm === "aes") {
        formData.append('password', password)
        formData.append('key_size', aesKeySize)
        formData.append('mode', aesMode)
        if (aesMode !== "ecb") {
          formData.append('nonce', aesIv)
        }
      } else if (algorithm === "chacha20") {
        formData.append('password', password)
        formData.append('nonce', chachaNonce)
      } else if (algorithm === "rc4") {
        formData.append('rc4_key', rc4Key)
      } else if (algorithm === "logistic") {
        // Convert parameters to numbers and ensure they're valid
        const initialValue = parseFloat(logisticInitialValue)
        const parameter = parseFloat(logisticParameter)
        
        if (isNaN(initialValue) || isNaN(parameter)) {
          throw new Error("Invalid logistic parameters")
        }
        
        // Format the float values with fixed precision to ensure proper parsing
        formData.append('logistic_initial', initialValue.toFixed(6))
        formData.append('logistic_parameter', parameter.toFixed(6))
        
        // Add password if provided
        if (password) {
          formData.append('password', password)
        }
        
        // Log the parameters being sent
        console.log("Sending logistic parameters:", {
          logistic_initial: initialValue.toFixed(6),
          logistic_parameter: parameter.toFixed(6),
          password: password || "not provided"
        })
      }

      // Log the entire formData contents
      console.log("FormData contents:")
      for (let [key, value] of formData.entries()) {
        console.log(`${key}: ${value} (type: ${typeof value})`)
      }

      // Simulate progress
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 95) {
            clearInterval(interval)
            return prev
          }
          return prev + 5
        })
      }, 100)

      // Make the API call
      console.log("Making API call to /api/image/partial-encrypt")
      try {
      const response = await fetch('https://security-project-km7v.onrender.com/api/image/partial-encrypt', {
        method: 'POST',
        body: formData,
      })

      clearInterval(interval)
      setProgress(100)

        // Check if response is ok
      if (!response.ok) {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.indexOf("application/json") !== -1) {
            const errorData = await response.json();
            console.error("API error:", errorData);
            throw new Error(errorData.detail || 'Failed to process image');
          } else {
            const textError = await response.text();
            console.error("API error (text):", textError);
            throw new Error(`Server error: ${response.status} ${response.statusText}`);
          }
      }

      const result = await response.json()
      console.log('Received response:', result)

      setResult({
        success: true,
        message: `Image ${operation === "encrypt" ? "encrypted" : "decrypted"} successfully with ${algorithm.toUpperCase()}!`,
        processed_image: result.processed_image
      })
      
      setActiveStep(4)
      setRectangles([])
      } catch (fetchError) {
        console.error("Fetch error:", fetchError);
        throw new Error(`Network error: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`);
      }
    } catch (error) {
      console.error('Error processing image:', error)
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to process image. Please try again.',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const downloadImage = () => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const dataUrl = canvas.toDataURL("image/png")

    // Create a temporary link element
    const link = document.createElement("a")
    link.href = dataUrl
    link.download = `${operation === "encrypt" ? "encrypted" : "decrypted"}_image.png`
    
    // Append to body, click, and remove
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Effect to draw rectangles whenever they change
  useEffect(() => {
    drawRectangles()
  }, [rectangles, currentRect, selectedRectId, selectionMode, zoomLevel, panOffset])

  const getSelectionModeTooltip = () => {
    switch (selectionMode) {
      case "create":
        return "Click and drag to create a new selection area"
      case "edit":
        return "Click on a selection to edit it"
      case "delete":
        return "Click on a selection to delete it"
      case "move":
        return "Click and drag to move around the image"
      case "zoom":
        return "Use the zoom controls to zoom in/out"
      default:
        return ""
    }
  }

  const handleRectUpdate = (id: string, field: keyof RectangleInput, value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;

    setRectangles(prev => prev.map(rect => {
      if (rect.id === id) {
        const updated = { ...rect, [field]: numValue };
        // Ensure the rectangle stays within canvas bounds
        if (canvasRef.current) {
          updated.x = Math.max(0, Math.min(updated.x, canvasRef.current.width - updated.width));
          updated.y = Math.max(0, Math.min(updated.y, canvasRef.current.height - updated.height));
          updated.width = Math.max(1, Math.min(updated.width, canvasRef.current.width - updated.x));
          updated.height = Math.max(1, Math.min(updated.height, canvasRef.current.height - updated.y));
        }
        return updated;
      }
      return rect;
    }));
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Image {operation === "encrypt" ? "Encryption" : "Decryption"}</CardTitle>
        <CardDescription>
          Select rectangular areas of your image to {operation === "encrypt" ? "encrypt" : "decrypt"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Step indicator */}
            <div className="mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Step {activeStep} of 4</span>
                <span className="text-sm text-gray-500">
                  {activeStep === 1 ? "Select Operation & Algorithm" : 
                   activeStep === 2 ? "Upload & Select Areas" : 
                   activeStep === 3 ? "Configure Settings" : "Result"}
                </span>
              </div>
              <Progress value={activeStep * 25} className="h-2" />
            </div>

            {/* Step 1: Operation and Algorithm */}
            <div className={activeStep !== 1 ? "hidden" : ""}>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Operation</Label>
                  <RadioGroup
                    value={operation}
                    onValueChange={(value) => {
                      setOperation(value as "encrypt" | "decrypt")
                      setResult(null)
                    }}
                    className="flex space-x-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="encrypt" id="img-encrypt" />
                      <Label htmlFor="img-encrypt" className="flex items-center gap-1 cursor-pointer">
                        <Lock className="h-4 w-4" /> Encrypt
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="decrypt" id="img-decrypt" />
                      <Label htmlFor="img-decrypt" className="flex items-center gap-1 cursor-pointer">
                        <Unlock className="h-4 w-4" /> Decrypt
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="algorithm">Encryption Algorithm</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-gray-400 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-sm">
                          <p>{getAlgorithmDescription()}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Select value={algorithm} onValueChange={setAlgorithm}>
                    <SelectTrigger id="algorithm">
                      <SelectValue placeholder="Select algorithm" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aes">AES</SelectItem>
                      <SelectItem value="chacha20">ChaCha20</SelectItem>
                      <SelectItem value="rc4">RC4</SelectItem>
                      <SelectItem value="logistic">Logistic XOR</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">{getAlgorithmDescription()}</p>
                </div>

                <Button 
                  type="button" 
                  onClick={() => setActiveStep(2)} 
                  className="w-full"
                >
                  Continue to Image Selection
                </Button>
              </div>
            </div>

            {/* Step 2: Image Upload and Area Selection */}
            <div className={activeStep !== 2 ? "hidden" : ""}>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="image">Select Image</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="cursor-pointer"
                      disabled={isProcessing}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById("image")?.click()}
                      disabled={isProcessing}
                    >
                      <ImageIcon className="h-4 w-4 mr-2" />
                      Browse
                    </Button>
                  </div>
                </div>

                {image && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Selection Tools</Label>
                        <Dialog open={showHelp} onOpenChange={setShowHelp}>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <HelpCircle className="h-4 w-4 mr-1" />
                              Help
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>How to Select Areas</DialogTitle>
                              <DialogDescription>
                                Follow these steps to select areas of your image for encryption or decryption:
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="flex items-start gap-2">
                                <div className="bg-primary/10 p-2 rounded-full">
                                  <Pencil className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                  <h4 className="font-medium">Create Selection</h4>
                                  <p className="text-sm text-gray-500">Click and drag to draw a rectangle around the area you want to encrypt.</p>
                                </div>
                              </div>
                              <div className="flex items-start gap-2">
                                <div className="bg-primary/10 p-2 rounded-full">
                                  <Move className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                  <h4 className="font-medium">Move Around</h4>
                                  <p className="text-sm text-gray-500">Click the Move tool and drag to pan around the image.</p>
                                </div>
                              </div>
                              <div className="flex items-start gap-2">
                                <div className="bg-primary/10 p-2 rounded-full">
                                  <ZoomIn className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                  <h4 className="font-medium">Zoom</h4>
                                  <p className="text-sm text-gray-500">Use the zoom controls to zoom in for precise selections.</p>
                                </div>
                              </div>
                              <div className="flex items-start gap-2">
                                <div className="bg-primary/10 p-2 rounded-full">
                                  <Trash2 className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                  <h4 className="font-medium">Delete Selection</h4>
                                  <p className="text-sm text-gray-500">Click the Delete tool and then click on a selection to remove it.</p>
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-4">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                variant={selectionMode === "create" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setSelectionMode("create")}
                              >
                                <Pencil className="h-4 w-4 mr-1" />
                                Create
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Draw new selection areas</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                variant={selectionMode === "edit" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setSelectionMode("edit")}
                              >
                                <Pencil className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Select and edit existing areas</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                variant={selectionMode === "delete" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setSelectionMode("delete")}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Delete selection areas</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                variant={selectionMode === "move" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setSelectionMode("move")}
                              >
                                <Move className="h-4 w-4 mr-1" />
                                Move
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Pan around the image</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <div className="flex items-center border rounded-md">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={handleZoomOut}
                                >
                                  <ZoomOut className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Zoom out</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={handleZoomReset}
                                >
                                  <span className="text-xs font-mono">{Math.round(zoomLevel * 100)}%</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Reset zoom</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={handleZoomIn}
                                >
                                  <ZoomIn className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Zoom in</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>

                        <div className="flex items-center border rounded-md ml-auto">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={handleUndo}
                                  disabled={historyIndex <= 0}
                                >
                                  <Undo className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Undo</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={handleRedo}
                                  disabled={historyIndex >= history.length - 1}
                                >
                                  <Redo className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Redo</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={clearSelections}
                                className="ml-auto"
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Clear All
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Clear all selections</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-900 p-2 rounded-md mb-2">
                        <p className="text-xs text-gray-500 flex items-center">
                          <Info className="h-3 w-3 mr-1" />
                          {getSelectionModeTooltip()}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Image Canvas</Label>
                      <div
                        ref={containerRef}
                        className="relative border rounded-md overflow-hidden"
                        style={{ maxWidth: "100%", maxHeight: "500px" }}
                      >
                        <div className="overflow-auto" style={{ maxHeight: "500px" }}>
                          <div className="relative">
                            <canvas 
                              ref={canvasRef} 
                              className="max-w-full" 
                              style={{ 
                                display: "block",
                                transform: `scale(${zoomLevel})`,
                                transformOrigin: "top left",
                                marginLeft: `${panOffset.x}px`,
                                marginTop: `${panOffset.y}px`
                              }} 
                            />
                            <canvas
                              ref={selectionCanvasRef}
                              className="absolute top-0 left-0 max-w-full"
                              style={{ 
                                display: "block",
                                cursor: selectionMode === "create" ? "crosshair" : 
                                       selectionMode === "delete" ? "not-allowed" :
                                       selectionMode === "edit" ? "pointer" :
                                       selectionMode === "move" ? "move" : "default",
                                transform: `scale(${zoomLevel})`,
                                transformOrigin: "top left",
                                marginLeft: `${panOffset.x}px`,
                                marginTop: `${panOffset.y}px`
                              }}
                              onMouseDown={handleCanvasMouseDown}
                              onMouseMove={handleCanvasMouseMove}
                              onMouseUp={handleCanvasMouseUp}
                              onMouseLeave={handleCanvasMouseUp}
                            />
                          </div>
                        </div>
                      </div>
                      
                      {rectangles.length > 0 && activeStep === 2 && (
                        <div className="mt-2">
                          <Alert>
                            <Info className="h-4 w-4" />
                            <AlertTitle>Important: Save Your Selection Coordinates</AlertTitle>
                            <p className="text-sm">
                              For accurate decryption later, please save the coordinates of your selected areas below. 
                              You can copy them to a secure location and use them when decrypting the image.
                            </p>
                          </Alert>
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-sm font-medium">Selected Areas: {rectangles.length}</p>
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const coordinates = rectangles.map(rect => 
                                    `${Math.round(rect.x)},${Math.round(rect.y)},${Math.round(rect.width)},${Math.round(rect.height)}`
                                  ).join(';');
                                  navigator.clipboard.writeText(coordinates);
                                }}
                              >
                                Copy All Coordinates
                              </Button>
                            </div>
                            
                            <Dialog>
                              <DialogTrigger asChild>
   
                              </DialogTrigger>
                              <DialogContent className="max-w-3xl">
                                <DialogHeader>
                                  <DialogTitle>Preview of {operation === "encrypt" ? "Encrypted" : "Decrypted"} Result</DialogTitle>
                                  <DialogDescription>
                                    This is how your image will look after {operation === "encrypt" ? "encryption" : "decryption"}.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="overflow-auto max-h-[60vh]">
                                  <canvas 
                                    ref={previewCanvasRef} 
                                    className="max-w-full border rounded" 
                                    style={{ display: "block" }}
                                  />
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                          
                          <ScrollArea className="h-48 rounded-md border mt-2">
                            <div className="p-2">
                              {rectangles.map((rect, index) => (
                                <div key={rect.id} className="space-y-2 py-2 border-b last:border-0">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Badge variant={rect.id === selectedRectId ? "default" : "outline"} className="w-6 h-6 flex items-center justify-center p-0">
                                        {index + 1}
                                      </Badge>
                                      <span className="text-sm font-medium">Region {index + 1}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-7 w-7" 
                                        onClick={() => setSelectedRectId(rect.id)}
                                      >
                                        <Pencil className="h-3 w-3" />
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-7 w-7 text-red-500" 
                                        onClick={() => {
                                          const newRectangles = rectangles.filter(r => r.id !== rect.id)
                                          setRectangles(newRectangles)
                                          if (selectedRectId === rect.id) setSelectedRectId(null)
                                        }}
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="space-y-1">
                                      <Label className="text-xs">Coordinates</Label>
                                      <div className="flex items-center gap-2">
                                        <Input
                                          type="text"
                                          value={`${Math.round(rect.x)},${Math.round(rect.y)},${Math.round(rect.width)},${Math.round(rect.height)}`}
                                          onChange={(e) => {
                                            const [x, y, width, height] = e.target.value.split(',').map(Number);
                                            if (!isNaN(x) && !isNaN(y) && !isNaN(width) && !isNaN(height)) {
                                              handleRectUpdate(rect.id, 'x', x.toString());
                                              handleRectUpdate(rect.id, 'y', y.toString());
                                              handleRectUpdate(rect.id, 'width', width.toString());
                                              handleRectUpdate(rect.id, 'height', height.toString());
                                            }
                                          }}
                                          className="h-7 text-xs font-mono"
                                          placeholder="x,y,width,height"
                                        />
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7"
                                          onClick={() => {
                                            const coords = `${Math.round(rect.x)},${Math.round(rect.y)},${Math.round(rect.width)},${Math.round(rect.height)}`;
                                            navigator.clipboard.writeText(coords);
                                          }}
                                        >
                                          <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="16"
                                            height="16"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                          >
                                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                          </svg>
                                        </Button>
                                      </div>
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-xs">Size</Label>
                                      <div className="text-xs">
                                        {Math.round(rect.width)} × {Math.round(rect.height)} px
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex justify-between">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setActiveStep(1)}
                  >
                    Back
                  </Button>
                  <Button 
                    type="button" 
                    onClick={() => setActiveStep(3)} 
                    disabled={!image || rectangles.length === 0}
                  >
                    Continue to Settings
                  </Button>
                </div>
              </div>
            </div>

            {/* Step 3: Algorithm Settings */}
            <div className={activeStep !== 3 ? "hidden" : ""}>
              <div className="space-y-6">
                {/* Algorithm-specific options */}
                {renderAlgorithmOptions()}

                {/* Password field for algorithms that need it */}
                {(algorithm === "aes" || algorithm === "chacha20") && (
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your encryption/decryption password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isProcessing}
                    />
                    <p className="text-xs text-gray-500">
                      {operation === "encrypt"
                        ? "Choose a strong password you'll remember. You'll need it to decrypt the image later."
                        : "Enter the password you used to encrypt this image."}
                    </p>
                  </div>
                )}

                {isProcessing && (
                  <div className="space-y-2">
                    <Label>Processing</Label>
                    <Progress value={progress} className="h-2" />
                    <p className="text-xs text-gray-500 text-center">{progress}% complete</p>
                  </div>
                )}

                <div className="flex justify-between">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setActiveStep(2)}
                  >
                    Back
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={
                      isProcessing ||
                      (algorithm === "aes" && !password) ||
                      (algorithm === "aes" && aesMode !== "ecb" && !aesIv) ||
                      (algorithm === "chacha20" && !password) ||
                      (algorithm === "chacha20" && !chachaNonce) ||
                      (algorithm === "rc4" && !rc4Key) ||
                      (algorithm === "logistic" && (!logisticInitialValue || !logisticParameter))
                    }
                  >
                    {isProcessing
                      ? "Processing..."
                      : operation === "encrypt"
                        ? "Encrypt Selected Areas"
                        : "Decrypt Selected Areas"}
                  </Button>
                </div>
              </div>
            </div>

            {/* Step 4: Results */}
            <div className={activeStep !== 4 ? "hidden" : ""}>
              <div className="space-y-6">
                {result && (
                  <>
                  <Alert variant={result.success ? "default" : "destructive"}>
                    <div className={`flex items-center gap-2 ${result.success ? "text-green-700" : "text-red-700"}`}>
                      {result.success ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <AlertCircle className="h-5 w-5" />
                      )}
                    <AlertTitle>{result.success ? "Success" : "Error"}</AlertTitle>
                    </div>
                    <AlertDescription className="mt-2">
                      {result.message}
                    </AlertDescription>
                  </Alert>

                    {result.success && result.processed_image && (
                        <div className="space-y-2">
                        <div className="rounded-lg overflow-hidden border">
                            <img 
                              src={`data:image/png;base64,${result.processed_image}`} 
                            alt="Processed Image"
                            className="w-full h-auto"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                          className="w-full"
                            onClick={() => {
                            const link = document.createElement("a");
                            link.href = `data:image/png;base64,${result.processed_image}`;
                            link.download = `${operation}_${algorithm}_image.png`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download Processed Image
                          </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
