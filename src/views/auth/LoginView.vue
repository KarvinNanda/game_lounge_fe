<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-logo">
        <img src="@/assets/logo.png" alt="Quantum Gaming" class="logo-img" />
        <div>
          <div class="logo-title">QUANTUM GAMING</div>
        </div>
      </div>
      <h2 class="login-heading">Selamat Datang</h2>
      <p class="login-desc">Masuk ke dashboard admin Quantum</p>

      <el-form :model="form" :rules="rules" ref="formRef" @submit.prevent="handleLogin">
        <el-form-item prop="username">
          <el-input v-model="form.username" placeholder="Username" size="large" prefix-icon="User" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="form.password" type="password" placeholder="Password" size="large" prefix-icon="Lock" show-password />
        </el-form-item>
        <el-button type="primary" size="large" :loading="loading" @click="handleLogin" style="width:100%;margin-top:8px">
          Masuk
        </el-button>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/authStore'

const router = useRouter()
const authStore = useAuthStore()
const formRef = ref()
const loading = ref(false)

const form = reactive({ username: '', password: '' })
const rules = {
  username: [{ required: true, message: 'Username wajib diisi', trigger: 'blur' }],
  password: [{ required: true, message: 'Password wajib diisi', trigger: 'blur' }],
}

const handleLogin = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    loading.value = true
    try {
      await authStore.doLogin(form.username, form.password)
      ElMessage.success('Login berhasil!')
      router.push('/dashboard')
    } catch (err) {
      ElMessage.error(err?.response?.data?.message || 'Login gagal')
    } finally {
      loading.value = false
    }
  })
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-main);
}
.login-card {
  width: 400px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 40px;
}
.login-logo {
  display: flex; align-items: center; gap: 12px; margin-bottom: 32px;
}
.logo-img {
  width: 90px; height: 90px; object-fit: contain; border-radius: 10px;
}
.logo-title { font-size: 15px; font-weight: 800; letter-spacing: 1px; color: var(--text-primary); }
.logo-sub { font-size: 10px; color: var(--text-secondary); letter-spacing: 0.5px; }
.login-heading { font-size: 22px; font-weight: 700; color: var(--text-primary); margin-bottom: 6px; }
.login-desc { font-size: 13px; color: var(--text-secondary); margin-bottom: 28px; }
</style>
