<template>
  <div class="admin-layout">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="sidebar-logo">
        <div class="logo-icon">⚡</div>
        <div class="logo-text">
          <div class="logo-title">QUANTUM</div>
          <div class="logo-sub">GAMING CENTER</div>
        </div>
      </div>

      <nav class="sidebar-nav">
        <!-- DASHBOARD — always first -->
        <router-link to="/sales" class="nav-item" active-class="active">
          <el-icon><TrendCharts /></el-icon>
          <span>Dashboard</span>
        </router-link>

        <!-- STORE -->
        <div class="nav-label">Store</div>
        <div class="nav-group">
          <div class="nav-group-header" @click="storeOpen = !storeOpen">
            <div style="display:flex;align-items:center;gap:10px">
              <el-icon><Shop /></el-icon>
              <span>Store Management</span>
            </div>
            <el-icon class="arrow" :class="{ rotated: storeOpen }"><ArrowDown /></el-icon>
          </div>
          <transition name="nav-sub">
            <div class="nav-sub" v-show="storeOpen">
              <router-link to="/facility-category" class="nav-subitem" active-class="active">
                <span class="sub-dot" />Facility Category
              </router-link>
              <router-link to="/facility" class="nav-subitem" active-class="active">
                <span class="sub-dot" />Facilities
              </router-link>
              <router-link to="/room-template" class="nav-subitem" active-class="active">
                <span class="sub-dot" />Rooms
              </router-link>
              <router-link to="/store" class="nav-subitem" active-class="active">
                <span class="sub-dot" />Stores
              </router-link>
            </div>
          </transition>
        </div>

        <!-- BUSINESS -->
        <div class="nav-label">Business</div>
        <router-link to="/bookings" class="nav-item" active-class="active">
          <el-icon><Calendar /></el-icon>
          <span>Bookings</span>
        </router-link>
        <router-link to="/pricing" class="nav-item" active-class="active">
          <el-icon><Money /></el-icon>
          <span>Pricing</span>
        </router-link>
        <router-link to="/customers" class="nav-item" active-class="active">
          <el-icon><User /></el-icon>
          <span>Customers</span>
        </router-link>
        <router-link to="/play-credits" class="nav-item" active-class="active">
          <el-icon><Coin /></el-icon>
          <span>Play Credits</span>
        </router-link>
        <router-link to="/promotion" class="nav-item" active-class="active">
          <el-icon><Ticket /></el-icon>
          <span>Promotion</span>
        </router-link>

        <!-- SYSTEM -->
        <div class="nav-label">System</div>
        <div class="nav-group">
          <div class="nav-group-header" @click="settingsOpen = !settingsOpen">
            <div style="display:flex;align-items:center;gap:10px">
              <el-icon><Setting /></el-icon>
              <span>Settings</span>
            </div>
            <el-icon class="arrow" :class="{ rotated: settingsOpen }"><ArrowDown /></el-icon>
          </div>
          <transition name="nav-sub">
            <div class="nav-sub" v-show="settingsOpen">
              <router-link to="/staff" class="nav-subitem" active-class="active">
                <span class="sub-dot" />Staff
              </router-link>
              <router-link to="/role" class="nav-subitem" active-class="active">
                <span class="sub-dot" />Roles
              </router-link>
            </div>
          </transition>
        </div>
      </nav>
    </aside>

    <!-- Main Content -->
    <div class="main-wrapper">
      <!-- Header -->
      <header class="app-header">
        <div></div>
        <!-- <el-input placeholder="Cari sesuatu..." class="header-search" prefix-icon="Search" /> -->
        <div class="header-right">
          <!-- Theme Toggle -->
          <div class="theme-toggle" @click="toggleTheme" :title="isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'">
            <el-icon size="16"><Sunny v-if="isDark" /><Moon v-else /></el-icon>
          </div>

          <!-- Bell: Sessions Ending Soon -->
          <el-popover placement="bottom-end" :width="310" trigger="click" popper-class="bell-popover">
            <template #reference>
              <div class="bell-wrapper">
                <el-icon size="18"><Bell /></el-icon>
                <transition name="badge-pop">
                  <div v-if="endingSoonCount > 0" class="bell-badge">{{ endingSoonCount > 9 ? '9+' : endingSoonCount }}</div>
                </transition>
              </div>
            </template>
            <div class="bell-popup">
              <div class="bell-popup-header">
                <span>⚠️ Sesi Hampir Selesai</span>
                <el-tag v-if="endingSoonCount > 0" type="warning" size="small">{{ endingSoonCount }}</el-tag>
              </div>
              <div v-if="endingSoonSessions.length === 0"
                   style="font-size:12px;color:var(--text-secondary);text-align:center;padding:20px 0">
                Semua sesi berjalan normal 👍
              </div>
              <div v-for="s in endingSoonSessions" :key="s.id" class="ending-item">
                <div>
                  <div style="font-size:12px;font-weight:700;color:var(--text-primary)">{{ s.room?.name }}</div>
                  <div style="font-size:11px;color:var(--text-secondary)">{{ s.customer_name }}</div>
                </div>
                <div style="text-align:right;flex-shrink:0">
                  <div style="font-size:13px;font-weight:700;color:#D97706">{{ s.end_time?.slice(0,5) }}</div>
                  <div style="font-size:10px;color:var(--text-muted)">Berakhir</div>
                </div>
              </div>
            </div>
          </el-popover>

          <el-dropdown trigger="click" @command="handleUserCommand" placement="bottom-end">
            <div class="header-user">
              <div class="user-avatar-initials">
                {{ userInitials }}
              </div>
              <div class="user-info">
                <div class="user-name">{{ authStore.staff?.username }}</div>
                <div class="user-role">{{ authStore.staff?.role?.name }}</div>
              </div>
              <el-icon class="user-chevron"><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu class="user-dropdown-menu">
                <!-- User Card di atas -->
                <div class="dropdown-user-card">
                  <div class="dropdown-avatar">{{ userInitials }}</div>
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
                <el-dropdown-item command="logout" class="logout-item">
                  <el-icon><SwitchButton /></el-icon> Keluar
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>

      <!-- Page Content -->
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { getSessionsEndingSoon } from '@/api/booking/bookingApi'

