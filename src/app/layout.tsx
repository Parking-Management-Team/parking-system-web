import './globals.css'
import type { Metadata } from 'next'
import { Inter, Plus_Jakarta_Sans } from 'next/font/google'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
})

const plusJakartaSans = Plus_Jakarta_Sans({ 
  subsets: ['latin'],
  variable: '--font-heading',
})

export const metadata: Metadata = {
  title: 'NexPark - Smart Parking Management',
  description: 'Modern smart parking solution for buildings with real-time allocation, booking, and monthly passes',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} ${plusJakartaSans.variable} bg-gray-50 text-gray-900 antialiased`}>
        {children}
      </body>
    </html>
  )
}
