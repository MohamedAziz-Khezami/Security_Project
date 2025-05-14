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
    formData.append("is_text", "true")
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
    formData.append("file_name", fileInfo.name)
    formData.append("file_type", fileInfo.type || "")
  }

  formData.append("action", action)
  formData.append("algorithm", algorithm)
  formData.append("apply_to", applyTo)
  if (key) formData.append("key", key)
  if (privateKey) formData.append("private_key", privateKey)

  // Add partial encryption parameters if they exist
  if (applyTo === "partial" && partialParams) {
    console.log("Adding partial parameters to form data:", partialParams)
    
    if (partialParams.startByte !== undefined && partialParams.endByte !== undefined) {
      formData.append("start_byte", partialParams.startByte.toString())
      formData.append("end_byte", partialParams.endByte.toString())
      console.log("Added byte range to form data:", {
        start: partialParams.startByte,
        end: partialParams.endByte
      })
    }
    
    if (partialParams.imageRegions && partialParams.imageRegions.length > 0) {
      // Convert all regions to a single dictionary
      const regionsDict = partialParams.imageRegions.reduce((acc, region, index) => {
        acc[`region_${index}`] = {
          x: Math.round(region.x),
          y: Math.round(region.y),
          width: Math.round(region.width),
          height: Math.round(region.height)
        }
        return acc
      }, {} as Record<string, { x: number; y: number; width: number; height: number }>)

      // Add the regions dictionary as a single entry
      formData.append("image_regions", JSON.stringify(regionsDict))
      console.log("Added image regions dictionary to form data:", regionsDict)
    }
  }

  // Log the complete form data
  console.log("Complete form data entries:")
  for (const [key, value] of formData.entries()) {
    if (key.startsWith('image_region_')) {
      console.log(`${key}:`, JSON.parse(value as string))
    } else {
      console.log(`${key}:`, value)
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
      imageRegions: partialParams?.imageRegions,
      totalRegions: partialParams?.imageRegions?.length
    } : undefined
  })

  try {
    const response = await fetch("http://localhost:8000/api/encrypt", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      throw new Error(
        errorData?.detail || 
        `HTTP error! status: ${response.status}`
      )
    }

    const data = await response.json()
    console.log("API Response:", data)
    return data
  } catch (error) {
    console.error("Error processing file:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "An unknown error occurred"
    }
  }
} 