const router = useRouter()
const authStore = useAuthStore()
const storeOpen = ref(true)
const settingsOpen = ref(true)

// ── Theme Toggle ─────────────────────────────────────────
const isDark = ref(localStorage.getItem('theme') !== 'light')

const toggleTheme = () => {
  isDark.value = !isDark.value
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
  document.body.classList.toggle('light-mode', !isDark.value)
}

// ── Bell: Sessions Ending Soon ────────────────────────────
const endingSoonSessions = ref([])
const endingSoonCount = computed(() => endingSoonSessions.value.length)

const pollEndingSoon = async () => {
  try {
    const { data } = await getSessionsEndingSoon('')
    endingSoonSessions.value = data.data || []
  } catch {
    // Silently fail — don't break layout if API is unavailable
  }
}

let endingPollInterval = null
// ─────────────────────────────────────────────────────────

const userInitials = computed(() => {
  const name = authStore.staff?.username || ''
  return name.slice(0, 2).toUpperCase()
})

const handleUserCommand = async (cmd) => {
  if (cmd === 'profile') {
    router.push('/profile')
  } else if (cmd === 'logout') {
    await authStore.doLogout()
    router.push('/login')
  }
}

onMounted(() => {
  if (!isDark.value) document.body.classList.add('light-mode')
  pollEndingSoon()
  endingPollInterval = setInterval(pollEndingSoon, 60000)
})

onUnmounted(() => {
  if (endingPollInterval) clearInterval(endingPollInterval)
})
</script>

<style scoped>
.admin-layout { display: flex; height: 100vh; overflow: hidden; }

/* ══════════════════════════════════════
   SIDEBAR — uses CSS vars, adapts per mode
   Dark: full navy | Light: lighter navy
══════════════════════════════════════ */
.sidebar {
  width: var(--sidebar-width);
  background: linear-gradient(180deg, var(--sidebar-bg-start) 0%, var(--sidebar-bg-end) 100%);
  border-right: 1px solid var(--sidebar-border-color);
  display: flex; flex-direction: column;
  flex-shrink: 0; overflow: hidden; position: relative;
  transition: background 0.3s ease;
}
.sidebar::after {
  content: '';
  position: absolute; right: 0; top: 15%; bottom: 15%; width: 1px;
  background: linear-gradient(180deg, transparent, var(--sidebar-glow-color), transparent);
  pointer-events: none;
}

