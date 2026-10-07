<template>
  <!-- Event Booking Form Panel -->
  <div class="right-panel">
    <div class="panel-header">
      <span style="font-size:14px;font-weight:700">EVENT BOOKING BARU</span>
      <el-button circle text @click="emit('close')"><el-icon><Close /></el-icon></el-button>
    </div>

    <div class="event-form-badge">
      <el-icon><Star /></el-icon>
      <span v-if="eventForm.booking_scope === 'full_venue'">Booking seluruh gedung — semua ruangan terblokir</span>
      <span v-else>Booking per tipe ruangan — pilih tipe yang diblokir</span>
    </div>

    <el-form :model="eventForm" label-position="top">
      <el-form-item label="Nama Event *">
        <el-input v-model="eventForm.event_name"
          placeholder="Contoh: Birthday Party, Tournament PS5"
          maxlength="150" show-word-limit />
      </el-form-item>

      <!-- BARU: Description -->
      <el-form-item label="Deskripsi (Opsional)">
        <el-input
          v-model="eventForm.description"
          type="textarea"
          :rows="3"
          placeholder="Contoh: Paket ini sudah termasuk FnB 1 paket per orang, dekorasi, dan akses semua ruangan lantai 4."
          maxlength="500"
          show-word-limit
        />
        <div style="font-size:11px;color:var(--text-muted);margin-top:4px">
          💡 Deskripsi ini akan ditampilkan kepada customer di halaman konfirmasi booking.
        </div>
      </el-form-item>

      <!-- Customer Search — sama dengan regular booking -->
      <el-form-item label="Customer (Opsional)">
        <el-select
          v-model="eventForm.customer_id"
          filterable remote
          :remote-method="searchCustomers"
          :loading="customerSearchLoading"
          placeholder="Cari nama / WhatsApp customer..."
          style="width:100%"
          clearable
          @change="onEventCustomerChange"
        >
          <el-option
            v-for="c in customerOptions"
            :key="c.id"
            :label="c.name"
            :value="c.id"
          >
            <div style="display:flex;justify-content:space-between;align-items:center;gap:6px">
              <span style="font-weight:600;font-size:13px">{{ c.name }} - {{ c.whatsapp }}</span>
              <el-tag :type="c.type === 'member' ? 'warning' : 'info'" size="small">
                {{ c.type === 'member' ? 'Member' : 'Regular' }}
              </el-tag>
            </div>
            <div v-if="c.whatsapp || c.phone" style="display:flex;align-items:center;gap:4px;margin-top:2px">
              <span style="font-size:10px;font-weight:600;color:#25D366;">WA</span>
              <span style="font-size:10px;color:var(--text-secondary)">{{ c.whatsapp || c.phone }}</span>
            </div>
          </el-option>
        </el-select>
        <div style="font-size:10px;color:var(--text-muted);margin-top:2px">
          Kosongkan untuk penyelenggara baru — isi manual di bawah
        </div>
      </el-form-item>

      <!-- Nama Customer — auto-fill jika dipilih dari search, bisa diedit manual -->
      <el-form-item label="Nama Penyelenggara *">
        <el-input v-model="eventForm.customer_name" placeholder="Nama penyelenggara" />
      </el-form-item>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <el-form-item label="WhatsApp">
          <el-input v-model="eventForm.customer_whatsapp" placeholder="08xx-xxxx" />
        </el-form-item>
        <el-form-item label="Email">
          <el-input v-model="eventForm.customer_email" placeholder="email@..." />
        </el-form-item>
      </div>

      <!-- Tanggal -->
      <el-form-item label="Tanggal *">
        <el-date-picker v-model="eventForm.booking_date" type="date"
          value-format="YYYY-MM-DD" format="dddd, DD MMM YYYY" style="width:100%"
          @change="previewEventPriceCalc" />
      </el-form-item>

      <!-- Tipe Durasi -->
      <el-form-item label="Tipe Durasi *">
        <el-radio-group v-model="eventForm.duration_type" @change="previewEventPriceCalc">
          <el-radio-button value="hourly">🕐 Per Jam</el-radio-button>
          <el-radio-button value="full_day">📅 Full 1 Hari</el-radio-button>
        </el-radio-group>
        <div style="font-size:11px;color:var(--text-secondary);margin-top:5px">
          <template v-if="eventForm.duration_type === 'full_day'">
            Seluruh jam operasional akan diblokir. Harga = harga event per hari.
          </template>
          <template v-else>
            Tentukan jam mulai dan selesai booking.
          </template>
        </div>
      </el-form-item>

      <!-- Jam (hanya jika hourly) -->
      <div v-if="eventForm.duration_type === 'hourly'"
           style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <el-form-item label="Jam Mulai *">
          <el-time-picker v-model="eventForm.start_time" format="HH:mm"
            value-format="HH:mm" style="width:100%" @change="previewEventPriceCalc" />
        </el-form-item>
        <el-form-item label="Jam Selesai *">
          <el-time-picker v-model="eventForm.end_time" format="HH:mm"
            value-format="HH:mm" style="width:100%" @change="previewEventPriceCalc" />
        </el-form-item>
      </div>

      <!-- Info full_day -->
      <div v-else class="info-box" style="margin-bottom:12px">
        <el-icon><InfoFilled /></el-icon>
        <span>Jam akan otomatis disesuaikan dengan jam operasional store pada tanggal tersebut.</span>
      </div>

      <!-- Scope Ruangan -->
      <el-form-item label="Scope Ruangan *">
        <el-radio-group v-model="eventForm.booking_scope">
          <el-radio-button value="full_venue">🏠 Full 1 Gedung</el-radio-button>
          <el-radio-button value="per_room_type">📋 Per Tipe Ruangan</el-radio-button>
        </el-radio-group>
      </el-form-item>

      <!-- Pilih tipe ruangan (per_room_type) -->
      <el-form-item v-if="eventForm.booking_scope === 'per_room_type'"
        label="Tipe Ruangan yang Diblokir *">
        <div v-if="loadingRoomTemplates" style="color:var(--text-muted);font-size:12px">
          <el-icon class="is-loading"><Loading /></el-icon> Memuat tipe ruangan...
        </div>
        <div v-else-if="!storeRoomTemplates.length" style="color:var(--text-muted);font-size:12px">
          Pilih cabang terlebih dahulu
        </div>
        <el-checkbox-group v-else v-model="eventSelectedRoomTemplateIds"
          style="display:flex;flex-wrap:wrap;gap:6px">
          <el-checkbox v-for="rt in storeRoomTemplates" :key="rt.id" :value="rt.id"
            style="margin:0">
            {{ rt.name }}
          </el-checkbox>
        </el-checkbox-group>
        <!-- <div style="font-size:11px;color:var(--text-muted);margin-top:5px">
          Semua unit dari tipe yang dipilih akan diblokir.
        </div> -->
      </el-form-item>

      <!-- Preview harga -->
      <div v-if="eventPricePreview" class="price-preview-box">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
          <div style="font-size:11px;color:var(--text-secondary)">KALKULASI HARGA</div>
          <span
            v-if="eventPricePreview.day_type"
            :class="['day-type-badge', eventPricePreview.day_type === 'weekday' ? 'weekday' : 'weekend']"
          >
            {{ eventPricePreview.day_type === 'weekday' ? 'Weekday' : 'Weekend / Hari Libur' }}
          </span>
        </div>
        <div v-if="eventPricePreview.active_price" style="font-size:11px;color:var(--text-secondary)">
          Harga aktif: <strong>{{ formatRp(eventPricePreview.active_price) }}</strong>/hari
        </div>
        <div v-if="eventPricePreview.duration_hours" style="font-size:11px;color:var(--text-secondary)">
          Durasi: <strong>{{ eventPricePreview.duration_hours }} jam</strong>
          <template v-if="eventPricePreview.formula">
            &nbsp;·&nbsp; {{ eventPricePreview.formula }}
          </template>
        </div>
        <div style="font-size:18px;font-weight:700;color:var(--color-primary);margin-top:6px">
          {{ formatRp(eventPricePreview.total_price) }}
        </div>
      </div>

      <el-form-item label="Catatan">
        <el-input v-model="eventForm.notes" type="textarea" :rows="2" />
      </el-form-item>
    </el-form>

    <el-button type="primary" style="width:100%;margin-top:8px"
      :loading="creatingEvent"
      :disabled="!eventForm.event_name || !eventForm.customer_name || !eventForm.booking_date ||
        (eventForm.duration_type === 'hourly' && (!eventForm.start_time || !eventForm.end_time)) ||
        (eventForm.booking_scope === 'per_room_type' && !eventSelectedRoomTemplateIds.length)"
      @click="handleCreateEventBooking">
      Konfirmasi Event Booking
    </el-button>
  </div>
