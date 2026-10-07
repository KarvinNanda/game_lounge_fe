<template>
  <!-- New Booking Form Panel -->
  <div class="right-panel">
    <div class="panel-header">
      <span style="font-size:13px;font-weight:700;letter-spacing:0.5px">BOOKING BARU</span>
      <el-button circle text @click="emit('close')"><el-icon><Close /></el-icon></el-button>
    </div>

    <!-- Room info chip -->
    <div class="room-chip">
      <el-icon style="color:var(--color-primary)"><Location /></el-icon>
      <span style="font-weight:600;font-size:13px">{{ newBookingForm.room_name }}</span>
      <span style="color:var(--text-muted);font-size:11px">• {{ newBookingForm.start_time }} – {{ newBookingForm.end_time }}</span>
    </div>

    <el-form :model="newBookingForm" ref="newBookingFormRef" label-position="top" size="small">

      <!-- Customer Search -->
      <el-form-item label="Customer (Opsional)" prop="customer_id">
        <el-select
          v-model="newBookingForm.customer_id"
          filterable remote :remote-method="searchCustomers"
          :loading="customerSearchLoading"
          placeholder="Cari nama / WhatsApp customer..."
          style="width:100%"
          @change="onCustomerChange"
          clearable
        >
          <el-option v-for="c in customerOptions" :key="c.id"
            :label="c.name" :value="c.id">
            <div style="display:flex;justify-content:space-between;align-items:center;gap:6px">
              <span style="font-weight:600;font-size:13px">{{ c.name }} - {{ c.whatsapp }}</span>
              <el-tag :type="c.type === 'member' ? 'warning' : 'info'" size="small">
                {{ c.type === 'member' ? 'Member' : 'Regular' }}
              </el-tag>
            </div>
            <div v-if="c.whatsapp || c.phone" style="display:flex;align-items:center;gap:4px;margin-top:2px">
              <span style="font-size:10px;font-weight:600;color:#25D366;">WA</span>
              <span style="font-size:10px;color:var(--text-secondary);font-variant-numeric:tabular-nums">{{ c.whatsapp || c.phone }}</span>
            </div>
          </el-option>
        </el-select>
        <div style="font-size:10px;color:var(--text-muted);margin-top:2px">
          Kosongkan untuk walk-in tanpa data
        </div>
      </el-form-item>

      <!-- Nama Customer -->
      <el-form-item label="Nama Customer *" prop="customer_name"
        :rules="[{ required: true, message: 'Nama wajib diisi', trigger: 'blur' }]">
        <el-input v-model="newBookingForm.customer_name" placeholder="Nama customer" />
      </el-form-item>

      <!-- Kontak -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
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
          value-format="YYYY-MM-DD" style="width:100%"
          @change="recalculatePrice" />
      </el-form-item>

      <!-- Jam -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <el-form-item label="Jam Mulai *">
          <el-time-picker v-model="newBookingForm.start_time" format="HH:mm"
            value-format="HH:mm" style="width:100%" @change="recalculatePrice" />
        </el-form-item>
        <el-form-item label="Jam Selesai *">
          <el-time-picker v-model="newBookingForm.end_time" format="HH:mm"
            value-format="HH:mm" style="width:100%" @change="recalculatePrice" />
        </el-form-item>
      </div>

      <!-- Durasi Quick Select -->
      <el-form-item label="Tambah Durasi">
        <div style="display:flex;gap:2px;flex-wrap:wrap">
          <el-button
            v-for="d in [1, 2, 3, 4, 5, 6, 8,10]" :key="d" size="small"
            :type="newBookingForm.duration_hours === d ? 'primary' : 'default'"
            @click="setDuration(d)"
          >{{ d }}j</el-button>
        </div>
      </el-form-item>

      <!-- Kalkulasi Harga -->
      <div v-if="priceCalcLoading" style="text-align:center;padding:12px;color:var(--text-muted);font-size:12px">
        <el-icon class="is-loading"><Loading /></el-icon> Menghitung harga...
      </div>
      <div v-else-if="priceCalc" class="price-breakdown-box">
        <div v-for="item in priceCalc.breakdown" :key="item.time_range" class="breakdown-row">
          <span style="font-size:11px;color:var(--text-secondary)">{{ item.description }}</span>
          <span style="font-size:12px;font-weight:600">{{ formatRp(item.amount) }}</span>
        </div>
        <!-- <div v-if="priceCalc.has_flash_sale" class="breakdown-row" style="color:var(--color-danger)">
          <span style="font-size:11px">⚡ Flash Sale: {{ priceCalc.flash_sale_name }}</span>
          <span style="font-size:12px">- {{ formatRp(priceCalc.flash_discount) }}</span>
        </div> -->

        <!-- Voucher discount preview -->
        <template v-if="voucherDiscount">
          <div v-if="voucherDiscount.invalid" class="breakdown-row voucher-invalid-row">
            <span style="font-size:11px">🎟️ Voucher {{ newBookingForm.voucher_code }}</span>
            <span style="font-size:11px">{{ voucherDiscount.reason }}</span>
          </div>
          <div v-else class="breakdown-row voucher-discount-row">
            <span style="font-size:11px">
              🎟️ {{ selectedVoucherData?.name }}
              <span style="opacity:0.7">({{ selectedVoucherData?.discount_type === 'percentage' ? selectedVoucherData.discount_value + '%' : formatRp(selectedVoucherData.discount_value) }})</span>
            </span>
            <span style="font-size:12px;font-weight:700">- {{ formatRp(voucherDiscount.amount) }}</span>
          </div>
        </template>

        <div class="breakdown-total">
          <span>Total Bayar</span>
          <strong style="font-size:15px" :style="{ color: voucherDiscount && !voucherDiscount.invalid ? 'var(--color-success)' : 'var(--color-primary)' }">
            {{ formatRp(voucherDiscount && !voucherDiscount.invalid ? voucherDiscount.finalPrice : priceCalc.final_price) }}
          </strong>
        </div>
        <div v-if="voucherDiscount && !voucherDiscount.invalid"
             style="text-align:right;font-size:10px;color:var(--text-muted);margin-top:2px;text-decoration:line-through">
          Sebelum diskon: {{ formatRp(priceCalc.final_price) }}
        </div>
      </div>

      <!-- Play Credits -->
      <div v-if="availableCredits.length > 0" class="credits-section">
        <div style="font-size:11px;font-weight:700;margin-bottom:8px;color:var(--color-success)">
          🎮 Pakai Play Credits?
        </div>
        <div style="display:flex;flex-direction:column;gap:6px">

          <!-- Opsi: Cash -->
          <div
            :class="['payment-option', newBookingForm.payment_method === 'cash' ? 'payment-option--selected' : '']"
            @click="newBookingForm.payment_method = 'cash'; newBookingForm.play_credit_id = null"
          >
            <div class="payment-option__check">
              <el-icon v-if="newBookingForm.payment_method === 'cash'"><Check /></el-icon>
            </div>
            <span style="font-size:12px;font-weight:600">💵 Cash</span>
            <span style="font-size:11px;color:var(--text-secondary);margin-left:4px">— Bayar langsung</span>
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
            <div style="display:flex;flex-direction:column;gap:1px">
              <span style="font-size:12px;font-weight:700">🎮 {{ cr.package?.name }}</span>
              <span style="font-size:11px;color:var(--text-secondary)">
                {{ cr.remaining_hours }} Jam tersisa
                <span style="color:var(--text-muted)">&nbsp;·&nbsp; exp. {{ formatDate(cr.expires_at) }}</span>
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
          filterable clearable style="width:100%"
          :loading="voucherOptionsLoading"
          no-data-text="Tidak ada voucher tersedia"
        >
          <el-option
            v-for="v in availableVouchers"
            :key="v.code"
            :label="v.name"
            :value="v.code"
          >
            <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
              <div>
                <span style="font-family:monospace;font-size:11px;font-weight:800;color:var(--color-primary)">{{ v.code }}</span>
                <span style="margin-left:8px;font-size:12px">{{ v.name }}</span>
              </div>
              <span style="font-size:12px;font-weight:700;color:var(--color-success);flex-shrink:0">
                {{ v.discount_type === 'percentage' ? v.discount_value + '%' : formatRp(v.discount_value) }}
              </span>
            </div>
            <div v-if="v.end_date" style="font-size:10px;color:var(--text-muted);margin-top:1px">
              Berlaku s/d {{ formatDate(v.end_date) }}
            </div>
          </el-option>
        </el-select>
        <div v-if="!voucherOptionsLoading && availableVouchers.length === 0"
             style="font-size:11px;color:var(--text-muted);margin-top:3px">
          Tidak ada voucher booking yang tersedia untuk customer ini
        </div>
      </el-form-item>

      <!-- Catatan -->
      <el-form-item label="Catatan (Opsional)">
        <el-input v-model="newBookingForm.notes" type="textarea" :rows="2"
          placeholder="Catatan untuk booking ini..." />
      </el-form-item>
    </el-form>

    <el-button type="primary" style="width:100%;margin-top:8px"
      :loading="creatingBooking" :disabled="!priceCalc && !priceCalcLoading" @click="openConfirmModal">
      Lanjutkan →
    </el-button>

      <!-- ════════════════════════════════════════════════════════
           MODAL: Konfirmasi Booking
      ════════════════════════════════════════════════════════ -->
      <el-dialog v-model="showConfirmModal" title="KONFIRMASI BOOKING" width="420px" align-center>
        <div v-if="priceCalc">
          <!-- Customer summary -->
          <div style="display:flex;align-items:center;gap:12px;padding:12px;background:var(--bg-main);border-radius:8px;margin-bottom:16px">
            <el-avatar :size="40" style="background:linear-gradient(135deg,#0282DE,#0262b0);font-weight:700;flex-shrink:0">
              {{ newBookingForm.customer_name?.[0]?.toUpperCase() }}
            </el-avatar>
            <div>
              <div style="font-weight:700">{{ newBookingForm.customer_name }}</div>
              <div style="font-size:12px;color:var(--text-secondary)">
                {{ newBookingForm.customer_whatsapp || newBookingForm.customer_email || 'Walk-in' }}
              </div>
            </div>
          </div>

          <div class="confirm-row"><span>Room</span><strong>{{ newBookingForm.room_name }}</strong></div>
          <div class="confirm-row">
            <span>Tanggal</span>
            <span>{{ formatDateDisplay(newBookingForm.booking_date) }}</span>
          </div>
          <div class="confirm-row">
            <span>Waktu</span>
            <span>{{ newBookingForm.start_time }} – {{ newBookingForm.end_time }} ({{ newBookingForm.duration_hours }} Jam)</span>
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
              <span>🎟️ {{ selectedVoucherData?.name }}</span>
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
            <span>{{ newBookingForm.payment_method === 'play_credits' ? '🎮 Play Credits' : '💵 Cash' }}</span>
          </div>
          <div v-if="newBookingForm.voucher_code" class="confirm-row">
            <span>Voucher</span>
            <span style="font-family:monospace;font-weight:700;color:var(--color-primary)">{{ newBookingForm.voucher_code }}</span>
          </div>
        </div>

        <template #footer>
          <el-button @click="showConfirmModal = false">Kembali</el-button>
          <el-button type="primary" :loading="creatingBooking" @click="handleCreateBooking">
            <el-icon><Check /></el-icon> Konfirmasi Booking
          </el-button>
        </template>
      </el-dialog>

      <!-- ════════════════════════════════════════════════════════
           MODAL: Booking Berhasil
      ════════════════════════════════════════════════════════ -->
      <el-dialog v-model="showSuccessModal" :show-close="false" width="380px" align-center>
        <div style="text-align:center;padding:12px 0 20px">
          <el-icon size="60" style="color:var(--color-success)"><CircleCheckFilled /></el-icon>
          <h3 style="margin:12px 0 4px;font-size:18px">Booking Berhasil!</h3>
          <p style="color:var(--text-secondary);font-size:13px;margin-bottom:16px">
            Booking ruangan telah dikonfirmasi.
          </p>
          <div style="background:var(--bg-main);border:1px solid var(--border-color);border-radius:10px;padding:16px;display:inline-block;min-width:200px">
            <div style="font-size:10px;color:var(--text-secondary);margin-bottom:6px;letter-spacing:1px">BOOKING ID</div>
            <div style="font-size:24px;font-weight:800;color:var(--color-primary);letter-spacing:3px;font-family:monospace">
              {{ createdBookingCode }}
            </div>
          </div>
          <p v-if="newBookingForm.customer_whatsapp || newBookingForm.customer_email"
             style="font-size:12px;color:var(--text-secondary);margin-top:12px">
            Konfirmasi dikirim ke customer
            <span v-if="newBookingForm.customer_email"> via email</span>
            <span v-if="newBookingForm.customer_whatsapp"> & WhatsApp</span>.
          </p>
          <div style="display:flex;gap:10px;justify-content:center;margin-top:20px">
            <el-button @click="viewCreatedBooking">Lihat di Kalender</el-button>
            <el-button type="primary" @click="resetForNewBooking">+ Booking Lain</el-button>
          </div>
        </div>
      </el-dialog>
  </div>
