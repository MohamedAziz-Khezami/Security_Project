"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { AlertCircle, FileUp, Lock, Unlock, Download, Eye, Info, Key, Hash } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Import the FileEncryptionGuide component at the top of the file
import { FileEncryptionGuide } from "./file-encryption-guide"

export default function FileEncryption() {
  const [file, setFile] = useState<File | null>(null)
  const [operation, setOperation] = useState<"encrypt" | "decrypt" | "hash">("encrypt")
  const [password, setPassword] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<{ success: boolean; message: string; hash?: string } | null>(null)
  const [fileType, setFileType] = useState<"binary" | "text" | "pdf">("binary")
  const [fileContent, setFileContent] = useState<string>("")
  const [selectedText, setSelectedText] = useState<{ start: number; end: number; text: string } | null>(null)
  const [partialEncryption, setPartialEncryption] = useState(false)
  const [algorithm, setAlgorithm] = useState("aes")
  const [previewVisible, setPreviewVisible] = useState(false)

  // Algorithm-specific parameters
  const [aesKeySize, setAesKeySize] = useState("256")
  const [aesMode, setAesMode] = useState("gcm")
  const [aesIv, setAesIv] = useState("")

  // ECC parameters
  const [eccCurve, setEccCurve] = useState("secp256k1")
  const [eccPublicKey, setEccPublicKey] = useState("")
  const [eccPrivateKey, setEccPrivateKey] = useState("")
  const [eccKeyType, setEccKeyType] = useState<"generate" | "upload" | "paste">("generate")
  const [eccPublicKeyFile, setEccPublicKeyFile] = useState<File | null>(null)
  const [eccPrivateKeyFile, setEccPrivateKeyFile] = useState<File | null>(null)

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

  // Hashing parameters
  const [hashAlgorithm, setHashAlgorithm] = useState("sha256")
  const [hashSalt, setHashSalt] = useState("")
  const [hashIterations, setHashIterations] = useState(1000)

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
    } else if (algorithm === "ecc") {
      setEccPublicKey("")
      setEccPrivateKey("")
      setEccPublicKeyFile(null)
      setEccPrivateKeyFile(null)
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
    const extension = file.name.split(".").pop()?.toLowerCase()

    if (extension === "pdf") {
      setFileType("pdf")
      simulatePdfToTextConversion(file)
    } else if (["txt", "json", "csv", "md", "html", "css", "js", "jsx", "ts", "tsx"].includes(extension || "")) {
      setFileType("text")
      readTextFile(file)
    } else {
      setFileType("binary")
      setFileContent("")
      setPreviewVisible(false)
    }
  }

  const readTextFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      setFileContent(content || "")
    }
    reader.readAsText(file)
  }

  const simulatePdfToTextConversion = (file: File) => {
    // In a real app, you would use a PDF to text library
    // Here we're simulating the conversion
    setIsProcessing(true)

    setTimeout(() => {
      const fileName = file.name
      setFileContent(
        `This is the simulated text content extracted from the PDF file "${fileName}".\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam auctor, nisl eget ultricies tincidunt, nisl nisl aliquam nisl, eget ultricies nisl nisl eget nisl. Nullam auctor, nisl eget ultricies tincidunt, nisl nisl aliquam nisl, eget ultricies nisl nisl eget nisl.\n\nNullam auctor, nisl eget ultricies tincidunt, nisl nisl aliquam nisl, eget ultricies nisl nisl eget nisl. Nullam auctor, nisl eget ultricies tincidunt, nisl nisl aliquam nisl, eget ultricies nisl nisl eget nisl.`,
      )
      setIsProcessing(false)
    }, 1500)
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

  const handleEccPublicKeyFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setEccPublicKeyFile(e.target.files[0])
      const reader = new FileReader()
      reader.onload = (e) => {
        setEccPublicKey((e.target?.result as string) || "")
      }
      reader.readAsText(e.target.files[0])
    }
  }

  const handleEccPrivateKeyFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setEccPrivateKeyFile(e.target.files[0])
      const reader = new FileReader()
      reader.onload = (e) => {
        setEccPrivateKey((e.target?.result as string) || "")
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
    // Generate 8 bytes (64 bits) for each key
    setTripleDesKey1(generateRandomHex(16)) // 8 bytes = 16 hex characters
    setTripleDesKey2(generateRandomHex(16))
    setTripleDesKey3(generateRandomHex(16))
  }

  const generateIV = () => {
    if (algorithm === "aes") {
      if (aesMode === "gcm") {
        // 12 bytes (96 bits) for GCM/CTR
        setAesIv(generateRandomHex(24))
      } else if (aesMode === "ctr") {
        setAesIv(generateRandomHex(32))
      }
      // 16 bytes (128 bits) for AES
      else setAesIv(generateRandomHex(32))
    } else if (algorithm === "3des") {
      // 8 bytes (64 bits) for 3DES
      setTripleDesIv(generateRandomHex(16))
    }
  }

  const downloadRSAKeys = (publicKey: string, privateKey: string) => {
    // Download public key
    const publicKeyBlob = new Blob([publicKey], { type: "text/plain" })
    const publicKeyUrl = URL.createObjectURL(publicKeyBlob)
    const publicKeyLink = document.createElement("a")
    publicKeyLink.href = publicKeyUrl
    publicKeyLink.download = "public_key.pem"
    document.body.appendChild(publicKeyLink)
    publicKeyLink.click()
    document.body.removeChild(publicKeyLink)
    URL.revokeObjectURL(publicKeyUrl)

    // Download private key
    const privateKeyBlob = new Blob([privateKey], { type: "text/plain" })
    const privateKeyUrl = URL.createObjectURL(privateKeyBlob)
    const privateKeyLink = document.createElement("a")
    privateKeyLink.href = privateKeyUrl
    privateKeyLink.download = "private_key.pem"
    document.body.appendChild(privateKeyLink)
    privateKeyLink.click()
    document.body.removeChild(privateKeyLink)
    URL.revokeObjectURL(privateKeyUrl)
  }

  const downloadECCKeys = (publicKey: string, privateKey: string) => {
    // Download public key
    const publicKeyBlob = new Blob([publicKey], { type: "text/plain" })
    const publicKeyUrl = URL.createObjectURL(publicKeyBlob)
    const publicKeyLink = document.createElement("a")
    publicKeyLink.href = publicKeyUrl
    publicKeyLink.download = "ecc_public_key.pem"
    document.body.appendChild(publicKeyLink)
    publicKeyLink.click()
    document.body.removeChild(publicKeyLink)
    URL.revokeObjectURL(publicKeyUrl)

    // Download private key
    const privateKeyBlob = new Blob([privateKey], { type: "text/plain" })
    const privateKeyUrl = URL.createObjectURL(privateKeyBlob)
    const privateKeyLink = document.createElement("a")
    privateKeyLink.href = privateKeyUrl
    privateKeyLink.download = "ecc_private_key.pem"
    document.body.appendChild(privateKeyLink)
    privateKeyLink.click()
    document.body.removeChild(privateKeyLink)
    URL.revokeObjectURL(privateKeyUrl)
  }

  const simulateRsaKeyGeneration = async () => {
    setIsProcessing(true)
    setResult(null)

    try {
      const response = await fetch("http://localhost:8000/api/generate-rsa-keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          keySize: Number.parseInt(rsaKeySize),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate RSA keys")
      }

      const data = await response.json()

      setRsaPublicKey(data.public_key)
      setRsaPrivateKey(data.private_key)

      // Download the keys automatically
      downloadRSAKeys(data.public_key, data.private_key)

      setResult({
        success: true,
        message: "RSA key pair generated and downloaded successfully. Make sure to save your private key securely.",
      })
    } catch (error) {
      console.error("Error generating RSA keys:", error)
      setResult({
        success: false,
        message: "Failed to generate RSA keys. Please try again.",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const simulateEccKeyGeneration = async () => {
    setIsProcessing(true)
    setResult(null)
 
    const fdata = new FormData()
    fdata.append("curve", eccCurve)


    console.log("Form data contents:")
    console.log(fdata)

    try {
      // Simulate API call to generate ECC keys
      const response = await fetch("http://localhost:8000/api/generate-ecc-keys", {
        method: "POST",
        body: fdata
      })
      if (!response.ok) {
        throw new Error("Failed to generate ECC keys")
      }

      const data = await response.json()

      const publicKey = data.public_key
      const privateKey = data.private_key

      setTimeout(() => {
        // Simulate key generation delay
        setIsProcessing(false)
        setResult({
          success: true,
          message: "ECC key pair generated and downloaded successfully. Make sure to save your private key securely.",
      })
        setEccPublicKey(publicKey)
        setEccPrivateKey(privateKey)

        // Download the keys automatically
        downloadECCKeys(publicKey, privateKey)

        setResult({
          success: true,
          message: "ECC key pair generated and downloaded successfully. Make sure to save your private key securely.",
        })
        setIsProcessing(false)
      }, 1500)
    } catch (error) {
      console.error("Error generating ECC keys:", error)
      setResult({
        success: false,
        message: "Failed to generate ECC keys. Please try again.",
      })
      setIsProcessing(false)
    }
  }

  const handleHashFile = async () => {
    if (!file) {
      setResult({
        success: false,
        message: "Please select a file to hash.",
      })
      return
    }

    setIsProcessing(true)
    setProgress(0)

    // Simulate progress
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
      // Create FormData for the request
      const formData = new FormData()
      formData.append("file", file)
      formData.append("algorithm", hashAlgorithm)
      //formData.append("salt", hashSalt)
      //formData.append("iterations", hashIterations.toString())

      // Simulate API call
      const response = await fetch("http://localhost:8000/api/hash", {
        method: "POST",
        body: formData,
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to hash file")
      }

      clearInterval(interval)
      setProgress(100)
      setResult({
        success: true,
        message: "File hashed successfully!",
        hash: data.hash,
      })
    } catch (error) {
      clearInterval(interval)
      setProgress(0)
      setResult({
        success: false,
        message: "Failed to hash file. Please try again.",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (operation === "hash") {
      handleHashFile()
      return
    }

    // Validate inputs based on selected algorithm
    if (!file) {
      setResult({
        success: false,
        message: "Please select a file.",
      })
      return
    }

    // Algorithm-specific validation
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
    } else if (algorithm === "ecc") {
      if (operation === "encrypt" && !eccPublicKey) {
        setResult({
          success: false,
          message: "Please provide a public key for ECC encryption.",
        })
        return
      }
      if (operation === "decrypt" && !eccPrivateKey) {
        setResult({
          success: false,
          message: "Please provide a private key for ECC decryption.",
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
    } else if (algorithm !== "rsa" && algorithm !== "ecc" && !password) {
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

    // Simulate progress
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
      // In a real app, you would send the file to your FastAPI backend
      // This is a placeholder for the API call
      const formData = new FormData()
      formData.append("file", file)
      formData.append("operation", operation)
      formData.append("algorithm", algorithm)

      // Add algorithm-specific parameters
      if (algorithm === "aes") {
        formData.append("password", password)
        formData.append("keySize", aesKeySize)
        formData.append("mode", aesMode)
        if (aesMode !== "ecb") {
          formData.append("iv", aesIv)
        }
      } else if (algorithm === "ecc") {
        if (operation === "encrypt") {
          formData.append("publicKey", eccPublicKey)
        } else {
          formData.append("privateKey", eccPrivateKey)
        }
        formData.append("curve", eccCurve)
      } else if (algorithm === "rsa") {
        if (operation === "encrypt") {
          formData.append("publicKey", rsaPublicKey)
        } else {
          formData.append("privateKey", rsaPrivateKey)
        }
      } else if (algorithm === "3des") {
        formData.append("password", password)
        formData.append("keySize", "192") // Triple DES uses 192-bit keys (3 x 64 bits)
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

      // Add file content
      if (file) {
        if (fileType === "text" || fileType === "pdf") {
          formData.append("plaintext", fileContent)
        } else {
          const fileBuffer = await file.arrayBuffer()
          formData.append("plaintext", new Blob([fileBuffer]))
        }
      }

      console.log("Form data contents:")
      for (const pair of formData.entries()) {
        console.log(pair[0] + ": " + pair[1])
      }

      // ----- New: Send to real API -----
      const response = await fetch("http://localhost:8000/api/encrypt", {
        method: "POST",
        body: formData,
      })
      const data = await response.json()

      clearInterval(interval)
      setProgress(100)

      if (data.message === "Success") {
        // If partial, update content
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
        setResult({ success: false, message: data.message || "Operation failed." })
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
      const blob = new Blob([fileContent], { type: "application/octet-stream" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = file ? file.name : "encrypted_file"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  const copyHashToClipboard = () => {
    if (result?.hash) {
      navigator.clipboard.writeText(result.hash)
      setResult({
        ...result,
        message: "Hash copied to clipboard!",
      })
    }
  }

  const getAlgorithmDescription = () => {
    switch (algorithm) {
      case "aes":
        return "AES (Advanced Encryption Standard) - Symmetric block cipher with key sizes of 128, 192, or 256 bits."
      case "ecc":
        return "ECC (Elliptic Curve Cryptography) - Asymmetric encryption using elliptic curves for enhanced security with smaller key sizes."
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

      case "ecc":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ecc-curve">Elliptic Curve</Label>
              <Select value={eccCurve} onValueChange={setEccCurve}>
                <SelectTrigger id="ecc-curve">
                  <SelectValue placeholder="Select curve" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="secp256k1">secp256k1 (Used in Bitcoin)</SelectItem>
                  <SelectItem value="secp256r1">secp256r1 (NIST P-256) - NIST standard</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Curve25519 offers excellent security and performance and is resistant to timing attacks.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Key Management</Label>
              <Tabs value={eccKeyType} onValueChange={(value: any) => setEccKeyType(value as any)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="generate">Generate Keys</TabsTrigger>
                  <TabsTrigger value="upload">Upload Keys</TabsTrigger>
                  <TabsTrigger value="paste">Paste Keys</TabsTrigger>
                </TabsList>
                <TabsContent value="generate" className="space-y-4">
                  <Button type="button" onClick={simulateEccKeyGeneration} disabled={isProcessing} className="w-full">
                    {isProcessing ? "Generating..." : "Generate ECC Key Pair"}
                  </Button>
                  {(eccPublicKey || eccPrivateKey) && (
                    <Alert>
                      <AlertTitle className="flex items-center gap-2">
                        <Key className="h-4 w-4" />
                        Keys Generated
                      </AlertTitle>
                      <AlertDescription>
                        ECC key pair has been generated and downloaded. Make sure to save your private key securely.
                      </AlertDescription>
                    </Alert>
                  )}
                </TabsContent>
                <TabsContent value="upload" className="space-y-4">
                  {operation === "encrypt" ? (
                    <div className="space-y-2">
                      <Label htmlFor="ecc-public-key-file">Public Key (for encryption)</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="ecc-public-key-file"
                          type="file"
                          accept=".pem,.key,.pub"
                          onChange={handleEccPublicKeyFileChange}
                          className="cursor-pointer"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById("ecc-public-key-file")?.click()}
                        >
                          Browse
                        </Button>
                      </div>
                      {eccPublicKeyFile && <p className="text-sm text-gray-500">Selected: {eccPublicKeyFile.name}</p>}
                    </div>
                  ) : null}

                  {operation === "decrypt" ? (
                    <div className="space-y-2">
                      <Label htmlFor="ecc-private-key-file">Private Key (for decryption)</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="ecc-private-key-file"
                          type="file"
                          accept=".pem,.key"
                          onChange={handleEccPrivateKeyFileChange}
                          className="cursor-pointer"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById("ecc-private-key-file")?.click()}
                        >
                          Browse
                        </Button>
                      </div>
                      {eccPrivateKeyFile && <p className="text-sm text-gray-500">Selected: {eccPrivateKeyFile.name}</p>}
                    </div>
                  ) : null}
                </TabsContent>
                <TabsContent value="paste" className="space-y-4">
                  {operation === "encrypt" ? (
                    <div className="space-y-2">
                      <Label htmlFor="ecc-public-key">Public Key (for encryption)</Label>
                      <Textarea
                        id="ecc-public-key"
                        value={eccPublicKey}
                        onChange={(e) => setEccPublicKey(e.target.value)}
                        placeholder="Paste PEM-formatted public key here"
                        className="font-mono text-xs h-32"
                      />
                    </div>
                  ) : null}

                  {operation === "decrypt" ? (
                    <div className="space-y-2">
                      <Label htmlFor="ecc-private-key">Private Key (for decryption)</Label>
                      <Textarea
                        id="ecc-private-key"
                        value={eccPrivateKey}
                        onChange={(e) => setEccPrivateKey(e.target.value)}
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
                  <Button type="button" onClick={simulateRsaKeyGeneration} disabled={isProcessing} className="w-full">
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
                  {operation === "encrypt" ? (
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

                  {operation === "decrypt" ? (
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
                  {operation === "encrypt" ? (
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

                  {operation === "decrypt" ? (
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

  const renderHashOptions = () => {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="hash-algorithm">Hash Algorithm</Label>
          <Select value={hashAlgorithm} onValueChange={setHashAlgorithm}>
            <SelectTrigger id="hash-algorithm">
              <SelectValue placeholder="Select hash algorithm" />
            </SelectTrigger>
            <SelectContent>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="relative w-full">
                      <SelectItem value="sha256">SHA-256 (Secure Hash Algorithm 256-bit)</SelectItem>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    <p>
                      SHA-256 is part of the SHA-2 family, producing a 256-bit (32-byte) hash value. Widely used in
                      security applications, digital signatures, and blockchain technology.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="relative w-full">
                      <SelectItem value="blake3">BLAKE3 (High-performance cryptographic hash)</SelectItem>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    <p>
                      BLAKE3 is a modern cryptographic hash function that is much faster than MD5, SHA-1, SHA-2, and
                      SHA-3, while maintaining high security. Ideal for high-performance applications.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500">
            {hashAlgorithm === "sha256"
              ? "SHA-256 is a widely used cryptographic hash function that produces a 256-bit (32-byte) hash value."
              : "BLAKE3 is a cryptographic hash function that is much faster than MD5, SHA-1, SHA-2, and SHA-3, yet is at least as secure as the latest standard SHA-3."}
          </p>
        </div>



        {result?.hash && (
          <div className="space-y-2">
            <Label htmlFor="hash-result">Hash Result</Label>
            <div className="flex items-center gap-2">
              <Input id="hash-result" value={result.hash} readOnly className="font-mono text-xs" />
              <Button type="button" variant="outline" size="sm" onClick={copyHashToClipboard}>
                Copy
              </Button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between">
            <CardTitle>
              File {operation === "encrypt" ? "Encryption" : operation === "decrypt" ? "Decryption" : "Hashing"}
            </CardTitle>
            <FileEncryptionGuide />
          </div>
          <CardDescription>
            {operation === "encrypt"
              ? "Secure your files with strong encryption"
              : operation === "decrypt"
                ? "Decrypt your previously encrypted files"
                : "Generate cryptographic hash of your files"}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Operation</Label>
              <RadioGroup
                value={operation}
                onValueChange={(value: any) => {
                  setOperation(value as "encrypt" | "decrypt" | "hash")
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
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="hash" id="hash" />
                  <Label htmlFor="hash" className="flex items-center gap-1 cursor-pointer">
                    <Hash className="h-4 w-4" /> Hash
                  </Label>
                </div>
              </RadioGroup>
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

            {operation !== "hash" && (


        


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
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="relative w-full">
                            <SelectItem value="aes">AES</SelectItem>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-xs">
                          <p>
                            Advanced Encryption Standard - Fast, secure symmetric encryption with 128/192/256-bit keys.
                            Widely used for sensitive data.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="relative w-full">
                            <SelectItem value="ecc">ECC</SelectItem>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-xs">
                          <p>
                            Elliptic Curve Cryptography - Asymmetric encryption using smaller keys than RSA while
                            maintaining security. Ideal for resource-constrained systems.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="relative w-full">
                            <SelectItem value="rsa">RSA</SelectItem>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-xs">
                          <p>
                            RSA - Classic asymmetric encryption using public/private key pairs. Good for secure
                            communications and digital signatures.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="relative w-full">
                            <SelectItem value="3des">Triple DES</SelectItem>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-xs">
                          <p>
                            Triple DES - Applies DES cipher three times to each data block. Legacy algorithm still used
                            in financial services.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">{getAlgorithmDescription()}</p>
              </div>
            )}



            {/* Algorithm-specific options or hash options */}
            {operation === "hash" ? renderHashOptions() : renderAlgorithmOptions()}

            {/* Password field for symmetric algorithms */}
            {operation !== "hash" && algorithm !== "rsa" && algorithm !== "ecc" && (
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

            {operation !== "hash" && (fileType === "text" || fileType === "pdf") && file && (
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

                {previewVisible && (
                  <div className="border rounded-md p-2">
                    <Textarea
                      ref={textAreaRef}
                      value={fileContent}
                      onChange={(e) => setFileContent(e.target.value)}
                      onSelect={handleTextSelection}
                      className="min-h-[200px] font-mono text-sm"
                      placeholder="File content will appear here..."
                    />
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
                (operation !== "hash" &&
                  algorithm === "rsa" &&
                  ((operation === "encrypt" && !rsaPublicKey) || (operation === "decrypt" && !rsaPrivateKey))) ||
                (operation !== "hash" &&
                  algorithm === "ecc" &&
                  ((operation === "encrypt" && !eccPublicKey) || (operation === "decrypt" && !eccPrivateKey))) ||
                (operation !== "hash" && algorithm !== "rsa" && algorithm !== "ecc" && !password) ||
                (operation !== "hash" &&
                  partialEncryption &&
                  fileType !== "binary" &&
                  (!selectedText || selectedText.text.trim() === ""))
              }
            >
              {isProcessing
                ? "Processing..."
                : operation === "encrypt"
                  ? "Encrypt File"
                  : operation === "decrypt"
                    ? "Decrypt File"
                    : "Hash File"}
            </Button>

            {operation !== "hash" && (fileType === "text" || fileType === "pdf") && fileContent && result?.success && (
              <Button type="button" variant="outline" onClick={handleDownload} className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Download Result
              </Button>
            )}
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center border-t pt-6">
        <p className="text-xs text-gray-500 text-center max-w-md">
          All encryption, decryption, and hashing is performed securely. Your files are never stored on our servers and
          are processed locally through our secure API.
        </p>
      </CardFooter>
    </Card>
  )
}
