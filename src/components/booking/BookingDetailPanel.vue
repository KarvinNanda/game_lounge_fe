<template>
  <!-- Detail Booking Panel -->
  <div class="right-panel">
    <div class="panel-header">
      <span style="font-size:13px;font-weight:700;letter-spacing:0.5px">DETAIL BOOKING</span>
      <el-button circle text @click="emit('close')"><el-icon><Close /></el-icon></el-button>
    </div>

    <!-- Status badge -->
    <el-tag :type="getStatusTagType(booking.status)" style="margin-bottom:14px">
      {{ booking.status?.toUpperCase() }}
    </el-tag>

    <!-- Customer info -->
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;padding:12px;background:var(--bg-main);border-radius:8px">
      <el-avatar :size="42" style="background:linear-gradient(135deg,#0282DE,#0262b0);font-weight:700">
        {{ booking.customer_name?.[0]?.toUpperCase() }}
      </el-avatar>
      <div>
        <div style="font-weight:700;font-size:14px">{{ booking.customer_name }}</div>
        <el-tag v-if="booking.customer?.type" size="small"
          :type="booking.customer?.type === 'member' ? 'warning' : 'info'"
          style="margin-top:2px">
          {{ booking.customer?.type === 'member' ? 'Member' : 'Regular' }}
        </el-tag>
        <div v-if="booking.customer_whatsapp" style="font-size:11px;color:var(--text-secondary);margin-top:2px">
          📱 {{ booking.customer_whatsapp }}
        </div>
      </div>
    </div>

    <!-- Booking info grid -->
    <div class="info-section-title">INFORMASI BOOKING</div>
    <div class="info-grid">
      <div class="info-row">
        <span>Booking ID</span>
        <strong style="font-family:monospace;color:var(--color-primary)">{{ booking.booking_code }}</strong>
      </div>
      <div class="info-row">
        <span>Room</span>
        <span>{{ booking.room?.name }}</span>
      </div>
      <div class="info-row">
        <span>Tanggal</span>
        <span>{{ formatDateDisplay(booking.booking_date) }}</span>
      </div>
      <div class="info-row">
        <span>Waktu</span>
        <span>{{ booking.start_time?.slice(0,5) }} – {{ booking.end_time?.slice(0,5) }} ({{ booking.duration_hours }} Jam)</span>
      </div>
      <div class="info-row">
        <span>Total Harga</span>
        <strong style="color:var(--color-primary)">{{ formatRp(booking.total_price) }}</strong>
      </div>
      <div class="info-row">
        <span>Payment</span>
        <span>{{ booking.payment_method === 'play_credits' ? '🎮 Play Credits' : '💵 Cash' }}</span>
      </div>
    </div>

    <!-- Cancel reason (if cancelled) -->
    <div v-if="booking.status === 'cancelled'"
         style="margin-top:12px;background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:8px;padding:10px;font-size:12px;color:var(--color-danger)">
      <div style="font-weight:700;margin-bottom:4px">Alasan Pembatalan</div>
      {{ booking.cancel_reason || '-' }}
    </div>

    <!-- Ending soon warning -->
    <div v-if="booking.is_ending_soon" class="ending-soon-alert">
      <el-icon><WarningFilled /></el-icon>
      Sesi akan berakhir dalam kurang dari 30 menit!
    </div>

    <!-- Aksi Cepat -->
    <div v-if="booking.status !== 'cancelled' && booking.status !== 'completed' && (can('bookings.edit') || can('bookings.cancel'))"
         style="margin-top:16px">
      <div class="info-section-title">AKSI CEPAT</div>
      <el-button v-if="can('bookings.edit')" style="width:100%;margin-bottom:8px;justify-content:flex-start" plain
        @click="openCompleteConfirm">
        <el-icon><CircleCheck /></el-icon> Mark as Completed
      </el-button>
      <el-button v-if="can('bookings.cancel') && !hasStarted(booking)" type="danger" plain style="width:100%;justify-content:flex-start"
        @click="openCancelForm">
        <el-icon><CircleClose /></el-icon> Cancel Booking
      </el-button>
    </div>

    <!-- Catatan -->
    <div style="margin-top:16px" v-if="booking.notes">
      <div class="info-section-title">CATATAN</div>
      <p style="font-size:12px;color:var(--text-secondary);background:var(--bg-main);padding:10px;border-radius:6px">
        {{ booking.notes }}
      </p>
    </div>

    <AuditTrail
      :created-by="booking.created_by"
      :updated-by="booking.updated_by"
      :created-at="booking.created_at"
      :updated-at="booking.updated_at"
    />

      <!-- ════════════════════════════════════════════════════════
           DIALOG: Cancel Booking
      ════════════════════════════════════════════════════════ -->
      <el-dialog v-model="showCancelDialog" title="Batalkan Booking" width="400px" align-center>
        <p style="font-size:13px;color:var(--text-secondary);margin-bottom:14px">
          Masukkan alasan pembatalan booking
          <strong style="color:var(--text-primary)">{{ booking?.booking_code }}</strong>.
        </p>
        <el-form :model="cancelForm" ref="cancelFormRef">
          <el-form-item prop="reason" :rules="[{ required: true, min: 5, message: 'Alasan minimal 5 karakter', trigger: 'blur' }]">
            <el-input v-model="cancelForm.reason" type="textarea" :rows="3"
              placeholder="Contoh: Customer tidak jadi hadir, request pembatalan dari customer..." />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="showCancelDialog = false">Kembali</el-button>
          <el-button type="danger" :loading="cancellingBooking" @click="handleCancelBooking">
            Konfirmasi Batalkan
          </el-button>
        </template>
      </el-dialog>
  </div>
