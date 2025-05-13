"use client"

import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { InfoIcon, Eye, EyeOff, Copy, KeyRound, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"

interface AlgorithmConfigProps {
  algorithm: string
  onAlgorithmChange: (algorithm: any) => void
  key: string
  onKeyChange: (key: string) => void
  autoGenerateKey: boolean
  onAutoGenerateKeyChange: (checked: boolean) => void
  action: "encrypt" | "decrypt" | "hash"
  onShowGuide: (algorithm: any) => void
  showKey: boolean
  onShowKeyChange: (show: boolean) => void
}

export function AlgorithmConfig({
  algorithm,
  onAlgorithmChange,
  key,
  onKeyChange,
  autoGenerateKey,
  onAutoGenerateKeyChange,
  action,
  onShowGuide,
  showKey,
  onShowKeyChange,
}: AlgorithmConfigProps) {
  const isHashAction = action === "hash"
  const hashAlgorithms = ["SHA-256", "BLAKE3"]
  const encryptionAlgorithms = ["AES", "RSA", "3DES", "Caesar", "XOR"]

  const algorithms = isHashAction ? hashAlgorithms : [...encryptionAlgorithms, ...hashAlgorithms]

  // RSA key generation state
  const [rsaKeys, setRsaKeys] = useState<{ publicKey: string; privateKey: string } | null>(null)
  const [showPrivateKey, setShowPrivateKey] = useState(false)
  const [generatingKeys, setGeneratingKeys] = useState(false)
  const [keyCopied, setKeyCopied] = useState<"public" | "private" | null>(null)

  // Generate RSA key pair
  const generateRSAKeys = async () => {
    setGeneratingKeys(true)

    try {
      // This is a mock implementation - in a real app, you would use a proper crypto library
      // For demonstration purposes, we'll create dummy keys
      setTimeout(() => {
        const publicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAu1SU1LfVLPHCozMxH2Mo
4lgOEePzNm0tRgeLezV6ffAt0gunVTLw7onLRnrq0/IzW7yWR7QkrmBL7jTKEn5u
+qKhbwKfBstIs+bMY2Zkp18gnTxKLxoS2tFczGkPLPgizskuemMghRniWaoLcyeh
kd3qqGElvW/VDL5AaWTg0nLVkjRo9z+40RQzuVaE8AkAFmxZzow3x+VJYKdjykkJ
0iT9wCS0DRTXu269V264Vf/3jvredZiKRkgwlL9xNAwxXFg0x/XFw005UWVRIkdg
cKWTjpBP2dPwVZ4WWC+9aGVd+Gyn1o0CLelf4rEjGoXbAAEgAqeGUxrcIlbjXfbc
mwIDAQAB
-----END PUBLIC KEY-----`

        const privateKey = `-----BEGIN PRIVATE KEY-----
MIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQC7VJTUt9Us8cKj
MzEfYyjiWA4R4/M2bS1GB4t7NXp98C3SC6dVMvDuictGeurT8jNbvJZHtCSuYEvu
NMoSfm76oqFvAp8Gy0iz5sxjZmSnXyCdPEovGhLa0VzMaQ8s+CLOyS56YyCFGeJZ
qgtzJ6GR3eqoYSW9b9UMvkBpZODSctWSNGj3P7jRFDO5VoTwCQAWbFnOjDfH5Ulg
p2PKSQnSJP3AJLQNFNe7br1XbrhV//eO+t51mIpGSDCUv3E0DDFcWDTH9cXDTTlR
ZVEiR2BwpZOOkE/Z0/BVnhZYL71oZV34bKfWjQIt6V/isSMahdsAASACp4ZTGtwi
VuNd9tybAgMBAAECggEBAKTmjaS6tkK8BlPXClTQ2vpz/N6uxDeS35mXpqasqskV
laAidgg/sWqpjXDbXr93otIMLlWsM+X0CqMDgSXKejLS2jx4GDjI1ZTXg++0AMJ8
sJ74pWzVDOfmCEQ/7wXs3+cbnXhKriO8Z036q92Qc1+N87SI38nkGa0ABH9CN83H
mQqt4fB7UdHzuIRe/me2PGhIq5ZBzj6h3BpoPGzEP+x3l9YmK8t/1cN0pqI+dQwY
dgfGjackLu/2qH80MCF7IyQaseZUOJyKrCLtSD/Iixv/hzDEUPfOCjFDgTpzf3cw
ta8+oE4wHCo1iI1/4TlPkwmXx4qSXtmw4aQPz7IDQvECgYEA8KNThCO2gsC2I9PQ
DM/8Cw0O983WCDY+oi+7JPiNAJwv5DYBqEZB1QYdj06YD16XlC/HAZMsMku1na2T
N0driwenQQWzoev3g2S7gRDoS/FCJSI3jJ+kjgtaA7Qmzlgk1TxODN+G1H91HW7t
0l7VnL27IWyYo2qRRK3jzxqUiPUCgYEAx0oQs2reBQGMVZnApD1jeq7n4MvNLcPv
t8b/eU9iUv6Y4Mj0Suo/AU8lYZXm8ubbqAlwz2VSVunD2tOplHyMUrtCtObAfVDU
AhCndKaA9gApgfb3xw1IKbuQ1u4IF1FJl3VtumfQn//LiH1B3rXhcdyo3/vIttEk
48RakUKClU8CgYEAwF6hj4L3rDqvQYrB/p8tJdrrW+B7dhgZRNkJFX/0IPLTg9kO
qFqKYxslV3Py/poHxmQAaCnGOMaRxKStgJNR2x31n0JqJUKlw0Lyr8A/ZYTTRNpZ
jQIMmMEQizqEYKKslPcG3qFPpWfSYMRqRY0C5bGO/cAk0kLprKNq/kkVUvkCgYEA
rnPjxQsRRi4Z+2ypGzjP3J+df2JKAzbwJb47wOPYcu0IpVC8KnZxlw4+yzAW8D4w
n4FV9cYBOYCCZNGZnBCJYGVQjlNv3KwO0YiQX9kpUUN1zROwLIxWO2ik0/8pQ4XV
NryGQkKVA0aBYvPo6CyGIywCHfJSHXCpGWJ4JoZRXjcCgYBgGDYACtTP11TmW2r9
YK5VRLUDww0yDGkPvRVebL/azdIg8EbDXQ8SOdaZw8t0O9FvEUjqzMdkSt2K2uWf
YDfRcHVf1MoAC8CN2GvYlz6QGBnfzHPf/mCOTy7snmrb3/7sPkYbADzleMQQbVeD
3mKWDTE+ERUOJY23gFxuAZ5nLg==
-----END PRIVATE KEY-----`

        setRsaKeys({ publicKey, privateKey })
        setGeneratingKeys(false)
      }, 1500) // Simulate processing time
    } catch (error) {
      console.error("Error generating RSA keys:", error)
      setGeneratingKeys(false)
    }
  }

  // Handle copying keys
  const handleCopyKey = (keyType: "public" | "private") => {
    if (!rsaKeys) return

    const keyToCopy = keyType === "public" ? rsaKeys.publicKey : rsaKeys.privateKey
    navigator.clipboard.writeText(keyToCopy)

    setKeyCopied(keyType)
    setTimeout(() => setKeyCopied(null), 2000)
  }

  // Use RSA key
  const handleUseRSAKey = (keyType: "public" | "private") => {
    if (!rsaKeys) return

    const keyToUse = keyType === "public" ? rsaKeys.publicKey : rsaKeys.privateKey
    onKeyChange(keyToUse)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="algorithm">Algorithm</Label>
            <Button variant="ghost" size="sm" className="h-8 px-2 text-gray-500" onClick={() => onShowGuide(algorithm)}>
              <InfoIcon className="h-4 w-4 mr-1" />
              <span className="text-xs">Guide</span>
            </Button>
          </div>
          <Select value={algorithm} onValueChange={onAlgorithmChange}>
            <SelectTrigger id="algorithm">
              <SelectValue placeholder="Select algorithm" />
            </SelectTrigger>
            <SelectContent>
              {algorithms.map((algo) => (
                <SelectItem key={algo} value={algo}>
                  {algo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isHashAction && !hashAlgorithms.includes(algorithm) && (
            <p className="text-xs text-amber-600">
              Note: This algorithm will hash your data, which is a one-way process.
            </p>
          )}
        </div>

        {!isHashAction && !hashAlgorithms.includes(algorithm) && (
          <div className="space-y-2">
            <Label htmlFor="key">Encryption Key</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="key"
                  type={showKey ? "text" : "password"}
                  value={key}
                  onChange={(e) => onKeyChange(e.target.value)}
                  disabled={autoGenerateKey}
                  placeholder="Enter or generate a key"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => onShowKeyChange(!showKey)}
                >
                  {showKey ? <EyeOff className="h-4 w-4 text-gray-500" /> : <Eye className="h-4 w-4 text-gray-500" />}
                  <span className="sr-only">{showKey ? "Hide" : "Show"} key</span>
                </Button>
              </div>
            </div>
            <div className="flex items-center space-x-2 mt-1">
              <Checkbox id="auto-generate" checked={autoGenerateKey} onCheckedChange={onAutoGenerateKeyChange} />
              <Label htmlFor="auto-generate" className="text-sm cursor-pointer">
                Auto-generate key
              </Label>
            </div>
          </div>
        )}
      </div>

      {/* RSA Key Generation Section */}
      {algorithm === "RSA" && !isHashAction && (
        <Card className="mt-4 border-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium text-blue-700">RSA Key Generation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Button onClick={generateRSAKeys} disabled={generatingKeys} className="bg-blue-600 hover:bg-blue-700">
                  {generatingKeys ? (
                    <>Generating...</>
                  ) : (
                    <>
                      <KeyRound className="h-4 w-4 mr-2" />
                      Generate RSA Keys
                    </>
                  )}
                </Button>
              </div>

              {rsaKeys && (
                <div className="space-y-4 mt-4">
                  {/* Public Key */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="public-key" className="text-sm font-medium flex items-center">
                        <Lock className="h-4 w-4 mr-1 text-green-600" />
                        Public Key
                      </Label>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => handleCopyKey("public")}
                        >
                          {keyCopied === "public" ? (
                            <span className="text-green-600">Copied!</span>
                          ) : (
                            <>
                              <Copy className="h-3 w-3 mr-1" />
                              Copy
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => handleUseRSAKey("public")}
                        >
                          Use for {action === "encrypt" ? "Encryption" : "Decryption"}
                        </Button>
                      </div>
                    </div>
                    <Textarea id="public-key" value={rsaKeys.publicKey} readOnly className="font-mono text-xs h-24" />
                  </div>

                  {/* Private Key */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="private-key" className="text-sm font-medium flex items-center">
                        <Lock className="h-4 w-4 mr-1 text-amber-600" />
                        Private Key
                      </Label>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => setShowPrivateKey(!showPrivateKey)}
                        >
                          {showPrivateKey ? (
                            <>
                              <EyeOff className="h-3 w-3 mr-1" />
                              Hide
                            </>
                          ) : (
                            <>
                              <Eye className="h-3 w-3 mr-1" />
                              Show
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => handleCopyKey("private")}
                        >
                          {keyCopied === "private" ? (
                            <span className="text-green-600">Copied!</span>
                          ) : (
                            <>
                              <Copy className="h-3 w-3 mr-1" />
                              Copy
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => handleUseRSAKey("private")}
                        >
                          Use for {action === "encrypt" ? "Encryption" : "Decryption"}
                        </Button>
                      </div>
                    </div>
                    {showPrivateKey ? (
                      <Textarea
                        id="private-key"
                        value={rsaKeys.privateKey}
                        readOnly
                        className="font-mono text-xs h-24"
                      />
                    ) : (
                      <div className="border rounded-md p-3 bg-gray-50 h-24 flex items-center justify-center">
                        <p className="text-gray-500 text-sm">
                          Private key is hidden for security. Click "Show" to view.
                        </p>
                      </div>
                    )}
                    <p className="text-xs text-amber-600 mt-1">
                      Warning: Keep your private key secure. Never share it with others.
                    </p>
                  </div>
                </div>
              )}

              {!rsaKeys && !generatingKeys && (
                <p className="text-sm text-gray-500 mt-2">
                  Generate RSA keys to use for asymmetric encryption and decryption.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {algorithm === "AES" && (
        <div className="p-3 bg-blue-50 rounded-md text-sm text-blue-800">
          <p className="font-medium">Recommended for:</p>
          <p className="text-xs mt-1">Fast, secure encryption of any file type. Best for most use cases.</p>
        </div>
      )}

      {algorithm === "RSA" && (
        <div className="p-3 bg-blue-50 rounded-md text-sm text-blue-800">
          <p className="font-medium">Recommended for:</p>
          <p className="text-xs mt-1">Secure key exchange and digital signatures. Slower for large files.</p>
        </div>
      )}
    </div>
  )
}
