"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Upload, Lock, Download } from "lucide-react"

interface IntroGuideProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function IntroGuide({ open, onOpenChange }: IntroGuideProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">How to Use SecureTransfer</DialogTitle>
          <DialogDescription className="text-center">Secure your files in just three simple steps</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex items-start gap-4">
            <div className="bg-blue-100 p-2 rounded-full">
              <Upload className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium">1. Upload a File</h3>
              <p className="text-sm text-gray-500">
                Drag and drop any file or click to browse your device. We support text, images, PDFs, and more.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="bg-blue-100 p-2 rounded-full">
              <Lock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium">2. Choose an Action</h3>
              <p className="text-sm text-gray-500">
                Select whether to encrypt, decrypt, or hash your file. Choose an algorithm and configure any options.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="bg-blue-100 p-2 rounded-full">
              <Download className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium">3. Download the Result</h3>
              <p className="text-sm text-gray-500">
                Process your file and download the result. For hashing, you'll get a hash value you can copy.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} className="w-full">
            Got it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
