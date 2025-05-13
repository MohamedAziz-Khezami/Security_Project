"use client"

import { Button } from "@/components/ui/button"
import { Lock, Key, Fingerprint, AlignJustify, Shuffle, FileDigit, Zap } from "lucide-react"

type Algorithm = "AES" | "RSA" | "3DES" | "Caesar" | "XOR" | "SHA-256" | "BLAKE3"
type Action = "encrypt" | "decrypt" | "hash"

interface AlgorithmButtonsProps {
  algorithm: Algorithm
  onAlgorithmChange: (algorithm: Algorithm) => void
  action: Action
}

export function AlgorithmButtons({ algorithm, onAlgorithmChange, action }: AlgorithmButtonsProps) {
  const isHashAction = action === "hash"

  // Define algorithm categories based on action
  const hashAlgorithms = ["SHA-256", "BLAKE3"]
  const encryptionAlgorithms = ["AES", "RSA", "3DES", "Caesar", "XOR"]

  // Filter algorithms based on the selected action
  const algorithms = isHashAction ? hashAlgorithms : encryptionAlgorithms

  // Define recommendations for each algorithm
  const recommendations = {
    AES: "Fast, secure encryption of any file type. Best for most use cases.",
    RSA: "Secure key exchange and digital signatures. Slower for large files.",
    "3DES": "Legacy systems and backward compatibility.",
    Caesar: "Educational purposes and simple text obfuscation.",
    XOR: "Simple encryption and educational demonstrations.",
    "SHA-256": "File integrity verification and password hashing.",
    BLAKE3: "High-speed hashing for large files and data sets.",
  }

  const getIcon = (algo: string) => {
    switch (algo) {
      case "AES":
        return <Lock className="h-4 w-4 mr-2" />
      case "RSA":
        return <Key className="h-4 w-4 mr-2" />
      case "3DES":
        return <Fingerprint className="h-4 w-4 mr-2" />
      case "Caesar":
        return <AlignJustify className="h-4 w-4 mr-2" />
      case "XOR":
        return <Shuffle className="h-4 w-4 mr-2" />
      case "SHA-256":
        return <FileDigit className="h-4 w-4 mr-2" />
      case "BLAKE3":
        return <Zap className="h-4 w-4 mr-2" />
      default:
        return <Lock className="h-4 w-4 mr-2" />
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {algorithms.map((algo) => (
          <Button
            key={algo}
            variant={algorithm === algo ? "default" : "outline"}
            className={`justify-start transition-all duration-200 ${
              algorithm === algo
                ? "hover:bg-blue-600 hover:scale-[1.02]"
                : "bg-white hover:bg-gray-50 hover:border-blue-300"
            }`}
            onClick={() => onAlgorithmChange(algo as Algorithm)}
          >
            {getIcon(algo)}
            {algo}
          </Button>
        ))}
      </div>

      {/* Display recommendation for the selected algorithm */}
      {algorithm && (
        <div className="p-3 bg-green-50 rounded-md text-sm text-green-800 mt-4">
          <p className="font-medium">Recommended for:</p>
          <p className="text-xs mt-1">{recommendations[algorithm]}</p>
        </div>
      )}

      {isHashAction && !hashAlgorithms.includes(algorithm) && (
        <p className="text-xs text-amber-600">Note: This algorithm will hash your data, which is a one-way process.</p>
      )}
    </div>
  )
}
