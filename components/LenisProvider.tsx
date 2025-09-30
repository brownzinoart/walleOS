'use client'

import type { ReactNode } from 'react'
import { ReactLenis } from 'lenis/react'
import { useReducedMotion } from '@/hooks/useReducedMotion'

type LenisProviderProps = {
  children: ReactNode
}

export default function LenisProvider({ children }: LenisProviderProps) {
  const prefersReducedMotion = useReducedMotion()

  if (prefersReducedMotion) {
    return <>{children}</>
  }

  return (
    <ReactLenis
      root
      options={{
        duration: 1.2,
        lerp: 0.1,
        smoothWheel: true,
        smoothTouch: false,
        autoRaf: true,
      }}
    >
      {children}
    </ReactLenis>
  )
}
