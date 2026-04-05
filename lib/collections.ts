function normalizeDay(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.floor(value)))
}

export function normalizeCollectionsWindow(soft: number, hard: number) {
  const softDays = normalizeDay(soft, 1, 30)
  const hardDays = normalizeDay(hard, softDays + 1, 60)
  return { softDays, hardDays }
}

/** Spread escalation send days between landlord prefs soft -> hard (inclusive), up to 4 steps. */
export function collectionEscalationThresholds(soft: number, hard: number): number[] {
  const { softDays, hardDays } = normalizeCollectionsWindow(soft, hard)
  const steps = 4
  const out: number[] = []

  for (let i = 0; i < steps; i++) {
    const threshold = softDays + Math.round((i * (hardDays - softDays)) / Math.max(1, steps - 1))
    out.push(Math.min(hardDays, Math.max(softDays, threshold)))
  }

  return [...new Set(out)].sort((a, b) => a - b)
}

export function formatCollectionThresholds(thresholds: number[]) {
  if (!thresholds.length) return ''
  if (thresholds.length === 1) return `day ${thresholds[0]}`
  if (thresholds.length === 2) return `days ${thresholds[0]} and ${thresholds[1]}`
  return `days ${thresholds.slice(0, -1).join(', ')}, and ${thresholds[thresholds.length - 1]}`
}
