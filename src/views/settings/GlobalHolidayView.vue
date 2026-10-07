<template>
  <div>
    <!-- Header -->
    <PageHeader breadcrumb="Settings → Tanggal Merah Global" title="Tanggal Merah Global" description="Kelola hari libur nasional yang berlaku di semua cabang.">
      <template #actions>
        <el-button v-if="can('settings.branches')" type="primary" @click="openDrawer()">
          <el-icon><Plus /></el-icon> Tambah Tanggal Merah
        </el-button>
      </template>
    </PageHeader>

    <!-- Table Card -->
    <el-card shadow="never" class="table-card">
      <FilterBar>
        <el-input class="filter-search"
          v-model="search"
          placeholder="Cari nama hari libur..."
          prefix-icon="Search"
         
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
          @change="applyFilters"
        />
        <template #actions>
          <el-button plain @click="resetFilters">
            <el-icon><RefreshRight /></el-icon> Reset
          </el-button>
        </template>
      </FilterBar>

      <!-- Mobile card list -->
      <div v-if="isMobile" class="m-card-list">
        <div class="m-card" v-for="row in holidays" :key="row.id">
          <div class="m-card-icon">
            <el-icon size="18" class="u-text-danger"><Calendar /></el-icon>
          </div>
          <div class="m-card-body">
            <div class="m-card-title">{{ row.name }}</div>
            <div class="m-card-meta">{{ formatDate(row.date) }}</div>
          </div>
          <div class="m-card-end">
            <div class="m-card-actions">
              <el-button v-if="can('settings.branches')" size="small" circle plain @click="openDrawer(row)"><el-icon><Edit /></el-icon></el-button>
              <el-button v-if="can('settings.branches')" size="small" circle plain type="danger" @click="removeHoliday(row)"><el-icon><Delete /></el-icon></el-button>
            </div>
          </div>
        </div>
        <div class="table-empty" v-if="!loading && holidays.length === 0">
          Belum ada tanggal merah
        </div>
      </div>

      <!-- Desktop table -->
      <div class="table-wrap">
        <el-table :data="holidays" v-loading="loading" size="small" class="u-w-full" empty-text="Belum ada tanggal merah">
          <el-table-column label="Nama Hari Libur" min-width="240">
            <template #default="{ row }">
              <div class="holiday-name-cell">
                <div class="hday-icon"><el-icon class="u-text-danger"><Calendar /></el-icon></div>
                <span class="holiday-name">{{ row.name }}</span>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="Tanggal" width="160">
            <template #default="{ row }">
              <span class="holiday-date">
                {{ formatDate(row.date) }}
              </span>
            </template>
          </el-table-column>

          <el-table-column label="Hari" width="120" v-if="!isMobile && !isTablet">
            <template #default="{ row }">
              <span class="u-text-xs u-text-secondary">{{ getDayName(row.date) }}</span>
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
              <span class="u-text-xs u-text-secondary">{{ row.description || '—' }}</span>
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
          <TablePagination
            v-model:page="page"
            v-model:page-size="perPage"
            :total="total"
            @change="fetchHolidays"
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
              class="u-w-full"
            />
          </el-form-item>
          <!-- Jam Operasional Khusus -->
          <div class="two-col">
            <el-form-item label="Jam Buka *" prop="open_time">
              <el-time-picker
                v-model="form.open_time"
                format="HH:mm"
                value-format="HH:mm"
                placeholder="10:00"
                class="u-w-full"
              />
            </el-form-item>
            <el-form-item label="Jam Tutup *" prop="close_time">
              <el-time-picker
                v-model="form.close_time"
                format="HH:mm"
                value-format="HH:mm"
                placeholder="02:00"
                class="u-w-full"
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
          <el-button @click="drawerVisible = false" class="u-flex-1">Batal</el-button>
          <el-button type="primary" :loading="saving" @click="save" class="u-flex-1">
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
import { notifyError } from '@/utils/notify'
import PageHeader from '@/components/ui/PageHeader.vue'
import FilterBar from '@/components/ui/FilterBar.vue'
import TablePagination from '@/components/ui/TablePagination.vue'
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

// Filter changes start again at page 1; the pager keeps calling fetchHolidays.
const applyFilters = () => {
  page.value = 1
  fetchHolidays()
}

const debouncedFetch = () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(applyFilters, 400)
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
      notifyError(e, 'Gagal menyimpan')
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
  applyFilters()
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

/* C3: former inline styles */
.filter-search { width: 260px; }
.m-card-actions { display: flex; gap: var(--space-1); }
.table-empty { text-align: center; padding: calc(var(--space-4) * 2); color: var(--text-muted); font-size: var(--font-size-sm); }
.holiday-name { font-weight: 600; font-size: var(--font-size-sm); color: var(--text-primary); }
.holiday-date { font-size: var(--font-size-sm); color: var(--text-secondary); font-variant-numeric: tabular-nums; }
.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3); }
</style>
