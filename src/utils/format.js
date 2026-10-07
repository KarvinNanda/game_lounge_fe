// Display helpers shared by the booking components (moved unchanged from
// BookingView.vue).

export const formatRp = (v) => `Rp ${(v || 0).toLocaleString('id-ID')}`

export const formatDateDisplay = (d) => {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('id-ID', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
  })
}

export const formatDate = (d) => d
  ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
  : '-'
