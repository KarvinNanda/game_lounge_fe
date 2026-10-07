<template>
  <el-dialog :model-value="modelValue" title="KONFIRMASI BOOKING" width="420px" align-center @update:model-value="emit('update:modelValue', $event)">
    <div v-if="priceCalc">
      <!-- Customer summary -->
      <div style="display:flex;align-items:center;gap:12px;padding:12px;background:var(--bg-main);border-radius:8px;margin-bottom:16px">
        <el-avatar :size="40" style="background:linear-gradient(135deg,#0282DE,#0262b0);font-weight:700;flex-shrink:0">
          {{ form.customer_name?.[0]?.toUpperCase() }}
        </el-avatar>
        <div>
          <div style="font-weight:700">{{ form.customer_name }}</div>
          <div style="font-size:12px;color:var(--text-secondary)">
            {{ form.customer_whatsapp || form.customer_email || 'Walk-in' }}
          </div>
        </div>
      </div>

      <div class="confirm-row"><span>Room</span><strong>{{ form.room_name }}</strong></div>
      <div class="confirm-row">
        <span>Tanggal</span>
        <span>{{ formatDateDisplay(form.booking_date) }}</span>
      </div>
      <div class="confirm-row">
        <span>Waktu</span>
        <span>{{ form.start_time }} – {{ form.end_time }} ({{ form.duration_hours }} Jam)</span>
      </div>

      <div style="background:var(--bg-card-hover);border:1px solid var(--border-color);border-radius:8px;padding:12px;margin:12px 0">
        <div v-for="item in priceCalc.breakdown" :key="item.time_range"
             style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:5px">
          <span style="color:var(--text-secondary)">{{ item.description }}</span>
          <span>{{ formatRp(item.amount) }}</span>
        </div>
        <div v-if="priceCalc.has_flash_sale"
             style="display:flex;justify-content:space-between;font-size:12px;color:var(--color-danger);margin-bottom:5px">
          <span>⚡ Flash Sale</span>
          <span>- {{ formatRp(priceCalc.flash_discount) }}</span>
        </div>
        <!-- Voucher discount di confirm modal -->
        <div v-if="voucherDiscount && !voucherDiscount.invalid"
             style="display:flex;justify-content:space-between;font-size:12px;color:var(--color-success);margin-bottom:5px">
          <span>🎟️ {{ voucherName }}</span>
          <span>- {{ formatRp(voucherDiscount.amount) }}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding-top:8px;border-top:1px solid var(--border-color);font-weight:700">
          <span>Total Bayar</span>
          <span style="font-size:16px" :style="{ color: voucherDiscount && !voucherDiscount.invalid ? 'var(--color-success)' : 'var(--color-primary)' }">
            {{ formatRp(voucherDiscount && !voucherDiscount.invalid ? voucherDiscount.finalPrice : priceCalc.final_price) }}
          </span>
        </div>
      </div>

      <div class="confirm-row">
        <span>Payment</span>
        <span>{{ form.payment_method === 'play_credits' ? '🎮 Play Credits' : '💵 Cash' }}</span>
      </div>
      <div v-if="form.voucher_code" class="confirm-row">
        <span>Voucher</span>
        <span style="font-family:monospace;font-weight:700;color:var(--color-primary)">{{ form.voucher_code }}</span>
      </div>
    </div>

    <template #footer>
      <el-button @click="emit('update:modelValue', false)">Kembali</el-button>
      <el-button type="primary" :loading="loading" @click="emit('confirm')">
        <el-icon><Check /></el-icon> Konfirmasi Booking
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
// Confirm step of a new booking (moved unchanged from NewBookingPanel).
import { formatRp, formatDateDisplay } from '@/utils/format'

defineProps({
  modelValue: { type: Boolean, default: false },
  form: { type: Object, required: true },
  priceCalc: { type: Object, default: null },
  voucherDiscount: { type: Object, default: null },
  voucherName: { type: String, default: '' },
  loading: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue', 'confirm'])
</script>

<style scoped>
.confirm-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 9px 0; border-bottom: 1px solid var(--border-color);
  gap: 10px;
}
.confirm-row > span:first-child {
  color: var(--text-secondary); font-size: 12px; font-weight: 600; flex-shrink: 0;
}
.confirm-row > span:last-child,
.confirm-row > strong { color: var(--text-primary); font-weight: 700; font-size: 13px; text-align: right; }
</style>
