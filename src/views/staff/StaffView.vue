<template>
  <div>
    <!-- Header -->
    <div class="page-header">
      <div>
        <div class="breadcrumb">Settings → Staff</div>
        <h1 class="page-title">Staff</h1>
        <p class="page-desc">Kelola akun staff yang dapat mengakses sistem.</p>
      </div>
      <el-button v-if="can('settings.staff_role')" type="primary" @click="openDrawer()">
        <el-icon><Plus /></el-icon> Tambah Staff
      </el-button>
    </div>

    <!-- Stats -->
    <div class="stats-row">
      <div class="stat-item">
        <div class="stat-num">{{ stats.total }}</div>
        <div class="stat-lbl">Total Staff</div>
      </div>
      <div class="stat-divider" />
      <div class="stat-item">
        <div class="stat-num" style="color:var(--color-info)">{{ roles.length }}</div>
        <div class="stat-lbl">Role Tersedia</div>
      </div>
    </div>

    <!-- Table Card -->
    <el-card shadow="never" class="table-card">
      <div class="table-toolbar">
        <div style="display:flex;gap:10px">
          <el-input
            v-model="filters.search"
            placeholder="Cari username atau email..."
            prefix-icon="Search"
            style="width:260px"
            clearable
            @input="debouncedFetch"
          />
          <el-select v-model="filters.role_id" placeholder="Semua Role" clearable style="width:150px" @change="fetchStaffs">
            <el-option v-for="r in roles" :key="r.id" :label="r.name" :value="r.id" />
          </el-select>
          <el-select v-model="filters.store_id" placeholder="Semua Cabang" clearable style="width:160px" @change="fetchStaffs">
            <el-option v-for="s in stores" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
        </div>
        <el-button plain @click="resetFilters">
          <el-icon><RefreshRight /></el-icon> Reset
        </el-button>
      </div>

      <div v-if="isMobile" class="m-card-list">
        <div class="m-card" v-for="row in staffList" :key="row.id">
          <div class="m-card-icon" style="background:var(--color-primary);color:#fff;font-weight:700;font-size:14px">
            {{ row.username?.[0]?.toUpperCase() }}
          </div>
          <div class="m-card-body">
            <div class="m-card-title">{{ row.username }}<el-tag v-if="row.id === authStore.staff?.id" size="small" type="info" style="margin-left:6px;font-size:9px">You</el-tag></div>
            <div class="m-card-meta">{{ row.email }} · {{ row.role?.name || '—' }}</div>
          </div>
          <div class="m-card-end">
            <el-tag :type="row.deleted_at ? 'danger' : 'success'" size="small">{{ row.deleted_at ? 'Nonaktif' : 'Aktif' }}</el-tag>
            <div style="display:flex;gap:4px">
              <el-button v-if="authStore.isSystem" size="small" circle plain type="warning" @click="handleResetPassword(row)"><el-icon><Key /></el-icon></el-button>
              <el-button v-if="can('settings.staff_role')" size="small" circle plain @click="openDrawer(row)"><el-icon><Edit /></el-icon></el-button>
              <el-button v-if="can('settings.staff_role')" size="small" circle plain type="danger" :disabled="row.id === authStore.staff?.id" @click="removeStaff(row)"><el-icon><Delete /></el-icon></el-button>
            </div>
          </div>
        </div>
      </div>

      <div class="table-wrap">
      <el-table :data="staffList" v-loading="loading" size="small" style="width:100%" empty-text="Belum ada staff">
        <!-- Staff -->
        <el-table-column label="Staff" min-width="220">
          <template #default="{ row }">
            <div class="staff-cell">
              <el-avatar :size="36" :src="row.avatar_url" class="staff-avatar">
                {{ row.username?.[0]?.toUpperCase() }}
              </el-avatar>
              <div>
                <div class="cell-name">
                  {{ row.username }}
                  <el-tag v-if="row.id === authStore.staff?.id" size="small" type="info" style="margin-left:6px">You</el-tag>
                </div>
                <div class="cell-sub">{{ row.email }}</div>
              </div>
            </div>
          </template>
        </el-table-column>

        <!-- Role -->
        <el-table-column label="Role" width="130">
          <template #default="{ row }">
            <el-tag :type="getRoleTagType(row.role?.name)" size="small">
              {{ row.role?.name || '—' }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- Cabang -->
        <el-table-column label="Cabang" min-width="200" v-if="!isTablet && !isMobile">
          <template #default="{ row }">
            <template v-if="row.is_all_stores">
              <el-tag size="small" type="success" plain>Semua Cabang</el-tag>
            </template>
            <template v-else>
              <div style="display:flex;flex-wrap:wrap;gap:4px">
                <el-tag v-for="ss in row.staff_stores?.slice(0, 2)" :key="ss.id" size="small" plain>
                  {{ ss.store?.name }}
                </el-tag>
                <el-tag v-if="row.staff_stores?.length > 2" size="small" type="info">
                  +{{ row.staff_stores.length - 2 }}
                </el-tag>
                <span v-if="!row.staff_stores?.length" style="font-size:12px;color:var(--text-muted)">—</span>
              </div>
            </template>
          </template>
        </el-table-column>

        <!-- No HP -->
        <el-table-column label="No. HP" width="140" v-if="!isTablet && !isMobile">
          <template #default="{ row }">
            <span style="font-size:12px;color:var(--text-secondary)">{{ row.phone || '—' }}</span>
          </template>
        </el-table-column>

        <!-- Status -->
        <el-table-column label="Status" width="100">
          <template #default="{ row }">
            <el-tag :type="row.deleted_at ? 'danger' : 'success'" size="small">
              {{ row.deleted_at ? 'Nonaktif' : 'Aktif' }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- Aksi -->
        <el-table-column label="Aksi" width="130" align="right" fixed="right">
          <template #default="{ row }">
            <div class="row-actions">
              <el-tooltip v-if="authStore.isSystem" content="Reset Password" placement="top">
                <el-button size="small" circle plain type="warning" @click="handleResetPassword(row)">
                  <el-icon><Key /></el-icon>
                </el-button>
              </el-tooltip>
              <el-tooltip v-if="can('settings.staff_role')" content="Edit" placement="top">
                <el-button size="small" circle plain @click="openDrawer(row)">
                  <el-icon><Edit /></el-icon>
                </el-button>
              </el-tooltip>
              <el-tooltip v-if="can('settings.staff_role')" content="Hapus" placement="top">
                <el-button
                  size="small" circle plain type="danger"
                  :disabled="row.id === authStore.staff?.id"
                  @click="removeStaff(row)"
                >
                  <el-icon><Delete /></el-icon>
                </el-button>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div class="table-footer">
        <span class="footer-info">Menampilkan {{ staffList.length }} dari {{ pagination.total }} data</span>
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.per_page"
          :total="pagination.total"
          :page-sizes="[10, 20, 50]"
          layout="sizes, prev, pager, next"
          @size-change="fetchStaffs"
          @current-change="fetchStaffs"
        />
      </div>
      </div>
    </el-card>

    <!-- Drawer Add/Edit Staff -->
    <el-drawer
      v-model="drawerVisible"
      :title="form.id ? 'Edit Staff' : 'Tambah Staff'"
      direction="rtl"
      :size="isMobile ? '100%' : '420px'"
      :destroy-on-close="true"
    >
      <div class="drawer-body">
        <el-form :model="form" :rules="formRules" ref="formRef" label-position="top">
          <!-- Akun -->
          <div class="drawer-section-title">Informasi Akun</div>
          <el-form-item label="Username" prop="username">
            <el-input v-model="form.username" placeholder="Masukkan username" />
          </el-form-item>
          <el-form-item label="Email" prop="email">
            <el-input v-model="form.email" placeholder="Masukkan email" />
          </el-form-item>
          <el-form-item label="No. Handphone">
            <el-input v-model="form.phone" placeholder="Contoh: 0812-3456-7890" />
          </el-form-item>

          <!-- Password hanya saat create -->
          <template v-if="!form.id">
            <el-form-item label="Password" prop="password">
              <el-input v-model="form.password" type="password" placeholder="Minimal 6 karakter" show-password />
            </el-form-item>
            <el-form-item label="Konfirmasi Password" prop="password_confirm">
              <el-input v-model="form.password_confirm" type="password" placeholder="Masukkan ulang password" show-password />
            </el-form-item>
          </template>

          <!-- Staff Info -->
          <div class="drawer-section-title" style="margin-top:16px">Informasi Staff</div>
          <el-form-item label="Role" prop="role_id">
            <el-select v-model="form.role_id" placeholder="Pilih role" style="width:100%">
              <el-option v-for="r in roles" :key="r.id" :label="r.name" :value="r.id" />
            </el-select>
            <div class="field-hint">
              Kelola role di halaman
              <router-link to="/role" class="hint-link">Roles</router-link>.
            </div>
          </el-form-item>

          <el-form-item label="Akses Cabang">
            <div class="store-assign">
              <div
                class="store-option"
                :class="{ active: form.is_all_stores }"
                @click="form.is_all_stores = true; form.store_ids = []"
              >
                <el-icon style="color:var(--color-success)"><Shop /></el-icon>
                <div>
                  <div class="so-title">Semua Cabang</div>
                  <div class="so-desc">Akses ke seluruh cabang</div>
                </div>
              </div>
              <div
                class="store-option"
                :class="{ active: !form.is_all_stores }"
                @click="form.is_all_stores = false"
              >
                <el-icon style="color:var(--color-info)"><Location /></el-icon>
                <div>
                  <div class="so-title">Pilih Cabang</div>
                  <div class="so-desc">Batasi akses per cabang</div>
                </div>
              </div>
            </div>

            <div v-if="!form.is_all_stores" class="store-checkboxes">
              <el-checkbox
                v-for="s in stores"
                :key="s.id"
                :label="s.id"
                v-model="form.store_ids"
              >{{ s.name }}</el-checkbox>
            </div>
          </el-form-item>
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
            {{ form.id ? 'Simpan Perubahan' : 'Tambah Staff' }}
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
import { useAuthStore } from '@/stores/authStore'
import { getStaffs, createStaff, updateStaff, deleteStaff as apiDelete, resetStaffPassword } from '@/api/staff/staffApi'
import AuditTrail from '@/components/AuditTrail.vue'
import { getRoles } from '@/api/role/roleApi'
import { getStores } from '@/api/store/storeApi'

const { can } = usePermission()
const { isMobile, isTablet } = useBreakpoint()
const authStore = useAuthStore()
const loading = ref(false)
const saving = ref(false)
const resettingPassword = ref(false)
const drawerVisible = ref(false)
const formRef = ref()
const staffList = ref([])
const roles = ref([])
const stores = ref([])
const pagination = reactive({ page: 1, per_page: 10, total: 0 })
const filters = reactive({ search: '', role_id: null, store_id: null })
const stats = reactive({ total: 0, active: 0, inactive: 0 })
let debounceTimer = null

const form = reactive({
  id: null, username: '', email: '', phone: '',
  password: '', password_confirm: '',
  role_id: null, is_all_stores: true, store_ids: [],
  created_by: null, updated_by: null, created_at: null, updated_at: null,
})

const formRules = computed(() => ({
  username: [{ required: true, message: 'Username wajib diisi', trigger: 'blur' }],
  email: [{ required: true, type: 'email', message: 'Format email tidak valid', trigger: 'blur' }],
  ...(form.id ? {} : {
    password: [{ required: true, min: 6, message: 'Password minimal 6 karakter', trigger: 'blur' }],
    password_confirm: [
      { required: true, message: 'Konfirmasi password wajib diisi', trigger: 'blur' },
      {
        validator: (_, val, cb) => {
          if (val !== form.password) cb(new Error('Password tidak cocok'))
          else cb()
        },
        trigger: 'blur',
      },
    ],
  }),
  role_id: [{ required: true, message: 'Role wajib dipilih', trigger: 'change' }],
}))

const debouncedFetch = () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(fetchStaffs, 400)
}

const fetchStaffs = async () => {
  loading.value = true
  try {
    const { data } = await getStaffs({
      page: pagination.page,
      per_page: pagination.per_page,
      search: filters.search || undefined,
      role_id: filters.role_id || undefined,
      store_id: filters.store_id || undefined,
    })
    staffList.value = data.data || []
    pagination.total = data.meta?.total || 0
    if (data.stats) {
      Object.assign(stats, data.stats)
    } else {
      stats.total = pagination.total
      stats.active = staffList.value.filter(s => !s.deleted_at).length
      stats.inactive = staffList.value.filter(s => !!s.deleted_at).length
    }
  } catch {
    staffList.value = []
  } finally {
    loading.value = false
  }
}

const fetchRoles = async () => {
  try {
    const { data } = await getRoles({ per_page: 100 })
    roles.value = data.data || []
  } catch {}
}

const fetchStores = async () => {
  try {
    const { data } = await getStores({ per_page: 100 })
    stores.value = data.data || []
  } catch {}
}

const openDrawer = (row = null) => {
  if (row) {
    Object.assign(form, {
      id: row.id,
      username: row.username,
      email: row.email,
      phone: row.phone || '',
      password: '',
      password_confirm: '',
      role_id: row.role_id,
      is_all_stores: row.is_all_stores,
      store_ids: row.staff_stores?.map(ss => ss.store_id) || [],
      created_by: row.created_by || null,
      updated_by: row.updated_by || null,
      created_at: row.created_at || null,
      updated_at: row.updated_at || null,
    })
  } else {
    Object.assign(form, {
      id: null, username: '', email: '', phone: '',
      password: '', password_confirm: '',
      role_id: null, is_all_stores: true, store_ids: [],
      created_by: null, updated_by: null, created_at: null, updated_at: null,
    })
  }
  drawerVisible.value = true
}

const save = async () => {
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    saving.value = true
    try {
      const payload = {
        username: form.username,
        email: form.email,
        phone: form.phone,
        role_id: form.role_id,
        is_all_stores: form.is_all_stores,
        store_ids: form.is_all_stores ? [] : form.store_ids,
        ...(form.id ? {} : { password: form.password }),
      }
      if (form.id) {
        await updateStaff(form.id, payload)
        ElMessage.success('Staff berhasil diperbarui')
      } else {
        await createStaff(payload)
        ElMessage.success('Staff berhasil ditambahkan')
      }
      drawerVisible.value = false
      fetchStaffs()
    } catch (e) {
      ElMessage.error(e?.response?.data?.message || 'Gagal menyimpan staff')
    } finally {
      saving.value = false
    }
  })
}

