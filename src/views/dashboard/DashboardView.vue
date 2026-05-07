<template>
  <div>
    <h1 style="font-size:22px;font-weight:700;margin-bottom:6px">Dashboard</h1>
    <p style="font-size:13px;color:var(--text-secondary)">Selamat datang kembali, {{ authStore.staff?.username }}!</p>
    <el-card shadow="never" style="margin-top:24px;text-align:center;padding:40px">
      <el-icon size="48" style="color:var(--text-muted)"><DataAnalysis /></el-icon>
      <p style="margin-top:12px;color:var(--text-secondary)">Sales summary akan ditampilkan di sini.</p>
    </el-card>
  </div>
</template>

<script setup>
import { useAuthStore } from '@/stores/authStore'
const authStore = useAuthStore()
</script>
