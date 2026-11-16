<template>
  <div>
    <!-- Header -->
    <PageHeader breadcrumb="Pengaturan → Role" title="Role" description="Kelola role dan hak akses untuk setiap jabatan staff.">
      <template #actions>
        <el-button v-if="can('settings.staff_role')" type="primary" @click="openDrawer()">
          <el-icon><Plus /></el-icon> Tambah Role
        </el-button>
      </template>
    </PageHeader>

    <!-- Stats -->
    <StatStrip :items="[{ label: 'Total Role', value: roleList.length }]" />

    <!-- Table -->
    <el-card shadow="never" class="table-card">
      <FilterBar>
        <el-input class="filter-search"
          v-model="search"
          placeholder="Cari nama role..."
          prefix-icon="Search"
         
          clearable
        />
        <template #actions>
          <el-button plain @click="search = ''">
            <el-icon><RefreshRight /></el-icon> Reset
          </el-button>
        </template>
      </FilterBar>

      <div v-if="isMobile" class="m-card-list">
        <div class="m-card" v-for="row in filteredRoles" :key="row.id">
          <div class="m-card-icon m-card-icon-role">
            <el-icon size="18"><UserFilled /></el-icon>
          </div>
          <div class="m-card-body">
            <div class="m-card-title">{{ row.name }}</div>
            <div class="m-card-meta">{{ row.permissions?.length || 0 }} permission · {{ row.staff_count || 0 }} staff</div>
          </div>
          <div class="m-card-end">
            <div class="m-card-actions">
              <el-button v-if="can('settings.staff_role')" size="small" circle plain @click="openDrawer(row)"><el-icon><Edit /></el-icon></el-button>
              <el-button v-if="can('settings.staff_role')" size="small" circle plain type="danger" :disabled="(row.staff_count || 0) > 0" @click="deleteRole(row)"><el-icon><Delete /></el-icon></el-button>
            </div>
          </div>
        </div>
      </div>

      <div class="table-wrap">
      <el-table :data="filteredRoles" v-loading="loading" size="small" class="u-w-full" empty-text="Belum ada role">
        <el-table-column label="Role" min-width="200">
          <template #default="{ row }">
            <div>
              <div class="cell-name">{{ row.name }}</div>
              <div class="cell-desc" v-if="row.description">{{ row.description }}</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="Permissions" min-width="280">
          <template #default="{ row }">
            <div v-if="row.permissions?.length" class="perm-tags">
              <el-tag
                v-for="p in row.permissions.slice(0, 4)"
                :key="p"
                size="small"
                type="info"
                plain
                class="perm-tag"
              >{{ p }}</el-tag>
              <el-tag v-if="row.permissions.length > 4" size="small" type="info">
                +{{ row.permissions.length - 4 }} lainnya
              </el-tag>
            </div>
            <span v-else class="u-text-xs u-text-muted">Tidak ada permission</span>
          </template>
        </el-table-column>

        <el-table-column label="Jumlah Staff" width="120" align="center" v-if="!isTablet && !isMobile">
          <template #default="{ row }">
            <el-tag size="small" :type="(row.staff_count || 0) > 0 ? 'success' : 'info'" plain>
              {{ row.staff_count || 0 }} staff
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="Aksi" width="110" align="right" fixed="right">
          <template #default="{ row }">
            <div class="row-actions">
              <el-tooltip v-if="can('settings.staff_role')" content="Ubah" placement="top">
                <el-button size="small" circle plain @click="openDrawer(row)">
                  <el-icon><Edit /></el-icon>
                </el-button>
              </el-tooltip>
              <el-tooltip v-if="can('settings.staff_role')" content="Hapus" placement="top">
                <el-button
                  size="small" circle plain type="danger"
                  :disabled="(row.staff_count || 0) > 0"
                  @click="deleteRole(row)"
                >
                  <el-icon><Delete /></el-icon>
                </el-button>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
      </el-table>
      </div>
    </el-card>

    <!-- Drawer Add/Edit Role -->
    <el-drawer
      v-model="drawerVisible"
      :title="form.id ? 'Ubah Role' : 'Tambah Role'"
      direction="rtl"
      :size="isMobile ? '100%' : '480px'"
      :destroy-on-close="true"
    >
      <div class="drawer-body">
        <el-form :model="form" :rules="rules" ref="formRef" label-position="top">
          <!-- Info -->
          <div class="drawer-section-title">Informasi Role</div>
          <el-form-item label="Nama Role" prop="name">
            <el-input v-model="form.name" placeholder="Contoh: Manager, Cashier, Operator" maxlength="50" show-word-limit />
          </el-form-item>

          <!-- Permissions -->
          <div class="drawer-section-title perm-section">
            Hak Akses
            <el-checkbox class="perm-count"
              v-model="selectAll"
              :indeterminate="isIndeterminate"
              @change="toggleAll"
             
            >Pilih Semua</el-checkbox>
          </div>

          <div class="perm-groups">
            <div v-for="group in permissionGroups" :key="group.key" class="perm-group">
              <el-checkbox
                v-model="group.checked"
                :indeterminate="group.indeterminate"
                @change="toggleGroup(group)"
                class="perm-group-header"
              >
                <span class="perm-group-label">{{ group.label }}</span>
              </el-checkbox>
              <p class="perm-group-desc">{{ group.description }}</p>
              <div class="perm-children">
                <el-checkbox
                  v-for="perm in group.permissions"
                  :key="perm.value"
                  v-model="perm.checked"
                  @change="onPermChange(group)"
                  class="perm-item"
                >{{ perm.label }}</el-checkbox>
              </div>
            </div>
          </div>
        </el-form>

        <AuditTrail
          v-if="form.id"
          :created-by="form.created_by"
          :updated-by="form.updated_by"
          :created-at="form.created_at"
          :updated-at="form.updated_at"
        />
      </div>

      <template #footer>
        <div class="drawer-footer">
          <el-button @click="drawerVisible = false" class="u-flex-1">Batal</el-button>
          <el-button type="primary" :loading="saving" @click="save" class="u-flex-1">
            {{ form.id ? 'Simpan Perubahan' : 'Tambah Role' }}
          </el-button>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { usePermission } from '@/composables/usePermission'