const removeStaff = async (row) => {
  try {
    await ElMessageBox.confirm(
      `Hapus staff "${row.username}"?`,
      'Konfirmasi Hapus',
      { type: 'warning', confirmButtonText: 'Hapus', cancelButtonText: 'Batal' }
    )
    await apiDelete(row.id)
    ElMessage.success('Staff berhasil dihapus')
    fetchStaffs()
  } catch {}
}

const resetFilters = () => {
  Object.assign(filters, { search: '', role_id: null, store_id: null })
  fetchStaffs()
}

const handleResetPassword = async (row) => {
  try {
    await ElMessageBox.confirm(
      `Reset password untuk <b>${row.username}</b>?<br><span style="font-size:12px;color:var(--text-secondary)">Password baru akan dikirimkan ke email staff.</span>`,
      'Reset Password',
      {
        type: 'warning',
        confirmButtonText: 'Reset Password',
        cancelButtonText: 'Batal',
        dangerouslyUseHTMLString: true,
      }
    )
    resettingPassword.value = true
    await resetStaffPassword(row.id)
    ElMessage.success('Password berhasil direset. Email konfirmasi dikirim ke staff.')
  } catch (e) {
    if (e !== 'cancel') ElMessage.error(e?.response?.data?.message || 'Gagal reset password')
  } finally {
    resettingPassword.value = false
  }
}

