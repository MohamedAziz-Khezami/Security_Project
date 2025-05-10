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
} from "lucide-react"
import { Alert, AlertTitle } from "@/components/ui/alert"
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

type SelectionMode = "create" | "edit" | "delete" | "move" | "zoom"

export default function ImageEncryption() {
  const [operation, setOperation] = useState<"encrypt" | "decrypt">("encrypt")
  const [password, setPassword] = useState("")
  const [image, setImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
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

  // Algorithm-specific parameters
  const [aesKeySize, setAesKeySize] = useState("256")
  const [aesMode, setAesMode] = useState("gcm")
  const [aesIv, setAesIv] = useState("")

  const [chachaMode, setChachaMode] = useState("chacha20-poly1305")
  const [chachaNonce, setChachaNonce] = useState("")

  const [rc4Key, setRc4Key] = useState("")

  const [logisticInitialValue, setLogisticInitialValue] = useState("0.5")
  const [logisticParameter, setLogisticParameter] = useState("3.99")

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
      setLogisticInitialValue("0.5")
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
          setImage(event.target.result as string)
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
          img.src = event.target.result as string
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
  }

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

  // Handle mouse events on canvas
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoordinates(e)

    if (selectionMode === "move") {
      setIsPanning(true)
      setLastPanPoint({ x: e.clientX, y: e.clientY })
      return
    }

    if (selectionMode === "delete") {
      // Find if we clicked on a rectangle
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
      // Find if we clicked on a rectangle
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

    if (!isDrawing || !currentRect || selectionMode !== "create") {
      setIsDrawing(false)
      return
    }

    // Only add rectangle if it has some size
    if (Math.abs(currentRect.width) > 5 && Math.abs(currentRect.height) > 5) {
      // Normalize rectangle coordinates (handle negative width/height)
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
      // Clear the canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // Apply zoom and pan transformations
      ctx.save()
      ctx.translate(panOffset.x, panOffset.y)
      ctx.scale(zoomLevel, zoomLevel)

      // Draw selection guide if in create mode
      if (selectionMode === "create") {
        ctx.strokeStyle = "rgba(0, 150, 255, 0.5)"
        ctx.setLineDash([5, 5])
        ctx.lineWidth = 1
        ctx.strokeRect(0, 0, canvas.width, canvas.height)
        ctx.setLineDash([])
      }

      // Draw all saved rectangles
      rectangles.forEach((rect) => {
        const isSelected = rect.id === selectedRectId

        // Draw rectangle
        ctx.strokeStyle = isSelected ? "rgba(255, 165, 0, 0.8)" : "rgba(255, 0, 0, 0.8)"
        ctx.lineWidth = isSelected ? 3 : 2
        ctx.strokeRect(rect.x, rect.y, rect.width, rect.height)

        // Fill with semi-transparent color
        ctx.fillStyle = isSelected ? "rgba(255, 165, 0, 0.2)" : "rgba(255, 0, 0, 0.2)"
        ctx.fillRect(rect.x, rect.y, rect.width, rect.height)

        // Draw resize handles if selected
        if (isSelected && selectionMode === "edit") {
          const handleSize = 8 / zoomLevel
          ctx.fillStyle = "white"
          ctx.strokeStyle = "black"
          ctx.lineWidth = 1

          // Draw handles at corners and midpoints
          const handles = [
            { x: rect.x, y: rect.y }, // top-left
            { x: rect.x + rect.width / 2, y: rect.y }, // top-middle
            { x: rect.x + rect.width, y: rect.y }, // top-right
            { x: rect.x + rect.width, y: rect.y + rect.height / 2 }, // right-middle
            { x: rect.x + rect.width, y: rect.y + rect.height }, // bottom-right
            { x: rect.x + rect.width / 2, y: rect.y + rect.height }, // bottom-middle
            { x: rect.x, y: rect.y + rect.height }, // bottom-left
            { x: rect.x, y: rect.y + rect.height / 2 } // left-middle
          ]

          handles.forEach(handle => {
            ctx.beginPath()
            ctx.arc(handle.x, handle.y, handleSize, 0, Math.PI * 2)
            ctx.fill()
            ctx.stroke()
          })
        }

        // Draw label
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
          
          // Draw label background
          ctx.fillStyle = isSelected ? "rgba(255, 165, 0, 0.9)" : "rgba(255, 0, 0, 0.9)"
          ctx.fillRect(
            rect.x + rect.width / 2 - textWidth / 2 - padding,
            rect.y + rect.height / 2 - 6 / zoomLevel - padding,
            textWidth + padding * 2,
            12 / zoomLevel + padding * 2
          )
          
          // Draw label text
          ctx.fillStyle = "white"
          ctx.fillText(label, rect.x + rect.width / 2, rect.y + rect.height / 2)
        }
      })

      // Draw the current rectangle being created
      if (currentRect && isDrawing) {
        ctx.strokeStyle = "rgba(0, 150, 255, 0.8)"
        ctx.lineWidth = 2
        ctx.strokeRect(currentRect.x, currentRect.y, currentRect.width, currentRect.height)

        // Fill with semi-transparent color
        ctx.fillStyle = "rgba(0, 150, 255, 0.2)"
        ctx.fillRect(currentRect.x, currentRect.y, currentRect.width, currentRect.height)
      }

      // Draw cursor guide based on selection mode
      if (selectionMode === "create" && !isDrawing) {
        ctx.strokeStyle = "rgba(0, 150, 255, 0.5)"
        ctx.setLineDash([5, 5])
        ctx.lineWidth = 1
        
        // We would need mouse position here, but since we don't have it in this function,
        // we'll just show a message instead in the UI
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
      // 16 bytes (128 bits) for AES
      setAesIv(generateRandomHex(32))
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
                  <SelectItem value="ecb">ECB (Electronic Codebook) - Not recommended for images</SelectItem>
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

    try {
      // In a real app, you would:
      // 1. Get the selection rectangles
      // 2. Get the image data from the main canvas
      // 3. Send both to your FastAPI backend along with the algorithm parameters
      // 4. Receive the processed image and display it

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

      // This is a placeholder for the API call
      await new Promise((resolve) => setTimeout(resolve, 2000))

      clearInterval(interval)
      setProgress(100)

      // Simulate processing the image
      if (canvasRef.current) {
        const canvas = canvasRef.current
        const ctx = canvas.getContext("2d")

        if (ctx) {
          // Apply a simple visual effect to show the selected areas were processed
          // In a real app, this would be replaced with the actual encrypted/decrypted image
          rectangles.forEach((rect) => {
            const imageData = ctx.getImageData(rect.x, rect.y, rect.width, rect.height)

            // Apply different visual effects based on the algorithm to simulate encryption
            for (let i = 0; i < imageData.data.length; i += 4) {
              if (operation === "encrypt") {
                switch (algorithm) {
                  case "aes":
                    // Pixelation effect for AES
                    imageData.data[i] = Math.floor(imageData.data[i] / 30) * 30
                    imageData.data[i + 1] = Math.floor(imageData.data[i + 1] / 30) * 30
                    imageData.data[i + 2] = Math.floor(imageData.data[i + 2] / 30) * 30
                    break
                  case "chacha20":
                    // Color shift effect for ChaCha20
                    imageData.data[i] = (imageData.data[i] + 50) % 256
                    imageData.data[i + 1] = (imageData.data[i + 1] + 100) % 256
                    imageData.data[i + 2] = (imageData.data[i + 2] + 150) % 256
                    break
                  case "rc4":
                    // Noise effect for RC4
                    imageData.data[i] = (imageData.data[i] + Math.floor(Math.random() * 50)) % 256
                    imageData.data[i + 1] = (imageData.data[i + 1] + Math.floor(Math.random() * 50)) % 256
                    imageData.data[i + 2] = (imageData.data[i + 2] + Math.floor(Math.random() * 50)) % 256
                    break
                  case "logistic":
                    // Inversion effect for Logistic XOR
                    imageData.data[i] = 255 - imageData.data[i]
                    imageData.data[i + 1] = 255 - imageData.data[i + 1]
                    imageData.data[i + 2] = 255 - imageData.data[i + 2]
                    break
                }
              } else {
                // Simple color inversion for decryption
                imageData.data[i] = 255 - imageData.data[i]
                imageData.data[i + 1] = 255 - imageData.data[i + 1]
                imageData.data[i + 2] = 255 - imageData.data[i + 2]
                break
              }
            }

            ctx.putImageData(imageData, rect.x, rect.y)
          })

          // Clear the selection canvas
          const selectionCtx = selectionCanvasRef.current?.getContext("2d")
          if (selectionCtx) {
            selectionCtx.clearRect(0, 0, canvas.width, canvas.height)
          }
        }
      }

      setResult({
        success: true,
        message: `Image ${operation === "encrypt" ? "encrypted" : "decrypted"} successfully with ${algorithm.toUpperCase()}!`,
      })
      
      setActiveStep(4)
    } catch (error) {
      setResult({
        success: false,
        message: `Failed to ${operation} image. Please try again.`,
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const downloadImage = () => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const dataUrl = canvas.toDataURL("image/png")

    const a = document.createElement("a")
    a.href = dataUrl
    a.download = `${operation === "encrypt" ? "encrypted" : "decrypted"}_image.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
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
                            <canvas ref={canvasRef} className="max-w-full" style={{ display: "block" }} />
                            <canvas
                              ref={selectionCanvasRef}
                              className="absolute top-0 left-0 max-w-full"
                              style={{ 
                                display: "block",
                                cursor: selectionMode === "create" ? "crosshair" : 
                                       selectionMode === "delete" ? "not-allowed" :
                                       selectionMode === "edit" ? "pointer" :
                                       selectionMode === "move" ? "move" : "default"
                              }}
                              onMouseDown={handleCanvasMouseDown}
                              onMouseMove={handleCanvasMouseMove}
                              onMouseUp={handleCanvasMouseUp}
                              onMouseLeave={handleCanvasMouseUp}
                            />
                          </div>
                        </div>
                      </div>
                      
                      {rectangles.length > 0 && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">Selected Areas: {rectangles.length}</p>
                            
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Eye className="h-4 w-4 mr-1" />
                                  Preview Result
                                </Button>
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
                                <Button onClick={generatePreview}>Generate Preview</Button>
                              </DialogContent>
                            </Dialog>
                          </div>
                          
                          <ScrollArea className="h-24 rounded-md border mt-2">
                            <div className="p-2">
                              {rectangles.map((rect, index) => (
                                <div key={rect.id} className="flex items-center justify-between py-1 border-b last:border-0">
                                  <div className="flex items-center gap-2">
                                    <Badge variant={rect.id === selectedRectId ? "default" : "outline"} className="w-6 h-6 flex items-center justify-center p-0">
                                      {index + 1}
                                    </Badge>
                                    <span className="text-sm">
                                      {Math.round(rect.width)} × {Math.round(rect.height)} px at ({Math.round(rect.x)}, {Math.round(rect.y)})
                                    </span>
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
                      (algorithm === "rc4" && !rc4Key)
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
                  <Alert variant={result.success ? "default" : "destructive"}>
                    <AlertTitle>{result.success ? "Success" : "Error"}</AlertTitle>
                  </Alert>
                )}
              </div>
          </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
