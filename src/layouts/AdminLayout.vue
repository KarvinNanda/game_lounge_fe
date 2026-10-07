<template>
  <div class="admin-layout">
    <!-- Backdrop: only shown below 1024px, where the sidebar overlays content -->
    <transition name="fade">
      <div v-if="!sidebarCollapsed" class="sidebar-backdrop" @click="sidebarCollapsed = true" />
    </transition>

    <aside
      id="admin-sidebar"
      class="sidebar"
      :class="{ collapsed: sidebarCollapsed }"
      aria-label="Navigasi utama"
      @keydown.esc="closeOverlaySidebar"
    >
      <div class="sidebar-logo">
        <img src="@/assets/logo.png" alt="" class="logo-img" />
        <div>
          <div class="logo-title">Quantum</div>
          <div class="logo-sub">Gaming Center</div>
        </div>
      </div>

      <nav class="sidebar-nav">
        <template v-for="section in sections" :key="section.label ?? 'main'">
          <div v-if="section.label" class="nav-label">{{ section.label }}</div>

          <div v-if="section.group" class="nav-group">
            <button
              type="button"
              class="nav-item nav-group-header"
              :aria-expanded="String(!!openGroups[section.group.key])"
              :aria-controls="`nav-${section.group.key}`"
              @click="toggleGroup(section.group.key)"
            >
              <el-icon><component :is="section.group.icon" /></el-icon>
              <span class="nav-text">{{ section.group.label }}</span>
              <el-icon class="arrow" :class="{ rotated: openGroups[section.group.key] }"><ArrowDown /></el-icon>
            </button>
            <div v-show="openGroups[section.group.key]" :id="`nav-${section.group.key}`" class="nav-sub">
              <router-link
                v-for="item in section.items"
                :key="item.to"
                :to="item.to"
                class="nav-subitem"
                active-class="active"
              >
                {{ item.label }}
              </router-link>
            </div>
          </div>

          <template v-else>
            <router-link
              v-for="item in section.items"
              :key="item.to"
              :to="item.to"
              class="nav-item"
              active-class="active"
            >
              <el-icon><component :is="item.icon" /></el-icon>
              <span class="nav-text">{{ item.label }}</span>
            </router-link>
          </template>
        </template>
      </nav>
    </aside>

    <div class="main-wrapper">
      <header class="app-header">
        <button
          ref="sidebarToggle"
          type="button"
          class="icon-btn"
          aria-controls="admin-sidebar"
          :aria-expanded="String(!sidebarCollapsed)"
          :aria-label="sidebarCollapsed ? 'Tampilkan sidebar' : 'Sembunyikan sidebar'"
          @click="sidebarCollapsed = !sidebarCollapsed"
        >
          <el-icon><component :is="sidebarCollapsed ? 'Expand' : 'Fold'" /></el-icon>
        </button>

        <div class="header-right">
          <el-popover v-if="canSeeBell" placement="bottom-end" :width="310" trigger="click">
            <template #reference>
              <button type="button" class="icon-btn" :aria-label="`Sesi hampir selesai: ${endingSoonCount}`">
                <el-icon><Bell /></el-icon>
                <span v-if="endingSoonCount > 0" class="bell-badge" aria-hidden="true">
                  {{ endingSoonCount > 9 ? '9+' : endingSoonCount }}
                </span>
              </button>
            </template>
            <div class="bell-popup">
              <div class="bell-popup-header">
                <el-icon class="bell-popup-icon"><Warning /></el-icon>
                <span>Sesi Hampir Selesai</span>
              </div>
              <p class="bell-popup-hint">Berakhir dalam &lt; 5 menit</p>
              <p v-if="endingSoonCount === 0" class="bell-empty">Semua sesi berjalan normal.</p>
              <ul v-else class="ending-list">
                <li v-for="s in endingSoonSessions" :key="s.id" class="ending-item">
                  <div class="ending-main">
                    <div class="ending-room">{{ s.room?.name }}</div>
                    <div class="ending-customer">{{ s.customer_name }}</div>
                    <div v-if="branchNames[s.branchId]" class="ending-branch">{{ branchNames[s.branchId] }}</div>
                  </div>
                  <div class="ending-time">
                    <div class="ending-clock">{{ s.end_time?.slice(0, 5) }}</div>
                    <div class="ending-label">Berakhir</div>
                  </div>
                </li>
              </ul>
            </div>
          </el-popover>

          <el-dropdown trigger="click" placement="bottom-end" @command="handleUserCommand">
            <button type="button" class="header-user">
              <span class="avatar" aria-hidden="true">{{ userInitials }}</span>
              <span class="user-info">
                <span class="user-name">{{ authStore.staff?.username }}</span>
                <span class="user-role">{{ authStore.staff?.role?.name }}</span>
              </span>
              <el-icon class="user-chevron"><ArrowDown /></el-icon>
            </button>
            <template #dropdown>
              <el-dropdown-menu>
                <div class="dropdown-user-card">
                  <span class="avatar avatar--lg" aria-hidden="true">{{ userInitials }}</span>
                  <div>
                    <div class="dropdown-name">{{ authStore.staff?.username }}</div>
                    <div class="dropdown-email">{{ authStore.staff?.email }}</div>
                    <div class="dropdown-role-badge">{{ authStore.staff?.role?.name }}</div>
                  </div>
                </div>
                <div class="dropdown-divider" />
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon> Profil Saya
                </el-dropdown-item>
                <div class="dropdown-divider" />
                <el-dropdown-item command="logout">
                  <span class="logout-label"><el-icon><SwitchButton /></el-icon> Keluar</span>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>

      <main class="page-content">
        <router-view v-slot="{ Component }">
          <Transition name="page" mode="out-in">
            <component :is="Component" :key="$route.path" />
          </Transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { getSessionsEndingSoon } from '@/api/booking/bookingApi'
