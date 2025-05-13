import { Loader2 } from "lucide-react"

export function LoadingOverlay() {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center">
        <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-4" />
        <p className="text-lg font-medium">Processing your file...</p>
        <p className="text-sm text-gray-500 mt-1">This may take a moment</p>
      </div>
    </div>
  )
}
