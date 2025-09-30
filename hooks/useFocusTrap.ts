import { useEffect, useRef } from 'react'

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'iframe',
  'audio[controls]',
  'video[controls]',
  '[contenteditable]',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

export function useFocusTrap<T extends HTMLElement = HTMLDivElement>(isActive: boolean) {
  const containerRef = useRef<T>(null)
  const previouslyFocusedElement = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!isActive) {
      return
    }

    const container = containerRef.current
    if (!container) {
      return
    }

    previouslyFocusedElement.current = document.activeElement as HTMLElement

    const getFocusable = () =>
      Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (element) => !element.hasAttribute('disabled') && element.tabIndex !== -1,
      )

    const focusableElements = getFocusable()

    if (focusableElements.length > 0) {
      focusableElements[0].focus({ preventScroll: true })
    } else {
      container.focus({ preventScroll: true })
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') {
        return
      }

      const focusable = getFocusable()
      if (focusable.length === 0) {
        event.preventDefault()
        container.focus({ preventScroll: true })
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement as HTMLElement

      if (event.shiftKey) {
        if (active === first) {
          event.preventDefault()
          last.focus()
        }
      } else if (active === last) {
        event.preventDefault()
        first.focus()
      }
    }

    const handleFocus = (event: FocusEvent) => {
      if (!container.contains(event.target as Node)) {
        const focusable = getFocusable()
        if (focusable.length > 0) {
          focusable[0].focus({ preventScroll: true })
        } else {
          container.focus({ preventScroll: true })
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('focus', handleFocus, true)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('focus', handleFocus, true)
      previouslyFocusedElement.current?.focus({ preventScroll: true })
    }
  }, [isActive])

  return containerRef
}