import { getStores } from '@/api/store/storeApi'
import { readStoreAccess } from '@/utils/storeAccess'
import { useVisiblePolling } from '@/composables/useVisiblePolling'
import { NAV_SECTIONS, visibleSections, groupKeyForPath } from './navItems'

// Below this width the sidebar is an overlay drawer instead of a column
const OVERLAY_BREAKPOINT = 1024
const POLL_INTERVAL_MS = 60_000

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const isOverlayWidth = () => window.innerWidth < OVERLAY_BREAKPOINT
const sidebarCollapsed = ref(isOverlayWidth())

// Escape closes the overlay sidebar and puts focus back on its toggle
const sidebarToggle = ref(null)
const closeOverlaySidebar = () => {
  if (!isOverlayWidth() || sidebarCollapsed.value) return
  sidebarCollapsed.value = true
  sidebarToggle.value?.focus()
}

// ── Navigation ────────────────────────────────────────────
const can = (perm) => !perm || authStore.isSystem || authStore.permissions.includes(perm)
const sections = computed(() => visibleSections(NAV_SECTIONS, can))

const openGroups = reactive({})
const toggleGroup = (key) => {
  openGroups[key] = !openGroups[key]
}

// On every route change: open the group that owns the route, and close
// the overlay sidebar on small screens so the page is visible.
watch(
  () => route.path,
  (path) => {
    const key = groupKeyForPath(path)
    if (key) openGroups[key] = true
    if (isOverlayWidth()) sidebarCollapsed.value = true
  },
  { immediate: true },
)

// ── Bell: sessions ending soon ────────────────────────────
// Only for staff who may view bookings; the API answers 403 otherwise.
const canSeeBell = computed(() => can('bookings.view'))
const endingSoonSessions = ref([])
const endingSoonCount = computed(() => endingSoonSessions.value.length)

const storeAccess = computed(() => readStoreAccess(authStore.staff))

// Branch names for the popup, loaded once, only for multi-branch staff
const branchNames = ref({})
const loadBranchNames = async () => {
  try {
    const { data } = await getStores({ per_page: 100 })
    branchNames.value = Object.fromEntries((data?.data || []).map((s) => [s.id, s.name]))
  } catch {
    // Names are a nice-to-have; sessions still show without them
  }
}

const pollEndingSoon = async () => {
  if (!canSeeBell.value) return
  const { allStores, storeIds } = storeAccess.value
  // All-branches staff: one call without store_id. Others: one call per
  // allowed branch (the API returns 400 without store_id for them).
  const targets = allStores ? [undefined] : storeIds
  if (targets.length === 0) return

  const results = await Promise.allSettled(targets.map((id) => getSessionsEndingSoon(id)))
  if (results.every((r) => r.status === 'rejected')) return // keep the last known list
  endingSoonSessions.value = results.flatMap((r, i) =>
    r.status === 'fulfilled' && Array.isArray(r.value?.data?.data)
      ? r.value.data.data.map((session) => ({ ...session, branchId: targets[i] }))
      : [],
  )
}
watch(
  () => storeAccess.value.storeIds.length,
  (count) => {
    if (count > 1 && canSeeBell.value) loadBranchNames()
  },
  { immediate: true },
)
useVisiblePolling(pollEndingSoon, POLL_INTERVAL_MS)

