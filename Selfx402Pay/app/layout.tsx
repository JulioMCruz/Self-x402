import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'sonner'
import { Providers } from '@/components/providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'Self x402 Pay - Verify Once, Pay Instantly',
  description: 'Decentralized payment platform with proof-of-human verification',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <Providers>
          {children}
        </Providers>
        <Toaster position="top-right" richColors />
        <Analytics />
      </body>
    </html>
  )
}
