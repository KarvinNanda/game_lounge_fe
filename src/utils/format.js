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