import { useBreakpoint } from '@/composables/useBreakpoint'
import { ElMessage, ElMessageBox } from 'element-plus'
import { notifyError } from '@/utils/notify'
import PageHeader from '@/components/ui/PageHeader.vue'
import StatStrip from '@/components/ui/StatStrip.vue'
import FilterBar from '@/components/ui/FilterBar.vue'
import { getRoles, createRole, updateRole, deleteRole as apiDelete } from '@/api/role/roleApi'
import { isFnbEnabled } from '@/config/features'
import AuditTrail from '@/components/AuditTrail.vue'

const { can } = usePermission()
const { isMobile, isTablet } = useBreakpoint()

const loading = ref(false)
const saving = ref(false)
const drawerVisible = ref(false)
const formRef = ref()
const roleList = ref([])
const search = ref('')

const form = reactive({ id: null, name: '', description: '', created_by: null, updated_by: null, created_at: null, updated_at: null })
const rules = {
  name: [{ required: true, message: 'Nama role wajib diisi', trigger: 'blur' }],
}

// ── Permission Groups ──
const ALL_PERMISSION_GROUPS = [
  { key: 'dashboard', label: 'Dashboard', description: 'Akses ke halaman dashboard utama.', checked: false, indeterminate: false, permissions: [{ label: 'Lihat', value: 'dashboard.view', checked: false }] },
  { key: 'bookings', label: 'Booking', description: 'Kelola booking & pembayaran.', checked: false, indeterminate: false, permissions: [{ label: 'Lihat', value: 'bookings.view', checked: false }, { label: 'Tambah', value: 'bookings.create', checked: false }, { label: 'Ubah', value: 'bookings.edit', checked: false }, { label: 'Batalkan', value: 'bookings.cancel', checked: false }] },
  { key: 'rooms', label: 'Ruangan', description: 'Kelola data room & console.', checked: false, indeterminate: false, permissions: [{ label: 'Lihat', value: 'rooms.view', checked: false }, { label: 'Tambah', value: 'rooms.create', checked: false }, { label: 'Ubah', value: 'rooms.edit', checked: false }, { label: 'Hapus', value: 'rooms.delete', checked: false }] },
  { key: 'schedule', label: 'Jadwal', description: 'Kelola jadwal & kalender.', checked: false, indeterminate: false, permissions: [{ label: 'Lihat', value: 'schedule.view', checked: false }, { label: 'Ubah', value: 'schedule.edit', checked: false }] },
  { key: 'orders_fnb', label: 'Pesanan (F&B)', description: 'Kelola pesanan makanan & minuman.', checked: false, indeterminate: false, permissions: [{ label: 'Lihat', value: 'orders_fnb.view', checked: false }, { label: 'Ubah', value: 'orders_fnb.edit', checked: false }] },
  { key: 'customers', label: 'Pelanggan', description: 'Kelola data pelanggan.', checked: false, indeterminate: false, permissions: [{ label: 'Lihat', value: 'customers.view', checked: false }, { label: 'Tambah', value: 'customers.create', checked: false }, { label: 'Ubah', value: 'customers.edit', checked: false }] },
  { key: 'membership', label: 'Membership', description: 'Kelola paket membership.', checked: false, indeterminate: false, permissions: [{ label: 'Lihat', value: 'membership.view', checked: false }, { label: 'Tambah', value: 'membership.create', checked: false }, { label: 'Ubah', value: 'membership.edit', checked: false }] },
  { key: 'play_credits', label: 'Play Credits', description: 'Kelola paket play credits.', checked: false, indeterminate: false, permissions: [{ label: 'Lihat', value: 'play_credits.view', checked: false }, { label: 'Tambah', value: 'play_credits.create', checked: false }, { label: 'Ubah', value: 'play_credits.edit', checked: false }] },
  { key: 'pricing', label: 'Harga', description: 'Kelola harga & paket.', checked: false, indeterminate: false, permissions: [{ label: 'Lihat', value: 'pricing.view', checked: false }, { label: 'Ubah', value: 'pricing.edit', checked: false }] },
  { key: 'promotion', label: 'Promosi', description: 'Kelola promo & kupon.', checked: false, indeterminate: false, permissions: [{ label: 'Lihat', value: 'promotion.view', checked: false }, { label: 'Tambah', value: 'promotion.create', checked: false }, { label: 'Ubah', value: 'promotion.edit', checked: false }] },
  { key: 'payment_setting', label: 'Pengaturan Pembayaran', description: 'Kelola pengaturan pembayaran.', checked: false, indeterminate: false, permissions: [{ label: 'Lihat', value: 'payment_setting.view', checked: false }, { label: 'Ubah', value: 'payment_setting.edit', checked: false }] },
  { key: 'settings', label: 'Pengaturan', description: 'Kelola pengaturan sistem.', checked: false, indeterminate: false, permissions: [{ label: 'Staff & Role', value: 'settings.staff_role', checked: false }, { label: 'Cabang', value: 'settings.branches', checked: false }, { label: 'Preferensi Sistem', value: 'settings.system_preference', checked: false }, { label: 'Log Aktivitas', value: 'settings.activity_log', checked: false }] },
]

