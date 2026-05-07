import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import AdminLayout from '@/layouts/AdminLayout.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/LoginView.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    component: AdminLayout,
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: '/dashboard' },
      { path: 'dashboard', name: 'Dashboard', component: () => import('@/views/dashboard/DashboardView.vue') },
      { path: 'profile', name: 'Profile', component: () => import('@/views/profile/ProfileView.vue') },
      { path: 'staff', name: 'Staff', component: () => import('@/views/staff/StaffView.vue') },
      { path: 'role', name: 'Role', component: () => import('@/views/role/RoleView.vue') },
      { path: 'store', name: 'Store', component: () => import('@/views/store/StoreView.vue') },
      { path: 'store/create', name: 'StoreCreate', component: () => import('@/views/store/StoreCreateView.vue') },
      { path: 'store/:id/edit', name: 'StoreEdit', component: () => import('@/views/store/StoreCreateView.vue') },
      { path: 'facility-category', name: 'FacilityCategory', component: () => import('@/views/facility/FacilityCategoryView.vue') },
      { path: 'facility', name: 'Facility', component: () => import('@/views/facility/FacilityView.vue') },
      { path: 'facility/create', name: 'FacilityCreate', component: () => import('@/views/facility/FacilityFormView.vue') },
      { path: 'facility/:id/edit', name: 'FacilityEdit', component: () => import('@/views/facility/FacilityFormView.vue') },
      { path: 'room-template', name: 'RoomTemplate', component: () => import('@/views/room_template/RoomTemplateView.vue') },
      { path: 'room-template/create', name: 'RoomTemplateCreate', component: () => import('@/views/room_template/RoomTemplateFormView.vue') },
      { path: 'room-template/:id/edit', name: 'RoomTemplateEdit', component: () => import('@/views/room_template/RoomTemplateFormView.vue') },
    ]
  }
]

const router = createRouter({ history: createWebHistory(), routes })

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  if (to.meta.requiresAuth && !authStore.isLoggedIn) return next('/login')
  if (to.path === '/login' && authStore.isLoggedIn) return next('/dashboard')
  next()
})

export default router
