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
    path: '/admin-recovery',
    name: 'AdminRecoveryRequest',
    component: () => import('@/views/auth/AdminRecoveryRequestView.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/admin-recovery/:token',
    name: 'AdminRecoveryReset',
    component: () => import('@/views/auth/AdminRecoveryResetView.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    component: AdminLayout,
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: '/dashboard' },
      { path: 'dashboard', name: 'Dashboard', component: () => import('@/views/dashboard/DashboardView.vue') },
      { path: 'profile',   name: 'Profile',   component: () => import('@/views/profile/ProfileView.vue') },

      // STORE — guarded by settings.branches (or rooms.view for room templates)
      { path: 'store',          name: 'Store',          meta: { permission: 'settings.branches' }, component: () => import('@/views/store/StoreView.vue') },
      { path: 'store/create',   name: 'StoreCreate',    meta: { permission: 'settings.branches' }, component: () => import('@/views/store/StoreCreateView.vue') },
      { path: 'store/:id/edit', name: 'StoreEdit',      meta: { permission: 'settings.branches' }, component: () => import('@/views/store/StoreCreateView.vue') },
      { path: 'facility-category',      name: 'FacilityCategory', meta: { permission: 'settings.branches' }, component: () => import('@/views/facility/FacilityCategoryView.vue') },
      { path: 'facility',               name: 'Facility',         meta: { permission: 'settings.branches' }, component: () => import('@/views/facility/FacilityView.vue') },
      { path: 'facility/create',        name: 'FacilityCreate',   meta: { permission: 'settings.branches' }, component: () => import('@/views/facility/FacilityFormView.vue') },
      { path: 'facility/:id/edit',      name: 'FacilityEdit',     meta: { permission: 'settings.branches' }, component: () => import('@/views/facility/FacilityFormView.vue') },
      { path: 'room-template',          name: 'RoomTemplate',     meta: { permission: 'rooms.view' },        component: () => import('@/views/room_template/RoomTemplateView.vue') },
      { path: 'room-template/create',   name: 'RoomTemplateCreate', meta: { permission: 'rooms.view' },      component: () => import('@/views/room_template/RoomTemplateFormView.vue') },
      { path: 'room-template/:id/edit', name: 'RoomTemplateEdit', meta: { permission: 'rooms.view' },        component: () => import('@/views/room_template/RoomTemplateFormView.vue') },

      // BUSINESS
      { path: 'bookings',                 name: 'Bookings',    meta: { permission: 'bookings.view' },     component: () => import('@/views/booking/BookingView.vue') },
      { path: 'pricing',                  name: 'Pricing',     meta: { permission: 'pricing.view' },      component: () => import('@/views/pricing/PricingView.vue') },
      { path: 'pricing/:storeId/edit',    name: 'PricingEdit', meta: { permission: 'pricing.edit' },      component: () => import('@/views/pricing/PricingEditView.vue') },
      { path: 'customers',                name: 'Customers',   meta: { permission: 'customers.view' },    component: () => import('@/views/customer/CustomerView.vue') },
      { path: 'play-credits',             name: 'PlayCredits', meta: { permission: 'play_credits.view' }, component: () => import('@/views/play_credits/PlayCreditsView.vue') },
      { path: 'promotion',                name: 'Promotion',   meta: { permission: 'promotion.view' },    component: () => import('@/views/promotion/PromotionView.vue') },
      { path: 'fnb',                      name: 'FnB',         meta: { permission: 'fnb.view' },          component: () => import('@/views/fnb/FnBView.vue') },

      // SYSTEM — guarded by settings.staff_role
      { path: 'staff', name: 'Staff', meta: { permission: 'settings.staff_role' }, component: () => import('@/views/staff/StaffView.vue') },
      { path: 'role',  name: 'Role',  meta: { permission: 'settings.staff_role' }, component: () => import('@/views/role/RoleView.vue') },
      { path: 'settings/notification-templates', name: 'NotificationTemplates', meta: { permission: 'settings.staff_role' }, component: () => import('@/views/settings/NotificationTemplatesView.vue') },
      { path: 'settings/global-holidays', name: 'GlobalHolidays', meta: { permission: 'settings.branches' }, component: () => import('@/views/settings/GlobalHolidayView.vue') },
      { path: 'settings/banners', name: 'BannerManagement', meta: { permission: 'settings.branches' }, component: () => import('@/views/settings/BannerManagementView.vue') },
    ]
  }
]

const router = createRouter({ history: createWebHistory(), routes })

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // ── On page refresh: token exists but staff not loaded yet.
  //    Fetch user data BEFORE permission checks so permissions
  //    are available and the user lands on the correct page.
  if (authStore.isLoggedIn && !authStore.staff) {
    await authStore.fetchMe()
    // fetchMe clears token on 401, so re-check login status below
  }

  // Not logged in → go to login
  if (to.meta.requiresAuth !== false && !authStore.isLoggedIn) return next('/login')

  // Already logged in → skip login page
  if (to.path === '/login' && authStore.isLoggedIn) return next('/dashboard')

  // Permission check: if route needs a specific permission, verify it
  const perm = to.meta?.permission
  if (perm && authStore.isLoggedIn) {
    const permitted = authStore.isSystem || authStore.permissions.includes(perm)
    if (!permitted) return next('/dashboard')
  }

  next()
})

export default router
