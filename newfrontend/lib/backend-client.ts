interface BackendResponse {
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

export async function processWithBackend(
  content: string | Buffer,
  action: string,
  algorithm: string,
  key?: string,
  privateKey?: string,
  fileName?: string,
  fileType?: string,
  partialParams?: PartialEncryptionParams
): Promise<BackendResponse> {
  try {
    // Log the content details before processing
    console.log("Content details before processing:", {
      type: content instanceof Buffer ? "Buffer" : typeof content,
      length: content instanceof Buffer ? content.length : content.length,
      isBase64: content instanceof Buffer ? "Yes" : "No",
      fileName,
      fileType
    })

    const requestBody = {
      content: content instanceof Buffer ? content.toString("base64") : content,
      action,
      algorithm,
      key,
      privateKey,
      fileName,
      fileType,
      partialEncryption: partialParams ? {
        startByte: partialParams.startByte,
        endByte: partialParams.endByte,
        imageRegions: partialParams.imageRegions,
      } : undefined,
    }

    // Log the request details (excluding the actual content for security)
    console.log("Backend Request Details:", {
    content,
      action,
      algorithm,
      fileName,
      fileType,
      hasKey: !!key,
      key,
      hasPrivateKey: !!privateKey,
      contentLength: content instanceof Buffer ? content.length : content.length,
      contentType: content instanceof Buffer ? "Buffer" : typeof content,
      partialEncryption: partialParams ? {
        startByte: partialParams.startByte,
        endByte: partialParams.endByte,
        imageRegions: partialParams.imageRegions,
      } : undefined,
    })

    const response = await fetch("http://localhost:8000/api/encrypt", {
      method: "POST",
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      throw new Error(`Backend error: ${response.statusText}`)
    }

    const data = await response.json()
    console.log("Backend Response:", {
      success: data.success,
      message: data.message,
      hasHash: !!data.hash,
      hasProcessedContent: !!data.processedContent,
      fileName: data.fileName,
    })
    return data
  } catch (error) {
    console.error("Error communicating with backend:", error)
    throw error
  }
} 