// Display helpers shared by the booking components (moved unchanged from
// BookingView.vue).

// Rupiah has no sub-unit in practice. Values computed as floats (averages,
// percentage discounts) are rounded to whole rupiah for display.
export const formatRp = (v) => `Rp ${(v || 0).toLocaleString('id-ID', { maximumFractionDigits: 0 })}`

export const formatDateDisplay = (d) => {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('id-ID', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
  })
}

export const formatDate = (d) => d
  ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
  : '-'

// Percentages with an Indonesian decimal comma: 15.2 -> "15,2%".
export const formatPercent = (v) => `${(Number(v) || 0).toLocaleString('id-ID', { maximumFractionDigits: 1 })}%`

// Short amounts for chart axes: 1800000 -> "1,8 jt", 900000 -> "900 rb".
export const formatCompact = (v) => {
  const n = Number(v) || 0
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} jt`
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toLocaleString('id-ID', { maximumFractionDigits: 0 })} rb`
  return n.toLocaleString('id-ID')
}

// "10:00:00" from the API reads as "10:00". Empty stays empty.
export const hhmm = (t) => (t || '').slice(0, 5)
