<template>
  <div class="admin-layout">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="sidebar-logo">
        <!-- <img src="@/assets/logo.png" alt="Quantum Gaming" class="sidebar-logo-img" /> -->
        <div class="logo-text">
          <div class="logo-title">QUANTUM GAMING CENTER </div>
        </div>
      </div>

      <nav class="sidebar-nav">
        <!-- <router-link to="/dashboard" class="nav-item" active-class="active">
          <el-icon><Odometer /></el-icon>
          <span>Dashboard</span>
        </router-link>
        <router-link to="/booking" class="nav-item" active-class="active">
          <el-icon><Calendar /></el-icon>
          <span>Bookings</span>
        </router-link>
        <router-link to="/customers" class="nav-item" active-class="active">
          <el-icon><User /></el-icon>
          <span>Customers</span>
        </router-link>
        <router-link to="/membership" class="nav-item" active-class="active">
          <el-icon><Medal /></el-icon>
          <span>Membership</span>
        </router-link> -->

        <!-- Store Group -->
        <div class="nav-group">
          <div class="nav-group-header" @click="storeOpen = !storeOpen">
            <div style="display:flex;align-items:center;gap:10px">
              <el-icon><Shop /></el-icon>
              <span>Store</span>
            </div>
            <el-icon class="arrow" :class="{ rotated: storeOpen }"><ArrowDown /></el-icon>
          </div>
          <div class="nav-sub" v-show="storeOpen">
            <router-link to="/facility-category" class="nav-subitem" active-class="active">Facility Category</router-link>
            <router-link to="/facility" class="nav-subitem" active-class="active">Facilities</router-link>
            <router-link to="/room-template" class="nav-subitem" active-class="active">Rooms</router-link>
            <router-link to="/store" class="nav-subitem" active-class="active">Stores</router-link>
          </div>
        </div>

        <!-- <router-link to="/pricing" class="nav-item" active-class="active">
          <el-icon><Money /></el-icon>
          <span>Pricing</span>
        </router-link>
        <router-link to="/play-credits" class="nav-item" active-class="active">
          <el-icon><Coin /></el-icon>
          <span>Play Credits</span>
        </router-link>
        <router-link to="/promotion" class="nav-item" active-class="active">
          <el-icon><Present /></el-icon>
          <span>Promotion</span>
        </router-link>
        <router-link to="/payment" class="nav-item" active-class="active">
          <el-icon><CreditCard /></el-icon>
          <span>Payment Setting</span>
        </router-link> -->

        <!-- Settings Group -->
        <div class="nav-group">
          <div class="nav-group-header" @click="settingsOpen = !settingsOpen">
            <div style="display:flex;align-items:center;gap:10px">
              <el-icon><Setting /></el-icon>
              <span>Settings</span>
            </div>
            <el-icon class="arrow" :class="{ rotated: settingsOpen }"><ArrowDown /></el-icon>
          </div>
          <div class="nav-sub" v-show="settingsOpen">
            <router-link to="/staff" class="nav-subitem" active-class="active">Staff</router-link>
            <router-link to="/role" class="nav-subitem" active-class="active">Roles</router-link>
          </div>
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
          <!-- <el-badge :value="3" class="notif-badge">
            <el-icon size="20" style="cursor:pointer;color:var(--text-secondary)"><Bell /></el-icon>
          </el-badge> -->
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
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

const router = useRouter()
const authStore = useAuthStore()
const storeOpen = ref(true)
const settingsOpen = ref(true)

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
</script>

<style scoped>
.admin-layout { display: flex; height: 100vh; overflow: hidden; }

.sidebar {
  width: var(--sidebar-width);
  background: var(--bg-sidebar);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  overflow-y: auto;
}

.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px 16px;
  border-bottom: 1px solid var(--border-color);
}
.sidebar-logo-img {
  width: 88px; height: 88px; object-fit: contain; border-radius: 8px; flex-shrink: 0;
}
.logo-title { font-size: 10px; font-weight: 800; color: var(--text-primary); letter-spacing: 1px; }
.logo-sub { font-size: 9px; color: var(--text-secondary); letter-spacing: 0.5px; }

