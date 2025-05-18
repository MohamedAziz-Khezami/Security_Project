import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { HelpCircle } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

export function ImageEncryptionGuide() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <HelpCircle className="h-4 w-4" />
          Algorithm Guide
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Image Encryption Algorithms Guide</DialogTitle>
          <DialogDescription>
            Learn about the different encryption algorithms available for image encryption.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6 py-4">
            <div className="border rounded-lg p-4 space-y-2">
              <h3 className="text-lg font-semibold">AES (Advanced Encryption Standard)</h3>
              <p className="text-sm text-gray-600">
                AES is a symmetric encryption algorithm established by the U.S. National Institute of Standards and
                Technology (NIST) in 2001. It's widely used worldwide to encrypt sensitive data.
              </p>
              <div className="space-y-2 mt-2">
                <h4 className="text-md font-medium">For Image Encryption:</h4>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  <li>Encrypts image data block by block (128 bits at a time)</li>
                  <li>
                    Different modes affect how encryption is applied across the image:
                    <ul className="list-disc list-inside ml-6 text-sm text-gray-600 space-y-1">
                      <li>CBC mode: Each block's encryption depends on the previous block</li>
                      <li>CTR mode: Converts block cipher into stream cipher, good for partial image encryption</li>
                      <li>GCM mode: Provides authentication along with encryption</li>
                    </ul>
                  </li>
                  <li>Preserves image dimensions but completely changes pixel values</li>
                  <li>Highly secure for protecting sensitive image content</li>
                </ul>
              </div>
              <div className="space-y-2 mt-2">
                <h4 className="text-md font-medium">Best for:</h4>
                <p className="text-sm text-gray-600">
                  Medical images, confidential documents, personal photographs, and any image where security is the
                  primary concern.
                </p>
              </div>
            </div>


            <div className="border rounded-lg p-4 space-y-2">
              <h3 className="text-lg font-semibold">RC4 (Rivest Cipher 4)</h3>
              <p className="text-sm text-gray-600">
                RC4 is one of the most widely used stream ciphers due to its simplicity and speed. However, it has known
                vulnerabilities and is no longer recommended for new applications.
              </p>
              <div className="space-y-2 mt-2">
                <h4 className="text-md font-medium">For Image Encryption:</h4>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
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
              <div className="space-y-2 mt-2">
                <h4 className="text-md font-medium">Best for:</h4>
                <p className="text-sm text-gray-600">
                  Legacy systems, educational purposes, or non-critical applications. Not recommended for new
                  security-sensitive applications due to known vulnerabilities.
                </p>
              </div>
            </div>

            <div className="border rounded-lg p-4 space-y-2">
              <h3 className="text-lg font-semibold">Logistic XOR</h3>
              <p className="text-sm text-gray-600">
                Logistic XOR encryption uses the chaotic behavior of the logistic map to generate a pseudorandom
                sequence, which is then XORed with the image data.
              </p>
              <div className="space-y-2 mt-2">
                <h4 className="text-md font-medium">For Image Encryption:</h4>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  <li>
                    Based on chaos theory, using the logistic map equation: x<sub>n+1</sub> = r × x<sub>n</sub> × (1 - x
                    <sub>n</sub>)
                  </li>
                  <li>
                    Requires two parameters: initial value (x₀) and control parameter (r), which serve as the encryption
                    key
                  </li>
                  <li>
                    Highly sensitive to initial conditions - small changes in parameters produce completely different
                    encryption results
                  </li>
                  <li>Can be applied selectively to regions of an image</li>
                  <li>
                    For best security, the control parameter r should be between 3.57 and 4.0 to ensure chaotic behavior
                  </li>
                </ul>
              </div>
              <div className="space-y-2 mt-2">
                <h4 className="text-md font-medium">Best for:</h4>
                <p className="text-sm text-gray-600">
                  Lightweight image encryption, visual cryptography, and applications where the chaotic nature of the
                  encryption provides sufficient security for the use case.
                </p>
              </div>
            </div>

            <div className="border rounded-lg p-4 space-y-2">
              <h3 className="text-lg font-semibold">Selective Image Encryption</h3>
              <p className="text-sm text-gray-600">
                Selective encryption allows you to encrypt only specific regions of an image, leaving the rest
                untouched. This approach has several advantages and use cases.
              </p>
              <div className="space-y-2 mt-2">
                <h4 className="text-md font-medium">Benefits:</h4>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  <li>Reduced computational overhead compared to full image encryption</li>
                  <li>Preserves overall image context while protecting sensitive regions</li>
                  <li>Allows for partial access control to image content</li>
                  <li>Can be used to redact or protect specific information within documents or photographs</li>
                </ul>
              </div>
              <div className="space-y-2 mt-2">
                <h4 className="text-md font-medium">Applications:</h4>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  <li>Medical imaging: Encrypt patient identifiers while leaving diagnostic regions visible</li>
                  <li>
                    Document security: Encrypt sensitive information like signatures, account numbers, or addresses
                  </li>
                  <li>
                    Privacy protection: Encrypt faces or identifying features in photographs while preserving the scene
                  </li>
                  <li>
                    Watermarking: Selectively encrypt regions to create visible marks that indicate ownership or
                    authenticity
                  </li>
                </ul>
              </div>
              <div className="space-y-2 mt-2">
                <h4 className="text-md font-medium">Important Considerations:</h4>
                <p className="text-sm text-gray-600">
                  When using selective encryption, it's crucial to carefully identify all sensitive regions that need
                  protection. Also, remember to securely store the coordinates of encrypted regions, as they'll be
                  needed for decryption.
                </p>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
