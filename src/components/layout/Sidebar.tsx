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
  Dumbbell,
  CalendarCheck,
  Footprints,
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/dashboard',  label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/weigh-in',   label: 'Weigh-in',   icon: Scale },
  { href: '/workouts',   label: 'Workouts',   icon: Dumbbell },
  { href: '/food',       label: 'Food',       icon: UtensilsCrossed },
  { href: '/activity',   label: 'Activity',   icon: Footprints },
  { href: '/nutrition',  label: 'Nutrition',  icon: UtensilsCrossed },
  { href: '/fasting',    label: 'Fasting',    icon: Timer },
  { href: '/decisions',  label: 'Decisions',  icon: ClipboardList },
  { href: '/check-in',   label: 'Check-in',   icon: CalendarCheck },
  { href: '/profile',    label: 'Profile',    icon: User },
] as const

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col w-56 border-r border-border bg-card',
        className
      )}
    >
      <div className="flex-1 p-3 overflow-y-auto">
        <div className="space-y-0.5">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active =
              pathname === href ||
              (href !== '/dashboard' && pathname.startsWith(href + '/'))
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary/15 text-primary'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                )}
              >
                <Icon className="w-4 h-4 shrink-0" aria-hidden />
                <span>{label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </aside>
  )
}
