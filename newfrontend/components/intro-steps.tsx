import { Upload, Lock, Download } from "lucide-react"

export function IntroSteps() {
  return (
    <section className="py-6 px-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl mb-8 border border-blue-100">
      <h2 className="text-xl font-semibold text-center mb-6 text-blue-800">How to Use SecureTransfer</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="flex flex-col items-center text-center p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-blue-100">
          <div className="bg-blue-100 p-3 rounded-full mb-3">
            <Upload className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="font-medium text-blue-900 mb-2">1. Upload your file</h3>
          <p className="text-sm text-gray-600">
            Drag and drop any file or click to browse. We support text, images, PDFs, and more.
          </p>
        </div>

        <div className="flex flex-col items-center text-center p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-blue-100">
          <div className="bg-blue-100 p-3 rounded-full mb-3">
            <Lock className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="font-medium text-blue-900 mb-2">2. Choose action & algorithm</h3>
          <p className="text-sm text-gray-600">
            Select encrypt, decrypt, or hash. Pick the algorithm that best suits your needs.
          </p>
        </div>

        <div className="flex flex-col items-center text-center p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-blue-100">
          <div className="bg-blue-100 p-3 rounded-full mb-3">
            <Download className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="font-medium text-blue-900 mb-2">3. Download your result</h3>
          <p className="text-sm text-gray-600">
            Process your file and download the result. For hashing, copy the generated hash value.
          </p>
        </div>
      </div>
    </section>
  )
}