// Permissions or store_access can arrive after mount (role sync); poll as
// soon as the bell becomes usable instead of waiting for the next tick.
const bellReady = computed(
  () => canSeeBell.value && (storeAccess.value.allStores || storeAccess.value.storeIds.length > 0),
)
watch(bellReady, (ready, wasReady) => {
  if (ready && !wasReady) pollEndingSoon()
})

// ── User menu ─────────────────────────────────────────────
const userInitials = computed(() => (authStore.staff?.username || '').slice(0, 2).toUpperCase())

const handleUserCommand = async (cmd) => {
  if (cmd === 'profile') return router.push('/profile')
  if (cmd === 'logout') {
    await authStore.doLogout()
    router.push('/login')
  }
}
</script>

<style scoped>
.admin-layout { display: flex; height: 100dvh; overflow: hidden; }

/* ── Sidebar ─────────────────────────────────────────── */
.sidebar {
  width: var(--sidebar-width);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: var(--sidebar-bg);
  overflow: hidden;
}
.sidebar.collapsed { display: none; }

.sidebar-backdrop { display: none; }

@media (max-width: 1023px) {
  .sidebar {
    position: fixed;
    inset: 0 auto 0 0;
    z-index: 1001;
    transition: transform var(--motion-base) var(--ease-out);
  }
  /* Off-screen and hidden from tab order; visibility flips after the slide */
  .sidebar.collapsed {
    display: flex;
    transform: translateX(-100%);
    visibility: hidden;
    transition: transform var(--motion-base) var(--ease-out), visibility 0s linear var(--motion-base);
  }
  .sidebar-backdrop {
    display: block;
    position: fixed;
    inset: 0;
    z-index: 1000;
    background: rgba(15, 23, 42, 0.45);
  }
}

.sidebar-logo {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  height: var(--header-height);
  padding: 0 var(--space-4);
  border-bottom: 1px solid var(--sidebar-divider);
  flex-shrink: 0;
}
.logo-img { width: 32px; height: 32px; object-fit: contain; border-radius: var(--radius-md); }
.logo-title {
  font-size: var(--font-size-sm);
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--sidebar-text-active);
}
.logo-sub {
  font-size: var(--font-size-xs);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--sidebar-label);
}

.sidebar-nav {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: var(--space-2);
  overflow-y: auto;
  overflow-x: hidden;
}

.nav-label {
  padding: var(--space-4) var(--space-3) var(--space-1);
  font-size: var(--font-size-xs);
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--sidebar-label);
  user-select: none;
}

.nav-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  min-height: 36px;
  padding: 0 var(--space-3);
  border: 0;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--sidebar-text);
  font: inherit;
  font-size: var(--font-size-sm);
  font-weight: 500;
  text-align: left;
  text-decoration: none;
  cursor: pointer;
  transition: background-color var(--motion-fast) var(--ease-out), color var(--motion-fast) var(--ease-out);
}
.nav-item .el-icon { font-size: 16px; flex-shrink: 0; }
.nav-text { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.nav-item:hover { background: var(--sidebar-hover-bg); color: var(--sidebar-text-active); }
.nav-item.active { background: var(--sidebar-active-bg); color: var(--sidebar-text-active); font-weight: 600; }
.nav-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 8px;
  bottom: 8px;
  width: 3px;
  border-radius: 0 2px 2px 0;
  background: var(--sidebar-accent);
}
/* Inset ring: the nav clips overflow, an outside ring would be cut off */
.nav-item:focus-visible,
.nav-subitem:focus-visible { outline: 2px solid var(--sidebar-accent); outline-offset: -2px; }

.arrow { font-size: 12px; transition: transform var(--motion-fast) var(--ease-out); }
.arrow.rotated { transform: rotate(180deg); }

.nav-sub {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin: 2px 0 2px 20px;
  padding-left: var(--space-3);
  border-left: 1px solid var(--sidebar-divider);
}
.nav-subitem {
  display: flex;
  align-items: center;
  min-height: 32px;
  padding: 0 var(--space-3);
  border-radius: var(--radius-md);
  color: var(--sidebar-text);
  font-size: var(--font-size-sm);
  text-decoration: none;
  transition: background-color var(--motion-fast) var(--ease-out), color var(--motion-fast) var(--ease-out);
}
.nav-subitem:hover { background: var(--sidebar-hover-bg); color: var(--sidebar-text-active); }
.nav-subitem.active { background: var(--sidebar-active-bg); color: var(--sidebar-text-active); font-weight: 600; }

