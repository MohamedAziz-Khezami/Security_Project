import { FileInfo } from "@/components/secure-transfer"

interface ProcessFileResponse {
  success: boolean
  message: string
  hash?: string
  processedContent?: string
  fileName?: string
}

interface ImageRegion {
  x: number
  y: number
  width: number
  height: number
}

interface PartialEncryptionParams {
  startByte?: number
  endByte?: number
  imageRegions?: ImageRegion[]
}

export async function processFile(
  fileInfo: FileInfo | string,
  action: "encrypt" | "decrypt" | "hash",
  algorithm: string,
  key?: string,
  privateKey?: string,
  applyTo: "full" | "partial" = "full",
  partialParams?: PartialEncryptionParams
): Promise<ProcessFileResponse> {
  const formData = new FormData()
  
  if (typeof fileInfo === "string") {
    // Handle text input
    formData.append("content", fileInfo)
    formData.append("isText", "true")
    console.log("Sending text input:", { contentLength: fileInfo.length })
  } else {
    // Handle file input
    if (fileInfo.file) {
      console.log("File details:", {
        name: fileInfo.file.name,
        type: fileInfo.file.type,
        size: fileInfo.file.size,
        lastModified: fileInfo.file.lastModified
      })
      formData.append("file", fileInfo.file)
    }
    if (fileInfo.content) {
      const contentStr = fileInfo.content.toString()
      console.log("File content details:", {
        contentLength: contentStr.length,
        contentType: typeof fileInfo.content,
        isArrayBuffer: fileInfo.content instanceof ArrayBuffer
      })
      formData.append("content", contentStr)
    }
    formData.append("fileName", fileInfo.name)
    formData.append("fileType", fileInfo.type || "")
  }

  formData.append("action", action)
  formData.append("algorithm", algorithm)
  formData.append("applyTo", applyTo)
  if (key) formData.append("key", key)
  if (privateKey) formData.append("privateKey", privateKey)

  // Add partial encryption parameters if they exist
  if (applyTo === "partial" && partialParams) {
    if (partialParams.startByte !== undefined) {
      formData.append("startByte", partialParams.startByte.toString())
    }
    if (partialParams.endByte !== undefined) {
      formData.append("endByte", partialParams.endByte.toString())
    }
    if (partialParams.imageRegions && partialParams.imageRegions.length > 0) {
      formData.append("imageRegions", JSON.stringify(partialParams.imageRegions))
    }
  }

  // Log the request details
  console.log("API Request Details:", {
    action,
    algorithm,
    applyTo,
    fileType: typeof fileInfo === "string" ? "text" : fileInfo.type,
    fileName: typeof fileInfo === "string" ? "text_input" : fileInfo.name,
    hasKey: !!key,
    hasPrivateKey: !!privateKey,
    partialParams: applyTo === "partial" ? {
      startByte: partialParams?.startByte,
      endByte: partialParams?.endByte,
      imageRegions: partialParams?.imageRegions
    } : undefined
  })

  try {
    const response = await fetch("http://localhost:8000/api/encrypt", {
      method: "POST",
      body: formData,
    })
    console.log(response.json())
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    console.log("API Response:", data)
    return data
  } catch (error) {
    console.error("Error processing file:", error)
    throw error
  }
} 