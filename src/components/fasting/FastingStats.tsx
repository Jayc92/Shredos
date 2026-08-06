import type { FastingWeekStats } from '@/types/app'
import { Card, CardContent } from '@/components/ui/card'

interface FastingStatsProps {
  stats: FastingWeekStats
}

export function FastingStats({ stats }: FastingStatsProps) {
  if (stats.totalCount === 0) return null

  return (
    <Card variant="metric" className="gap-0 py-4">
      <CardContent>
      <h3 className="text-sm font-medium text-ink mb-4">This week</h3>
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-2xl font-bold tabular-nums">{stats.completedCount}</p>
          <p className="text-xs text-ink-muted mt-0.5">goals met</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold tabular-nums">{stats.totalCount}</p>
          <p className="text-xs text-ink-muted mt-0.5">total fasts</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold">{stats.avgDurationFormatted ?? '—'}</p>
          <p className="text-xs text-ink-muted mt-0.5">avg duration</p>
        </div>
      </div>
    </CardContent>
    </Card>
  )
}
