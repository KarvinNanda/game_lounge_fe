<template>
  <el-dialog :model-value="modelValue" :show-close="false" width="380px" align-center @update:model-value="emit('update:modelValue', $event)">
    <div style="text-align:center;padding:12px 0 20px">
      <el-icon size="60" style="color:var(--color-success)"><CircleCheckFilled /></el-icon>
      <h3 style="margin:12px 0 4px;font-size:18px">Booking Berhasil!</h3>
      <p style="color:var(--text-secondary);font-size:13px;margin-bottom:16px">
        Booking ruangan telah dikonfirmasi.
      </p>
      <div style="background:var(--bg-main);border:1px solid var(--border-color);border-radius:10px;padding:16px;display:inline-block;min-width:200px">
        <div style="font-size:10px;color:var(--text-secondary);margin-bottom:6px;letter-spacing:1px">BOOKING ID</div>
        <div style="font-size:24px;font-weight:800;color:var(--color-primary);letter-spacing:3px;font-family:monospace">
          {{ code }}
        </div>
      </div>
      <p v-if="whatsapp || email"
         style="font-size:12px;color:var(--text-secondary);margin-top:12px">
        Konfirmasi dikirim ke customer
        <span v-if="email"> via email</span>
        <span v-if="whatsapp"> & WhatsApp</span>.
      </p>
      <div style="display:flex;gap:10px;justify-content:center;margin-top:20px">
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
