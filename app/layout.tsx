import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { JetBrains_Mono } from 'next/font/google'
import LenisProvider from '@/components/LenisProvider'
import { ClassicyDesktopProvider } from '@/app/SystemFolder/ControlPanels/AppManager/ClassicyAppManagerContext'
import './globals.css'

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'WalleOS | AI Coding & LLM Implementation',
  description: 'Showcasing cutting-edge AI coding projects and LLM implementations',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={jetbrainsMono.variable}>
        <LenisProvider>
          <ClassicyDesktopProvider>{children}</ClassicyDesktopProvider>
        </LenisProvider>
      </body>
    </html>
  )
}
