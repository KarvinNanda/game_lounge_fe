// Booking status from the API (upcoming, ongoing, completed, cancelled) as shown to staff.
const LABELS = {
  upcoming: 'Akan Datang',
  ongoing: 'Berlangsung',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
}

export const bookingStatusLabel = (status) => (status ? LABELS[status] || status : '-')
