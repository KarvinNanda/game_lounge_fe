<template>
  <!-- Event Detail Panel -->
  <div class="right-panel">
    <div class="panel-header">
      <span class="panel-title">DETAIL EVENT</span>
      <el-button circle text @click="emit('close')"><el-icon><Close /></el-icon></el-button>
    </div>

    <el-tag type="warning" class="u-mb-3">
      <el-icon><Star /></el-icon> {{ event.status?.toUpperCase() }}
    </el-tag>

    <div class="info-section-title">INFORMASI EVENT</div>
    <div class="info-grid">
      <div class="info-row"><span>Nama Event</span><strong>{{ event.event_name }}</strong></div>
      <div v-if="event?.description" class="detail-row">
        <span class="detail-label u-text-secondary u-text-xs">
          Deskripsi
        </span>
        <p class="event-description">
          {{ event.description }}
        </p>
      </div>
      <div class="info-row"><span>Customer</span><span>{{ event.customer_name }}</span></div>
      <div class="info-row"><span>Tanggal</span><span>{{ formatDateDisplay(event.booking_date) }}</span></div>
      <div class="info-row">
        <span>Waktu</span>
        <span>{{ event.start_time?.slice(0,5) }} – {{ event.end_time?.slice(0,5) }} ({{ event.duration_hours }} Jam)</span>
      </div>
      <div class="info-row">
        <span>Total Harga</span>
        <strong class="u-text-action">{{ formatRp(event.total_price) }}</strong>
      </div>
    </div>

    <div v-if="event.status !== 'cancelled' && event.status !== 'completed'"
         class="u-mt-4">
      <div class="info-section-title">AKSI</div>
      <el-button type="danger" plain class="u-w-full" @click="openCancelEventForm">
        <el-icon><CircleClose /></el-icon> Batalkan Event
      </el-button>
    </div>

    <div v-if="event.cancel_reason" class="cancel-info">
      <div class="u-fw-semibold u-mb-1">Alasan Pembatalan</div>
      {{ event.cancel_reason }}
    </div>

      <!-- ════════════════════════════════════════════════════════
           DIALOG: Cancel Event Booking
      ════════════════════════════════════════════════════════ -->
      <el-dialog v-model="showCancelEventDialog" title="Batalkan Event Booking" width="400px" align-center>
        <p class="u-text-sm u-text-secondary u-mb-3">
          Masukkan alasan pembatalan event
          <strong class="value-strong">{{ event?.event_name }}</strong>.
        </p>
        <el-form :model="cancelEventForm" ref="cancelEventFormRef">
          <el-form-item prop="reason"
            :rules="[{ required: true, min: 5, message: 'Alasan minimal 5 karakter', trigger: 'blur' }]">
            <el-input v-model="cancelEventForm.reason" type="textarea" :rows="3"
              placeholder="Alasan pembatalan..." />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="showCancelEventDialog = false">Kembali</el-button>
          <el-button type="danger" :loading="cancellingEvent" @click="handleCancelEvent">
            Konfirmasi Batalkan
          </el-button>
        </template>
      </el-dialog>
  </div>
</template>

<script setup>
// Event booking detail and the cancel-event dialog. The page reloads and
// closes the panel on `cancelled`.
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { cancelEventBooking } from '@/api/booking/eventBookingApi'
import { notifyError } from '@/utils/notify'
import { formatRp, formatDateDisplay } from '@/utils/format'

const props = defineProps({
  event: { type: Object, required: true },
})
const emit = defineEmits(['close', 'cancelled'])

const showCancelEventDialog = ref(false)
const cancellingEvent = ref(false)
const cancelEventForm = reactive({ reason: '' })
const cancelEventFormRef = ref()

const openCancelEventForm = () => {
  cancelEventForm.reason = ''
  showCancelEventDialog.value = true
}

const handleCancelEvent = async () => {
  await cancelEventFormRef.value.validate(async (valid) => {
    if (!valid) return
    cancellingEvent.value = true
    try {
      await cancelEventBooking(props.event.id, { reason: cancelEventForm.reason })
      ElMessage.success('Event booking berhasil dibatalkan')
      showCancelEventDialog.value = false
      emit('cancelled')
    } catch (e) {
      notifyError(e, 'Gagal membatalkan')
    } finally { cancellingEvent.value = false }
  })
}
</script>

<style scoped src="./panel.css"></style>

<style scoped>
.detail-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 7px 0;
  border-bottom: 1px solid var(--border-color);
  font-size: 12.5px;
}
.detail-label {
  font-weight: 600;
  flex-shrink: 0;
}
.cancel-info {
  margin-top: 12px;
  background: rgba(239,68,68,0.08);
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 12px;
  color: var(--color-danger);
}

/* C3: former inline styles */
.panel-title { font-size: var(--font-size-base); font-weight: 700; }
.event-description { margin: 0; font-size: var(--font-size-sm); line-height: 1.5; white-space: pre-wrap; word-break: break-word; }
.value-strong { color: var(--text-primary); }
</style>
