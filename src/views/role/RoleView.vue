<template>
  <div>
    <!-- Header -->
    <div class="page-header">
      <div>
        <div class="breadcrumb">Settings → Roles</div>
        <h1 class="page-title">Roles</h1>
        <p class="page-desc">Kelola role dan hak akses untuk setiap jabatan staff.</p>
      </div>
      <el-button v-if="can('settings.staff_role')" type="primary" @click="openDrawer()">
        <el-icon><Plus /></el-icon> Tambah Role
      </el-button>
    </div>

    <!-- Stats -->
    <div class="stats-row">
      <div class="stat-item">
        <div class="stat-num">{{ roleList.length }}</div>
        <div class="stat-lbl">Total Role</div>
      </div>
    </div>

    <!-- Table -->
    <el-card shadow="never" class="table-card">
      <div class="table-toolbar">
        <el-input
          v-model="search"
          placeholder="Cari nama role..."
          prefix-icon="Search"
          style="width:260px"
          clearable
        />
        <el-button plain @click="search = ''">
          <el-icon><RefreshRight /></el-icon> Reset
        </el-button>
      </div>

      <div v-if="isMobile" class="m-card-list">
        <div class="m-card" v-for="row in filteredRoles" :key="row.id">
          <div class="m-card-icon" style="background:rgba(124,58,237,0.15);color:var(--color-primary)">
            <el-icon size="18"><UserFilled /></el-icon>
          </div>
          <div class="m-card-body">
            <div class="m-card-title">{{ row.name }}</div>
            <div class="m-card-meta">{{ row.permissions?.length || 0 }} permission · {{ row.staff_count || 0 }} staff</div>
          </div>
          <div class="m-card-end">
            <div style="display:flex;gap:4px">
              <el-button v-if="can('settings.staff_role')" size="small" circle plain @click="openDrawer(row)"><el-icon><Edit /></el-icon></el-button>
              <el-button v-if="can('settings.staff_role')" size="small" circle plain type="danger" :disabled="(row.staff_count || 0) > 0" @click="deleteRole(row)"><el-icon><Delete /></el-icon></el-button>
            </div>
          </div>
        </div>
      </div>

      <div class="table-wrap">
      <el-table :data="filteredRoles" v-loading="loading" size="small" style="width:100%" empty-text="Belum ada role">
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
            <span v-else style="font-size:12px;color:var(--text-muted)">Tidak ada permission</span>
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
              <el-tooltip v-if="can('settings.staff_role')" content="Edit" placement="top">
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
      :title="form.id ? 'Edit Role' : 'Tambah Role'"
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
          <div class="drawer-section-title" style="margin-top:20px">
            Hak Akses
            <el-checkbox
              v-model="selectAll"
              :indeterminate="isIndeterminate"
              @change="toggleAll"
              style="margin-left:auto;font-size:12px;font-weight:400"
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
          <el-button @click="drawerVisible = false" style="flex:1">Batal</el-button>
          <el-button type="primary" :loading="saving" @click="save" style="flex:1">
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
import { getRoles, createRole, updateRole, deleteRole as apiDelete } from '@/api/role/roleApi'
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
const permissionGroups = reactive([
  { key: 'dashboard', label: 'Dashboard', description: 'Akses ke halaman dashboard utama.', checked: false, indeterminate: false, permissions: [{ label: 'View Dashboard', value: 'dashboard.view', checked: false }] },
  { key: 'bookings', label: 'Bookings', description: 'Kelola booking & pembayaran.', checked: false, indeterminate: false, permissions: [{ label: 'View', value: 'bookings.view', checked: false }, { label: 'Create', value: 'bookings.create', checked: false }, { label: 'Edit', value: 'bookings.edit', checked: false }, { label: 'Cancel', value: 'bookings.cancel', checked: false }] },
  { key: 'rooms', label: 'Rooms', description: 'Kelola data room & console.', checked: false, indeterminate: false, permissions: [{ label: 'View', value: 'rooms.view', checked: false }, { label: 'Create', value: 'rooms.create', checked: false }, { label: 'Edit', value: 'rooms.edit', checked: false }, { label: 'Delete', value: 'rooms.delete', checked: false }] },
  { key: 'schedule', label: 'Schedule', description: 'Kelola jadwal & kalender.', checked: false, indeterminate: false, permissions: [{ label: 'View', value: 'schedule.view', checked: false }, { label: 'Edit', value: 'schedule.edit', checked: false }] },
  { key: 'orders_fnb', label: 'Orders (F&B)', description: 'Kelola pesanan makanan & minuman.', checked: false, indeterminate: false, permissions: [{ label: 'View', value: 'orders_fnb.view', checked: false }, { label: 'Create', value: 'orders_fnb.create', checked: false }, { label: 'Edit', value: 'orders_fnb.edit', checked: false }, { label: 'Cancel', value: 'orders_fnb.cancel', checked: false }] },
  { key: 'customers', label: 'Customers', description: 'Kelola data pelanggan.', checked: false, indeterminate: false, permissions: [{ label: 'View', value: 'customers.view', checked: false }, { label: 'Create', value: 'customers.create', checked: false }, { label: 'Edit', value: 'customers.edit', checked: false }] },
  { key: 'membership', label: 'Membership', description: 'Kelola paket membership.', checked: false, indeterminate: false, permissions: [{ label: 'View', value: 'membership.view', checked: false }, { label: 'Create', value: 'membership.create', checked: false }, { label: 'Edit', value: 'membership.edit', checked: false }] },
  { key: 'play_credits', label: 'Play Credits', description: 'Kelola paket play credits.', checked: false, indeterminate: false, permissions: [{ label: 'View', value: 'play_credits.view', checked: false }, { label: 'Create', value: 'play_credits.create', checked: false }, { label: 'Edit', value: 'play_credits.edit', checked: false }] },
  { key: 'pricing', label: 'Pricing', description: 'Kelola harga & paket.', checked: false, indeterminate: false, permissions: [{ label: 'View', value: 'pricing.view', checked: false }, { label: 'Edit', value: 'pricing.edit', checked: false }] },
  { key: 'promotion', label: 'Promotion', description: 'Kelola promo & kupon.', checked: false, indeterminate: false, permissions: [{ label: 'View', value: 'promotion.view', checked: false }, { label: 'Create', value: 'promotion.create', checked: false }, { label: 'Edit', value: 'promotion.edit', checked: false }] },
  { key: 'payment_setting', label: 'Payment Setting', description: 'Kelola pengaturan pembayaran.', checked: false, indeterminate: false, permissions: [{ label: 'View', value: 'payment_setting.view', checked: false }, { label: 'Edit', value: 'payment_setting.edit', checked: false }] },
  { key: 'settings', label: 'Settings', description: 'Kelola pengaturan sistem.', checked: false, indeterminate: false, permissions: [{ label: 'Staff & Role', value: 'settings.staff_role', checked: false }, { label: 'Branches', value: 'settings.branches', checked: false }, { label: 'System Preference', value: 'settings.system_preference', checked: false }, { label: 'Activity Log', value: 'settings.activity_log', checked: false }] },
])

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
}

