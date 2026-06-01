/**
 * WavyNavLink Component - Link có hiệu ứng gạch chân khi hover
 *
 * Khi hover, gạch chân sẽ trượt từ trái sang phải.
 * Dùng cho navigation links trên navbar.
 *
 * @param children - Text hiển thị
 * @param onClick - Hàm xử lý khi click
 *
 * @example
 * <WavyNavLink onClick={() => scrollToSection('home')}>Home</WavyNavLink>
 */

'use client'

import { useState } from 'react'

interface WavyNavLinkProps {
  children: React.ReactNode
  onClick?: () => void
  className?: string
}

export default function WavyNavLink({ children, onClick, className = '' }: WavyNavLinkProps) {
  const [hovered, setHovered] = useState(false)

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`relative inline-block cursor-pointer font-medium outline-none ${className}`}
      style={{
        background: 'none',
        border: 'none',
        outline: 'none',
        paddingBottom: '4px',
      }}
    >
      {children}
      {/* Underline: slides from left to right on hover */}
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          height: '2px',
          width: hovered ? '100%' : '0%',
          backgroundColor: '#10b981',
          borderRadius: '999px',
          transition: 'width 0.3s ease-out',
          display: 'block',
        }}
      />
    </button>
  )
}
