"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { HelpCircle, Shield, Zap, Lock, Key, Clock, FileText, Hash } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

export function FileEncryptionGuide() {
  const [selectedAlgo, setSelectedAlgo] = useState<string>("AES")

  const encryptionAlgos = ["AES", "ECC", "RSA", "3DES"]
  const hashingAlgos = ["SHA-256", "BLAKE3"]

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <HelpCircle className="h-4 w-4" />
          Algorithm Guide
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden border rounded-xl shadow-lg">
        {/* Header - removed the duplicate close button */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold">Encryption & Hashing Algorithms Guide</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Learn about the different encryption and hashing algorithms available in this application.
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
                    Consider these factors when selecting an algorithm:
                  </p>
                  <ul className="list-disc list-inside text-blue-700 dark:text-blue-400 space-y-1.5 text-sm ml-1">
                    <li>Security level needed (high security = AES, RSA)</li>
                    <li>Speed requirements (fastest = BLAKE3, XOR)</li>
                    <li>File size (large files = AES, BLAKE3)</li>
                    <li>Purpose (one-way hashing = SHA-256, BLAKE3)</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Algorithm tabs */}
            <Tabs defaultValue="encryption" className="mt-6">
              <TabsList className="grid grid-cols-2 mb-6 w-full max-w-md mx-auto">
                <TabsTrigger value="encryption" className="rounded-full" onClick={() => setSelectedAlgo("AES")}>
                  Encryption Algorithms
                </TabsTrigger>
                <TabsTrigger value="hashing" className="rounded-full" onClick={() => setSelectedAlgo("SHA-256")}>
                  Hashing Algorithms
                </TabsTrigger>
              </TabsList>

              {/* Encryption Algorithms Tab */}
              <TabsContent value="encryption" className="space-y-6">
                {/* Algorithm buttons */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {encryptionAlgos.map((algo) => (
                    <Button
                      key={algo}
                      variant={selectedAlgo === algo ? "default" : "outline"}
                      className={cn(
                        "rounded-full px-4 py-1 h-auto text-sm font-medium",
                        selectedAlgo !== algo &&
                          "bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800",
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
                          <Zap className="h-3 w-3 mr-1" />
                          Fast Performance
                        </span>
                      </div>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      AES is a symmetric encryption algorithm established by NIST. It's widely used worldwide to encrypt
                      sensitive data.
                    </p>
                    <div className="space-y-2">
                      <h4 className="font-medium">Key Features:</h4>
                      <ul className="list-disc list-inside text-muted-foreground space-y-1 text-sm ml-1">
                        <li>Symmetric key algorithm</li>
                        <li>Supports 128, 192, and 256-bit keys</li>
                        <li>Block cipher with 128-bit blocks</li>
                        <li>Supports ECB, CBC, CTR, and GCM modes</li>
                        <li>Efficient in software and hardware</li>
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium">When to use:</h4>
                      <p className="text-muted-foreground text-sm">
                        Use AES for encrypting sensitive data, communications, and passwords. AES-256 is preferred for
                        high security.
                      </p>
                    </div>
                  </div>
                )}

                {/* ECC */}
                {selectedAlgo === "ECC" && (
                  <div className="border rounded-lg p-5 space-y-3 hover:shadow-sm transition-shadow dark:border-border">
                    <div className="flex justify-between items-start">
                      <h3 className="text-xl font-semibold flex items-center gap-2">
                        <Key className="h-5 w-5 text-purple-500 dark:text-purple-400" />
                        ECC (Elliptic Curve Cryptography)
                      </h3>
                      <div className="flex gap-2">
                        <span className="inline-flex items-center rounded-full border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:text-green-400">
                          <Shield className="h-3 w-3 mr-1" />
                          Highly Secure
                        </span>
                      </div>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      ECC uses elliptic curves for public-key cryptography. It provides strong security with smaller key
                      sizes.
                    </p>
                    <div className="space-y-2">
                      <h4 className="font-medium">Key Features:</h4>
                      <ul className="list-disc list-inside text-muted-foreground space-y-1 text-sm ml-1">
                        <li>Asymmetric algorithm</li>
                        <li>Smaller keys than RSA for same security</li>
                        <li>Common curves: secp256k1, Curve25519</li>
                        <li>Provides forward secrecy</li>
                        <li>Efficient for mobile and IoT</li>
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium">When to use:</h4>
                      <p className="text-muted-foreground text-sm">
                        Ideal for secure communications, digital signatures, and devices with limited resources.
                      </p>
                    </div>
                  </div>
                )}

                {/* RSA */}
                {selectedAlgo === "RSA" && (
                  <div className="border rounded-lg p-5 space-y-3 hover:shadow-sm transition-shadow dark:border-border">
                    <div className="flex justify-between items-start">
                      <h3 className="text-xl font-semibold flex items-center gap-2">
                        <Key className="h-5 w-5 text-yellow-500 dark:text-yellow-400" />
                        RSA (Rivest–Shamir–Adleman)
                      </h3>
                      <div className="flex gap-2">
                        <span className="inline-flex items-center rounded-full border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:text-green-400">
                          <Shield className="h-3 w-3 mr-1" />
                          Highly Secure
                        </span>
                        <span className="inline-flex items-center rounded-full border border-orange-200 dark:border-orange-900 bg-orange-50 dark:bg-orange-950 px-2.5 py-0.5 text-xs font-medium text-orange-700 dark:text-orange-400">
                          <Clock className="h-3 w-3 mr-1" />
                          Slower Performance
                        </span>
                      </div>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      RSA is a foundational public-key encryption method, using large prime factorization.
                    </p>
                    <div className="space-y-2">
                      <h4 className="font-medium">Key Features:</h4>
                      <ul className="list-disc list-inside text-muted-foreground space-y-1 text-sm ml-1">
                        <li>Asymmetric algorithm</li>
                        <li>Common sizes: 2048 and 4096 bits</li>
                        <li>Used for encryption and digital signatures</li>
                        <li>Slower than AES</li>
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium">When to use:</h4>
                      <p className="text-muted-foreground text-sm">
                        Best for key exchange or digital signatures. Combine with AES for encrypting large data.
                      </p>
                    </div>
                  </div>
                )}

                {/* 3DES */}
                {selectedAlgo === "3DES" && (
                  <div className="border rounded-lg p-5 space-y-3 hover:shadow-sm transition-shadow dark:border-border">
                    <div className="flex justify-between items-start">
                      <h3 className="text-xl font-semibold flex items-center gap-2">
                        <Lock className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                        Triple DES (3DES)
                      </h3>
                      <div className="flex gap-2">
                        <span className="inline-flex items-center rounded-full border border-orange-200 dark:border-orange-900 bg-orange-50 dark:bg-orange-950 px-2.5 py-0.5 text-xs font-medium text-orange-700 dark:text-orange-400">
                          <Clock className="h-3 w-3 mr-1" />
                          Slower Performance
                        </span>
                      </div>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      3DES applies DES three times. Used for compatibility with older systems.
                    </p>
                    <div className="space-y-2">
                      <h4 className="font-medium">Key Features:</h4>
                      <ul className="list-disc list-inside text-muted-foreground space-y-1 text-sm ml-1">
                        <li>Symmetric cipher</li>
                        <li>Effective key length: 112 or 168 bits</li>
                        <li>Block size: 64 bits</li>
                        <li>Slower and less secure than AES</li>
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium">When to use:</h4>
                      <p className="text-muted-foreground text-sm">
                        Only for legacy systems. AES is preferred for modern applications.
                      </p>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Hashing Algorithms Tab */}
              <TabsContent value="hashing" className="space-y-6">
                {/* Algorithm buttons */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {hashingAlgos.map((algo) => (
                    <Button
                      key={algo}
                      variant={selectedAlgo === algo ? "default" : "outline"}
                      className={cn(
                        "rounded-full px-4 py-1 h-auto text-sm font-medium",
                        selectedAlgo !== algo &&
                          "bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800",
                      )}
                      onClick={() => setSelectedAlgo(algo)}
                    >
                      {algo}
                    </Button>
                  ))}
                </div>

                {/* SHA-256 */}
                {selectedAlgo === "SHA-256" && (
                  <div className="border rounded-lg p-5 space-y-3 hover:shadow-sm transition-shadow dark:border-border">
                    <div className="flex justify-between items-start">
                      <h3 className="text-xl font-semibold flex items-center gap-2">
                        <Hash className="h-5 w-5 text-green-500 dark:text-green-400" />
                        SHA-256
                      </h3>
                      <div className="flex gap-2">
                        <span className="inline-flex items-center rounded-full border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:text-green-400">
                          <Shield className="h-3 w-3 mr-1" />
                          Highly Secure
                        </span>
                      </div>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      SHA-256 is part of the SHA-2 family. It outputs a 256-bit hash and is widely used in digital
                      signatures and file integrity.
                    </p>
                    <div className="space-y-2">
                      <h4 className="font-medium">Key Features:</h4>
                      <ul className="list-disc list-inside text-muted-foreground space-y-1 text-sm ml-1">
                        <li>256-bit fixed-size hash</li>
                        <li>One-way function</li>
                        <li>Collision-resistant</li>
                        <li>Commonly used in password hashing, signatures</li>
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium">When to use:</h4>
                      <p className="text-muted-foreground text-sm">
                        Ideal for file checksums, password hashes (with salt), and digital verification.
                      </p>
                    </div>
                  </div>
                )}

                {/* BLAKE3 */}
                {selectedAlgo === "BLAKE3" && (
                  <div className="border rounded-lg p-5 space-y-3 hover:shadow-sm transition-shadow dark:border-border">
                    <div className="flex justify-between items-start">
                      <h3 className="text-xl font-semibold flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                        BLAKE3
                      </h3>
                      <div className="flex gap-2">
                        <span className="inline-flex items-center rounded-full border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-400">
                          <Zap className="h-3 w-3 mr-1" />
                          Fast Performance
                        </span>
                        <span className="inline-flex items-center rounded-full border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:text-green-400">
                          <Shield className="h-3 w-3 mr-1" />
                          Highly Secure
                        </span>
                      </div>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      BLAKE3 is a modern, fast hash function supporting variable output lengths and parallel processing.
                    </p>
                    <div className="space-y-2">
                      <h4 className="font-medium">Key Features:</h4>
                      <ul className="list-disc list-inside text-muted-foreground space-y-1 text-sm ml-1">
                        <li>Extremely fast on modern CPUs</li>
                        <li>Secure and reliable</li>
                        <li>Extendable output length</li>
                        <li>Keyed hash & KDF support</li>
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium">When to use:</h4>
                      <p className="text-muted-foreground text-sm">
                        Great for real-time hashing and large file integrity checks.
                      </p>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
