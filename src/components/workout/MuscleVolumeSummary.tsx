interface MuscleVolumeSummaryProps {
  volume: Record<string, number>
}

export function MuscleVolumeSummary({ volume }: MuscleVolumeSummaryProps) {
  const entries = Object.entries(volume)
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1])

  if (entries.length === 0) return null

  const label = (m: string) => m.charAt(0).toUpperCase() + m.slice(1).replace('_', ' ')

  return (
    <div className="shred-card space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground">This week by muscle</p>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {entries.map(([m, n]) => (
          <span key={m} className="text-xs text-foreground">
            <span className="font-medium">{label(m)}</span>
            <span className="text-muted-foreground ml-1">{n} set{n !== 1 ? 's' : ''}</span>
          </span>
        ))}
      </div>
    </div>
  )
}
