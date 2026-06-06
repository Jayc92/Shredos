import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'ShredOS',
    template: '%s | ShredOS',
  },
  description: 'Private performance dashboard — fat loss, strength, and running coaching.',
  
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'ShredOS',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#111111',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`font-sans antialiased bg-background text-foreground min-h-screen`}>
        {children}
      </body>
    </html>
  )
}
