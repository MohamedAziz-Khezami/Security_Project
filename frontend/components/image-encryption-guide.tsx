"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { HelpCircle, Shield, Zap, Lock, Clock, FileImage, Layers } from "lucide-react"
import { cn } from "@/lib/utils"

export function ImageEncryptionGuide() {
  const [selectedAlgo, setSelectedAlgo] = useState<string>("AES")
  const algorithms = ["AES", "RC4", "Logistic XOR", "Selective"]

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <HelpCircle className="h-4 w-4" />
          Algorithm Guide
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden border rounded-xl shadow-lg">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold">Image Encryption Algorithms Guide</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Learn about the different encryption algorithms available for image encryption.
            </p>
          </div>
        </div>

        <ScrollArea className="h-[calc(90vh-80px)]">
          <div className="p-6">
            {/* How to choose section */}
            <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-5 mb-6">
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 dark:bg-blue-900 rounded-full p-1.5 mt-0.5">
                  <HelpCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-blue-800 dark:text-blue-300 mb-2">
                    How to choose the right algorithm?
                  </h3>
                  <p className="text-blue-700 dark:text-blue-400 mb-2 text-sm">
                    Consider these factors when selecting an image encryption algorithm:
                  </p>
                  <ul className="list-disc list-inside text-blue-700 dark:text-blue-400 space-y-1.5 text-sm ml-1">
                    <li>Security level needed (highest security = AES)</li>
                    <li>Performance requirements (fastest = RC4, Logistic XOR)</li>
                    <li>Selective protection (partial encryption = Selective)</li>
                    <li>Resource constraints (lightweight = Logistic XOR)</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Algorithm buttons */}
            <div className="flex flex-wrap gap-2 mb-6">
              {algorithms.map((algo) => (
                <Button
                  key={algo}
                  variant={selectedAlgo === algo ? "default" : "outline"}
                  className={cn(
                    "rounded-full px-4 py-1 h-auto text-sm font-medium",
                    selectedAlgo !== algo && "bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800",
                  )}
                  onClick={() => setSelectedAlgo(algo)}
                >
                  {algo}
                </Button>
              ))}
            </div>

            {/* AES */}
            {selectedAlgo === "AES" && (
              <div className="border rounded-lg p-5 space-y-3 hover:shadow-sm transition-shadow dark:border-border">
                <div className="flex justify-between items-start">
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    <Lock className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                    AES (Advanced Encryption Standard)
                  </h3>
                  <div className="flex gap-2">
                    <span className="inline-flex items-center rounded-full border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:text-green-400">
                      <Shield className="h-3 w-3 mr-1" />
                      Highly Secure
                    </span>
                    <span className="inline-flex items-center rounded-full border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-400">
                      <FileImage className="h-3 w-3 mr-1" />
                      Full Image
                    </span>
                  </div>
                </div>
                <p className="text-muted-foreground text-sm">
                  AES is a symmetric encryption algorithm established by the U.S. National Institute of Standards and
                  Technology (NIST) in 2001. It's widely used worldwide to encrypt sensitive data.
                </p>
                <div className="space-y-2">
                  <h4 className="font-medium">For Image Encryption:</h4>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 text-sm ml-1">
                    <li>Encrypts image data block by block (128 bits at a time)</li>
                    <li>
                      Different modes affect how encryption is applied across the image:
                      <ul className="list-disc list-inside ml-6 text-muted-foreground space-y-1 text-sm">
                        <li>CBC mode: Each block's encryption depends on the previous block</li>
                        <li>CTR mode: Converts block cipher into stream cipher, good for partial image encryption</li>
                        <li>GCM mode: Provides authentication along with encryption</li>
                      </ul>
                    </li>
                    <li>Preserves image dimensions but completely changes pixel values</li>
                    <li>Highly secure for protecting sensitive image content</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Best for:</h4>
                  <p className="text-muted-foreground text-sm">
                    Medical images, confidential documents, personal photographs, and any image where security is the
                    primary concern.
                  </p>
                </div>
              </div>
            )}

            {/* RC4 */}
            {selectedAlgo === "RC4" && (
              <div className="border rounded-lg p-5 space-y-3 hover:shadow-sm transition-shadow dark:border-border">
                <div className="flex justify-between items-start">
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-500 dark:text-yellow-400" />
                    RC4 (Rivest Cipher 4)
                  </h3>
                  <div className="flex gap-2">
                    <span className="inline-flex items-center rounded-full border border-yellow-200 dark:border-yellow-900 bg-yellow-50 dark:bg-yellow-950 px-2.5 py-0.5 text-xs font-medium text-yellow-700 dark:text-yellow-400">
                      <Clock className="h-3 w-3 mr-1" />
                      Legacy
                    </span>
                    <span className="inline-flex items-center rounded-full border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-400">
                      <Zap className="h-3 w-3 mr-1" />
                      Fast Performance
                    </span>
                  </div>
                </div>
                <p className="text-muted-foreground text-sm">
                  RC4 is one of the most widely used stream ciphers due to its simplicity and speed. However, it has
                  known vulnerabilities and is no longer recommended for new applications.
                </p>
                <div className="space-y-2">
                  <h4 className="font-medium">For Image Encryption:</h4>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 text-sm ml-1">
                    <li>Simple stream cipher that generates a pseudorandom stream of bits</li>
                    <li>Very fast and requires minimal computational resources</li>
                    <li>No initialization vector (IV) required, making it simpler to implement</li>
                    <li>
                      Has known weaknesses, particularly in the beginning of the keystream (first bytes should be
                      discarded)
                    </li>
                    <li>Variable key length (typically 40-256 bits)</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Best for:</h4>
                  <p className="text-muted-foreground text-sm">
                    Legacy systems, educational purposes, or non-critical applications. Not recommended for new
                    security-sensitive applications due to known vulnerabilities.
                  </p>
                </div>
              </div>
            )}

            {/* Logistic XOR */}
            {selectedAlgo === "Logistic XOR" && (
              <div className="border rounded-lg p-5 space-y-3 hover:shadow-sm transition-shadow dark:border-border">
                <div className="flex justify-between items-start">
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    <FileImage className="h-5 w-5 text-purple-500 dark:text-purple-400" />
                    Logistic XOR
                  </h3>
                  <div className="flex gap-2">
                    <span className="inline-flex items-center rounded-full border border-purple-200 dark:border-purple-900 bg-purple-50 dark:bg-purple-950 px-2.5 py-0.5 text-xs font-medium text-purple-700 dark:text-purple-400">
                      <Shield className="h-3 w-3 mr-1" />
                      Chaos-based
                    </span>
                    <span className="inline-flex items-center rounded-full border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-400">
                      <Zap className="h-3 w-3 mr-1" />
                      Lightweight
                    </span>
                  </div>
                </div>
                <p className="text-muted-foreground text-sm">
                  Logistic XOR encryption uses the chaotic behavior of the logistic map to generate a pseudorandom
                  sequence, which is then XORed with the image data.
                </p>
                <div className="space-y-2">
                  <h4 className="font-medium">For Image Encryption:</h4>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 text-sm ml-1">
                    <li>
                      Based on chaos theory, using the logistic map equation: x<sub>n+1</sub> = r × x<sub>n</sub> × (1 -
                      x<sub>n</sub>)
                    </li>
                    <li>
                      Requires two parameters: initial value (x₀) and control parameter (r), which serve as the
                      encryption key
                    </li>
                    <li>
                      Highly sensitive to initial conditions - small changes in parameters produce completely different
                      encryption results
                    </li>
                    <li>Can be applied selectively to regions of an image</li>
                    <li>
                      For best security, the control parameter r should be between 3.57 and 4.0 to ensure chaotic
                      behavior
                    </li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Best for:</h4>
                  <p className="text-muted-foreground text-sm">
                    Lightweight image encryption, visual cryptography, and applications where the chaotic nature of the
                    encryption provides sufficient security for the use case.
                  </p>
                </div>
              </div>
            )}

            {/* Selective Image Encryption */}
            {selectedAlgo === "Selective" && (
              <div className="border rounded-lg p-5 space-y-3 hover:shadow-sm transition-shadow dark:border-border">
                <div className="flex justify-between items-start">
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    <Layers className="h-5 w-5 text-green-500 dark:text-green-400" />
                    Selective Image Encryption
                  </h3>
                  <div className="flex gap-2">
                    <span className="inline-flex items-center rounded-full border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:text-green-400">
                      <Layers className="h-3 w-3 mr-1" />
                      Partial Protection
                    </span>
                    <span className="inline-flex items-center rounded-full border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-400">
                      <Zap className="h-3 w-3 mr-1" />
                      Efficient
                    </span>
                  </div>
                </div>
                <p className="text-muted-foreground text-sm">
                  Selective encryption allows you to encrypt only specific regions of an image, leaving the rest
                  untouched. This approach has several advantages and use cases.
                </p>
                <div className="space-y-2">
                  <h4 className="font-medium">Benefits:</h4>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 text-sm ml-1">
                    <li>Reduced computational overhead compared to full image encryption</li>
                    <li>Preserves overall image context while protecting sensitive regions</li>
                    <li>Allows for partial access control to image content</li>
                    <li>Can be used to redact or protect specific information within documents or photographs</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Applications:</h4>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 text-sm ml-1">
                    <li>Medical imaging: Encrypt patient identifiers while leaving diagnostic regions visible</li>
                    <li>
                      Document security: Encrypt sensitive information like signatures, account numbers, or addresses
                    </li>
                    <li>
                      Privacy protection: Encrypt faces or identifying features in photographs while preserving the
                      scene
                    </li>
                    <li>
                      Watermarking: Selectively encrypt regions to create visible marks that indicate ownership or
                      authenticity
                    </li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Important Considerations:</h4>
                  <p className="text-muted-foreground text-sm">
                    When using selective encryption, it's crucial to carefully identify all sensitive regions that need
                    protection. Also, remember to securely store the coordinates of encrypted regions, as they'll be
                    needed for decryption.
                  </p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