const getRoleTagType = (name) => {
  const map = { 'Super Admin': '', 'Admin': 'success', 'Manager': 'warning', 'Cashier': 'danger' }
  return map[name] || 'info'
}

onMounted(() => {
  fetchStaffs()
  fetchRoles()
  fetchStores()
})
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

.staff-cell { display:flex; align-items:center; gap:10px; }
.staff-avatar { flex-shrink:0; background:var(--color-primary); color:#fff; font-weight:700; }
.cell-name { font-size:13px; font-weight:600; color:var(--text-primary); display:flex; align-items:center; }
.cell-sub { font-size:12px; color:var(--text-secondary); margin-top:1px; }

.row-actions { display:flex; gap:4px; justify-content:flex-end; }

.table-footer { display:flex; justify-content:space-between; align-items:center; margin-top:10px; padding-top:8px; border-top:1px solid var(--border-color); }
.footer-info { font-size:13px; color:var(--text-secondary); }

/* Drawer */
.drawer-body { padding:0 4px 80px; }
.drawer-section-title {
  font-size:13px; font-weight:700; color:var(--text-primary);
  margin-bottom:16px; padding-bottom:8px;
  border-bottom:1px solid var(--border-color);
}
.field-hint { font-size:11px; color:var(--text-muted); margin-top:4px; }
.hint-link { color:var(--color-primary-light); text-decoration:none; }
.hint-link:hover { text-decoration:underline; }

/* Store assign */
.store-assign { display:flex; gap:8px; margin-bottom:10px; }
.store-option {
  flex:1; display:flex; align-items:center; gap:10px;
  padding:10px 12px; border:1px solid var(--border-color);
  border-radius:8px; cursor:pointer; transition:all 0.2s;
}
.store-option:hover { border-color:var(--color-primary); }
.store-option.active { border-color:var(--color-primary); background:rgba(124,58,237,0.08); }
.so-title { font-size:12px; font-weight:600; color:var(--text-primary); }
.so-desc { font-size:11px; color:var(--text-secondary); }

.store-checkboxes {
  display:grid; grid-template-columns:1fr 1fr; gap:6px;
  padding:10px; background:var(--bg-main);
}
@media (max-width:639px) {
  .store-checkboxes { grid-template-columns:1fr; border-radius:8px; border:1px solid var(--border-color); }
}

.drawer-footer { display:flex; gap:10px; padding:0 4px; }

/* Responsive */
@media (max-width:639px) { .table-wrap { display:none; } }
@media (min-width:640px) { .m-card-list { display:none; } }
@media (max-width:639px) { .table-toolbar { flex-direction:column; align-items:stretch; gap:8px; } .table-toolbar .el-input, .table-toolbar .el-select { width:100% !important; } }
@media (max-width:639px) { .stats-row { flex-wrap:wrap; } .stat-item { min-width:calc(50% - 1px); } }
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
