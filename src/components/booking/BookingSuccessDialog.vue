<template>
  <el-dialog :model-value="modelValue" :show-close="false" width="380px" align-center @update:model-value="emit('update:modelValue', $event)">
    <div class="success-body">
      <el-icon size="60" class="u-text-success"><CircleCheckFilled /></el-icon>
      <h3 class="success-title">Booking Berhasil!</h3>
      <p class="u-text-secondary u-text-sm u-mb-4">
        Booking ruangan telah dikonfirmasi.
      </p>
      <div class="code-box">
        <div class="code-label">BOOKING ID</div>
        <div class="code-value">
          {{ code }}
        </div>
      </div>
      <p v-if="whatsapp || email"
         class="u-text-xs u-text-secondary u-mt-3">
        Konfirmasi dikirim ke customer
        <span v-if="email"> via email</span>
        <span v-if="whatsapp"> & WhatsApp</span>.
      </p>
      <div class="success-actions">
        <el-button @click="emit('view')">Lihat di Kalender</el-button>
        <el-button type="primary" @click="emit('again')">+ Booking Lain</el-button>
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
// Last step of a new booking (moved unchanged from NewBookingPanel).
defineProps({
  modelValue: { type: Boolean, default: false },
  code: { type: String, default: '' },
  whatsapp: { type: String, default: '' },
  email: { type: String, default: '' },
})
const emit = defineEmits(['update:modelValue', 'view', 'again'])
</script>

<style scoped>
/* C3: former inline styles */
.success-body { text-align: center; padding: var(--space-3) 0 var(--space-5); }
.success-title { margin: var(--space-3) 0 var(--space-1); font-size: 18px; }
.code-box { background: var(--surface-page); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: var(--space-4); display: inline-block; min-width: 200px; }
.code-label { font-size: var(--font-size-xs); color: var(--text-secondary); margin-bottom: var(--space-1); letter-spacing: 1px; }
.code-value { font-size: var(--font-size-xl); font-weight: 800; color: var(--action); letter-spacing: 3px; font-family: monospace; }
.success-actions { display: flex; gap: var(--space-2); justify-content: center; margin-top: var(--space-5); }
</style>
