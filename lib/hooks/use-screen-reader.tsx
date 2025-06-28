import { useEffect, useRef } from 'react'
import * as React from 'react'

export function useScreenReaderAnnouncement() {
  const announcementRef = useRef<HTMLDivElement>(null)

  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!announcementRef.current) return

    // Clear previous announcement
    announcementRef.current.textContent = ''
    
    // Use setTimeout to ensure screen readers detect the change
    setTimeout(() => {
      if (announcementRef.current) {
        announcementRef.current.textContent = message
        announcementRef.current.setAttribute('aria-live', priority)
      }
    }, 100)
  }

  return { announce, announcementRef }
}

export function ScreenReaderAnnouncement({ announcementRef }: { announcementRef: React.RefObject<HTMLDivElement> }) {
  return (
    <div
      ref={announcementRef}
      className="sr-only"
      aria-live="polite"
      aria-atomic="true"
      role="status"
    />
  )
}