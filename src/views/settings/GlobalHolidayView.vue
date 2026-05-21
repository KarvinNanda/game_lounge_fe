<template>
  <div>
    <!-- Header -->
    <div class="page-header">
      <div>
        <div class="breadcrumb">Settings → Tanggal Merah Global</div>
        <h1 class="page-title">Tanggal Merah Global</h1>
        <p class="page-desc">Kelola hari libur nasional yang berlaku di semua cabang.</p>
      </div>
      <el-button v-if="can('settings.branches')" type="primary" @click="openDrawer()">
        <el-icon><Plus /></el-icon> Tambah Tanggal Merah
      </el-button>
    </div>

    <!-- Table Card -->
    <el-card shadow="never" class="table-card">
      <div class="table-toolbar">
        <div style="display:flex;gap:10px">
          <el-input
            v-model="search"
            placeholder="Cari nama hari libur..."
            prefix-icon="Search"
            style="width:260px"
            clearable
            @input="debouncedFetch"
          />
          <el-date-picker
            v-model="yearFilter"
            type="year"
            format="YYYY"
            value-format="YYYY"
            placeholder="Filter tahun"
            :style="{ width: '130px' }"
            clearable
            @change="fetchHolidays"
          />
        </div>
        <el-button plain @click="resetFilters">
          <el-icon><RefreshRight /></el-icon> Reset
        </el-button>
      </div>

      <!-- Mobile card list -->
      <div v-if="isMobile" class="m-card-list">
        <div class="m-card" v-for="row in holidays" :key="row.id">
          <div class="m-card-icon">
            <el-icon size="18" style="color:var(--color-danger)"><Calendar /></el-icon>
          </div>
          <div class="m-card-body">
            <div class="m-card-title">{{ row.name }}</div>
            <div class="m-card-meta">{{ formatDate(row.date) }}</div>
          </div>
          <div class="m-card-end">
            <div style="display:flex;gap:4px">
              <el-button v-if="can('settings.branches')" size="small" circle plain @click="openDrawer(row)"><el-icon><Edit /></el-icon></el-button>
              <el-button v-if="can('settings.branches')" size="small" circle plain type="danger" @click="removeHoliday(row)"><el-icon><Delete /></el-icon></el-button>
            </div>
          </div>
        </div>
        <div v-if="!loading && holidays.length === 0" style="text-align:center;padding:32px;color:var(--text-muted);font-size:13px">
          Belum ada tanggal merah
        </div>
      </div>

      <!-- Desktop table -->
      <div class="table-wrap">
        <el-table :data="holidays" v-loading="loading" size="small" style="width:100%" empty-text="Belum ada tanggal merah">
          <el-table-column label="Nama Hari Libur" min-width="240">
            <template #default="{ row }">
              <div class="holiday-name-cell">
                <div class="hday-icon"><el-icon style="color:var(--color-danger)"><Calendar /></el-icon></div>
                <span style="font-weight:600;font-size:13px;color:var(--text-primary)">{{ row.name }}</span>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="Tanggal" width="160">
            <template #default="{ row }">
              <span style="font-size:13px;color:var(--text-secondary);font-variant-numeric:tabular-nums">
                {{ formatDate(row.date) }}
              </span>
            </template>
          </el-table-column>

          <el-table-column label="Hari" width="120" v-if="!isMobile && !isTablet">
            <template #default="{ row }">
              <span style="font-size:12px;color:var(--text-secondary)">{{ getDayName(row.date) }}</span>
            </template>
          </el-table-column>

          <el-table-column label="Jam Buka" width="100" v-if="!isMobile && !isTablet">
            <template #default="{ row }">
              <el-tag type="success" size="small">{{ row.open_time?.slice(0,5) || '—' }}</el-tag>
            </template>
          </el-table-column>

          <el-table-column label="Jam Tutup" width="100" v-if="!isMobile && !isTablet">
            <template #default="{ row }">
              <el-tag type="danger" size="small">{{ row.close_time?.slice(0,5) || '—' }}</el-tag>
            </template>
          </el-table-column>

          <el-table-column label="Keterangan" min-width="160" v-if="!isMobile && !isTablet">
            <template #default="{ row }">
              <span style="font-size:12px;color:var(--text-secondary)">{{ row.description || '—' }}</span>
            </template>
          </el-table-column>

          <el-table-column label="Aksi" width="100" align="right" fixed="right">
            <template #default="{ row }">
              <div class="row-actions">
                <el-tooltip v-if="can('settings.branches')" content="Edit" placement="top">
                  <el-button size="small" circle plain @click="openDrawer(row)">
                    <el-icon><Edit /></el-icon>
                  </el-button>
                </el-tooltip>
                <el-tooltip v-if="can('settings.branches')" content="Hapus" placement="top">
                  <el-button size="small" circle plain type="danger" @click="removeHoliday(row)">
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </el-tooltip>
              </div>
            </template>
          </el-table-column>
        </el-table>

        <div class="table-footer">
          <span class="footer-info">Menampilkan {{ holidays.length }} dari {{ total }} data</span>
          <el-pagination
            v-model:current-page="page"
            v-model:page-size="perPage"
            :total="total"
            :page-sizes="[10, 20, 50]"
            layout="sizes, prev, pager, next"
            @size-change="fetchHolidays"
            @current-change="fetchHolidays"
          />
        </div>
      </div>
    </el-card>

    <!-- Drawer Add/Edit -->
    <el-drawer
      v-model="drawerVisible"
      :title="form.id ? 'Edit Tanggal Merah' : 'Tambah Tanggal Merah'"
      direction="rtl"
      :size="isMobile ? '100%' : '420px'"
      :destroy-on-close="true"
    >
      <div class="drawer-body">
        <el-form :model="form" :rules="formRules" ref="formRef" label-position="top">
          <el-form-item label="Nama Hari Libur" prop="name">
            <el-input v-model="form.name" placeholder="Contoh: Hari Raya Idul Fitri" />
          </el-form-item>
          <el-form-item label="Tanggal" prop="date">
            <el-date-picker
              v-model="form.date"
              type="date"
              format="DD MMM YYYY"
              value-format="YYYY-MM-DD"
              placeholder="Pilih tanggal"
              style="width:100%"
            />
          </el-form-item>
          <!-- Jam Operasional Khusus -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <el-form-item label="Jam Buka *" prop="open_time">
              <el-time-picker
                v-model="form.open_time"
                format="HH:mm"
                value-format="HH:mm"
                placeholder="10:00"
                style="width:100%"
              />
            </el-form-item>
            <el-form-item label="Jam Tutup *" prop="close_time">
              <el-time-picker
                v-model="form.close_time"
                format="HH:mm"
                value-format="HH:mm"
                placeholder="02:00"
                style="width:100%"
              />
            </el-form-item>
          </div>

          <el-form-item label="Keterangan (opsional)">
            <el-input
              v-model="form.description"
              type="textarea"
              :rows="2"
              placeholder="Deskripsi singkat hari libur..."
            />
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <div class="drawer-footer">
          <el-button @click="drawerVisible = false" style="flex:1">Batal</el-button>
          <el-button type="primary" :loading="saving" @click="save" style="flex:1">
            {{ form.id ? 'Simpan Perubahan' : 'Tambah' }}
          </el-button>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { usePermission } from '@/composables/usePermission'
