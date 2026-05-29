'use client'

import { useState, useEffect } from 'react'

interface TypewriterTextProps {
  words: string[]
  typingSpeed?: number
  deletingSpeed?: number
  delayBetweenWords?: number
  className?: string
}

export default function TypewriterText({
  words,
  typingSpeed = 80,
  deletingSpeed = 40,
  delayBetweenWords = 2000,
  className = ''
}: TypewriterTextProps) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [currentText, setCurrentText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (!words || words.length === 0) return

    let timer: NodeJS.Timeout
    const activeWord = words[currentWordIndex]

    if (!isDeleting) {
      // Gõ chữ
      if (currentText.length < activeWord.length) {
        timer = setTimeout(() => {
          setCurrentText(activeWord.substring(0, currentText.length + 1))
        }, typingSpeed)
      } else {
        // Gõ xong, nghỉ một lát trước khi xóa
        timer = setTimeout(() => {
          setIsDeleting(true)
        }, delayBetweenWords)
      }
    } else {
      // Xóa chữ
      if (currentText.length > 0) {
        timer = setTimeout(() => {
          setCurrentText(activeWord.substring(0, currentText.length - 1))
        }, deletingSpeed)
      } else {
        // Xóa xong, đổi sang từ tiếp theo
        setIsDeleting(false)
        setCurrentWordIndex((prev) => (prev + 1) % words.length)
      }
    }

    return () => clearTimeout(timer)
  }, [currentText, isDeleting, currentWordIndex, words, typingSpeed, deletingSpeed, delayBetweenWords])

  return (
    <span className={className}>
      {currentText}
      <span className="ml-1 inline-block w-[3px] h-[0.95em] bg-emerald-400 align-middle animate-pulse" />
    </span>
  )
}