</template>

<script setup>
// New regular booking: customer, time, price, voucher, play credits, the
// confirm modal and the success modal. `selection` is the clicked slot;
// a new selection refills the form, like a new slot click did before.
import { ref, reactive, computed, watch, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { createBooking, getAvailableCredits, calculatePrice } from '@/api/booking/bookingApi'
import { getCustomers } from '@/api/customer/customerApi'
import api from '@/api/index'
import { notifyError } from '@/utils/notify'
import { formatRp, formatDateDisplay } from '@/utils/format'

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
const priceCalc = ref(null)
const priceCalcLoading = ref(false)

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

// ── Voucher Discount Preview ──────────────────────────────────
const selectedVoucherData = computed(() =>
  availableVouchers.value.find(v => v.code === newBookingForm.voucher_code) || null
)

const voucherDiscount = computed(() => {
  const v = selectedVoucherData.value
  const base = priceCalc.value?.final_price
  if (!v || !base) return null

  // Cek minimum pembelian
  if (v.min_purchase && base < v.min_purchase) {
    return { amount: 0, invalid: true, reason: `Min. pembelian ${formatRp(v.min_purchase)}` }
  }

  let amount
  if (v.discount_type === 'percentage') {
    amount = Math.round(base * v.discount_value / 100)
    if (v.max_discount && amount > v.max_discount) amount = v.max_discount
  } else {
    amount = Math.min(v.discount_value, base)
  }

  return { amount, invalid: false, finalPrice: base - amount }
})

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

let priceCalcTimer = null
const recalculatePrice = async () => {
  const f = newBookingForm
  if (!f.store_id || !f.booking_date || !f.start_time || !f.end_time) return

  // debounce
  clearTimeout(priceCalcTimer)
  priceCalcTimer = setTimeout(async () => {
    const room = props.rooms.find(r => r.id === f.room_id)
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
      newBookingForm.duration_hours = eH - sH
    } catch {
      priceCalc.value = null
    } finally {
      priceCalcLoading.value = false
    }

    // Refresh play credits jika tanggal berubah dan customer adalah member
    if (f.customer_id) {
      const customer = customerOptions.value.find(c => c.id === f.customer_id)
      if (customer?.type === 'member') {
        getAvailableCredits(f.customer_id, f.store_id, f.booking_date)
          .then(({ data }) => { availableCredits.value = data.data || [] })
          .catch(() => {})
      }
    }
  }, 600)
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

onUnmounted(() => {
  clearTimeout(priceCalcTimer)
})
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
.payment-option--selected {
  border-color: var(--color-success) !important;
  background: rgba(16,185,129,0.08) !important;
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
  color: #fff;
}
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
