'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Scale,
  UtensilsCrossed,
  Timer,
  ClipboardList,
  User,
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/weigh-in', label: 'Weigh-in', icon: Scale },
  { href: '/nutrition', label: 'Nutrition', icon: UtensilsCrossed },
  { href: '/fasting', label: 'Fasting', icon: Timer },
  { href: '/decisions', label: 'Decisions', icon: ClipboardList },
  { href: '/profile', label: 'Profile', icon: User },
] as const

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        'flex flex-col bg-card border-r border-border',
        className
      )}
    >
      {/* App name */}
      <div className="px-4 py-5 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
            <span className="text-primary-foreground font-bold text-xs">S</span>
          </div>
          <span className="font-bold text-sm text-foreground tracking-tight">ShredOS</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" aria-hidden />
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Version footer */}
      <div className="px-4 py-3 border-t border-border">
        <p className="text-xs text-muted-foreground">Phase 1A</p>
      </div>
    </aside>
  )
}