/* Logo */
.sidebar-logo {
  display: flex; align-items: center; gap: 12px;
  padding: 14px 16px;
  background: rgba(2,130,222,0.08);
  border-bottom: 1px solid var(--sidebar-border-color);
  flex-shrink: 0;
}
.logo-icon {
  width: 38px; height: 38px;
  background: var(--sidebar-logo-bg);
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-size: 19px; flex-shrink: 0;
  box-shadow: 0 4px 14px var(--sidebar-logo-shadow);
}
.logo-title { font-size: 12px; font-weight: 800; color: #F5F7FA; letter-spacing: 0.5px; line-height: 1.2; }
.logo-sub   { font-size: 9px; color: rgba(25,185,238,0.6); letter-spacing: 1.2px; margin-top: 2px; text-transform: uppercase; }

/* Nav */
.sidebar-nav { flex: 1; padding: 6px 8px 12px; display: flex; flex-direction: column; overflow-y: auto; overflow-x: hidden; }

/* Section labels */
.nav-label {
  font-size: 9px; font-weight: 700; letter-spacing: 1.8px;
  color: var(--sidebar-label-color); text-transform: uppercase;
  padding: 12px 12px 5px; user-select: none;
}

/* Nav item */
.nav-item {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 12px; border-radius: 8px;
  color: var(--sidebar-text); text-decoration: none;
  font-size: 13px; font-weight: 500;
  transition: all 0.2s; position: relative; margin-bottom: 1px;
}
.nav-item .el-icon { font-size: 15px; flex-shrink: 0; transition: all 0.2s; }
.nav-item:hover { background: var(--sidebar-hover-bg); color: var(--sidebar-text-hover); }
.nav-item:hover .el-icon { color: var(--sidebar-text-hover); }
.nav-item.active {
  background: var(--sidebar-active-bg);
  color: var(--sidebar-text-active); font-weight: 600;
}
.nav-item.active .el-icon {
  color: var(--sidebar-text-active);
  filter: drop-shadow(0 0 5px rgba(2,130,222,0.7));
}
.nav-item.active::before {
  content: '';
  position: absolute; left: 0; top: 18%; bottom: 18%; width: 3px;
  background: var(--sidebar-active-bar);
  border-radius: 0 3px 3px 0;
}

/* Nav group */
.nav-group { margin-bottom: 1px; }
.nav-group-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 9px 12px; border-radius: 8px;
  color: var(--sidebar-text); font-size: 13px; font-weight: 500;
  cursor: pointer; transition: all 0.2s; user-select: none;
}
.nav-group-header .el-icon { font-size: 15px; flex-shrink: 0; }
.nav-group-header:hover { background: var(--sidebar-hover-bg); color: var(--sidebar-text-hover); }
.arrow { transition: transform 0.25s ease; }
.arrow.rotated { transform: rotate(180deg); }

/* Sub nav */
.nav-sub {
  margin-left: 20px; padding-left: 10px;
  border-left: 1px solid var(--sidebar-sub-line);
  display: flex; flex-direction: column; margin-top: 2px;
}
.nav-subitem {
  display: flex; align-items: center; gap: 8px;
  padding: 7px 10px; border-radius: 6px;
  color: var(--sidebar-text); text-decoration: none;
  font-size: 12px; font-weight: 500; transition: all 0.2s;
  position: relative; margin-bottom: 1px;
}
.nav-subitem:hover { background: var(--sidebar-hover-bg); color: var(--sidebar-text-hover); }
.nav-subitem.active { color: var(--sidebar-text-active); background: var(--sidebar-hover-bg); font-weight: 600; }
.nav-subitem.active::before {
  content: '';
  position: absolute; left: -11px; top: 28%; bottom: 28%; width: 2px;
  background: var(--color-primary-light); border-radius: 2px;
}
.sub-dot {
  width: 5px; height: 5px; border-radius: 50%;
  background: rgba(2,130,222,0.25); flex-shrink: 0; transition: background 0.2s;
}
.nav-subitem.active .sub-dot { background: var(--color-primary-light); }
.nav-subitem:hover .sub-dot  { background: rgba(25,185,238,0.5); }

/* Collapse transition */
.nav-sub-enter-active,
.nav-sub-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.nav-sub-enter-from,
.nav-sub-leave-to { opacity: 0; transform: translateY(-6px); }

/* ══════════════════════════════════════
   MAIN WRAPPER — adapts to theme
══════════════════════════════════════ */
.main-wrapper {
  flex: 1; display: flex; flex-direction: column; overflow: hidden;
  background: var(--bg-main);
  transition: background 0.3s ease;
}

/* Header */
.app-header {
  height: 52px;
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-color);
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 20px; gap: 16px; flex-shrink: 0;
  transition: background 0.3s ease, border-color 0.3s ease;
}
.header-right { display: flex; align-items: center; gap: 10px; }

