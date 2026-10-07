<template>
  <main class="login-page">
    <section class="login-card" aria-labelledby="login-heading">
      <div class="login-brand">
        <img src="@/assets/logo.png" alt="" class="login-logo" />
        <span class="login-brand-name">Quantum Gaming</span>
      </div>
      <h1 id="login-heading" class="login-heading">Masuk ke dashboard admin</h1>

      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @submit.prevent="handleLogin">
        <el-form-item label="Username" prop="username">
          <el-input v-model="form.username" size="large" autocomplete="username" prefix-icon="User" />
        </el-form-item>
        <el-form-item label="Password" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            size="large"
            autocomplete="current-password"
            prefix-icon="Lock"
            show-password
          />
        </el-form-item>
        <el-button type="primary" size="large" native-type="submit" :loading="loading" class="login-submit">
          Masuk
        </el-button>
      </el-form>
    </section>
  </main>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/authStore'
import { loginErrorMessage } from '@/utils/authErrors'

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
  // One login at a time. Lock before validating so two submits in the same
  // tick cannot both pass, and stay locked after success until the page
  // changes (the dashboard chunk can take a while to load).
  if (loading.value || !formRef.value) return
  loading.value = true

  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) {
    loading.value = false
    return
  }

  try {
    await authStore.doLogin(form.username, form.password)
  } catch (err) {
    form.password = ''
    ElMessage.error(loginErrorMessage(err))
    loading.value = false
    return
  }
  router.push('/dashboard')
}
</script>

<style scoped>
.login-page {
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
  background: var(--surface-page);
}
.login-card {
  width: 100%;
  max-width: 380px;
  padding: var(--space-6);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}
.login-brand { display: flex; align-items: center; gap: var(--space-3); margin-bottom: var(--space-5); }
.login-logo { width: 48px; height: 48px; object-fit: contain; }
.login-brand-name {
  font-size: var(--font-size-base);
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--text-primary);
}
.login-heading { margin-bottom: var(--space-5); font-size: var(--font-size-xl); font-weight: 600; }
.login-submit { width: 100%; margin-top: var(--space-2); }
</style>