.sidebar-nav { flex: 1; padding: 12px 8px; display: flex; flex-direction: column; gap: 2px; }

.nav-item {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 12px; border-radius: 8px;
  color: var(--text-secondary); text-decoration: none;
  font-size: 13px; font-weight: 500;
  transition: all 0.2s;
}
.nav-item:hover { background: rgba(124,58,237,0.1); color: var(--text-primary); }
.nav-item.active { background: rgba(124,58,237,0.2); color: var(--color-primary-light); }

.nav-group { margin: 2px 0; }
.nav-group-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 9px 12px; border-radius: 8px;
  color: var(--text-secondary); font-size: 13px; font-weight: 500;
  cursor: pointer; transition: all 0.2s;
}
.nav-group-header:hover { background: rgba(124,58,237,0.1); color: var(--text-primary); }
.arrow { transition: transform 0.2s; }
.arrow.rotated { transform: rotate(180deg); }

.nav-sub { padding-left: 22px; display: flex; flex-direction: column; gap: 2px; margin-top: 2px; }
.nav-subitem {
  display: flex; align-items: center;
  padding: 7px 12px; border-radius: 6px;
  color: var(--text-secondary); text-decoration: none;
  font-size: 12.5px; font-weight: 500;
  transition: all 0.2s;
}
.nav-subitem:hover { background: rgba(124,58,237,0.1); color: var(--text-primary); }
.nav-subitem.active { color: var(--color-primary-light); background: rgba(124,58,237,0.15); }

.sidebar-footer { padding: 12px; border-top: 1px solid var(--border-color); }
.staff-info { display: flex; align-items: center; gap: 10px; }
.staff-name { font-size: 13px; font-weight: 600; color: var(--text-primary); }
.staff-role { font-size: 11px; color: var(--text-secondary); }

.main-wrapper { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

.app-header {
  height: 60px;
  background: var(--bg-sidebar);
  border-bottom: 1px solid var(--border-color);
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 24px; gap: 16px; flex-shrink: 0;
}
.header-search { width: 280px; }
.header-right { display: flex; align-items: center; gap: 20px; }

/* User dropdown trigger */
.header-user {
  display: flex; align-items: center; gap: 10px;
  cursor: pointer; padding: 6px 10px; border-radius: 8px;
  transition: background 0.2s;
}
.header-user:hover { background: rgba(124,58,237,0.1); }

.user-avatar-initials {
  width: 34px; height: 34px; border-radius: 50%;
  background: var(--color-primary);
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 700; color: #fff;
  flex-shrink: 0; letter-spacing: 0.5px;
}
.user-info { display: flex; flex-direction: column; }
.user-name { font-size: 13px; font-weight: 600; color: var(--text-primary); line-height: 1.3; }
.user-role { font-size: 11px; color: var(--text-secondary); line-height: 1.3; }
.user-chevron { color: var(--text-muted); font-size: 12px; }

/* Dropdown card */
.dropdown-user-card {
  display: flex; align-items: center; gap: 12px;
  padding: 14px 16px;
}
.dropdown-avatar {
  width: 42px; height: 42px; border-radius: 50%;
  background: var(--color-primary);
  display: flex; align-items: center; justify-content: center;
  font-size: 15px; font-weight: 700; color: #fff;
  flex-shrink: 0;
}
.dropdown-name { font-size: 13px; font-weight: 700; color: var(--text-primary); }
.dropdown-email { font-size: 11px; color: var(--text-secondary); margin-top: 1px; }
.dropdown-role-badge {
  display: inline-block; margin-top: 4px;
  font-size: 10px; font-weight: 600;
  background: rgba(124,58,237,0.2); color: var(--color-primary-light);
  padding: 2px 8px; border-radius: 10px;
}
.dropdown-divider { height: 1px; background: var(--border-color); margin: 4px 0; }
:deep(.logout-item) { color: var(--color-danger) !important; }
:deep(.logout-item:hover) { background: rgba(239,68,68,0.1) !important; }

.notif-badge { cursor: pointer; }

.page-content { flex: 1; overflow-y: auto; padding: 24px; background: var(--bg-main); }
</style>
