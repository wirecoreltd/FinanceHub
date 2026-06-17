import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'MoneyPilot',
  description: 'Votre copilote financier au quotidien.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  )
}
