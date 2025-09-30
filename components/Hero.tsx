'use client'

import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'
import { useReducedMotion } from '@/hooks/useReducedMotion'

const titleText = '> WalleOS'
const taglineText = 'AI Coding & LLM Implementation'
const typingDelay = 90

export default function Hero() {
  const prefersReducedMotion = useReducedMotion()
  const [displayedText, setDisplayedText] = useState(() =>
    prefersReducedMotion ? titleText : ''
  )

  useEffect(() => {
    if (prefersReducedMotion) {
      setDisplayedText(titleText)
      return
    }

    let frame = 0
    setDisplayedText('')

    const interval = window.setInterval(() => {
      frame += 1
      setDisplayedText(titleText.slice(0, frame))

      if (frame >= titleText.length) {
        window.clearInterval(interval)
      }
    }, typingDelay)

    return () => {
      window.clearInterval(interval)
    }
  }, [prefersReducedMotion])

  const typingDuration = prefersReducedMotion ? 0 : titleText.length * typingDelay

  const headingInitial = prefersReducedMotion
    ? { opacity: 1, y: 0 }
    : { opacity: 0, y: 24 }

  const headingAnimate = { opacity: 1, y: 0 }

  const transitionTiming = { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }

  const taglineInitial = prefersReducedMotion
    ? { opacity: 1, y: 0 }
    : { opacity: 0, y: 18 }
  const taglineAnimate = { opacity: 1, y: 0 }

  const ctaInitial = prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }
  const ctaAnimate = { opacity: 1, y: 0 }

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center px-4 py-24 text-center">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-6">
        <motion.h1
          initial={headingInitial}
          animate={headingAnimate}
          transition={transitionTiming}
          className="text-balance text-5xl font-semibold tracking-tight text-terminal-accent md:text-7xl"
        >
          <span>{displayedText}</span>
          <span
            aria-hidden
            className="ml-1 inline-block w-3 align-baseline text-terminal-accent animate-blink"
          >
            _
          </span>
        </motion.h1>

        <motion.p
          initial={taglineInitial}
          animate={taglineAnimate}
          transition={{
            ...transitionTiming,
            delay: prefersReducedMotion ? 0 : typingDuration / 1000 + 0.25,
          }}
          className="max-w-2xl text-lg text-terminal-fg md:text-2xl"
        >
          {taglineText}
        </motion.p>

        <motion.a
          href="#projects"
          initial={ctaInitial}
          animate={ctaAnimate}
          transition={{
            ...transitionTiming,
            delay: prefersReducedMotion ? 0 : typingDuration / 1000 + 0.5,
          }}
          className={cn(
            'terminal-button inline-flex items-center gap-3 rounded-md bg-transparent',
            prefersReducedMotion ? '' : 'hover:glow-accent'
          )}
        >
          <span>View Projects</span>
          <motion.span
            initial={prefersReducedMotion ? { x: 0 } : { x: -4 }}
            animate={{ x: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            aria-hidden
          >
            →
          </motion.span>
        </motion.a>
      </div>
    </section>
  )
}
