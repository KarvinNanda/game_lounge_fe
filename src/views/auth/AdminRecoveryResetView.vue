<template>
  <div class="recovery-page">
    <div class="recovery-card">

      <!-- Logo -->
      <div class="recovery-logo">
        <img src="@/assets/logo.png" alt="Quantum" style="height:40px" />
      </div>

      <!-- Loading state: sedang validasi token -->
      <div v-if="validating" style="text-align:center;padding:20px 0">
        <el-icon size="32" class="is-loading"><Loading /></el-icon>
        <p style="color:var(--text-secondary);margin-top:12px">Memvalidasi link...</p>
      </div>

      <!-- Token tidak valid / expired -->
      <div v-else-if="tokenError" style="text-align:center">
        <el-icon size="56" style="color:var(--el-color-danger)">
          <CircleCloseFilled />
        </el-icon>
        <h2 class="recovery-title" style="margin-top:16px">Link Tidak Valid</h2>
        <p class="recovery-desc">
          Link reset password sudah kadaluwarsa atau sudah pernah digunakan.
          Silakan request link baru.
        </p>
        <el-button type="primary" @click="$router.push('/admin-recovery')">
          Request Link Baru
        </el-button>
      </div>

      <!-- Form reset password (token valid) -->
      <template v-else-if="!resetSuccess">
        <h2 class="recovery-title">Buat Password Baru</h2>
        <p class="recovery-desc">
          Password baru minimal 8 karakter.
        </p>

        <el-form :model="form" ref="formRef" label-position="top">

          <el-form-item
            label="Password Baru"
            prop="new_password"
            :rules="[
              { required: true, message: 'Password wajib diisi' },
              { min: 8, message: 'Minimal 8 karakter' }
            ]"
          >
            <el-input
              v-model="form.new_password"
              type="password"
              show-password
              placeholder="Masukkan password baru"
              size="large"
            />
          </el-form-item>

          <el-form-item
            label="Konfirmasi Password"
            prop="confirm_password"
            :rules="[
              { required: true, message: 'Konfirmasi password wajib diisi' },
              {
                validator: (rule, value, callback) => {
                  if (value !== form.new_password) callback('Password tidak cocok')
                  else callback()
                },
                trigger: 'blur'
              }
            ]"
          >
            <el-input
              v-model="form.confirm_password"
              type="password"
              show-password
              placeholder="Ulangi password baru"
              size="large"
            />
          </el-form-item>

          <el-button
            type="primary"
            size="large"
            style="width:100%"
            :loading="loading"
            @click="handleReset"
          >
            Simpan Password Baru
          </el-button>

        </el-form>
      </template>

      <!-- Reset berhasil -->
      <template v-else>
        <div style="text-align:center">
          <el-icon size="56" style="color:var(--el-color-success)">
            <CircleCheckFilled />
          </el-icon>
          <h2 class="recovery-title" style="margin-top:16px">Password Berhasil Diperbarui</h2>
          <p class="recovery-desc">
            Password baru kamu sudah aktif. Silakan login dengan password baru.
          </p>
          <el-button type="primary" size="large" style="width:100%;margin-top:8px"
            @click="$router.push('/login')">
            Login Sekarang
          </el-button>
        </div>
      </template>

    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { validateResetToken, resetPassword } from '@/api/auth/authApi'

const route = useRoute()
const token = route.params.token

const validating   = ref(true)
const tokenError   = ref(false)
const resetSuccess = ref(false)
const loading      = ref(false)
const formRef      = ref()

const form = reactive({ new_password: '', confirm_password: '' })

// Validasi token saat halaman dibuka
onMounted(async () => {
  try {
    await validateResetToken(token)
    validating.value = false
  } catch {
    validating.value = false
    tokenError.value = true
  }
})

const handleReset = async () => {
  await formRef.value?.validate(async (valid) => {
    if (!valid) return
    loading.value = true
    try {
      await resetPassword(token, {
        new_password:     form.new_password,
        confirm_password: form.confirm_password,
      })
      resetSuccess.value = true
    } catch (e) {
      ElMessage.error(e?.response?.data?.message || 'Gagal reset password')
    } finally {
      loading.value = false
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

.recovery-logo  { text-align: center; margin-bottom: 28px; }
.recovery-title { font-size: 20px; font-weight: 700; text-align: center; margin: 0 0 10px; }
.recovery-desc  { font-size: 13px; color: var(--text-secondary); text-align: center; line-height: 1.6; margin: 0 0 24px; }
</style>
