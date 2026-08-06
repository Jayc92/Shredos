// ============================================================
// ForgeFitOS — Navigation Icon Layer (Phase 4B.2)
//
// route-match.ts is the single source of truth for routes, labels,
// grouping, and active matching (pure, harness-testable). This
// module is the single source of truth for ICONS: one lucide-react
// component per destination id, named imports only (tree-shakeable —
// no barrel/no dynamic icon lookup). Sidebar, MobileBottomNav,
// TopBar, and MoreSheet all consume these two modules; no component
// declares its own route strings or icons.
//
// Icon language (Phase 4B.1 rules): restrained line icons, one
// library, consistent default stroke, 16–20px in shell rows. Coach
// uses Compass (guidance) — the previous Sparkles read as generic
// "AI magic" and is retired. No emoji anywhere.
// ============================================================

import {
  LayoutDashboard,
  Dumbbell,
  ClipboardList,
  Library,
  UtensilsCrossed,
  Bookmark,
  SlidersHorizontal,
  TrendingUp,
  Scale,
  Footprints,
  Timer,
  Compass,
  CalendarCheck,
  ListChecks,
  UserRound,
  type LucideIcon,
} from 'lucide-react'

import type { NavGroupId } from '@/components/layout/route-match'

/** One icon per destination id (ids from route-match.ts NAV_ROUTES). */
export const NAV_ICONS: Record<string, LucideIcon> = {
  today: LayoutDashboard,
  workouts: Dumbbell,
  routines: ClipboardList,
  'exercise-library': Library,
  food: UtensilsCrossed,
  'saved-meals': Bookmark,
  nutrition: SlidersHorizontal,
  progress: TrendingUp,
  'weigh-in': Scale,
  activity: Footprints,
  fasting: Timer,
  coach: Compass,
  'weekly-review': CalendarCheck,
  decisions: ListChecks,
  profile: UserRound,
}

/** Pillar icons for the mobile bottom navigation (match desktop). */
export const PILLAR_ICONS: Record<NavGroupId, LucideIcon> = {
  today: LayoutDashboard,
  train: Dumbbell,
  fuel: UtensilsCrossed,
  progress: TrendingUp,
  coach: Compass,
  account: UserRound,
}
