import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import ImageEncryption from "@/components/image-encryption";

export default function ImageEncryptionPage() {
  return (
    <main className="container mx-auto px-4 py-10">
      <div className="mb-6">
        <Link href="/">
          <Button variant="ghost" className="flex items-center gap-2 pl-0">
            <ChevronLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </Link>
      </div>

      <div className="flex flex-col items-center justify-center space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl">
            Image Encryption
          </h1>
          <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl">
            Encrypt or decrypt specific parts of your images using canvas
            selection.
          </p>
        </div>

        <div className="w-full max-w-4xl">
          <ImageEncryption />
        </div>
      </div>
    </main>
  );
}