/* ── Main column ─────────────────────────────────────── */
.main-wrapper {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--surface-page);
}

.app-header {
  height: var(--header-height);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: 0 var(--space-5);
  background: var(--surface);
  border-bottom: 1px solid var(--border);
}
.header-right { display: flex; align-items: center; gap: var(--space-2); }

.icon-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
  color: var(--text-secondary);
  cursor: pointer;
  transition: background-color var(--motion-fast) var(--ease-out), color var(--motion-fast) var(--ease-out);
}
.icon-btn:hover { background: var(--surface-muted); color: var(--text-primary); }
.icon-btn .el-icon { font-size: 18px; }

.bell-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  border: 2px solid var(--surface);
  border-radius: 9px;
  background: var(--danger);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  line-height: 14px;
  text-align: center;
}

.bell-popup-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--text-primary);
}
.bell-popup-icon { color: var(--warning); }
.bell-popup-hint { margin: var(--space-1) 0 var(--space-2); font-size: var(--font-size-xs); color: var(--text-muted); }
.bell-empty { padding: var(--space-4) 0; font-size: var(--font-size-sm); text-align: center; }
.ending-list { list-style: none; max-height: 320px; overflow-y: auto; }
.ending-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) 0;
  border-bottom: 1px solid var(--border);
}
.ending-item:last-child { border-bottom: 0; }
.ending-main { min-width: 0; }
.ending-room { font-size: var(--font-size-sm); font-weight: 600; color: var(--text-primary); }
.ending-customer { font-size: var(--font-size-xs); color: var(--text-secondary); }
.ending-branch { font-size: var(--font-size-xs); color: var(--text-muted); }
.ending-time { flex-shrink: 0; text-align: right; }
.ending-clock { font-size: var(--font-size-sm); font-weight: 600; color: var(--warning); font-variant-numeric: tabular-nums; }
.ending-label { font-size: var(--font-size-xs); color: var(--text-muted); }

.header-user {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-1) var(--space-2);
  border: 0;
  border-radius: var(--radius-md);
  background: transparent;
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: background-color var(--motion-fast) var(--ease-out);
}
.header-user:hover { background: var(--surface-muted); }

.avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  background: var(--action);
  color: #fff;
  font-size: var(--font-size-xs);
  font-weight: 600;
}
.avatar--lg { width: 40px; height: 40px; font-size: var(--font-size-sm); }
.user-info { display: flex; flex-direction: column; }
.user-name { font-size: var(--font-size-sm); font-weight: 600; line-height: 1.3; color: var(--text-primary); }
.user-role { font-size: var(--font-size-xs); line-height: 1.3; color: var(--text-muted); }
.user-chevron { font-size: 12px; color: var(--text-muted); }

.dropdown-user-card { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-3) var(--space-4); }
.dropdown-name { font-size: var(--font-size-sm); font-weight: 600; color: var(--text-primary); }
.dropdown-email { font-size: var(--font-size-xs); color: var(--text-muted); }
.dropdown-role-badge {
  display: inline-block;
  margin-top: var(--space-1);
  padding: 0 var(--space-2);
  border-radius: 10px;
  background: var(--action-soft);
  color: var(--action);
  font-size: var(--font-size-xs);
  font-weight: 600;
}
.dropdown-divider { height: 1px; margin: var(--space-1) 0; background: var(--border); }
.logout-label { display: inline-flex; align-items: center; gap: var(--space-1); color: var(--danger); }

/* The only vertical scroll area. overflow-x: auto (not hidden) so wide
   content stays reachable; the page itself never scrolls sideways. */
.page-content {
  flex: 1;
  min-height: 0;
  min-width: 0;
  overflow-y: auto;
  overflow-x: auto;
  padding: var(--space-4) var(--space-5);
}

@media (max-width: 639px) {
  .app-header { padding: 0 var(--space-3); }
  .page-content { padding: var(--space-3); }
  .user-info { display: none; }
}

/* Page change: short fade in only; the old page leaves instantly */
.page-enter-active { transition: opacity var(--motion-fast) var(--ease-out); }
.page-enter-from { opacity: 0; }
</style>