</template>

<script setup>
// Booking detail: info, notes, audit trail, complete / cancel actions and
// the cancel dialog. The page reloads and closes the panel on the events.
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import AuditTrail from '@/components/AuditTrail.vue'
import { cancelBooking, completeBooking } from '@/api/booking/bookingApi'
import { usePermission } from '@/composables/usePermission'
import { hasStarted } from '@/utils/bookingTime'
import { notifyError } from '@/utils/notify'
import { formatRp, formatDateDisplay } from '@/utils/format'

const props = defineProps({
  booking: { type: Object, required: true },
})
const emit = defineEmits(['close', 'cancelled', 'completed'])

const { can } = usePermission()

const cancellingBooking = ref(false)
const showCancelDialog = ref(false)
const cancelFormRef = ref()
const cancelForm = reactive({ reason: '' })

const getStatusTagType = (s) => ({
  upcoming: '', ongoing: 'success', completed: 'info', cancelled: 'danger'
}[s] || 'info')

// ── Booking Detail Actions ────────────────────────────────────
const openCancelForm = () => {
  cancelForm.reason = ''
  showCancelDialog.value = true
}

const handleCancelBooking = async () => {
  await cancelFormRef.value.validate(async (valid) => {
    if (!valid) return
    cancellingBooking.value = true
    try {
      await cancelBooking(props.booking.id, { reason: cancelForm.reason })
      ElMessage.success('Booking berhasil dibatalkan')
      showCancelDialog.value = false
      emit('cancelled')
    } catch (e) {
      notifyError(e, 'Gagal membatalkan booking')
    } finally { cancellingBooking.value = false }
  })
}

const openCompleteConfirm = async () => {
  try {
    await ElMessageBox.confirm(
      'Tandai booking ini sebagai selesai?',
      'Konfirmasi',
      { type: 'success', confirmButtonText: 'Ya, Selesaikan', cancelButtonText: 'Batal' }
    )
    await completeBooking(props.booking.id)
    ElMessage.success('Booking berhasil diselesaikan')
    emit('completed')
  } catch {}
}
</script>

<style scoped src="./panel.css"></style>

<style scoped>
.ending-soon-alert {
  background: rgba(245,158,11,0.1);
  border: 1px solid rgba(245,158,11,0.35);
  border-radius: 8px; padding: 10px 13px;
  font-size: 12px; font-weight: 700; color: var(--warning);
  display: flex; align-items: center; gap: 7px; margin-top: 10px;
}
</style>
