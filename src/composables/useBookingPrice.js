import { ref, computed } from 'vue'
import { calculatePrice } from '@/api/booking/bookingApi'
import { computeVoucherDiscount } from '@/utils/voucher'

/**
 * Debounced price of the new-booking form and the voucher preview on it
 * (moved unchanged from NewBookingPanel). `onPriced` runs after each price
 * attempt, success or failure, where the panel refreshes play credits.
 */
export function useBookingPrice({ form, rooms, vouchers, onPriced = () => {} }) {
  const priceCalc = ref(null)
  const priceCalcLoading = ref(false)

  const selectedVoucherData = computed(() =>
    vouchers.value.find(v => v.code === form.voucher_code) || null
  )
  const voucherDiscount = computed(() =>
    computeVoucherDiscount(selectedVoucherData.value, priceCalc.value?.final_price)
  )

  let priceCalcTimer = null
  const recalculatePrice = async () => {
    const f = form
    if (!f.store_id || !f.booking_date || !f.start_time || !f.end_time) return

    // debounce
    clearTimeout(priceCalcTimer)
    priceCalcTimer = setTimeout(async () => {
      const room = rooms().find(r => r.id === f.room_id)
      if (!room) return

      priceCalcLoading.value = true
      try {
        const { data } = await calculatePrice({
          store_id: f.store_id,
          room_template_id: room.room_template_id || room.room_template?.id,
          booking_date: f.booking_date,
          start_time: f.start_time,
          end_time: f.end_time,
        })
        priceCalc.value = data.data

        // Recalculate duration_hours from start/end
        let sH = parseInt(f.start_time.split(':')[0])
        let eH = parseInt(f.end_time.split(':')[0])
        if (eH < sH) eH += 24
        f.duration_hours = eH - sH
      } catch {
        priceCalc.value = null
      } finally {
        priceCalcLoading.value = false
      }

      onPriced()
    }, 600)
  }

  const cancelPriceCalc = () => clearTimeout(priceCalcTimer)

  return { priceCalc, priceCalcLoading, selectedVoucherData, voucherDiscount, recalculatePrice, cancelPriceCalc }
}
