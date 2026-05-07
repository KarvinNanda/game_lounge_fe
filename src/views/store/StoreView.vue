<template>
  <div>
    <!-- Header -->
    <div class="page-header">
      <div>
        <div class="breadcrumb">Store → Stores</div>
        <h1 class="page-title">Stores</h1>
        <p class="page-desc">Kelola semua cabang Quantum Gaming.</p>
      </div>
      <el-button type="primary" @click="$router.push('/store/create')">
        <el-icon><Plus /></el-icon> Buat Store Baru
      </el-button>
    </div>

    <!-- Stats -->
    <div class="stats-row">
      <div class="stat-item">
        <div class="stat-num">{{ stats.total }}</div>
        <div class="stat-lbl">Total Store</div>
      </div>
      <div class="stat-divider" />
      <div class="stat-item">
        <div class="stat-num" style="color:var(--color-success)">{{ stats.active }}</div>
        <div class="stat-lbl">Aktif</div>
      </div>
      <div class="stat-divider" />
      <div class="stat-item">
        <div class="stat-num" style="color:var(--color-danger)">{{ stats.inactive }}</div>
        <div class="stat-lbl">Nonaktif</div>
      </div>
      <div class="stat-divider" />
      <div class="stat-item">
        <div class="stat-num" style="color:var(--color-info)">{{ stats.total_rooms }}</div>
        <div class="stat-lbl">Total Ruangan</div>
      </div>
    </div>

    <!-- Table -->
    <el-card shadow="never" class="table-card">
      <div class="table-toolbar">
        <div style="display:flex;gap:10px">
          <el-input
            v-model="search"
            placeholder="Cari nama store atau lokasi..."
            prefix-icon="Search"
            style="width:260px"
            clearable
            @input="debouncedFetch"
          />
          <el-select v-model="statusFilter" placeholder="Semua Status" clearable style="width:140px" @change="fetchStores">
            <el-option label="Aktif" value="active" />
            <el-option label="Nonaktif" value="inactive" />
            <el-option label="Draft" value="draft" />
          </el-select>
        </div>
        <el-button plain @click="resetFilters">
          <el-icon><RefreshRight /></el-icon> Reset
        </el-button>
      </div>

      <el-table :data="storeList" v-loading="loading" style="width:100%" empty-text="Belum ada store">
        <el-table-column label="Store" min-width="160">
          <template #default="{ row }">
            <div class="store-cell">
              <div class="store-thumb">
                <img v-if="row.photo_url" :src="getImageUrl(row.photo_url)" :alt="row.name" />
                <el-icon v-else size="20" style="color:var(--text-muted)"><Shop /></el-icon>
              </div>
              <div>
                <div class="cell-name">{{ row.name }}</div>
                <div class="cell-addr" v-if="row.address">
                  <el-icon style="font-size:10px;color:var(--text-muted)"><Location /></el-icon>
                  {{ row.description }}
                </div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="Status" min-width="90">
          <template #default="{ row }">
            <el-tag
              :type="row.status === 'active' ? 'success' : row.status === 'draft' ? 'warning' : 'danger'"
              size="small"
            >
              {{ row.status === 'active' ? 'Aktif' : row.status === 'draft' ? 'Draft' : 'Nonaktif' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="Jumlah Ruangan" min-width="100">
          <template #default="{ row }">
            <span style="font-size:13px;color:var(--text-secondary)">{{ row.room_count || 0 }} ruangan</span>
          </template>
        </el-table-column>

        <el-table-column label="Alamat" min-width="130">
          <template #default="{ row }">
            <span style="font-size:13px;color:var(--text-secondary)">{{ row.address }}</span>
          </template>
        </el-table-column>

        <el-table-column label="Jam Operasional" min-width="200">
          <template #default="{ row }">
            <div class="hours-cell">
              <template v-if="getHoursInfo(row).sameHours">
                <div class="hours-row">
                  <span class="hours-label">Setiap Hari</span>
                  <span class="hours-time">{{ getHoursInfo(row).weekday }}</span>
                </div>
              </template>
              <template v-else>
                <div class="hours-row" v-if="getHoursInfo(row).weekday">
                  <span class="hours-label">Sen – Kam</span>
                  <span class="hours-time">{{ getHoursInfo(row).weekday }}</span>
                </div>
                <div class="hours-row" v-if="getHoursInfo(row).weekend">
                  <span class="hours-label">Jum – Min</span>
                  <span class="hours-time">{{ getHoursInfo(row).weekend }}</span>
                </div>
              </template>
              <div v-if="!getHoursInfo(row).weekday && !getHoursInfo(row).weekend" class="hours-empty">—</div>
              <template v-if="getHoursInfo(row).holidays.length > 0">
                <div class="holiday-divider" />
                <div
                  v-for="h in getHoursInfo(row).holidays"
                  :key="h.date"
                  class="holiday-row"
                >
                  <el-icon style="font-size:9px;color:var(--color-danger);flex-shrink:0"><Calendar /></el-icon>
                  <span class="holiday-date">{{ formatHolidayDate(h.date) }}</span>
                  <span class="holiday-time">{{ h.open_time }} – {{ h.close_time }}</span>
                </div>
              </template>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="Kontak" min-width="140">
          <template #default="{ row }">
            <span style="font-size:12px;color:var(--text-secondary)">{{ row.whatsapp || '—' }}</span>
          </template>
        </el-table-column>

        <el-table-column label="Aksi" width="120" align="right" fixed="right">
          <template #default="{ row }">
            <div class="row-actions">
              <el-tooltip :content="row.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'" placement="top">
                <el-button
                  size="small" circle plain
                  :type="row.status === 'active' ? 'warning' : 'success'"
                  @click="toggleStatus(row)"
                >
                  <el-icon><component :is="row.status === 'active' ? 'VideoPause' : 'VideoPlay'" /></el-icon>
                </el-button>
              </el-tooltip>
              <el-tooltip content="Edit" placement="top">
                <el-button size="small" circle plain @click="$router.push(`/store/${row.id}/edit`)">
                  <el-icon><Edit /></el-icon>
                </el-button>
              </el-tooltip>
              <el-tooltip content="Hapus" placement="top">
                <el-button size="small" circle plain type="danger" @click="deleteStore(row)">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div class="table-footer">
        <span class="footer-info">Menampilkan {{ storeList.length }} dari {{ total }} data</span>
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="perPage"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="sizes, prev, pager, next"
          @size-change="fetchStores"
          @current-change="fetchStores"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getStores, deleteStore as apiDelete, updateStore } from '@/api/store/storeApi'
import { getImageUrl } from '@/utils/imageHelper'

const loading = ref(false)
const storeList = ref([])
const search = ref('')
const statusFilter = ref(null)
const page = ref(1)
const perPage = ref(10)
const total = ref(0)
const stats = reactive({ total: 0, active: 0, inactive: 0, total_rooms: 0 })
let debounceTimer = null

const debouncedFetch = () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(fetchStores, 400)
}

