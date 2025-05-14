"use client"

import { useState, useEffect, useRef } from "react"
import dynamic from 'next/dynamic'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { AlertCircle, FileUp, Lock, Unlock, Download, Eye, Info, Key } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/esm/Page/AnnotationLayer.css'
import 'react-pdf/dist/esm/Page/TextLayer.css'

// Set up PDF.js worker with proper error handling
try {
  pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`
} catch (error) {
  console.error('Error setting up PDF.js worker:', error)
}

// Define supported file types
const SUPPORTED_FILE_TYPES = {
  document: ['pdf', 'docx', 'doc', 'odt', 'rtf'],
  text: ['txt', 'json', 'csv', 'md', 'html', 'css', 'js', 'jsx', 'ts', 'tsx'],
  spreadsheet: ['xlsx', 'xls', 'ods'],
  presentation: ['pptx', 'ppt', 'odp'],
  image: ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'],
  archive: ['zip', 'rar', '7z', 'tar', 'gz'],
  binary: ['*'] // Default for unsupported types
}

export default function FileEncryption() {
  const [file, setFile] = useState<File | null>(null)
  const [operation, setOperation] = useState<"encrypt" | "decrypt">("encrypt")
  const [password, setPassword] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const [fileType, setFileType] = useState<"document" | "text" | "spreadsheet" | "presentation" | "image" | "archive" | "binary">("binary")
  const [fileContent, setFileContent] = useState<string>("")
  const [selectedText, setSelectedText] = useState<{ start: number; end: number; text: string } | null>(null)
  const [partialEncryption, setPartialEncryption] = useState(false)
  const [algorithm, setAlgorithm] = useState("aes")
  const [previewVisible, setPreviewVisible] = useState(false)
  const [numPages, setNumPages] = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [pdfText, setPdfText] = useState<string[]>([])
  const [pdfPages, setPdfPages] = useState<any[]>([])
  const [pdfError, setPdfError] = useState<string | null>(null)
  const [documentType, setDocumentType] = useState<"pdf" | "docx" | "other">("other")
  const [documentError, setDocumentError] = useState<string | null>(null)
  const [documentContent, setDocumentContent] = useState<string[]>([])
  const [documentPages, setDocumentPages] = useState<any[]>([])

  // Algorithm-specific parameters
  const [aesKeySize, setAesKeySize] = useState("256")
  const [aesMode, setAesMode] = useState("gcm")
  const [aesIv, setAesIv] = useState("")
  const [chachaMode, setChachaMode] = useState("chacha20-poly1305")
  const [chachaNonce, setChachaNonce] = useState("")
  const [rsaKeyType, setRsaKeyType] = useState<"generate" | "upload" | "paste">("generate")
  const [rsaPublicKey, setRsaPublicKey] = useState("")
  const [rsaPrivateKey, setRsaPrivateKey] = useState("")
  const [rsaKeySize, setRsaKeySize] = useState("2048")
  const [rsaPublicKeyFile, setRsaPublicKeyFile] = useState<File | null>(null)
  const [rsaPrivateKeyFile, setRsaPrivateKeyFile] = useState<File | null>(null)
  const [tripleDesKeyOption, setTripleDesKeyOption] = useState("three")
  const [tripleDesKey1, setTripleDesKey1] = useState("")
  const [tripleDesKey2, setTripleDesKey2] = useState("")
  const [tripleDesKey3, setTripleDesKey3] = useState("")
  const [tripleDesIv, setTripleDesIv] = useState("")
  const [tripleDesMode, setTripleDesMode] = useState("cbc")

  const textAreaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (file) {
      determineFileType(file)
    }
  }, [file])

  useEffect(() => {
    // Reset algorithm-specific fields when algorithm changes
    if (algorithm === "aes") {
      setAesIv("")
    } else if (algorithm === "chacha20") {
      setChachaNonce("")
    } else if (algorithm === "rsa") {
      setRsaPublicKey("")
      setRsaPrivateKey("")
      setRsaPublicKeyFile(null)
      setRsaPrivateKeyFile(null)
    } else if (algorithm === "3des") {
      setTripleDesKey1("")
      setTripleDesKey2("")
      setTripleDesKey3("")
      setTripleDesIv("")
    }
  }, [algorithm])

  const determineFileType = (file: File) => {
    const extension = file.name.split(".").pop()?.toLowerCase() || ""
    
    // Reset states
    setDocumentError(null)
    setDocumentContent([])
    setDocumentPages([])
    setFileContent("")
    
    // Determine file category
    if (SUPPORTED_FILE_TYPES.document.includes(extension)) {
      setFileType("document")
      if (extension === "pdf") {
        setDocumentType("pdf")
        const url = URL.createObjectURL(file)
        setPdfUrl(url)
        extractDocumentText(file, "pdf")
      } else if (extension === "docx") {
        setDocumentType("docx")
        extractDocumentText(file, "docx")
      } else {
        setDocumentType("other")
        extractDocumentText(file, "other")
      }
    } else if (SUPPORTED_FILE_TYPES.text.includes(extension)) {
      setFileType("text")
      readTextFile(file)
    } else if (SUPPORTED_FILE_TYPES.spreadsheet.includes(extension)) {
      setFileType("spreadsheet")
      extractDocumentText(file, "spreadsheet")
    } else if (SUPPORTED_FILE_TYPES.presentation.includes(extension)) {
      setFileType("presentation")
      extractDocumentText(file, "presentation")
    } else if (SUPPORTED_FILE_TYPES.image.includes(extension)) {
      setFileType("image")
      // Handle image files
      handleImageFile(file)
    } else if (SUPPORTED_FILE_TYPES.archive.includes(extension)) {
      setFileType("archive")
      // Handle archive files
      handleArchiveFile(file)
    } else {
      setFileType("binary")
      setFileContent("")
      setPreviewVisible(false)
    }
  }

  const extractDocumentText = async (file: File, type: string) => {
    try {
      setDocumentError(null)
      const arrayBuffer = await file.arrayBuffer()
      
      switch (type) {
        case "pdf":
          await extractPdfText(arrayBuffer)
          break
        case "docx":
          // TODO: Add docx extraction when library is added
          console.log("DOCX extraction will be implemented")
          break
        case "spreadsheet":
          // TODO: Add spreadsheet extraction when library is added
          console.log("Spreadsheet extraction will be implemented")
          break
        case "presentation":
          // TODO: Add presentation extraction when library is added
          console.log("Presentation extraction will be implemented")
          break
        default:
          // Handle other document types
          console.log("Other document type extraction will be implemented")
      }
    } catch (error) {
      console.error('Error extracting document text:', error)
      setDocumentError(`Failed to extract text from ${type.toUpperCase()} file. Please ensure it's a valid document.`)
      setResult({
        success: false,
        message: `Failed to extract text from ${type.toUpperCase()} file. Please try another file.`
      })
    }
  }

  const extractPdfText = async (arrayBuffer: ArrayBuffer) => {
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer })
    
    // Add progress callback
    loadingTask.onProgress = (progressData: { loaded: number; total: number }) => {
      if (progressData.total > 0) {
        const percent = (progressData.loaded / progressData.total) * 100
        setProgress(Math.round(percent))
      }
    }

    const pdf = await loadingTask.promise
    const numPages = pdf.numPages
    const textContent: string[] = []
    const pages: any[] = []

    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i)
      const text = await page.getTextContent()
      const pageText = text.items.map((item: any) => item.str).join(' ')
      textContent.push(pageText)
      pages.push(page)
    }

    setPdfText(textContent)
    setPdfPages(pages)
    setFileContent(textContent.join('\n\n'))
    setProgress(100)
  }

  const handleImageFile = async (file: File) => {
    // TODO: Add image handling when library is added
    console.log("Image handling will be implemented")
  }

  const handleArchiveFile = async (file: File) => {
    // TODO: Add archive handling when library is added
    console.log("Archive handling will be implemented")
  }

  const readTextFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      setFileContent(content || "")
    }
    reader.readAsText(file)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setResult(null)
      setSelectedText(null)
    }
  }

  const handleRsaPublicKeyFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setRsaPublicKeyFile(e.target.files[0])
      const reader = new FileReader()
      reader.onload = (e) => {
        setRsaPublicKey((e.target?.result as string) || "")
      }
      reader.readAsText(e.target.files[0])
    }
  }

  const handleRsaPrivateKeyFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setRsaPrivateKeyFile(e.target.files[0])
      const reader = new FileReader()
      reader.onload = (e) => {
        setRsaPrivateKey((e.target?.result as string) || "")
      }
      reader.readAsText(e.target.files[0])
    }
  }

  const handleTextSelection = () => {
    if (textAreaRef.current) {
      const start = textAreaRef.current.selectionStart
      const end = textAreaRef.current.selectionEnd

      if (start !== end) {
        setSelectedText({
          start,
          end,
          text: fileContent.substring(start, end),
        })
      }
    }
  }

  const generateRandomHex = (length: number) => {
    const characters = "0123456789abcdef"
    let result = ""
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length))
    }
    return result
  }

  const generateTripleDesKeys = () => {
    setTripleDesKey1(generateRandomHex(16))
    setTripleDesKey2(generateRandomHex(16))
    setTripleDesKey3(generateRandomHex(16))
  }

  const generateIV = () => {
    if (algorithm === "aes") {
      if (aesMode === "gcm") {
        setAesIv(generateRandomHex(24))
      } else if (aesMode === "ctr") {
        setAesIv(generateRandomHex(32))
      } else {
        setAesIv(generateRandomHex(32))
      }
    } else if (algorithm === "chacha20") {
      if (chachaMode === "chacha20-poly1305") {
        setChachaNonce(generateRandomHex(24))
      } else {
        setChachaNonce(generateRandomHex(32))
      }
    } else if (algorithm === "3des") {
      setTripleDesIv(generateRandomHex(16))
    }
  }

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
  }

  const handlePdfPageChange = (pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= (numPages || 1)) {
      setCurrentPage(pageNumber)
    }
  }

  const downloadRSAKeys = (publicKey: string, privateKey: string) => {
    const publicKeyBlob = new Blob([publicKey], { type: 'text/plain' })
    const publicKeyUrl = URL.createObjectURL(publicKeyBlob)
    const publicKeyLink = document.createElement('a')
    publicKeyLink.href = publicKeyUrl
    publicKeyLink.download = 'public_key.pem'
    document.body.appendChild(publicKeyLink)
    publicKeyLink.click()
    document.body.removeChild(publicKeyLink)
    URL.revokeObjectURL(publicKeyUrl)

    const privateKeyBlob = new Blob([privateKey], { type: 'text/plain' })
    const privateKeyUrl = URL.createObjectURL(privateKeyBlob)
    const privateKeyLink = document.createElement('a')
    privateKeyLink.href = privateKeyUrl
    privateKeyLink.download = 'private_key.pem'
    document.body.appendChild(privateKeyLink)
    privateKeyLink.click()
    document.body.removeChild(privateKeyLink)
    URL.revokeObjectURL(privateKeyUrl)
  }

  const simulateRsaKeyGeneration = async () => {
    setIsProcessing(true)
    setResult(null)

    try {
      const response = await fetch('https://security-project-km7v.onrender.com/api/generate-rsa-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keySize: parseInt(rsaKeySize)
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate RSA keys')
      }

      const data = await response.json()
      
      setRsaPublicKey(data.public_key)
      setRsaPrivateKey(data.private_key)
      
      downloadRSAKeys(data.public_key, data.private_key)
      
      setResult({
        success: true,
        message: "RSA key pair generated and downloaded successfully. Make sure to save your private key securely."
      })

    } catch (error) {
      console.error('Error generating RSA keys:', error)
      setResult({
        success: false,
        message: "Failed to generate RSA keys. Please try again."
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file) {
      setResult({
        success: false,
        message: "Please select a file.",
      })
      return
    }

    if (algorithm === "rsa") {
      if (operation === "encrypt" && !rsaPublicKey) {
        setResult({
          success: false,
          message: "Please provide a public key for RSA encryption.",
        })
        return
      }
      if (operation === "decrypt" && !rsaPrivateKey) {
        setResult({
          success: false,
          message: "Please provide a private key for RSA decryption.",
        })
        return
      }
    } else if (algorithm === "3des") {
      if (!tripleDesKey1) {
        setResult({
          success: false,
          message: "Please provide at least the first key for Triple DES.",
        })
        return
      }
      if (tripleDesKeyOption === "two" && !tripleDesKey2) {
        setResult({
          success: false,
          message: "Please provide the second key for Triple DES (2-key mode).",
        })
        return
      }
      if (tripleDesKeyOption === "three" && (!tripleDesKey2 || !tripleDesKey3)) {
        setResult({
          success: false,
          message: "Please provide all three keys for Triple DES (3-key mode).",
        })
        return
      }
    } else if (algorithm !== "rsa" && !password) {
      setResult({
        success: false,
        message: "Please enter a password.",
      })
      return
    }

    if (partialEncryption && fileType !== "binary" && (!selectedText || selectedText.text.trim() === "")) {
      setResult({
        success: false,
        message: "Please select a portion of text to encrypt.",
      })
      return
    }

    setIsProcessing(true)
    setProgress(0)

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          clearInterval(interval)
          return prev
        }
        return prev + 5
      })
    }, 100)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("operation", operation)
      formData.append("algorithm", algorithm)

      if (algorithm === "aes") {
        formData.append("password", password)
        formData.append("keySize", aesKeySize)
        formData.append("mode", aesMode)
        if (aesMode !== "ecb") {
          formData.append("iv", aesIv)
        }
      } else if (algorithm === "chacha20") {
        formData.append("password", password)
        formData.append("mode", chachaMode)
        formData.append("nonce", chachaNonce)
      } else if (algorithm === "rsa") {
        if (operation === "encrypt") {
          formData.append("publicKey", rsaPublicKey)
        } else {
          formData.append("privateKey", rsaPrivateKey)
        }
      } else if (algorithm === "3des") {
        formData.append("password", password)
        formData.append("keySize", "192")
        formData.append("mode", tripleDesMode)
        formData.append("keyOption", tripleDesKeyOption)
        formData.append("key1", tripleDesKey1)
        if (tripleDesKeyOption === "two" || tripleDesKeyOption === "three") {
          formData.append("key2", tripleDesKey2)
        }
        if (tripleDesKeyOption === "three") {
          formData.append("key3", tripleDesKey3)
        }
        if (tripleDesMode !== "ecb") {
          formData.append("iv", tripleDesIv)
        }
      }

      if (partialEncryption && fileType !== "binary" && selectedText) {
        formData.append("partialEncryption", "true")
        formData.append("selectedTextStart", selectedText.start.toString())
        formData.append("selectedTextEnd", selectedText.end.toString())
        formData.append("selectedText", selectedText.text)
      }

      if (file) {
        if (fileType === "text" || fileType === "pdf") {
          formData.append("plaintext", fileContent)
        } else {
          const fileBuffer = await file.arrayBuffer()
          formData.append("plaintext", new Blob([fileBuffer]))
        }
      }

      const response = await fetch('https://security-project-km7v.onrender.com/api/encrypt', {
        method: 'POST',
        body: formData,
      })
      const data = await response.json()

      clearInterval(interval)
      setProgress(100)

      if (data.message === "Success") {
        if (partialEncryption && fileType !== "binary" && selectedText) {
          const prefix = fileContent.substring(0, selectedText.start)
          const suffix = fileContent.substring(selectedText.end)
          setFileContent(prefix + data.processedSelection + suffix)
        }

        setResult({
          success: true,
          message: data.message || `File ${operation}d successfully!`,
        })

        setFileContent(data.data)

      } else {
        setResult({ success: false, message: data.message || 'Operation failed.' })
      }
    } catch (error) {
      clearInterval(interval)
      setProgress(0)
      setResult({ success: false, message: `Failed to ${operation} file. Please try again.` })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDownload = () => {
    if (result && result.success) {
      let content = fileContent
      let filename = file ? file.name : "encrypted_file"
      
      if (fileType === "document") {
        content = documentContent.join('\n\n')
        filename = filename.replace(/\.[^/.]+$/, '_extracted.txt')
      }
      
      const blob = new Blob([content], { type: "text/plain" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  const getAlgorithmDescription = () => {
    switch (algorithm) {
      case "aes":
        return "AES (Advanced Encryption Standard) - Symmetric block cipher with key sizes of 128, 192, or 256 bits."
      case "chacha20":
        return "ChaCha20 - High-speed stream cipher designed for software implementation without special hardware."
      case "rsa":
        return "RSA - Asymmetric encryption algorithm using public/private key pairs for secure communication."
      case "3des":
        return "Triple DES - Applies DES cipher three times to each data block for increased security."
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
                  <SelectItem value="ecb">ECB (Electronic Codebook) - Not recommended for most uses</SelectItem>
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

      case "rsa":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Key Management</Label>
              <Tabs value={rsaKeyType} onValueChange={(value: any) => setRsaKeyType(value as any)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="generate">Generate Keys</TabsTrigger>
                  <TabsTrigger value="upload">Upload Keys</TabsTrigger>
                  <TabsTrigger value="paste">Paste Keys</TabsTrigger>
                </TabsList>
                <TabsContent value="generate" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="rsa-key-size">Key Size</Label>
                    <Select value={rsaKeySize} onValueChange={setRsaKeySize}>
                      <SelectTrigger id="rsa-key-size">
                        <SelectValue placeholder="Select key size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2048">2048 bits (Standard security)</SelectItem>
                        <SelectItem value="4096">4096 bits (High security)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    type="button" 
                    onClick={simulateRsaKeyGeneration} 
                    disabled={isProcessing} 
                    className="w-full"
                  >
                    {isProcessing ? "Generating..." : "Generate Key Pair"}
                  </Button>
                  {(rsaPublicKey || rsaPrivateKey) && (
                    <Alert>
                      <AlertTitle className="flex items-center gap-2">
                        <Key className="h-4 w-4" />
                        Keys Generated
                      </AlertTitle>
                      <AlertDescription>
                        RSA key pair has been generated and downloaded. Make sure to save your private key securely.
                      </AlertDescription>
                    </Alert>
                  )}
                </TabsContent>
                <TabsContent value="upload" className="space-y-4">
                  {operation === "encrypt"  ? (
                    <div className="space-y-2">
                      <Label htmlFor="rsa-public-key-file">Public Key (for encryption)</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="rsa-public-key-file"
                          type="file"
                          accept=".pem,.key,.pub"
                          onChange={handleRsaPublicKeyFileChange}
                          className="cursor-pointer"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById("rsa-public-key-file")?.click()}
                        >
                          Browse
                        </Button>
                      </div>
                      {rsaPublicKeyFile && <p className="text-sm text-gray-500">Selected: {rsaPublicKeyFile.name}</p>}
                    </div>
                  ) : null}

                  {operation === "decrypt"  ? (
                    <div className="space-y-2">
                      <Label htmlFor="rsa-private-key-file">Private Key (for decryption)</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="rsa-private-key-file"
                          type="file"
                          accept=".pem,.key"
                          onChange={handleRsaPrivateKeyFileChange}
                          className="cursor-pointer"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById("rsa-private-key-file")?.click()}
                        >
                          Browse
                        </Button>
                      </div>
                      {rsaPrivateKeyFile && <p className="text-sm text-gray-500">Selected: {rsaPrivateKeyFile.name}</p>}
                    </div>
                  ) : null}
                </TabsContent>
                <TabsContent value="paste" className="space-y-4">
                  {operation === "encrypt"  ? (
                    <div className="space-y-2">
                      <Label htmlFor="rsa-public-key">Public Key (for encryption)</Label>
                      <Textarea
                        id="rsa-public-key"
                        value={rsaPublicKey}
                        onChange={(e) => setRsaPublicKey(e.target.value)}
                        placeholder="Paste PEM-formatted public key here"
                        className="font-mono text-xs h-32"
                      />
                    </div>
                  ) : null}

                  {operation === "decrypt"  ? (
                    <div className="space-y-2">
                      <Label htmlFor="rsa-private-key">Private Key (for decryption)</Label>
                      <Textarea
                        id="rsa-private-key"
                        value={rsaPrivateKey}
                        onChange={(e) => setRsaPrivateKey(e.target.value)}
                        placeholder="Paste PEM-formatted private key here"
                        className="font-mono text-xs h-32"
                      />
                    </div>
                  ) : null}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        )

      case "3des":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="3des-key-option">Key Option</Label>
              <Select value={tripleDesKeyOption} onValueChange={setTripleDesKeyOption}>
                <SelectTrigger id="3des-key-option">
                  <SelectValue placeholder="Select key option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="one">1 Key (56-bit effective security, not recommended)</SelectItem>
                  <SelectItem value="two">2 Keys (112-bit effective security)</SelectItem>
                  <SelectItem value="three">3 Keys (168-bit effective security)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="3des-key1">Key 1</Label>
                <Button type="button" variant="outline" size="sm" onClick={generateTripleDesKeys}>
                  Generate Random Keys
                </Button>
              </div>
              <Input
                id="3des-key1"
                value={tripleDesKey1}
                onChange={(e) => setTripleDesKey1(e.target.value)}
                placeholder="Enter first key (8 bytes / 64 bits)"
              />
            </div>

            {(tripleDesKeyOption === "two" || tripleDesKeyOption === "three") && (
              <div className="space-y-2">
                <Label htmlFor="3des-key2">Key 2</Label>
                <Input
                  id="3des-key2"
                  value={tripleDesKey2}
                  onChange={(e) => setTripleDesKey2(e.target.value)}
                  placeholder="Enter second key (8 bytes / 64 bits)"
                />
              </div>
            )}

            {tripleDesKeyOption === "three" && (
              <div className="space-y-2">
                <Label htmlFor="3des-key3">Key 3</Label>
                <Input
                  id="3des-key3"
                  value={tripleDesKey3}
                  onChange={(e) => setTripleDesKey3(e.target.value)}
                  placeholder="Enter third key (8 bytes / 64 bits)"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="3des-mode">Mode of Operation</Label>
              <Select value={tripleDesMode} onValueChange={setTripleDesMode}>
                <SelectTrigger id="3des-mode">
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ecb">ECB (Electronic Codebook) - Not recommended for most uses</SelectItem>
                  <SelectItem value="cbc">CBC (Cipher Block Chaining) - Requires IV</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {tripleDesMode !== "ecb" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="3des-iv">Initialization Vector (IV)</Label>
                  <Button type="button" variant="outline" size="sm" onClick={generateIV}>
                    Generate Random
                  </Button>
                </div>
                <Input
                  id="3des-iv"
                  value={tripleDesIv}
                  onChange={(e) => setTripleDesIv(e.target.value)}
                  placeholder="Enter IV (8 bytes / 64 bits, hex format)"
                />
                <p className="text-xs text-gray-500">IV should be random and unique for each encryption</p>
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>File {operation === "encrypt" ? "Encryption" : "Decryption"}</CardTitle>
        <CardDescription>
          {operation === "encrypt"
            ? "Secure your files with strong encryption"
            : "Decrypt your previously encrypted files"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Operation</Label>
              <RadioGroup
                value={operation}
                onValueChange={(value: any) => {
                  setOperation(value as "encrypt" | "decrypt")
                  setResult(null)
                }}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="encrypt" id="encrypt" />
                  <Label htmlFor="encrypt" className="flex items-center gap-1 cursor-pointer">
                    <Lock className="h-4 w-4" /> Encrypt
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="decrypt" id="decrypt" />
                  <Label htmlFor="decrypt" className="flex items-center gap-1 cursor-pointer">
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
                  <SelectItem value="rsa">RSA</SelectItem>
                  <SelectItem value="3des">Triple DES</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">{getAlgorithmDescription()}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">Select File</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="file"
                  type="file"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                  disabled={isProcessing}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("file")?.click()}
                  disabled={isProcessing}
                >
                  <FileUp className="h-4 w-4 mr-2" />
                  Browse
                </Button>
              </div>
              {file && (
                <p className="text-sm text-gray-500">
                  Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB) -{" "}
                  {fileType === "pdf" ? "PDF Document" : fileType === "text" ? "Text File" : "Binary File"}
                </p>
              )}
            </div>

            {renderAlgorithmOptions()}

            {algorithm !== "rsa" && (
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
                    ? "Choose a strong password you'll remember. You'll need it to decrypt the file later."
                    : "Enter the password you used to encrypt this file."}
                </p>
              </div>
            )}

            {(fileType === "text" || fileType === "pdf") && file && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="partial-encryption">Partial Encryption</Label>
                  <Switch id="partial-encryption" checked={partialEncryption} onCheckedChange={setPartialEncryption} />
                </div>
                <p className="text-xs text-gray-500">
                  {partialEncryption
                    ? "Select text in the preview to encrypt/decrypt only that portion"
                    : "Enable to encrypt/decrypt only selected portions of text"}
                </p>
              </div>
            )}

            {(fileType === "text" || fileType === "pdf") && file && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>File Preview</Label>
                  <div className="flex items-center gap-2">
                    {fileType === "pdf" && (
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handlePdfPageChange(currentPage - 1)}
                          disabled={currentPage <= 1}
                        >
                          Previous
                        </Button>
                        <span className="text-sm">
                          Page {currentPage} of {numPages || 1}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handlePdfPageChange(currentPage + 1)}
                          disabled={currentPage >= (numPages || 1)}
                        >
                          Next
                        </Button>
                      </div>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewVisible(!previewVisible)}
                      className="flex items-center gap-1"
                    >
                      <Eye className="h-4 w-4" />
                      {previewVisible ? "Hide Preview" : "Show Preview"}
                    </Button>
                  </div>
                </div>

                {previewVisible && (
                  <div className="border rounded-md p-2">
                    {fileType === "document" && pdfUrl ? (
                      <div className="max-h-[500px] overflow-auto">
                        {documentError ? (
                          <Alert variant="destructive" className="mb-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{documentError}</AlertDescription>
                          </Alert>
                        ) : (
                          <>
                            {documentType === "pdf" && (
                              <Document
                                file={pdfUrl}
                                onLoadSuccess={onDocumentLoadSuccess}
                                onLoadError={(error) => {
                                  console.error('Error loading PDF:', error)
                                  setDocumentError("Failed to load PDF file. Please try another file.")
                                }}
                                loading={
                                  <div className="flex items-center justify-center p-4">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                                  </div>
                                }
                                className="flex flex-col items-center"
                              >
                                <Page
                                  pageNumber={currentPage}
                                  renderTextLayer={true}
                                  renderAnnotationLayer={true}
                                  className="max-w-full"
                                  loading={
                                    <div className="flex items-center justify-center p-4">
                                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                                    </div>
                                  }
                                />
                              </Document>
                            )}
                            {partialEncryption && !documentError && (
                              <div className="mt-4">
                                <Textarea
                                  ref={textAreaRef}
                                  value={documentContent[currentPage - 1] || ''}
                                  onChange={(e) => {
                                    const newContent = [...documentContent]
                                    newContent[currentPage - 1] = e.target.value
                                    setDocumentContent(newContent)
                                    setFileContent(newContent.join('\n\n'))
                                  }}
                                  onSelect={handleTextSelection}
                                  className="min-h-[100px] font-mono text-sm"
                                  placeholder="Document text content..."
                                />
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    ) : (
                      <Textarea
                        ref={textAreaRef}
                        value={fileContent}
                        onChange={(e) => setFileContent(e.target.value)}
                        onSelect={handleTextSelection}
                        className="min-h-[200px] font-mono text-sm"
                        placeholder="File content will appear here..."
                      />
                    )}
                    {partialEncryption && selectedText && (
                      <div className="mt-2 p-2 bg-gray-100 rounded-md">
                        <p className="text-sm font-medium">Selected Text:</p>
                        <p className="text-sm font-mono break-all">
                          {selectedText.text.length > 100
                            ? `${selectedText.text.substring(0, 100)}...`
                            : selectedText.text}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Characters: {selectedText.text.length}, Position: {selectedText.start}-{selectedText.end}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {isProcessing && (
              <div className="space-y-2">
                <Label>Processing</Label>
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-gray-500 text-center">{progress}% complete</p>
              </div>
            )}

            {result && (
              <Alert variant={result.success ? "default" : "destructive"}>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{result.success ? "Success" : "Error"}</AlertTitle>
                <AlertDescription>{result.message}</AlertDescription>
              </Alert>
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-4">
            <Button
              type="submit"
              className="flex-1"
              disabled={
                !file ||
                isProcessing ||
                (algorithm === "rsa" &&
                  ((operation === "encrypt" && !rsaPublicKey) || (operation === "decrypt" && !rsaPrivateKey))) ||
                (algorithm !== "rsa" && !password) ||
                (partialEncryption && fileType !== "binary" && (!selectedText || selectedText.text.trim() === ""))
              }
            >
              {isProcessing ? "Processing..." : operation === "encrypt" ? "Encrypt File" : "Decrypt File"}
            </Button>

            {(fileType === "text" || fileType === "pdf") && fileContent && result?.success && (
              <Button
                type="button"
                variant="outline"
                onClick={handleDownload}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download Result
              </Button>
            )}
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center border-t pt-6">
        <p className="text-xs text-gray-500 text-center max-w-md">
          All encryption and decryption is performed securely. Your files are never stored on our servers and are
          processed locally through our secure API.
        </p>
      </CardFooter>
    </Card>
  )
}
