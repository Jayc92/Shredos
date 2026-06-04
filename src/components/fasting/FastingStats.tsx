import type { FastingWeekStats } from '@/types/app'

interface FastingStatsProps {
  stats: FastingWeekStats
}

export function FastingStats({ stats }: FastingStatsProps) {
  if (stats.totalCount === 0) return null

  return (
    <div className="shred-card">
      <h3 className="text-sm font-medium text-foreground mb-4">This week</h3>
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-2xl font-bold tabular-nums">{stats.completedCount}</p>
          <p className="text-xs text-muted-foreground mt-0.5">goals met</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold tabular-nums">{stats.totalCount}</p>
          <p className="text-xs text-muted-foreground mt-0.5">total fasts</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold">{stats.avgDurationFormatted ?? '—'}</p>
          <p className="text-xs text-muted-foreground mt-0.5">avg duration</p>
        </div>
      </div>
    </div>
  )
}
