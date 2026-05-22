<template>
  <div class="recovery-page">
    <div class="recovery-card">

      <!-- Form request (default) -->
      <template v-if="!submitted">
        <h2 class="recovery-title">Reset Password Super Admin</h2>
        <p class="recovery-desc">
          Masukkan email akun Super Admin kamu. Link reset password akan dikirim jika email terdaftar.
        </p>

        <el-form :model="form" ref="formRef" @submit.prevent="handleSubmit">
          <el-form-item
            prop="email"
            :rules="[
              { required: true, message: 'Email wajib diisi', trigger: 'blur' },
              { type: 'email', message: 'Format email tidak valid', trigger: 'blur' }
            ]"
          >
            <el-input
              v-model="form.email"
              type="email"
              placeholder="Masukkan email kamu"
              size="large"
              prefix-icon="Message"
              :disabled="loading"
              @keyup.enter="handleSubmit"
            />
          </el-form-item>

          <el-button
            type="primary"
            size="large"
            style="width:100%"
            :loading="loading"
            @click="handleSubmit"
          >
            Kirim Link Reset Password
          </el-button>
        </el-form>

        <div style="text-align:center;margin-top:16px">
          <el-button text @click="$router.push('/login')">
            ← Kembali ke Login
          </el-button>
        </div>
      </template>

      <!-- State setelah submit (selalu tampil sukses, tidak bocorkan info) -->
      <template v-else>
        <div style="text-align:center">
          <el-icon size="56" style="color:var(--el-color-success)">
            <CircleCheckFilled />
          </el-icon>
          <h2 class="recovery-title" style="margin-top:16px">Cek Email Kamu</h2>
          <p class="recovery-desc">
            Jika email terdaftar sebagai akun admin, link reset password akan dikirim
            dalam beberapa menit. Link berlaku selama <strong>15 menit</strong>.
          </p>
          <p style="font-size:12px;color:var(--text-muted);margin-top:8px">
            Tidak menerima email? Cek folder Spam atau coba lagi.
          </p>
          <el-button
            style="margin-top:16px"
            @click="submitted = false; form.email = ''"
          >
            Coba Lagi
          </el-button>
          <el-button text @click="$router.push('/login')">
            Kembali ke Login
          </el-button>
        </div>
      </template>

    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { requestPasswordReset } from '@/api/auth/authApi'

const loading   = ref(false)
const submitted = ref(false)
const formRef   = ref()
const form      = reactive({ email: '' })

const handleSubmit = async () => {
  await formRef.value?.validate(async (valid) => {
    if (!valid) return
    loading.value = true
    try {
      // Selalu tampilkan state sukses — tidak peduli response backend
      // (backend juga selalu return sukses untuk security)
      await requestPasswordReset(form.email)
    } catch {
      // Tetap tampilkan sukses meski error — jangan bocorkan info
    } finally {
      loading.value = false
      submitted.value = true  // selalu pindah ke state sukses
    }
  })
}
</script>

<style scoped>
.recovery-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-main);
  padding: 20px;
}

.recovery-card {
  width: 100%;
  max-width: 420px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 40px 36px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.08);
}

.recovery-logo {
  text-align: center;
  margin-bottom: 28px;
}

.recovery-title {
  font-size: 20px;
  font-weight: 700;
  text-align: center;
  margin: 0 0 10px;
}

.recovery-desc {
  font-size: 13px;
  color: var(--text-secondary);
  text-align: center;
  line-height: 1.6;
  margin: 0 0 24px;
}
</style>
