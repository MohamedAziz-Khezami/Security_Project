import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ShieldCheck, Zap, Clock, FileWarning, HelpCircle } from "lucide-react"

interface AlgorithmGuideProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  algorithm?: string | null
}

export function AlgorithmGuide({ open, onOpenChange, algorithm }: AlgorithmGuideProps) {
  const initialTab = algorithm?.toLowerCase() || "aes"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Algorithm Guide</DialogTitle>
          <DialogDescription>Learn about different encryption, decryption, and hashing algorithms</DialogDescription>
        </DialogHeader>

        <div className="p-4 bg-blue-50 rounded-lg mb-4">
          <div className="flex items-start">
            <HelpCircle className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-800">How to choose the right algorithm?</h3>
              <p className="text-sm text-blue-700 mt-1">Consider these factors when selecting an algorithm:</p>
              <ul className="text-sm text-blue-700 list-disc pl-5 mt-1 space-y-1">
                <li>Security level needed (high security = AES, RSA)</li>
                <li>Speed requirements (fastest = BLAKE3, XOR)</li>
                <li>File size (large files = AES, BLAKE3)</li>
                <li>Purpose (one-way hashing = SHA-256, BLAKE3)</li>
              </ul>
            </div>
          </div>
        </div>

        <Tabs defaultValue={initialTab} className="mt-4">
          <TabsList className="grid grid-cols-3 md:grid-cols-7 mb-4">
            <TabsTrigger value="aes">AES</TabsTrigger>
            <TabsTrigger value="rsa">RSA</TabsTrigger>
            <TabsTrigger value="3des">3DES</TabsTrigger>
            <TabsTrigger value="caesar">Caesar</TabsTrigger>
            <TabsTrigger value="xor">XOR</TabsTrigger>
            <TabsTrigger value="sha-256">SHA-256</TabsTrigger>
            <TabsTrigger value="blake3">BLAKE3</TabsTrigger>
          </TabsList>

          <TabsContent value="aes" className="space-y-4">
            <div className="flex flex-wrap gap-2 mb-2">
              <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-100">
                <ShieldCheck className="h-3 w-3 mr-1" /> Highly Secure
              </Badge>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
                <Zap className="h-3 w-3 mr-1" /> Fast Performance
              </Badge>
            </div>
            <h3 className="text-lg font-medium">Advanced Encryption Standard (AES)</h3>
            <p className="text-sm text-gray-700">
              AES is a symmetric encryption algorithm widely used for securing sensitive data. It operates on blocks of
              data and supports key sizes of 128, 192, and 256 bits.
            </p>
            <div className="bg-gray-50 p-3 rounded-md">
              <h4 className="text-sm font-medium mb-1">Best for:</h4>
              <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
                <li>Encrypting files of any size</li>
                <li>Securing sensitive data at rest</li>
                <li>Fast encryption and decryption operations</li>
                <li>Applications requiring high security standards</li>
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="rsa" className="space-y-4">
            <div className="flex flex-wrap gap-2 mb-2">
              <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-100">
                <ShieldCheck className="h-3 w-3 mr-1" /> Highly Secure
              </Badge>
              <Badge variant="outline" className="bg-amber-50 text-amber-700 hover:bg-amber-100">
                <Clock className="h-3 w-3 mr-1" /> Slower Performance
              </Badge>
            </div>
            <h3 className="text-lg font-medium">RSA (Rivest–Shamir–Adleman)</h3>
            <p className="text-sm text-gray-700">
              RSA is an asymmetric encryption algorithm that uses a pair of keys: a public key for encryption and a
              private key for decryption. It's widely used for secure data transmission.
            </p>
            <div className="bg-gray-50 p-3 rounded-md">
              <h4 className="text-sm font-medium mb-1">Best for:</h4>
              <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
                <li>Digital signatures</li>
                <li>Key exchange</li>
                <li>Encrypting small amounts of data</li>
                <li>Secure communication channels</li>
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="3des" className="space-y-4">
            <div className="flex flex-wrap gap-2 mb-2">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
                <ShieldCheck className="h-3 w-3 mr-1" /> Reliable
              </Badge>
              <Badge variant="outline" className="bg-amber-50 text-amber-700 hover:bg-amber-100">
                <Clock className="h-3 w-3 mr-1" /> Slower than AES
              </Badge>
            </div>
            <h3 className="text-lg font-medium">Triple DES (3DES)</h3>
            <p className="text-sm text-gray-700">
              Triple DES applies the DES cipher algorithm three times to each data block. While slower than AES, it's
              still used in legacy systems and financial services.
            </p>
            <div className="bg-gray-50 p-3 rounded-md">
              <h4 className="text-sm font-medium mb-1">Best for:</h4>
              <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
                <li>Legacy systems requiring compatibility</li>
                <li>Financial applications</li>
                <li>Systems where AES isn't available</li>
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="caesar" className="space-y-4">
            <div className="flex flex-wrap gap-2 mb-2">
              <Badge variant="outline" className="bg-red-50 text-red-700 hover:bg-red-100">
                <FileWarning className="h-3 w-3 mr-1" /> Not Secure
              </Badge>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
                <Zap className="h-3 w-3 mr-1" /> Very Fast
              </Badge>
            </div>
            <h3 className="text-lg font-medium">Caesar Cipher</h3>
            <p className="text-sm text-gray-700">
              One of the simplest encryption techniques, the Caesar cipher shifts each letter in the plaintext by a
              fixed number of positions down the alphabet.
            </p>
            <div className="bg-gray-50 p-3 rounded-md">
              <h4 className="text-sm font-medium mb-1">Best for:</h4>
              <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
                <li>Educational purposes</li>
                <li>Simple text obfuscation (not security)</li>
                <li>Puzzles and games</li>
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="xor" className="space-y-4">
            <div className="flex flex-wrap gap-2 mb-2">
              <Badge variant="outline" className="bg-amber-50 text-amber-700 hover:bg-amber-100">
                <FileWarning className="h-3 w-3 mr-1" /> Basic Security
              </Badge>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
                <Zap className="h-3 w-3 mr-1" /> Very Fast
              </Badge>
            </div>
            <h3 className="text-lg font-medium">XOR Cipher</h3>
            <p className="text-sm text-gray-700">
              The XOR cipher applies the XOR operation between each byte of the plaintext and a key. It's simple but can
              be secure when used with a one-time pad.
            </p>
            <div className="bg-gray-50 p-3 rounded-md">
              <h4 className="text-sm font-medium mb-1">Best for:</h4>
              <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
                <li>Simple data obfuscation</li>
                <li>Educational purposes</li>
                <li>Quick encoding of data</li>
                <li>One-time pad implementations (when used correctly)</li>
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="sha-256" className="space-y-4">
            <div className="flex flex-wrap gap-2 mb-2">
              <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-100">
                <ShieldCheck className="h-3 w-3 mr-1" /> Cryptographically Secure
              </Badge>
              <Badge variant="outline" className="bg-purple-50 text-purple-700 hover:bg-purple-100">
                <FileWarning className="h-3 w-3 mr-1" /> One-way (Not Reversible)
              </Badge>
            </div>
            <h3 className="text-lg font-medium">SHA-256</h3>
            <p className="text-sm text-gray-700">
              SHA-256 is a cryptographic hash function that generates a unique 256-bit (32-byte) hash. It's one-way,
              meaning you cannot retrieve the original data from the hash.
            </p>
            <div className="bg-gray-50 p-3 rounded-md">
              <h4 className="text-sm font-medium mb-1">Best for:</h4>
              <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
                <li>Password storage</li>
                <li>Data integrity verification</li>
                <li>Digital signatures</li>
                <li>Blockchain applications</li>
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="blake3" className="space-y-4">
            <div className="flex flex-wrap gap-2 mb-2">
              <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-100">
                <ShieldCheck className="h-3 w-3 mr-1" /> Cryptographically Secure
              </Badge>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
                <Zap className="h-3 w-3 mr-1" /> Extremely Fast
              </Badge>
              <Badge variant="outline" className="bg-purple-50 text-purple-700 hover:bg-purple-100">
                <FileWarning className="h-3 w-3 mr-1" /> One-way (Not Reversible)
              </Badge>
            </div>
            <h3 className="text-lg font-medium">BLAKE3</h3>
            <p className="text-sm text-gray-700">
              BLAKE3 is a cryptographic hash function that's much faster than MD5, SHA-1, SHA-2, and SHA-3, while
              providing at least as much security as SHA-2.
            </p>
            <div className="bg-gray-50 p-3 rounded-md">
              <h4 className="text-sm font-medium mb-1">Best for:</h4>
              <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
                <li>High-performance applications</li>
                <li>Large file integrity verification</li>
                <li>Modern cryptographic systems</li>
                <li>Applications where speed is critical</li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
