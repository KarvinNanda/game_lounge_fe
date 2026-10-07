<template>
  <el-dialog :model-value="modelValue" title="KONFIRMASI BOOKING" width="420px" align-center @update:model-value="emit('update:modelValue', $event)">
    <div v-if="priceCalc">
      <!-- Customer summary -->
      <div class="customer-card">
        <el-avatar class="customer-avatar" :size="40">
          {{ form.customer_name?.[0]?.toUpperCase() }}
        </el-avatar>
        <div>
          <div class="u-fw-bold">{{ form.customer_name }}</div>
          <div class="u-text-xs u-text-secondary">
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

      <div class="price-box">
        <div class="price-line" v-for="item in priceCalc.breakdown" :key="item.time_range"
            >
          <span class="u-text-secondary">{{ item.description }}</span>
          <span>{{ formatRp(item.amount) }}</span>
        </div>
        <div class="price-line-flash" v-if="priceCalc.has_flash_sale"
            >
          <span><el-icon aria-hidden="true"><Lightning /></el-icon> Flash Sale</span>
          <span>- {{ formatRp(priceCalc.flash_discount) }}</span>
        </div>
        <!-- Voucher discount di confirm modal -->
        <div class="price-line-voucher" v-if="voucherDiscount && !voucherDiscount.invalid"
            >
          <span><el-icon aria-hidden="true"><Ticket /></el-icon> {{ voucherName }}</span>
          <span>- {{ formatRp(voucherDiscount.amount) }}</span>
        </div>
        <div class="price-total-row">
          <span>Total Bayar</span>
          <span class="price-total-amount" :style="{ color: voucherDiscount && !voucherDiscount.invalid ? 'var(--color-success)' : 'var(--color-primary)' }">
            {{ formatRp(voucherDiscount && !voucherDiscount.invalid ? voucherDiscount.finalPrice : priceCalc.final_price) }}
          </span>
        </div>
      </div>

      <div class="confirm-row">
        <span>Payment</span>
        <span>
          <el-icon aria-hidden="true"><component :is="form.payment_method === 'play_credits' ? 'Coin' : 'Money'" /></el-icon>
          {{ form.payment_method === 'play_credits' ? 'Play Credits' : 'Cash' }}
        </span>
      </div>
      <div v-if="form.voucher_code" class="confirm-row">
        <span>Voucher</span>
        <span class="voucher-code">{{ form.voucher_code }}</span>
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

/* C3: former inline styles */
.customer-card { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-3); background: var(--surface-page); border-radius: var(--radius-lg); margin-bottom: var(--space-4); }
.customer-avatar { background: linear-gradient(135deg, var(--action), var(--action-hover)); font-weight: 700; flex-shrink: 0; }
.price-box { background: var(--surface-muted); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: var(--space-3); margin: var(--space-3) 0; }
.price-line { display: flex; justify-content: space-between; font-size: var(--font-size-xs); margin-bottom: var(--space-1); }
.price-line-flash { display: flex; justify-content: space-between; font-size: var(--font-size-xs); color: var(--danger); margin-bottom: var(--space-1); }
.price-line-voucher { display: flex; justify-content: space-between; font-size: var(--font-size-xs); color: var(--success); margin-bottom: var(--space-1); }
.price-total-row { display: flex; justify-content: space-between; padding-top: var(--space-2); border-top: 1px solid var(--border); font-weight: 700; }
.price-total-amount { font-size: var(--font-size-lg); }
.voucher-code { font-family: monospace; font-weight: 700; color: var(--action); }
</style>
