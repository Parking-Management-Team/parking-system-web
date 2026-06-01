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