// Groups of switched-off features are hidden. A role's existing permissions in those
// groups are kept aside and sent back on save, so hiding a group never removes them.
const HIDDEN_GROUP_KEYS = isFnbEnabled() ? [] : ['orders_fnb']
const permissionGroups = reactive(ALL_PERMISSION_GROUPS.filter(g => !HIDDEN_GROUP_KEYS.includes(g.key)))
const hiddenPermissionValues = ALL_PERMISSION_GROUPS
  .filter(g => HIDDEN_GROUP_KEYS.includes(g.key))
  .flatMap(g => g.permissions.map(p => p.value))
let keptHiddenPermissions = []

const selectAll = ref(false)

const isIndeterminate = computed(() => {
  const all = permissionGroups.flatMap(g => g.permissions)
  const checked = all.filter(p => p.checked).length
  return checked > 0 && checked < all.length
})

const toggleAll = (val) => {
  permissionGroups.forEach(g => {
    g.checked = val; g.indeterminate = false
    g.permissions.forEach(p => p.checked = val)
  })
}

const toggleGroup = (group) => {
  group.permissions.forEach(p => p.checked = group.checked)
  group.indeterminate = false
  updateSelectAll()
}

const onPermChange = (group) => {
  const count = group.permissions.filter(p => p.checked).length
  group.checked = count === group.permissions.length
  group.indeterminate = count > 0 && count < group.permissions.length
  updateSelectAll()
}

const updateSelectAll = () => {
  const all = permissionGroups.flatMap(g => g.permissions)
  const checked = all.filter(p => p.checked).length
  selectAll.value = checked === all.length
}

const resetPermissions = () => {
  permissionGroups.forEach(g => {
    g.checked = false; g.indeterminate = false
    g.permissions.forEach(p => p.checked = false)
  })
  selectAll.value = false
  keptHiddenPermissions = []
}

const loadPermissions = (perms = []) => {
  resetPermissions()
  keptHiddenPermissions = perms.filter(v => hiddenPermissionValues.includes(v))
  permissionGroups.forEach(g => {
    g.permissions.forEach(p => { p.checked = perms.includes(p.value) })
    const count = g.permissions.filter(p => p.checked).length
    g.checked = count === g.permissions.length
    g.indeterminate = count > 0 && count < g.permissions.length
  })
  updateSelectAll()
}

const getSelectedPermissions = () => [
  ...permissionGroups.flatMap(g => g.permissions.filter(p => p.checked).map(p => p.value)),
  ...keptHiddenPermissions,
]

// ── Stats ──
const filteredRoles = computed(() => {
  if (!search.value.trim()) return roleList.value
  const q = search.value.toLowerCase()
  return roleList.value.filter(r => r.name.toLowerCase().includes(q))
})


