import type { Config } from 'tailwindcss'

// Phase 4B.1 (ForgeFitOS foundation): semantic color roles join the
// existing shadcn-style tokens. EVERY pre-existing mapping below is
// preserved unchanged so current pages keep compiling and rendering —
// the new roles (canvas/surface/brand/success/caution/critical/info/
// chart/readiness/focus-ring) are additive and resolve to the CSS
// variables defined in src/app/globals.css. Transitional aliases are
// documented in docs/phase4b1-foundation-notes.md.

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // UI-7 cleanup: the legacy ShredOS-era literal palette block
        // was removed - a repo-wide audit found zero class usages of
        // it in source or scripts.

        // ── ForgeFitOS semantic roles (Phase 4B.1) ──────────────
        canvas: {
          DEFAULT: 'hsl(var(--canvas))',
          subtle: 'hsl(var(--canvas-subtle))',
        },
        surface: {
          DEFAULT: 'hsl(var(--surface))',
          raised: 'hsl(var(--surface-raised))',
          sunken: 'hsl(var(--surface-sunken))',
          interactive: 'hsl(var(--surface-interactive))',
          selected: 'hsl(var(--surface-selected))',
        },
        ink: {
          DEFAULT: 'hsl(var(--text-primary))',
          secondary: 'hsl(var(--text-secondary))',
          muted: 'hsl(var(--text-muted))',
          inverse: 'hsl(var(--text-inverse))',
        },
        edge: {
          subtle: 'hsl(var(--border-subtle))',
          DEFAULT: 'hsl(var(--border-default))',
          strong: 'hsl(var(--border-strong))',
        },
        brand: {
          DEFAULT: 'hsl(var(--brand))',
          hover: 'hsl(var(--brand-hover))',
          active: 'hsl(var(--brand-active))',
          subtle: 'hsl(var(--brand-subtle))',
          foreground: 'hsl(var(--brand-foreground))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          subtle: 'hsl(var(--success-subtle))',
        },
        caution: {
          DEFAULT: 'hsl(var(--caution))',
          subtle: 'hsl(var(--caution-subtle))',
        },
        critical: {
          DEFAULT: 'hsl(var(--critical))',
          subtle: 'hsl(var(--critical-subtle))',
        },
        info: {
          DEFAULT: 'hsl(var(--info))',
          subtle: 'hsl(var(--info-subtle))',
        },
        'focus-ring': 'hsl(var(--focus-ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
          '6': 'hsl(var(--chart-6))',
        },
        readiness: {
          ready: 'hsl(var(--readiness-ready))',
          caution: 'hsl(var(--readiness-caution))',
          recovery: 'hsl(var(--readiness-recovery))',
        },
        overlay: 'hsl(var(--overlay))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        // ForgeFitOS shape tokens (Phase 4B.1)
        control: 'var(--radius-control)',
        card: 'var(--radius-card)',
        panel: 'var(--radius-panel)',
        badge: 'var(--radius-badge)',
        modal: 'var(--radius-modal)',
      },
      boxShadow: {
        // Restrained elevation only — no neon glows, no glassmorphism.
        raised: 'var(--shadow-raised)',
        floating: 'var(--shadow-floating)',
      },
      fontFamily: {
        // Geist Sans is the single interface family (Phase 4A decision);
        // --font-geist-sans is exposed by the root layout. The legacy
        // var(--font-sans)/var(--font-mono) references were REMOVED (4B.1
        // QA correction): neither variable is defined anywhere, and one
        // undefined var() invalidates the ENTIRE font-family declaration
        // (CSS invalid-at-computed-value-time), which made the app render
        // the browser default (Times) instead of Geist.
        sans: [
          'var(--font-geist-sans)',
          'system-ui',
          'sans-serif',
        ],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}

export default config
