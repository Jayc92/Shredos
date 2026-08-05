import type { Metadata, Viewport } from 'next'
import { GeistSans } from 'geist/font/sans'
import './globals.css'

// Phase 4B.1: Geist Sans is the single variable interface family for
// ForgeFitOS (SIL Open Font License 1.1, loaded via the official
// `geist` package — no font files live in this repository, no layout
// shift, no runtime font requests). GeistSans.variable exposes
// --font-geist-sans, which tailwind.config.ts wires into the sans
// family with system fallbacks. Geist Mono is deliberately NOT loaded
// — no general second family (Phase 4A decision).

export const metadata: Metadata = {
  title: {
    default: 'ForgeFitOS',
    template: '%s | ForgeFitOS',
  },
  description:
    'ForgeFitOS — a personal fitness operating system for training, nutrition, body trends, and deliberate decisions.',

  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'ForgeFitOS',
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
    <html lang="en" className={`dark ${GeistSans.variable}`} suppressHydrationWarning>
      {/* bg-canvas/text-ink (valid ForgeFitOS tokens) replace the legacy
          bg-background/text-foreground utilities here (4B.1 QA
          correction): those utilities resolve to invalid hsl(oklch(…))
          values, and as class selectors they beat every element-selector
          fallback — leaving the body transparent, so the page color
          followed the viewer's OS color scheme instead of the design. */}
      <body className={`font-sans antialiased bg-canvas text-ink min-h-screen`}>
        {children}
      </body>
    </html>
  )
}
