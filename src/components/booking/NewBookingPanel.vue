<template>
  <!-- New Booking Form Panel -->
  <div class="right-panel">
    <div class="panel-header">
      <span class="panel-title">BOOKING BARU</span>
      <el-button circle text @click="emit('close')"><el-icon><Close /></el-icon></el-button>
    </div>

    <!-- Room info chip -->
    <div class="room-chip">
      <el-icon class="u-text-action"><Location /></el-icon>
      <span class="u-fw-semibold u-text-sm">{{ newBookingForm.room_name }}</span>
      <span class="u-text-muted u-text-xs">• {{ newBookingForm.start_time }} – {{ newBookingForm.end_time }}</span>
    </div>

    <el-form :model="newBookingForm" ref="newBookingFormRef" label-position="top" size="small">

      <!-- Customer Search -->
      <el-form-item label="Customer (Opsional)" prop="customer_id">
        <el-select
          v-model="newBookingForm.customer_id"
          filterable remote :remote-method="searchCustomers"
          :loading="customerSearchLoading"
          placeholder="Cari nama / WhatsApp customer..."
          class="u-w-full"
          @change="onCustomerChange"
          clearable
        >
          <el-option v-for="c in customerOptions" :key="c.id"
            :label="c.name" :value="c.id">
            <div class="u-flex u-justify-between u-gap-1">
              <span class="u-fw-semibold u-text-sm">{{ c.name }} - {{ c.whatsapp }}</span>
              <el-tag :type="c.type === 'member' ? 'warning' : 'info'" size="small">
                {{ c.type === 'member' ? 'Member' : 'Regular' }}
              </el-tag>
            </div>
            <div v-if="c.whatsapp || c.phone" class="u-flex u-gap-1 u-mt-1">
              <span class="wa-badge">WA</span>
              <span class="customer-phone">{{ c.whatsapp || c.phone }}</span>
            </div>
          </el-option>
        </el-select>
        <div class="u-text-xs u-text-muted u-mt-1">
          Kosongkan untuk walk-in tanpa data
        </div>
      </el-form-item>

      <!-- Nama Customer -->
      <el-form-item label="Nama Customer *" prop="customer_name"
        :rules="[{ required: true, message: 'Nama wajib diisi', trigger: 'blur' }]">
        <el-input v-model="newBookingForm.customer_name" placeholder="Nama customer" />
      </el-form-item>

      <!-- Kontak -->
      <div class="two-col">
        <el-form-item label="WhatsApp">
          <el-input v-model="newBookingForm.customer_whatsapp" placeholder="08xx-xxxx" />
        </el-form-item>
        <el-form-item label="Email">
          <el-input v-model="newBookingForm.customer_email" placeholder="email@..." />
        </el-form-item>
      </div>

      <!-- Tanggal -->
      <el-form-item label="Tanggal Booking">
        <el-date-picker v-model="newBookingForm.booking_date" type="date"
          value-format="YYYY-MM-DD" class="u-w-full"
          @change="recalculatePrice" />
      </el-form-item>

      <!-- Jam -->
      <div class="two-col">
        <el-form-item label="Jam Mulai *">
          <el-time-picker v-model="newBookingForm.start_time" format="HH:mm"
            value-format="HH:mm" class="u-w-full" @change="recalculatePrice" />
        </el-form-item>
        <el-form-item label="Jam Selesai *">
          <el-time-picker v-model="newBookingForm.end_time" format="HH:mm"
            value-format="HH:mm" class="u-w-full" @change="recalculatePrice" />
        </el-form-item>
      </div>

      <!-- Durasi Quick Select -->
      <el-form-item label="Tambah Durasi">
        <div class="duration-buttons">
          <el-button
            v-for="d in [1, 2, 3, 4, 5, 6, 8,10]" :key="d" size="small"
            :type="newBookingForm.duration_hours === d ? 'primary' : 'default'"
            @click="setDuration(d)"
          >{{ d }}j</el-button>
        </div>
      </el-form-item>

      <!-- Kalkulasi Harga -->
      <div class="price-placeholder" v-if="priceCalcLoading">
        <el-icon class="is-loading"><Loading /></el-icon> Menghitung harga...
      </div>
      <div v-else-if="priceCalc" class="price-breakdown-box">
        <div v-for="item in priceCalc.breakdown" :key="item.time_range" class="breakdown-row">
          <span class="u-text-xs u-text-secondary">{{ item.description }}</span>
          <span class="u-text-xs u-fw-semibold">{{ formatRp(item.amount) }}</span>
        </div>
        <!-- <div v-if="priceCalc.has_flash_sale" class="breakdown-row u-text-danger">
          <span class="u-text-xs"><el-icon aria-hidden="true"><Lightning /></el-icon> Flash Sale: {{ priceCalc.flash_sale_name }}</span>
          <span class="u-text-xs">- {{ formatRp(priceCalc.flash_discount) }}</span>
        </div> -->

        <!-- Voucher discount preview -->
        <template v-if="voucherDiscount">
          <div v-if="voucherDiscount.invalid" class="breakdown-row voucher-invalid-row">
            <span class="u-text-xs"><el-icon aria-hidden="true"><Ticket /></el-icon> Voucher {{ newBookingForm.voucher_code }}</span>
            <span class="u-text-xs">{{ voucherDiscount.reason }}</span>
          </div>
          <div v-else class="breakdown-row voucher-discount-row">
            <span class="u-text-xs">
              <el-icon aria-hidden="true"><Ticket /></el-icon> {{ selectedVoucherData?.name }}
              <span class="dimmed">({{ selectedVoucherData?.discount_type === 'percentage' ? selectedVoucherData.discount_value + '%' : formatRp(selectedVoucherData.discount_value) }})</span>
            </span>
            <span class="u-text-xs u-fw-bold">- {{ formatRp(voucherDiscount.amount) }}</span>
          </div>
        </template>

        <div class="breakdown-total">
          <span>Total Bayar</span>
          <strong class="price-amount" :style="{ color: voucherDiscount && !voucherDiscount.invalid ? 'var(--color-success)' : 'var(--color-primary)' }">
            {{ formatRp(voucherDiscount && !voucherDiscount.invalid ? voucherDiscount.finalPrice : priceCalc.final_price) }}
          </strong>
        </div>
        <div class="price-original" v-if="voucherDiscount && !voucherDiscount.invalid"
            >
          Sebelum diskon: {{ formatRp(priceCalc.final_price) }}
        </div>
      </div>

      <!-- Play Credits -->
      <div v-if="availableCredits.length > 0" class="credits-section">
        <div class="u-text-xs u-fw-bold u-mb-2 u-text-success">
          <el-icon aria-hidden="true"><Coin /></el-icon> Pakai Play Credits?
        </div>
        <div class="payment-options">

          <!-- Opsi: Cash -->
          <div
            :class="['payment-option', newBookingForm.payment_method === 'cash' ? 'payment-option--selected' : '']"
            @click="newBookingForm.payment_method = 'cash'; newBookingForm.play_credit_id = null"
          >
            <div class="payment-option__check">
              <el-icon v-if="newBookingForm.payment_method === 'cash'"><Check /></el-icon>
            </div>
            <span class="u-text-xs u-fw-semibold"><el-icon aria-hidden="true"><Money /></el-icon> Cash</span>
            <span class="option-hint">— Bayar langsung</span>
          </div>

          <!-- Opsi: Play Credits -->
          <div
            v-for="cr in availableCredits" :key="cr.id"
            :class="['payment-option', newBookingForm.play_credit_id === cr.id && newBookingForm.payment_method !== 'cash' ? 'payment-option--selected' : '']"
            @click="newBookingForm.play_credit_id = cr.id; newBookingForm.payment_method = 'play_credits'"
          >
            <div class="payment-option__check">
              <el-icon v-if="newBookingForm.play_credit_id === cr.id && newBookingForm.payment_method !== 'cash'"><Check /></el-icon>
            </div>
            <div class="credit-info">
              <span class="u-text-xs u-fw-bold"><el-icon aria-hidden="true"><Coin /></el-icon> {{ cr.package?.name }}</span>
              <span class="u-text-xs u-text-secondary">
                {{ cr.remaining_hours }} Jam tersisa
                <span class="u-text-muted">&nbsp;·&nbsp; exp. {{ formatDate(cr.expires_at) }}</span>
              </span>
            </div>
          </div>

        </div>
      </div>

      <!-- Voucher -->
      <el-form-item v-if="selectedCustomerIsMember" label="Voucher (Opsional)">
        <el-select
          v-model="newBookingForm.voucher_code"
          placeholder="Pilih voucher..."
          filterable clearable class="u-w-full"
          :loading="voucherOptionsLoading"
          no-data-text="Tidak ada voucher tersedia"
        >
          <el-option
            v-for="v in availableVouchers"
            :key="v.code"
            :label="v.name"
            :value="v.code"
          >
            <div class="u-flex u-justify-between u-gap-2">
              <div>
                <span class="voucher-code">{{ v.code }}</span>
                <span class="voucher-name">{{ v.name }}</span>
              </div>
              <span class="voucher-amount">
                {{ v.discount_type === 'percentage' ? v.discount_value + '%' : formatRp(v.discount_value) }}
              </span>
            </div>
            <div class="voucher-meta" v-if="v.end_date">
              Berlaku s/d {{ formatDate(v.end_date) }}
            </div>
          </el-option>
        </el-select>
        <div class="voucher-hint" v-if="!voucherOptionsLoading && availableVouchers.length === 0"
            >
          Tidak ada voucher booking yang tersedia untuk customer ini
        </div>
      </el-form-item>

      <!-- Catatan -->
      <el-form-item label="Catatan (Opsional)">
        <el-input v-model="newBookingForm.notes" type="textarea" :rows="2"
          placeholder="Catatan untuk booking ini..." />
      </el-form-item>
    </el-form>

    <el-button type="primary" class="u-w-full u-mt-2"
      :loading="creatingBooking" :disabled="!priceCalc && !priceCalcLoading" @click="openConfirmModal">
      Lanjutkan →
    </el-button>

    <BookingConfirmDialog
      v-model="showConfirmModal"
      :form="newBookingForm"
      :price-calc="priceCalc"
      :voucher-discount="voucherDiscount"
      :voucher-name="selectedVoucherData?.name || ''"
      :loading="creatingBooking"
      @confirm="handleCreateBooking"
    />

    <BookingSuccessDialog
      v-model="showSuccessModal"
      :code="createdBookingCode"
      :whatsapp="newBookingForm.customer_whatsapp"
      :email="newBookingForm.customer_email"
      @view="viewCreatedBooking"
      @again="resetForNewBooking"
    />
  </div>
