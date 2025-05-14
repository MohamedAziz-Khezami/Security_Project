"use client"

import type React from "react"

import { useState, useRef } from "react"
import type { FileInfo } from "./secure-transfer"
import { Upload, FileIcon, X, FileText } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { formatBytes } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface FileUploadProps {
  onFileChange: (fileInfo: FileInfo) => void
  onRemoveFile: () => void
  fileInfo: FileInfo
}

export function FileUpload({ onFileChange, onRemoveFile, fileInfo }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const determineFileType = (file: File): "text" | "image" | "pdf" | "docx" | "other" => {
    if (file.type.startsWith("image/")) return "image"
    if (file.type === "application/pdf") return "pdf"
    if (
      file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.name.toLowerCase().endsWith(".docx")
    )
      return "docx"
    if (
      file.type === "text/plain" ||
      file.type === "text/html" ||
      file.type === "text/css" ||
      file.type === "text/javascript" ||
      file.type === "application/json" ||
      file.type === "application/xml"
    )
      return "text"
    return "other"
  }

  const processFile = async (file: File) => {
    if (!file) return

    setIsUploading(true)
    setUploadProgress(0)

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return prev + 10
      })
    }, 200)

    const fileType = determineFileType(file)
    let content: string | ArrayBuffer | null = null

    try {
      if (fileType === "text") {
        content = await file.text()
      } else if (fileType === "image") {
        content = await new Promise<string | ArrayBuffer>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => {
            if (reader.result) {
              resolve(reader.result)
            } else {
              reject(new Error("Failed to read file"))
            }
          }
          reader.onerror = () => reject(reader.error)
          reader.readAsDataURL(file)
        })
      } else if (fileType === "pdf" || fileType === "docx") {
        // For PDFs and DOCX, we'll handle text extraction separately
        content = null
      }

      const newFileInfo: FileInfo = {
        file,
        name: file.name,
        size: file.size,
        type: fileType,
        content,
      }

      // Ensure progress completes
      setTimeout(() => {
        clearInterval(interval)
        setUploadProgress(100)
        setTimeout(() => {
          setIsUploading(false)
          onFileChange(newFileInfo)
        }, 500)
      }, 1000)
    } catch (error) {
      console.error("Error processing file:", error)
      clearInterval(interval)
      setIsUploading(false)
      // You might want to add error handling UI here
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0]
      console.log("File dropped:", file.name)
      processFile(file)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0])
    }
  }

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const getFileIcon = () => {
    if (fileInfo.type === "pdf") return <FileText className="h-8 w-8 text-red-500 mr-3" />
    if (fileInfo.type === "docx") return <FileText className="h-8 w-8 text-blue-500 mr-3" />
    if (fileInfo.type === "text") return <FileText className="h-8 w-8 text-green-500 mr-3" />
    return <FileIcon className="h-8 w-8 text-blue-500 mr-3" />
  }

  return (
    <div className="space-y-4">
      {!fileInfo.file && !isUploading && (
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-300 ${
            isDragging
              ? "border-blue-500 bg-blue-50 scale-[1.01] shadow-md"
              : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleButtonClick}
        >
          <input
            type="file"
            className="hidden"
            onChange={handleFileInputChange}
            ref={fileInputRef}
            accept=".txt,.pdf,.jpg,.jpeg,.png,.gif,.bmp,.webp,.svg,.json,.xml,.html,.css,.js,.docx"
          />
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm font-medium text-gray-900">Click or drag a file here to upload</p>
          <p className="mt-1 text-xs text-gray-500">Supports text, images, PDFs, DOCX, and more</p>
        </div>
      )}

      {isUploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Uploading...</span>
            <span>{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} className="h-2" />
        </div>
      )}

      {fileInfo.file && !isUploading && (
        <div className="flex items-center p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-all duration-300 hover:shadow-md">
          {getFileIcon()}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{fileInfo.name}</p>
            <p className="text-xs text-gray-500">{formatBytes(fileInfo.size)}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemoveFile}
            className="text-gray-500 hover:text-red-500 hover:bg-red-50 transition-colors duration-200"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Remove file</span>
          </Button>
        </div>
      )}
    </div>
  )
}