/* Bell */
.bell-wrapper {
  position: relative; cursor: pointer;
  width: 34px; height: 34px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
  background: var(--bg-card-hover);
  transition: all 0.2s;
}
.bell-wrapper:hover {
  background: var(--color-primary-soft);
  color: var(--color-primary-light);
  border-color: rgba(2,130,222,0.4);
}
.bell-badge {
  position: absolute; top: -5px; right: -5px;
  background: #EF4444; color: white;
  min-width: 17px; height: 17px; border-radius: 10px;
  font-size: 9px; font-weight: 800; padding: 0 3px;
  display: flex; align-items: center; justify-content: center;
  border: 2px solid var(--bg-card);
}
.badge-pop-enter-active, .badge-pop-leave-active { transition: all 0.2s; }
.badge-pop-enter-from, .badge-pop-leave-to { transform: scale(0); opacity: 0; }

.bell-popup { display: flex; flex-direction: column; }
.bell-popup-header {
  display: flex; justify-content: space-between; align-items: center;
  font-size: 13px; font-weight: 700; color: var(--text-primary); margin-bottom: 10px;
}
.ending-item {
  display: flex; justify-content: space-between; align-items: center;
  padding: 9px 0; border-bottom: 1px solid var(--border-color); gap: 10px;
}
.ending-item:last-child { border-bottom: none; }

/* Theme toggle */
.theme-toggle {
  width: 34px; height: 34px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  color: var(--text-secondary); cursor: pointer;
  border: 1px solid var(--border-color);
  background: var(--bg-card-hover);
  transition: all 0.2s; flex-shrink: 0;
}
.theme-toggle:hover {
  background: var(--color-primary-soft);
  color: var(--color-primary-light);
  border-color: rgba(2,130,222,0.4);
  box-shadow: 0 0 12px rgba(2,130,222,0.2);
}

/* User */
.header-user {
  display: flex; align-items: center; gap: 10px;
  cursor: pointer; padding: 5px 10px; border-radius: 8px;
  transition: background 0.2s;
}
.header-user:hover { background: var(--color-primary-soft); }

.user-avatar-initials {
  width: 32px; height: 32px; border-radius: 8px;
  background: linear-gradient(135deg, #0282DE, #0262b0);
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 700; color: #fff;
  flex-shrink: 0;
  box-shadow: 0 3px 10px rgba(2,130,222,0.45);
}
.user-info    { display: flex; flex-direction: column; }
.user-name    { font-size: 12px; font-weight: 600; color: var(--text-primary); line-height: 1.3; transition: color 0.3s; }
.user-role    { font-size: 10px; color: var(--text-secondary); line-height: 1.3; transition: color 0.3s; }
.user-chevron { color: var(--text-muted); font-size: 11px; }

/* Dropdown */
.dropdown-user-card {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 16px;
  background: var(--color-primary-soft);
  border-radius: 6px; margin: 4px;
}
.dropdown-avatar {
  width: 38px; height: 38px; border-radius: 10px;
  background: linear-gradient(135deg, #0282DE, #0262b0);
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; font-weight: 700; color: #fff;
  flex-shrink: 0;
  box-shadow: 0 3px 10px rgba(2,130,222,0.4);
}
.dropdown-name  { font-size: 13px; font-weight: 700; color: var(--text-primary); }
.dropdown-email { font-size: 11px; color: var(--text-secondary); margin-top: 1px; }
.dropdown-role-badge {
  display: inline-block; margin-top: 4px;
  font-size: 10px; font-weight: 700;
  background: rgba(2,130,222,0.2); color: var(--color-primary-light);
  padding: 2px 8px; border-radius: 10px;
}
.dropdown-divider { height: 1px; background: var(--border-color); margin: 4px 0; }
:deep(.logout-item) { color: var(--color-danger) !important; }
:deep(.logout-item:hover) { background: rgba(239,68,68,0.1) !important; }

/* Page content */
.page-content {
  flex: 1; overflow-y: auto; padding: 16px 20px;
  background: var(--bg-main);
  transition: background 0.3s ease;
}

/* Page transition */
.page-enter-active { animation: pageIn 0.22s ease; }
.page-leave-active { animation: pageOut 0.15s ease; }
@keyframes pageIn {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes pageOut {
  from { opacity: 1; }
  to   { opacity: 0; transform: translateY(-6px); }
}
</style>
