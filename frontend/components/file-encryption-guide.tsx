"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { HelpCircle } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

export function FileEncryptionGuide() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <HelpCircle className="h-4 w-4" />
          Algorithm Guide
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Encryption & Hashing Algorithms Guide</DialogTitle>
          <DialogDescription>
            Learn about the different encryption and hashing algorithms available in this application.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <Tabs defaultValue="encryption">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="encryption">Encryption Algorithms</TabsTrigger>
              <TabsTrigger value="hashing">Hashing Algorithms</TabsTrigger>
            </TabsList>

            {/* Encryption Algorithms Tab */}
            <TabsContent value="encryption" className="space-y-6 mt-4">
              {/* AES */}
              <div className="border rounded-lg p-4 space-y-2">
                <h3 className="text-lg font-semibold">AES (Advanced Encryption Standard)</h3>
                <p className="text-sm text-gray-600">
                  AES is a symmetric encryption algorithm established by NIST. It’s widely used worldwide to encrypt sensitive data.
                </p>
                <div className="space-y-2 mt-2">
                  <h4 className="text-md font-medium">Key Features:</h4>
                  <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                    <li>Symmetric key algorithm</li>
                    <li>Supports 128, 192, and 256-bit keys</li>
                    <li>Block cipher with 128-bit blocks</li>
                    <li>Supports ECB, CBC, CTR, and GCM modes</li>
                    <li>Efficient in software and hardware</li>
                  </ul>
                </div>
                <div className="space-y-2 mt-2">
                  <h4 className="text-md font-medium">When to use:</h4>
                  <p className="text-sm text-gray-600">
                    Use AES for encrypting sensitive data, communications, and passwords. AES-256 is preferred for high security.
                  </p>
                </div>
              </div>

              {/* ECC */}
              <div className="border rounded-lg p-4 space-y-2">
                <h3 className="text-lg font-semibold">ECC (Elliptic Curve Cryptography)</h3>
                <p className="text-sm text-gray-600">
                  ECC uses elliptic curves for public-key cryptography. It provides strong security with smaller key sizes.
                </p>
                <div className="space-y-2 mt-2">
                  <h4 className="text-md font-medium">Key Features:</h4>
                  <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                    <li>Asymmetric algorithm</li>
                    <li>Smaller keys than RSA for same security</li>
                    <li>Common curves: secp256k1, Curve25519</li>
                    <li>Provides forward secrecy</li>
                    <li>Efficient for mobile and IoT</li>
                  </ul>
                </div>
                <div className="space-y-2 mt-2">
                  <h4 className="text-md font-medium">When to use:</h4>
                  <p className="text-sm text-gray-600">
                    Ideal for secure communications, digital signatures, and devices with limited resources.
                  </p>
                </div>
              </div>

              {/* RSA */}
              <div className="border rounded-lg p-4 space-y-2">
                <h3 className="text-lg font-semibold">RSA (Rivest–Shamir–Adleman)</h3>
                <p className="text-sm text-gray-600">
                  RSA is a foundational public-key encryption method, using large prime factorization.
                </p>
                <div className="space-y-2 mt-2">
                  <h4 className="text-md font-medium">Key Features:</h4>
                  <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                    <li>Asymmetric algorithm</li>
                    <li>Common sizes: 2048 and 4096 bits</li>
                    <li>Used for encryption and digital signatures</li>
                    <li>Slower than AES</li>
                  </ul>
                </div>
                <div className="space-y-2 mt-2">
                  <h4 className="text-md font-medium">When to use:</h4>
                  <p className="text-sm text-gray-600">
                    Best for key exchange or digital signatures. Combine with AES for encrypting large data.
                  </p>
                </div>
              </div>

              {/* 3DES */}
              <div className="border rounded-lg p-4 space-y-2">
                <h3 className="text-lg font-semibold">Triple DES (3DES)</h3>
                <p className="text-sm text-gray-600">
                  3DES applies DES three times. Used for compatibility with older systems.
                </p>
                <div className="space-y-2 mt-2">
                  <h4 className="text-md font-medium">Key Features:</h4>
                  <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                    <li>Symmetric cipher</li>
                    <li>Effective key length: 112 or 168 bits</li>
                    <li>Block size: 64 bits</li>
                    <li>Slower and less secure than AES</li>
                  </ul>
                </div>
                <div className="space-y-2 mt-2">
                  <h4 className="text-md font-medium">When to use:</h4>
                  <p className="text-sm text-gray-600">
                    Only for legacy systems. AES is preferred for modern applications.
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* Hashing Algorithms Tab */}
            <TabsContent value="hashing" className="space-y-6 mt-4">
              {/* SHA-256 */}
              <div className="border rounded-lg p-4 space-y-2">
                <h3 className="text-lg font-semibold">SHA-256</h3>
                <p className="text-sm text-gray-600">
                  SHA-256 is part of the SHA-2 family. It outputs a 256-bit hash and is widely used in digital signatures and file integrity.
                </p>
                <div className="space-y-2 mt-2">
                  <h4 className="text-md font-medium">Key Features:</h4>
                  <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                    <li>256-bit fixed-size hash</li>
                    <li>One-way function</li>
                    <li>Collision-resistant</li>
                    <li>Commonly used in password hashing, signatures</li>
                  </ul>
                </div>
                <div className="space-y-2 mt-2">
                  <h4 className="text-md font-medium">When to use:</h4>
                  <p className="text-sm text-gray-600">
                    Ideal for file checksums, password hashes (with salt), and digital verification.
                  </p>
                </div>
              </div>

              {/* BLAKE3 */}
              <div className="border rounded-lg p-4 space-y-2">
                <h3 className="text-lg font-semibold">BLAKE3</h3>
                <p className="text-sm text-gray-600">
                  BLAKE3 is a modern, fast hash function supporting variable output lengths and parallel processing.
                </p>
                <div className="space-y-2 mt-2">
                  <h4 className="text-md font-medium">Key Features:</h4>
                  <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                    <li>Extremely fast on modern CPUs</li>
                    <li>Secure and reliable</li>
                    <li>Extendable output length</li>
                    <li>Keyed hash & KDF support</li>
                  </ul>
                </div>
                <div className="space-y-2 mt-2">
                  <h4 className="text-md font-medium">When to use:</h4>
                  <p className="text-sm text-gray-600">
                    Great for real-time hashing and large file integrity checks.
                  </p>
                </div>
              </div>

         
            </TabsContent>
          </Tabs>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