import { useBreakpoint } from '@/composables/useBreakpoint'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getGlobalHolidays,
  createGlobalHoliday,
  updateGlobalHoliday,
  deleteGlobalHoliday,
} from '@/api/store/storeApi'

const { can } = usePermission()
const { isMobile, isTablet } = useBreakpoint()

const loading = ref(false)
const saving  = ref(false)
const drawerVisible = ref(false)
const formRef = ref()
const holidays = ref([])
const search    = ref('')
const yearFilter = ref(null)
const page = ref(1)
const perPage = ref(20)
const total = ref(0)
let debounceTimer = null

const form = reactive({ id: null, name: '', date: '', description: '', open_time: '10:00', close_time: '02:00' })

const formRules = {
  name:       [{ required: true, message: 'Nama hari libur wajib diisi', trigger: 'blur' }],
  date:       [{ required: true, message: 'Tanggal wajib dipilih', trigger: 'change' }],
  open_time:  [{ required: true, message: 'Jam buka wajib diisi', trigger: 'change' }],
  close_time: [{ required: true, message: 'Jam tutup wajib diisi', trigger: 'change' }],
}

const debouncedFetch = () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(fetchHolidays, 400)
}

const fetchHolidays = async () => {
  loading.value = true
  try {
    const { data } = await getGlobalHolidays({
      page: page.value,
      per_page: perPage.value,
      search: search.value || undefined,
      year: yearFilter.value || undefined,
    })
    holidays.value = data.data || []
    total.value = data.meta?.total || holidays.value.length
  } catch {
    holidays.value = []
  } finally {
    loading.value = false
  }
}