</template>

<script setup>
// New regular booking: customer, time, price, voucher and play credits.
// Price + voucher preview live in useBookingPrice; the confirm and success
// steps are BookingConfirmDialog and BookingSuccessDialog. `selection` is the clicked slot;
// a new selection refills the form, like a new slot click did before.
import { ref, reactive, computed, watch, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { createBooking, getAvailableCredits } from '@/api/booking/bookingApi'
import { getCustomers } from '@/api/customer/customerApi'
import api from '@/api/index'
import { notifyError } from '@/utils/notify'
import { formatRp, formatDate } from '@/utils/format'
import { useBookingPrice } from '@/composables/useBookingPrice'
import BookingConfirmDialog from './BookingConfirmDialog.vue'
import BookingSuccessDialog from './BookingSuccessDialog.vue'

const props = defineProps({
  // { storeId, roomId, roomName, date, startTime, endTime } of the clicked slot
  selection: { type: Object, required: true },
  // branch selected on the page (play credits are looked up for it, as before)
  store: { type: String, default: '' },
  rooms: { type: Array, default: () => [] },
})
const emit = defineEmits(['close', 'created', 'view-booking'])

const customerOptions = ref([])
const customerSearchLoading = ref(false)
const availableCredits = ref([])
const availableVouchers = ref([])
const voucherOptionsLoading = ref(false)

const creatingBooking = ref(false)

const showConfirmModal = ref(false)
const showSuccessModal = ref(false)
const createdBookingCode = ref('')

const newBookingFormRef = ref()

const newBookingForm = reactive({
  store_id: '', room_id: '', room_name: '',
  customer_id: '', customer_name: '',
  customer_whatsapp: '', customer_email: '',
  booking_date: '', start_time: '', end_time: '',
  duration_hours: 1,
  payment_method: 'cash', play_credit_id: '',
  voucher_code: '', notes: ''
})

// ── Computed
const selectedCustomerIsMember = computed(() => {
  const c = customerOptions.value.find(c => c.id === newBookingForm.customer_id)
  return c?.type === 'member'
})

// ── Price + voucher preview ───────────────────────────────────
const { priceCalc, priceCalcLoading, selectedVoucherData, voucherDiscount, recalculatePrice, cancelPriceCalc } =
  useBookingPrice({ form: newBookingForm, rooms: () => props.rooms, vouchers: availableVouchers, onPriced: () => refreshCredits() })

// Refresh play credits when the date may have changed and the customer is a member
const refreshCredits = () => {
  const f = newBookingForm
  if (!f.customer_id) return
  const customer = customerOptions.value.find(c => c.id === f.customer_id)
  if (customer?.type === 'member') {
    getAvailableCredits(f.customer_id, f.store_id, f.booking_date)
      .then(({ data }) => { availableCredits.value = data.data || [] })
      .catch(() => {})
  }
}

// ── Customer Search ───────────────────────────────────────────
const searchCustomers = async (q) => {
  if (!q || q.length < 2) return
  customerSearchLoading.value = true
  try {
    const { data } = await getCustomers({ search: q, per_page: 20 })
    customerOptions.value = data.data || []
  } catch {}
  finally { customerSearchLoading.value = false }
}

const setDuration = (hours) => {
  newBookingForm.duration_hours = hours
  const startH = parseInt(newBookingForm.start_time.split(':')[0])
  const endH = (startH + hours) % 24
  newBookingForm.end_time = `${String(endH).padStart(2,'0')}:00`
  recalculatePrice()
}

const loadAvailableVouchers = async (customerId) => {
  voucherOptionsLoading.value = true
  availableVouchers.value = []
  try {
    const { data } = await api.get('/vouchers/customer-available', {
      params: { customer_id: customerId, store_id: newBookingForm.store_id, type: 'booking' }
    })
    availableVouchers.value = data.data || []
  } catch { availableVouchers.value = [] }
  finally { voucherOptionsLoading.value = false }
}

const onCustomerChange = async (customerId) => {
  newBookingForm.voucher_code = ''
  availableVouchers.value = []

  if (!customerId) {
    newBookingForm.customer_name = ''
    newBookingForm.customer_whatsapp = ''
    newBookingForm.customer_email = ''
    availableCredits.value = []
    return
  }
  const customer = customerOptions.value.find(c => c.id === customerId)
  if (customer) {
    newBookingForm.customer_name = customer.name
    newBookingForm.customer_whatsapp = customer.whatsapp || ''
    newBookingForm.customer_email = customer.email || ''
    if (customer.type === 'member') {
      // Load play credits dan vouchers paralel
      const [, ] = await Promise.allSettled([
        getAvailableCredits(customerId, props.store,newBookingForm.booking_date)
          .then(({ data }) => { availableCredits.value = data.data || [] })
          .catch(() => { availableCredits.value = [] }),
        loadAvailableVouchers(customerId),
      ])
    } else {
      availableCredits.value = []
      newBookingForm.payment_method = 'cash'
    }
  }
}

const openConfirmModal = () => {
  if (!newBookingForm.customer_name.trim()) {
    ElMessage.warning('Nama customer wajib diisi')
    return
  }
  if (!priceCalc.value) {
    ElMessage.warning('Harga belum terhitung. Pastikan waktu booking sudah diisi.')
    return
  }
  showConfirmModal.value = true
}

const handleCreateBooking = async () => {
  creatingBooking.value = true
  try {
    const payload = {
      store_id: newBookingForm.store_id,
      room_id: newBookingForm.room_id,
      customer_id: newBookingForm.customer_id || null,
      customer_name: newBookingForm.customer_name,
      customer_whatsapp: newBookingForm.customer_whatsapp || null,
      customer_email: newBookingForm.customer_email || null,
      booking_date: newBookingForm.booking_date,
      start_time: newBookingForm.start_time,
      end_time: newBookingForm.end_time,
      payment_method: newBookingForm.payment_method === 'cash' ? 'cash' : 'play_credits',
      play_credit_id: newBookingForm.payment_method !== 'cash' ? newBookingForm.play_credit_id : null,
      voucher_code: newBookingForm.voucher_code || null,
      notes: newBookingForm.notes || null,
    }
    const { data } = await createBooking(payload)
    createdBookingCode.value = data.data?.booking_code || data.data?.id || '—'
    showConfirmModal.value = false
    showSuccessModal.value = true
    emit('created')
  } catch (e) {
    notifyError(e, 'Gagal membuat booking')
  } finally { creatingBooking.value = false }
}

const viewCreatedBooking = () => {
  showSuccessModal.value = false
  emit('view-booking')
}

const resetForNewBooking = () => {
  showSuccessModal.value = false
  priceCalc.value = null
  availableCredits.value = []
  Object.assign(newBookingForm, {
    customer_id: '', customer_name: '', customer_whatsapp: '', customer_email: '',
    payment_method: 'cash', play_credit_id: '', voucher_code: '', notes: ''
  })
}

// Fill the form from the clicked slot (moved from the page's handleSlotClick)
watch(() => props.selection, (sel) => {
  Object.assign(newBookingForm, {
    store_id: sel.storeId,
    room_id: sel.roomId,
    room_name: sel.roomName,
    booking_date: sel.date,
    start_time: sel.startTime,
    end_time: sel.endTime,
    duration_hours: 1,
    customer_id: '', customer_name: '',
    customer_whatsapp: '', customer_email: '',
    payment_method: 'cash', play_credit_id: '',
    voucher_code: '', notes: ''
  })

  priceCalc.value = null
  availableCredits.value = []
  availableVouchers.value = []
  customerOptions.value = []
  recalculatePrice()
}, { immediate: true })

onUnmounted(cancelPriceCalc)
</script>

<style scoped src="./panel.css"></style>

<style scoped>
.room-chip {
  display: flex; align-items: center; gap: 8px;
  background: rgba(2,130,222,0.1);
  border: 1px solid rgba(2,130,222,0.25);
  border-radius: 8px; padding: 9px 13px; margin-bottom: 14px;
  font-weight: 600;
}
.price-breakdown-box {
  background: var(--bg-main);
  border: 1px solid var(--border-color);
  border-radius: 8px; padding: 12px; margin: 10px 0;
}
.breakdown-row {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 6px;
}
.breakdown-row > span:first-child {
  color: var(--text-secondary); font-size: 11.5px; font-weight: 600;
}
.breakdown-row > span:last-child {
  font-size: 12.5px; font-weight: 700; color: var(--text-primary);
}
.breakdown-total {
  display: flex; justify-content: space-between; align-items: center;
  padding-top: 9px; border-top: 1px solid var(--border-color);
  font-size: 13px; font-weight: 800; color: var(--text-primary);
}
.voucher-discount-row {
  display: flex; justify-content: space-between; align-items: center;
  color: var(--color-success);
  background: rgba(16,185,129,0.08);
  border: 1px solid rgba(16,185,129,0.2);
  border-radius: 5px;
  margin: 3px 0 6px; padding: 5px 8px;
  font-weight: 700; font-size: 11.5px;
}
.voucher-invalid-row {
  display: flex; justify-content: space-between; align-items: center;
  color: var(--color-danger);
  background: rgba(239,68,68,0.08);
  border: 1px solid rgba(239,68,68,0.2);
  border-radius: 5px;
  margin: 3px 0 6px; padding: 5px 8px;
  font-weight: 700; font-size: 11.5px;
}
.credits-section {
  background: rgba(16,185,129,0.07);
  border: 1px solid rgba(16,185,129,0.22);
  border-radius: 8px; padding: 12px; margin-bottom: 12px;
}
.payment-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border: 1.5px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  background: var(--bg-card);
  transition: border-color 0.15s, background 0.15s;
  user-select: none;
}
.payment-option:hover {
  border-color: var(--color-primary);
  background: rgba(2,130,222,0.04);
}
/* Two classes: beats .payment-option:hover, so the selected look stays while hovering. */
.payment-option.payment-option--selected {
  border-color: var(--success);
  background: rgba(16,185,129,0.08);
}
.payment-option__check {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 1.5px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 11px;
  color: var(--color-success);
  transition: border-color 0.15s, background 0.15s;
}
.payment-option--selected .payment-option__check {
  border-color: var(--color-success);
  background: var(--color-success);
  color: var(--text-on-action);
}