const fetchStores = async () => {
  loading.value = true
  try {
    const { data } = await getStores({
      page: page.value,
      per_page: perPage.value,
      search: search.value || undefined,
      status: statusFilter.value || undefined,
    })
    storeList.value = data.data || []
    total.value = data.meta?.total || 0
    if (data.stats) Object.assign(stats, data.stats)
    else stats.total = total.value
  } catch {
    storeList.value = []
  } finally {
    loading.value = false
  }
}

const getHoursInfo = (row) => {
  const oh = row.operating_hours || []
  const wh = oh.find(o => o.day_type === 'weekday' && o.is_active)
  const we = oh.find(o => o.day_type === 'weekend' && o.is_active)

  const fmt = (o) => o ? `${o.open_time} – ${o.close_time}` : null
  const weekday = fmt(wh)
  const weekend = fmt(we)
  const sameHours = !!(weekday && weekend && weekday === weekend)
  const holidays = (row.holidays || row.holiday_schedules || row.holidays_schedules || [])
    .filter(h => h.date)
    .sort((a, b) => a.date.localeCompare(b.date))

  return { weekday, weekend, sameHours, holidays }
}

const formatHolidayDate = (dateStr) => {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
}

const toggleStatus = async (row) => {
  const next = row.status === 'active' ? 'inactive' : 'active'
  try {
    await updateStore(row.id, { status: next,name: row.name, address: row.address, whatsapp: row.whatsapp, photo_url: row.photo_url })
    row.status = next
    ElMessage.success('Status store diperbarui')
  } catch {
    ElMessage.error('Gagal mengubah status')
  }
}

