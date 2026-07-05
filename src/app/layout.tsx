/**
 * Root Layout - Khung chung của toàn bộ ứng dụng NexPark
 *
 * File này là layout gốc, bọc quanh MỌI trang trong ứng dụng.
 * Tương tự như "khung tranh" - mọi nội dung trang đều nằm bên trong.
 *
 * Chức năng chính:
 * 1. Import CSS toàn cục (globals.css)
 * 2. Cấu hình fonts (Inter cho body, Plus Jakarta Sans cho tiêu đề)
 * 3. SEO metadata (title, description hiển thị trên Google)
 * 4. Cung cấp AuthContext cho toàn bộ app (kiểm tra đăng nhập)
 */

import './globals.css'
import type { Metadata } from 'next'
import { Inter, Plus_Jakarta_Sans } from 'next/font/google'
import { AuthProvider } from '@/features/auth'
import Script from 'next/script'

// Font chính cho body text (nội dung thường)
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',  // CSS variable: var(--font-inter)
})

// Font cho tiêu đề (heading)
const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-heading',  // CSS variable: var(--font-heading)
})

// SEO - hiển thị trên tab trình duyệt và kết quả tìm kiếm Google
export const metadata: Metadata = {
  title: 'NexPark - Smart Parking Management',
  description: 'Modern smart parking solution for buildings with real-time allocation, booking, and monthly passes',
}

/**
 * RootLayout - Component layout gốc
 *
 * @param children - Nội dung của trang hiện tại (page.tsx)
 *
 * Cấu trúc:
 * <html>
 *   <body>
 *     <AuthProvider>     ← Cung cấp thông tin đăng nhập cho toàn bộ app
 *       {children}       ← Trang hiện tại (Home, Login, Register...)
 *     </AuthProvider>
 *   </body>
 * </html>
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body className={`${inter.className} ${plusJakartaSans.variable} bg-gray-50 text-gray-900 antialiased`}>
        {/* AuthProvider bọc quanh toàn bộ app để mọi component đều kiểm tra được user đã đăng nhập chưa */}
        <AuthProvider>
          {children}
        </AuthProvider>
        {/* Load Google Identity Services SDK */}
        <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
      </body>
    </html>
  )
}
