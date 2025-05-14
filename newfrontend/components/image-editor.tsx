import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface ImageRegion {
  x: number
  y: number
  width: number
  height: number
}

interface ImageEditorProps {
  imageUrl: string
  onRegionsChange: (regions: ImageRegion[]) => void
}

export function ImageEditor({ imageUrl, onRegionsChange }: ImageEditorProps) {
  const [regions, setRegions] = useState<ImageRegion[]>([])
  const [isDrawing, setIsDrawing] = useState(false)
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 })
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const image = new Image()
    image.src = imageUrl
    image.onload = () => {
      if (canvasRef.current) {
        const canvas = canvasRef.current
        canvas.width = image.width
        canvas.height = image.height
        const ctx = canvas.getContext("2d")
        if (ctx) {
          ctx.drawImage(image, 0, 0)
        }
      }
    }
  }, [imageUrl])

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setIsDrawing(true)
    setStartPoint({ x, y })
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return

    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const currentX = e.clientX - rect.left
    const currentY = e.clientY - rect.top

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas and redraw image
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    if (imageRef.current) {
      ctx.drawImage(imageRef.current, 0, 0)
    }

    // Draw existing regions
    regions.forEach(region => {
      ctx.strokeStyle = "#00ff00"
      ctx.lineWidth = 2
      ctx.strokeRect(region.x, region.y, region.width, region.height)
    })

    // Draw current selection
    ctx.strokeStyle = "#ff0000"
    ctx.lineWidth = 2
    ctx.strokeRect(
      startPoint.x,
      startPoint.y,
      currentX - startPoint.x,
      currentY - startPoint.y
    )
  }

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return

    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const endX = e.clientX - rect.left
    const endY = e.clientY - rect.top

    const newRegion: ImageRegion = {
      x: Math.min(startPoint.x, endX),
      y: Math.min(startPoint.y, endY),
      width: Math.abs(endX - startPoint.x),
      height: Math.abs(endY - startPoint.y)
    }

    setRegions([...regions, newRegion])
    onRegionsChange([...regions, newRegion])
    setIsDrawing(false)
  }

  const removeRegion = (index: number) => {
    const newRegions = regions.filter((_, i) => i !== index)
    setRegions(newRegions)
    onRegionsChange(newRegions)
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="border border-gray-200 rounded-lg"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        />
        <img
          ref={imageRef}
          src={imageUrl}
          alt="Source"
          className="hidden"
        />
      </div>
      
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Selected Regions:</h3>
        {regions.map((region, index) => (
          <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
            <span className="text-sm">
              Region {index + 1}: ({region.x}, {region.y}) - {region.width}x{region.height}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeRegion(index)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
} 