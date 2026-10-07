import { ref } from 'vue'
import { getDashboard } from '@/api/booking/bookingApi'
import { getEventDashboard } from '@/api/booking/eventBookingApi'
import { getEffectiveOperatingHours } from '@/api/store/storeApi'
import { buildTimeSlots } from '@/utils/bookingGrid'
import { notifyError } from '@/utils/notify'

/**
 * Data for the booking calendar of one branch and date (moved unchanged
 * from BookingView.vue). `store`, `date` and `room` are refs owned by the
 * page; call `load()` when they change.
 */
export function useBookingDashboard({ store, date, room }) {
  const loading = ref(false)
  const dashboardData = ref(null)
  const allRooms = ref([])
  const eventBookings = ref([])
  const effectiveHours = ref(null) // { open_time, close_time, is_holiday, holiday_name, holiday_type }
  const operatingHours = ref('10:00 – 02:00')
  const timeSlots = ref([])
  const openHour = ref(10)

  const setSlots = (openTime, closeTime) => {
    const r = buildTimeSlots(openTime, closeTime)
    timeSlots.value = r.slots
    openHour.value = r.openHour
  }
  setSlots()

  const load = async () => {
    if (!store.value || !date.value) return
    loading.value = true
    try {
      const params = { store_id: store.value, date: date.value }
      if (room.value) params.room_id = room.value

      // Fetch regular booking + event booking + operating hours paralel
      const [dashRes, hoursRes, eventRes] = await Promise.allSettled([
        getDashboard(params),
        getEffectiveOperatingHours(store.value, date.value),
        getEventDashboard({ store_id: store.value, date: date.value }),
      ])

      if (dashRes.status === 'fulfilled') {
        dashboardData.value = dashRes.value.data.data
        allRooms.value = dashRes.value.data.data?.rooms || []
      } else {
        dashboardData.value = null
        allRooms.value = []
      }

      if (hoursRes.status === 'fulfilled') {
        const eff = hoursRes.value.data.data
        effectiveHours.value = eff
        const openT  = eff?.open_time  || '10:00:00'
        const closeT = eff?.close_time || '02:00:00'
        operatingHours.value = `${openT.slice(0,5)} – ${closeT.slice(0,5)}`
        setSlots(openT, closeT)
      } else {
        effectiveHours.value = null
        if (dashboardData.value?.operating_hours) operatingHours.value = dashboardData.value.operating_hours
        setSlots()
      }

      eventBookings.value = eventRes.status === 'fulfilled'
        ? (eventRes.value.data.data || [])
        : []
    } catch (e) {
      notifyError(e, 'Gagal memuat jadwal')
      dashboardData.value = null
      allRooms.value = []
      effectiveHours.value = null
      eventBookings.value = []
      setSlots()
    } finally { loading.value = false }
  }

  return { loading, dashboardData, allRooms, eventBookings, effectiveHours, operatingHours, timeSlots, openHour, load }
}