</template>

<script setup>
// New event booking: form, room types, price preview and create.
// The page gives it a new :key each time it opens, which resets the form.
import { ref, reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { createEventBooking, previewEventPrice } from '@/api/booking/eventBookingApi'
import { getCustomers } from '@/api/customer/customerApi'
import { publicApi } from '@/api/index'
import { notifyError } from '@/utils/notify'
import { formatRp } from '@/utils/format'

const props = defineProps({
  store: { type: String, default: '' },
  date: { type: String, default: '' },
  dashboardData: { type: Object, default: null },
})
const emit = defineEmits(['close', 'created'])

const creatingEvent = ref(false)
const eventPricePreview     = ref(null)

const eventForm = reactive({
  store_id:          '',
  event_name:        '',
  description:       '',
  customer_id:       '',
  customer_name:     '',
  customer_whatsapp: '',
  customer_email:    '',
  booking_date:      '',
  start_time:        '',
  end_time:          '',
  notes:             '',
  duration_type:     'hourly',     // 'hourly' | 'full_day'
  booking_scope:     'full_venue', // 'full_venue' | 'per_room_type'
})

// Room template pilihan untuk per_room_type — ref terpisah agar el-checkbox-group reaktif
const eventSelectedRoomTemplateIds = ref([])
const storeRoomTemplates           = ref([])
const loadingRoomTemplates         = ref(false)

// ── Customer Search ───────────────────────────────────────────
const customerOptions = ref([])
const customerSearchLoading = ref(false)
const searchCustomers = async (q) => {
  if (!q || q.length < 2) return
  customerSearchLoading.value = true
  try {
    const { data } = await getCustomers({ search: q, per_page: 20 })
    customerOptions.value = data.data || []
  } catch {}
  finally { customerSearchLoading.value = false }
}

// Fetch room templates milik store ini untuk pilihan per_room_type
const onEventStoreChange = async (storeId) => {
  storeRoomTemplates.value = []
  if (!storeId) return
  loadingRoomTemplates.value = true
  try {
    const { data } = await publicApi.get(`/public/room-templates?store_id=${storeId}`)
    storeRoomTemplates.value = data.data || []
  } catch { /* biarkan kosong */ } finally { loadingRoomTemplates.value = false }
}
watch(() => eventForm.store_id, onEventStoreChange)

// Reset on open (moved from the page's openEventBookingForm)
Object.assign(eventForm, {
  store_id:          props.store,
  event_name:        '',
  description:       '',
  customer_id:       '',
  customer_name:     '',
  customer_whatsapp: '',
  customer_email:    '',
  booking_date:      props.date,
  start_time:        '',
  end_time:          '',
  notes:             '',
  duration_type:     'hourly',
  booking_scope:     'full_venue',
})
eventSelectedRoomTemplateIds.value = []
eventPricePreview.value  = null
customerOptions.value    = []

// Auto-fill customer data saat dipilih dari dropdown search
const onEventCustomerChange = (customerId) => {
  if (!customerId) {
    // User clear pilihan → reset ke manual entry
    eventForm.customer_name     = ''
    eventForm.customer_whatsapp = ''
    eventForm.customer_email    = ''
    return
  }
  const customer = customerOptions.value.find(c => c.id === customerId)
  if (customer) {
    eventForm.customer_name     = customer.name
    eventForm.customer_whatsapp = customer.whatsapp || ''
    eventForm.customer_email    = customer.email    || ''
  }
}

const previewEventPriceCalc = async () => {
  if (!eventForm.store_id) return
  if (eventForm.duration_type === 'hourly' && (!eventForm.start_time || !eventForm.end_time)) return
  try {
    const params = {
      store_id:      eventForm.store_id,
      duration_type: eventForm.duration_type,
    }
    if (eventForm.booking_date) params.booking_date = eventForm.booking_date
    if (eventForm.duration_type === 'hourly') {
      params.start_time = eventForm.start_time
      params.end_time   = eventForm.end_time
    }
    if (eventForm.duration_type === 'full_day') {
      params.start_time = props.dashboardData.open_time
      params.end_time   = props.dashboardData.close_time
    }
    const { data } = await previewEventPrice(params)
    eventPricePreview.value = data.data
  } catch { eventPricePreview.value = null }
}

const handleCreateEventBooking = async () => {
  creatingEvent.value = true
  try {
    const payload = {
      store_id:          eventForm.store_id,
      event_name:        eventForm.event_name,
      description:       eventForm.description,
      customer_id:       eventForm.customer_id || null,
      customer_name:     eventForm.customer_name,
      customer_whatsapp: eventForm.customer_whatsapp,
      customer_email:    eventForm.customer_email,
      booking_date:      eventForm.booking_date,
      start_time:        eventForm.duration_type === 'hourly' ? eventForm.start_time : '',
      end_time:          eventForm.duration_type === 'hourly' ? eventForm.end_time   : '',
      notes:             eventForm.notes,
      duration_type:     eventForm.duration_type,
      booking_scope:     eventForm.booking_scope,
      selected_room_template_ids: eventForm.booking_scope === 'per_room_type'
        ? eventSelectedRoomTemplateIds.value
        : [],
    }
    await createEventBooking(payload)
    ElMessage.success('Event booking berhasil dibuat!')
    emit('created')
  } catch (e) {
    notifyError(e, 'Gagal membuat event booking')
  } finally { creatingEvent.value = false }
}
</script>

<style scoped src="./panel.css"></style>

<style scoped>
.event-form-badge {
  background: rgba(83,74,183,0.1);
  border: 1px solid rgba(83,74,183,0.2);
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 12px;
  color: var(--color-primary);
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 14px;
}
.day-type-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.4px;
  text-transform: uppercase;
}
.day-type-badge.weekday {
  background: rgba(59,130,246,0.12);
  color: #2563EB;
  border: 1px solid rgba(59,130,246,0.3);
}
.day-type-badge.weekend {
  background: rgba(217,119,6,0.12);
  color: #D97706;
  border: 1px solid rgba(217,119,6,0.3);
}
.price-preview-box {
  background: var(--bg-main);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 12px;
  margin: 8px 0 14px;
}
</style>
