// ============================================================
// ShredOS — Shared Navigation Config (Phase 1K)
//
// Single source of truth for the nav items rendered by both
// Sidebar.tsx (desktop) and TopBar.tsx (mobile drawer). Previously
// each file kept its own copy of this array — the exact drift risk
// that caused the Phase 1G mobile-nav gap, where Sidebar was updated
// but TopBar wasn't.
//
// Pure data module — no hooks, no 'use client' needed. Icons here are
// just component references (not invoked, not using any client-only
// APIs), so this is safe to import into both files as-is.
// ============================================================

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
  Sparkles,
  TrendingUp,
} from 'lucide-react'

export const NAV_ITEMS = [
  { href: '/dashboard',  label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/weigh-in',   label: 'Weigh-in',   icon: Scale },
  { href: '/workouts',   label: 'Workouts',   icon: Dumbbell },
  { href: '/food',       label: 'Food',       icon: UtensilsCrossed },
  { href: '/activity',   label: 'Activity',   icon: Footprints },
  { href: '/nutrition',  label: 'Nutrition',  icon: UtensilsCrossed },
  { href: '/fasting',    label: 'Fasting',    icon: Timer },
  { href: '/check-in',   label: 'Check-in',   icon: CalendarCheck },
  { href: '/coach',      label: 'Coach',      icon: Sparkles },
  { href: '/progress',   label: 'Progress',   icon: TrendingUp },
  { href: '/decisions',  label: 'Decisions',  icon: ClipboardList },
  { href: '/profile',    label: 'Profile',    icon: User },
] as const