// ── CRUD ──
const fetchRoles = async () => {
  loading.value = true
  try {
    const { data } = await getRoles({ per_page: 100 })
    roleList.value = data.data || []
  } catch {
    roleList.value = []
  } finally {
    loading.value = false
  }
}

const openDrawer = (row = null) => {
  if (row) {
    Object.assign(form, { id: row.id, name: row.name, description: row.description || '', created_by: row.created_by || null, updated_by: row.updated_by || null, created_at: row.created_at || null, updated_at: row.updated_at || null })
    loadPermissions(row.permissions || [])
  } else {
    Object.assign(form, { id: null, name: '', description: '' })
    resetPermissions()
  }
  drawerVisible.value = true
}

const save = async () => {
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    saving.value = true
    try {
      const payload = {
        name: form.name,
        permissions: getSelectedPermissions(),
      }
      if (form.id) {
        await updateRole(form.id, payload)
        ElMessage.success('Role berhasil diperbarui')
      } else {
        await createRole(payload)
        ElMessage.success('Role berhasil ditambahkan')
      }
      drawerVisible.value = false
      fetchRoles()
    } catch (e) {
      notifyError(e, 'Gagal menyimpan role')
    } finally {
      saving.value = false
    }
  })
}

const deleteRole = async (row) => {
  try {
    await ElMessageBox.confirm(
      `Hapus role "${row.name}"?`,
      'Konfirmasi Hapus',
      { type: 'warning', confirmButtonText: 'Hapus', cancelButtonText: 'Batal' }
    )
    await apiDelete(row.id)
    ElMessage.success('Role berhasil dihapus')
    fetchRoles()
  } catch {}
}

onMounted(fetchRoles)
</script>

<style scoped>

.cell-name { font-size:13px; font-weight:600; color:var(--text-primary); }
.cell-desc { font-size:12px; color:var(--text-secondary); margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:200px; }

.perm-tags { display:flex; flex-wrap:wrap; gap:4px; }
.perm-tag { font-size:11px; }

.row-actions { display:flex; gap:4px; justify-content:flex-end; }

/* Drawer */
.drawer-body { padding:0 4px 80px; }

.drawer-section-title {
  font-size:13px; font-weight:700; color:var(--text-primary);
  margin-bottom:16px; padding-bottom:8px;
  border-bottom:1px solid var(--border-color);
  display:flex; align-items:center; justify-content:space-between;
}

.perm-groups { display:flex; flex-direction:column; gap:8px; }
.perm-group {
  background:var(--bg-main); border:1px solid var(--border-color);
  border-radius:8px; padding:12px;
}
.perm-group-header { margin-bottom:2px; }
.perm-group-label { font-size:13px; font-weight:600; }
.perm-group-desc { font-size:11px; color:var(--text-secondary); margin:4px 0 8px 22px; }
.perm-children { display:grid; grid-template-columns:1fr 1fr; gap:6px; padding-left:22px; }
@media (max-width:639px) { .perm-children { grid-template-columns:1fr; } }
/* The label sets its own size from this Element Plus variable; a plain font-size on the root never reached it. */
.perm-item { --el-checkbox-font-size: var(--font-size-xs); }

.drawer-footer { display:flex; gap:10px; padding:0 4px; }

/* Responsive */
@media (max-width:639px) { .table-wrap { display:none; } }
@media (min-width:640px) { .m-card-list { display:none; } }
/* Mobile card list */
.m-card-list { display:flex; flex-direction:column; gap:8px; }
.m-card {
  background:var(--bg-card); border:1px solid var(--border-color);
  border-radius:10px; padding:12px;
  display:flex; align-items:center; gap:10px;
}
.m-card-icon {
  width:40px; height:40px; border-radius:8px; background:var(--bg-main);
  flex-shrink:0; display:flex; align-items:center; justify-content:center; overflow:hidden;
}
.m-card-icon img { width:100%; height:100%; object-fit:cover; }
.m-card-body { flex:1; min-width:0; }
.m-card-title { font-size:13px; font-weight:600; color:var(--text-primary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.m-card-meta { font-size:11px; color:var(--text-secondary); margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.m-card-end { display:flex; flex-direction:column; align-items:flex-end; gap:6px; flex-shrink:0; }

/* C3: former inline styles */
.filter-search { width: 260px; }
.m-card-icon-role { background: rgba(124,58,237,0.15); color: var(--action); }
.m-card-actions { display: flex; gap: var(--space-1); }
.perm-section { margin-top: var(--space-5); }
.perm-count { margin-left: auto; font-size: var(--font-size-xs); font-weight: 400; }
</style>
