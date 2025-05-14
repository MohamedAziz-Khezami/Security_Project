import { SecureTransfer } from "@/components/secure-transfer"

// Update the page.tsx to add a background gradient and better spacing

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-indigo-50 py-8 px-4">
      <SecureTransfer />
    </main>
  )
}