const deleteStore = async (row) => {
  try {
    await ElMessageBox.confirm(
      `Hapus store "${row.name}"?`,
      'Konfirmasi Hapus',
      { type: 'warning', confirmButtonText: 'Hapus', cancelButtonText: 'Batal' }
    )
    await apiDelete(row.id)
    ElMessage.success('Store berhasil dihapus')
    fetchStores()
  } catch {}
}

const resetFilters = () => {
  search.value = ''
  statusFilter.value = null
  fetchStores()
}

onMounted(fetchStores)
</script>

<style scoped>
.page-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:20px; }
.breadcrumb { font-size:12px; color:var(--text-muted); margin-bottom:4px; }
.page-title { font-size:22px; font-weight:700; color:var(--text-primary); }
.page-desc { font-size:13px; color:var(--text-secondary); margin-top:4px; }

.stats-row {
  display:flex; align-items:center;
  background:var(--bg-card); border:1px solid var(--border-color);
  border-radius:10px; padding:16px 24px; margin-bottom:16px;
}
.stat-item { text-align:center; flex:1; }
.stat-num { font-size:24px; font-weight:700; color:var(--text-primary); }
.stat-lbl { font-size:12px; color:var(--text-secondary); margin-top:2px; }
.stat-divider { width:1px; height:36px; background:var(--border-color); margin:0 4px; }

.table-card { border-color:var(--border-color) !important; }
.table-toolbar { display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; }

.store-cell { display:flex; align-items:center; gap:12px; }
.store-thumb {
  width:52px; height:40px; border-radius:8px;
  background:var(--bg-main); overflow:hidden;
  display:flex; align-items:center; justify-content:center;
  flex-shrink:0;
}
.store-thumb img { width:100%; height:100%; object-fit:cover; }

.cell-name { font-size:13px; font-weight:600; color:var(--text-primary); }
.cell-addr { font-size:11px; color:var(--text-secondary); margin-top:2px; display:flex; align-items:center; gap:2px; max-width:220px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }

.row-actions { display:flex; gap:4px; justify-content:flex-end; }

.hours-cell { display:flex; flex-direction:column; gap:3px; }
.hours-row { display:flex; align-items:center; gap:6px; }
.hours-label { font-size:10px; color:var(--text-muted); width:60px; flex-shrink:0; }
.hours-time { font-size:12px; color:var(--text-secondary); font-variant-numeric:tabular-nums; }
.hours-empty { font-size:12px; color:var(--text-muted); }
.holiday-divider { height:1px; background:var(--border-color); margin:3px 0; }
.holiday-row { display:flex; align-items:center; gap:4px; }
.holiday-date { font-size:10px; font-weight:600; color:var(--color-danger); width:50px; flex-shrink:0; }
.holiday-time { font-size:10px; color:var(--text-muted); font-variant-numeric:tabular-nums; }

.table-footer { display:flex; justify-content:space-between; align-items:center; margin-top:16px; padding-top:12px; border-top:1px solid var(--border-color); }
.footer-info { font-size:13px; color:var(--text-secondary); }
</style>
