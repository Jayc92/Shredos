'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { LogOut, Menu, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { NAV_ITEMS } from '@/components/layout/nav-items'

interface TopBarProps {
  displayName?: string
}

export function TopBar({ displayName }: TopBarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  const currentPage =
    NAV_ITEMS.find(
      (item) => pathname === item.href || pathname.startsWith(item.href + '/')
    )?.label ?? 'ShredOS'

  async function handleSignOut() {
    setSigningOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <>
      {/* Mobile top bar */}
      <header className="flex items-center justify-between px-4 h-14 bg-card border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-xs">S</span>
          </div>
          <span className="font-semibold text-sm text-foreground">{currentPage}</span>
        </div>

        <div className="flex items-center gap-2">
          {displayName && (
            <span className="text-xs text-muted-foreground hidden sm:block">{displayName}</span>
          )}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile drawer menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm" onClick={() => setMenuOpen(false)}>
          <div
            className="absolute right-0 top-0 h-full w-64 bg-card border-l border-border flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 h-14 border-b border-border">
              <span className="font-semibold text-sm">Menu</span>
              <button onClick={() => setMenuOpen(false)} className="p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
              {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || pathname.startsWith(href + '/')
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      active
                        ? 'bg-primary/15 text-primary'
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                    )}
                  >
                    <Icon className="w-4 h-4" aria-hidden />
                    <span>{label}</span>
                  </Link>
                )
              })}
            </nav>

            <div className="p-2 border-t border-border">
              {displayName && (
                <p className="px-3 py-1 text-xs text-muted-foreground">{displayName}</p>
              )}
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors disabled:opacity-50"
              >
                <LogOut className="w-4 h-4" aria-hidden />
                <span>{signingOut ? 'Signing out...' : 'Sign out'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