const loadPermissions = (perms = []) => {
  resetPermissions()
  permissionGroups.forEach(g => {
    g.permissions.forEach(p => { p.checked = perms.includes(p.value) })
    const count = g.permissions.filter(p => p.checked).length
    g.checked = count === g.permissions.length
    g.indeterminate = count > 0 && count < g.permissions.length
  })
  updateSelectAll()
}

const getSelectedPermissions = () =>
  permissionGroups.flatMap(g => g.permissions.filter(p => p.checked).map(p => p.value))

// ── Stats ──
const filteredRoles = computed(() => {
  if (!search.value.trim()) return roleList.value
  const q = search.value.toLowerCase()
  return roleList.value.filter(r => r.name.toLowerCase().includes(q))
})

const totalPermissions = computed(() =>
  roleList.value.reduce((sum, r) => sum + (r.permissions?.length || 0), 0)
)

const totalStaffAssigned = computed(() =>
  roleList.value.reduce((sum, r) => sum + (r.staff_count || 0), 0)
)

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
      ElMessage.error(e?.response?.data?.message || 'Gagal menyimpan role')
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
.page-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px; }
.breadcrumb { font-size:11px; color:var(--text-muted); margin-bottom:2px; }
.page-title { font-size:18px; font-weight:700; color:var(--text-primary); }
.page-desc { font-size:12px; color:var(--text-secondary); margin-top:2px; }

.stats-row {
  display:flex; align-items:center;
  background:var(--bg-card); border:1px solid var(--border-color);
  border-radius:8px; padding:10px 16px; margin-bottom:12px;
}
.stat-item { text-align:center; flex:1; }
.stat-num { font-size:18px; font-weight:700; color:var(--text-primary); }
.stat-lbl { font-size:11px; color:var(--text-secondary); margin-top:1px; }
.stat-divider { width:1px; height:28px; background:var(--border-color); margin:0 4px; }

.table-card { border-color:var(--border-color) !important; }
.table-toolbar { display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; }

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
.perm-item { font-size:12px !important; }

.drawer-footer { display:flex; gap:10px; padding:0 4px; }

/* Responsive */
@media (max-width:639px) { .table-wrap { display:none; } }
@media (min-width:640px) { .m-card-list { display:none; } }
@media (max-width:639px) { .table-toolbar { flex-direction:column; align-items:stretch; gap:8px; } .table-toolbar .el-input, .table-toolbar .el-select { width:100% !important; } }
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
</style>
