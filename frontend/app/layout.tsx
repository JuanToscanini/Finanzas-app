import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import Providers from '@/lib/providers'
import './css/globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Finanzas App',
  description: 'Gestión de gastos compartidos',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="bg-app">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