const openDrawer = (row = null) => {
  if (row) {
    Object.assign(form, {
      id: row.id, name: row.name, date: row.date, description: row.description || '',
      open_time:  row.open_time?.slice(0,5)  || '10:00',
      close_time: row.close_time?.slice(0,5) || '02:00',
    })
  } else {
    Object.assign(form, { id: null, name: '', date: '', description: '', open_time: '10:00', close_time: '02:00' })
  }
  drawerVisible.value = true
}

const save = async () => {
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    saving.value = true
    try {
      const payload = { name: form.name, date: form.date, description: form.description, open_time: form.open_time, close_time: form.close_time }
      if (form.id) {
        await updateGlobalHoliday(form.id, payload)
        ElMessage.success('Tanggal merah berhasil diperbarui')
      } else {
        await createGlobalHoliday(payload)
        ElMessage.success('Tanggal merah berhasil ditambahkan')
      }
      drawerVisible.value = false
      fetchHolidays()
    } catch (e) {
      ElMessage.error(e?.response?.data?.message || 'Gagal menyimpan')
    } finally {
      saving.value = false
    }
  })
}

const removeHoliday = async (row) => {
  try {
    await ElMessageBox.confirm(
      `Hapus "${row.name}" (${formatDate(row.date)})?`,
      'Konfirmasi Hapus',
      { type: 'warning', confirmButtonText: 'Hapus', cancelButtonText: 'Batal' }
    )
    await deleteGlobalHoliday(row.id)
    ElMessage.success('Tanggal merah berhasil dihapus')
    fetchHolidays()
  } catch {}
}

const resetFilters = () => {
  search.value = ''
  yearFilter.value = null
  fetchHolidays()
}

const formatDate = (val) => {
  if (!val) return '—'
  try {
    return new Date(val).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
  } catch { return val }
}

const getDayName = (val) => {
  if (!val) return '—'
  try {
    return new Date(val).toLocaleDateString('id-ID', { weekday: 'long' })
  } catch { return '—' }
}

onMounted(fetchHolidays)
</script>

<style scoped>
.page-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px; gap:12px; }
.breadcrumb  { font-size:11px; color:var(--text-muted); margin-bottom:2px; }
.page-title  { font-size:18px; font-weight:700; color:var(--text-primary); }
.page-desc   { font-size:12px; color:var(--text-secondary); margin-top:2px; }

.table-card { border-color:var(--border-color) !important; }
.table-toolbar { display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; flex-wrap:wrap; gap:8px; }

.holiday-name-cell { display:flex; align-items:center; gap:10px; }
.hday-icon {
  width:30px; height:30px; border-radius:6px;
  background: rgba(239,68,68,0.1);
  display:flex; align-items:center; justify-content:center; flex-shrink:0;
}
.row-actions { display:flex; gap:4px; justify-content:flex-end; }

.table-footer { display:flex; justify-content:space-between; align-items:center; margin-top:10px; padding-top:8px; border-top:1px solid var(--border-color); }
.footer-info  { font-size:13px; color:var(--text-secondary); }

/* Drawer */
.drawer-body { padding: 0 4px 80px; }
.drawer-footer { display:flex; gap:10px; padding:0 4px; }

/* Responsive */
@media (max-width:639px) { .table-wrap { display:none; } }
@media (min-width:640px) { .m-card-list { display:none; } }
@media (max-width:639px) { .table-toolbar { flex-direction:column; align-items:stretch; } .table-toolbar .el-input { width:100% !important; } }

/* Mobile card list */
.m-card-list { display:flex; flex-direction:column; gap:8px; }
.m-card {
  background:var(--bg-card); border:1px solid var(--border-color);
  border-radius:10px; padding:12px;
  display:flex; align-items:center; gap:10px;
}
.m-card-icon {
  width:40px; height:40px; border-radius:8px;
  background:rgba(239,68,68,0.1);
  flex-shrink:0; display:flex; align-items:center; justify-content:center;
}
.m-card-body  { flex:1; min-width:0; }
.m-card-title { font-size:13px; font-weight:600; color:var(--text-primary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.m-card-meta  { font-size:11px; color:var(--text-secondary); margin-top:2px; }
.m-card-end   { display:flex; flex-direction:column; align-items:flex-end; gap:6px; flex-shrink:0; }
</style>
