import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SecureTransfer",
  description: "Encrypt and Decrypt your files, and images seamlessly",
  generator: "v0.dev",
  icons: {
    icon: '/image.ico',
    apple: '/apple-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