/* C3: former inline styles */
.panel-title { font-size: var(--font-size-sm); font-weight: 700; letter-spacing: 0.5px; }
.wa-badge { font-size: var(--font-size-xs); font-weight: 600; color: var(--brand-whatsapp); }
.customer-phone { font-size: var(--font-size-xs); color: var(--text-secondary); font-variant-numeric: tabular-nums; }
.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-2); }
.duration-buttons { display: flex; gap: var(--space-1); flex-wrap: wrap; }
.price-placeholder { text-align: center; padding: var(--space-3); color: var(--text-muted); font-size: var(--font-size-xs); }
.dimmed { opacity: 0.7; }
.price-amount { font-size: var(--font-size-base); }
.price-original { text-align: right; font-size: var(--font-size-xs); color: var(--text-muted); margin-top: var(--space-1); text-decoration: line-through; }
.payment-options { display: flex; flex-direction: column; gap: var(--space-1); }
.option-hint { font-size: var(--font-size-xs); color: var(--text-secondary); margin-left: var(--space-1); }
.credit-info { display: flex; flex-direction: column; }
.voucher-code { font-family: monospace; font-size: var(--font-size-xs); font-weight: 800; color: var(--action); }
.voucher-name { margin-left: var(--space-2); font-size: var(--font-size-xs); }
.voucher-amount { font-size: var(--font-size-xs); font-weight: 700; color: var(--success); flex-shrink: 0; }
.voucher-meta { font-size: var(--font-size-xs); color: var(--text-muted); }
.voucher-hint { font-size: var(--font-size-xs); color: var(--text-muted); margin-top: var(--space-1); }
</style>
