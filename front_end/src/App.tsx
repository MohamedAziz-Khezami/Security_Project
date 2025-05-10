import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import FileEncryption from "@/components/file-encryption"
import { ArrowRight, FileKey, ImageIcon } from "lucide-react"

export default function App() {
  return (
    <main className="container mx-auto px-4 py-10">
      <div className="flex flex-col items-center justify-center space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Secure File Encryption</h1>
          <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl">
            Encrypt and decrypt your files and images with advanced encryption algorithms.
          </p>
        </div>

        <div className="w-full max-w-3xl">
          <Tabs defaultValue="files" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="files" className="flex items-center gap-2">
                <FileKey className="h-4 w-4" />
                Files
              </TabsTrigger>
              <TabsTrigger value="images" className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Images
              </TabsTrigger>
            </TabsList>
            <TabsContent value="files" className="mt-6">
              <FileEncryption />
            </TabsContent>
            <TabsContent value="images" className="mt-6">
              <div className="flex flex-col items-center justify-center space-y-4 rounded-lg border border-dashed p-10">
                <ImageIcon className="h-10 w-10 text-gray-400" />
                <h3 className="text-lg font-medium">Image Encryption</h3>
                <p className="text-sm text-gray-500">
                  Go to the image encryption page to encrypt or decrypt specific parts of your images.
                </p>
                <Link href="/image-encryption">
                  <Button className="mt-2 flex items-center gap-2">
                    Go to Image Encryption
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </main>
  )
}
