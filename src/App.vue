<template>
  <router-view />
</template>

<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/authStore'

const authStore = useAuthStore()

onMounted(async () => {
  // Token ada tapi staff belum di-load (misal setelah refresh halaman)
  if (authStore.token && !authStore.staff) {
    await authStore.fetchMe()
  }
})
</script>
