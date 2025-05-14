import { NextRequest, NextResponse } from "next/server"
import { writeFile } from "fs/promises"
import { join } from "path"
import { tmpdir } from "os"
import { processWithBackend } from "@/lib/backend-client"

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

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const action = formData.get("action") as string
    const algorithm = formData.get("algorithm") as string
    const key = formData.get("key") as string
    const privateKey = formData.get("privateKey") as string
    const isText = formData.get("isText") === "true"
    const fileName = formData.get("fileName") as string
    const fileType = formData.get("fileType") as string
    const applyTo = formData.get("applyTo") as string

    // Parse partial encryption parameters if they exist
    let partialParams: PartialEncryptionParams | undefined
    if (applyTo === "partial") {
      const startByte = formData.get("startByte")
      const endByte = formData.get("endByte")
      const imageRegions = formData.get("imageRegions")

      if (fileType === "image" && imageRegions) {
        try {
          const regions = JSON.parse(imageRegions as string) as ImageRegion[]
          if (Array.isArray(regions) && regions.length > 0) {
            partialParams = {
              imageRegions: regions
            }
          }
        } catch (error) {
          console.error("Error parsing image regions:", error)
        }
      } else if (startByte && endByte) {
        partialParams = {
          startByte: parseInt(startByte as string),
          endByte: parseInt(endByte as string)
        }
      }
    }

    let content: string | Buffer
    if (isText) {
      content = formData.get("content") as string
    } else {
      const file = formData.get("file") as File
      if (!file) {
        return NextResponse.json(
          { success: false, message: "No file provided" },
          { status: 400 }
        )
      }
      const bytes = await file.arrayBuffer()
      content = Buffer.from(bytes)
    }

    // Process the content with the backend service
    const backendResponse = await processWithBackend(
      content,
      action,
      algorithm,
      key,
      privateKey,
      fileName,
      fileType,
      partialParams
    )

    if (!backendResponse.success) {
      return NextResponse.json(
        { success: false, message: backendResponse.message },
        { status: 500 }
      )
    }

    // Create a temporary file for download if needed
    if (action !== "hash" && backendResponse.processedContent) {
      const tempDir = tmpdir()
      const tempFilePath = join(tempDir, `${action}_${fileName || "file"}`)
      await writeFile(tempFilePath, backendResponse.processedContent)
    }

    return NextResponse.json({
      success: true,
      message: `${action} completed successfully`,
      hash: backendResponse.hash,
      processedContent: backendResponse.processedContent,
      fileName: backendResponse.fileName || `${action}_${fileName || "file"}`,
    })
  } catch (error) {
    console.error("Error processing request:", error)
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : "Error processing request" 
      },
      { status: 500 }
    )
  }
} 