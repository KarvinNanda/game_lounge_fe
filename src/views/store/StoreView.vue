<template>
  <div>
    <!-- Header -->
    <PageHeader breadcrumb="Store → Stores" title="Stores" description="Kelola semua cabang Quantum Gaming.">
      <template #actions>
        <el-button v-if="can('settings.branches')" type="primary" @click="$router.push('/store/create')">
          <el-icon><Plus /></el-icon> Buat Store Baru
        </el-button>
      </template>
    </PageHeader>

    <!-- Stats -->
    <StatStrip :items="[
      { label: 'Total Store', value: stats.total },
      { label: 'Aktif', value: stats.active, tone: 'success' },
      { label: 'Nonaktif', value: stats.inactive, tone: 'danger' },
      { label: 'Total Ruangan', value: stats.total_rooms, tone: 'info' },
    ]" />

    <!-- Table -->
    <el-card shadow="never" class="table-card">
      <FilterBar>
        <el-input class="filter-search"
          v-model="search"
          placeholder="Cari nama store atau lokasi..."
          prefix-icon="Search"
         
          clearable
          @input="debouncedFetch"
        />
        <el-select class="filter-status" v-model="statusFilter" placeholder="Semua Status" clearable @change="applyFilters">
          <el-option label="Aktif" value="active" />
          <el-option label="Nonaktif" value="inactive" />
          <el-option label="Draft" value="draft" />
        </el-select>
        <template #actions>
          <el-button plain @click="resetFilters">
            <el-icon><RefreshRight /></el-icon> Reset
          </el-button>
        </template>
      </FilterBar>

      <div v-if="isMobile" class="m-card-list">
        <div class="m-card" v-for="row in storeList" :key="row.id">
          <div class="m-card-icon">
            <img v-if="row.photo_url" :src="getImageUrl(row.photo_url)" :alt="row.name" />
            <el-icon v-else size="18" class="u-text-muted"><Shop /></el-icon>
          </div>
          <div class="m-card-body">
            <div class="m-card-title">{{ row.name }}</div>
            <div class="m-card-meta">{{ row.address || '—' }} · {{ row.room_count || 0 }} ruangan</div>
          </div>
          <div class="m-card-end">
            <el-tag :type="row.status === 'active' ? 'success' : row.status === 'draft' ? 'warning' : 'danger'" size="small">
              {{ row.status === 'active' ? 'Aktif' : row.status === 'draft' ? 'Draft' : 'Nonaktif' }}
            </el-tag>
            <div class="m-card-actions">
              <el-button v-if="can('settings.branches')" size="small" circle plain @click="$router.push(`/store/${row.id}/edit`)"><el-icon><Edit /></el-icon></el-button>
              <el-button v-if="can('settings.branches')" size="small" circle plain type="danger" @click="deleteStore(row)"><el-icon><Delete /></el-icon></el-button>
            </div>
          </div>
        </div>
      </div>

      <div class="table-wrap">
      <el-table :data="storeList" v-loading="loading" size="small" class="u-w-full" empty-text="Belum ada store">
        <el-table-column label="Store" min-width="160">
          <template #default="{ row }">
            <div class="store-cell">
              <div class="store-thumb">
                <img v-if="row.photo_url" :src="getImageUrl(row.photo_url)" :alt="row.name" />
                <el-icon v-else size="20" class="u-text-muted"><Shop /></el-icon>
              </div>
              <div>
                <div class="cell-name">{{ row.name }}</div>
                <div class="cell-addr" v-if="row.address">
                  <el-icon class="u-text-xs u-text-muted"><Location /></el-icon>
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
            <span class="u-text-sm u-text-secondary">{{ row.room_count || 0 }} ruangan</span>
          </template>
        </el-table-column>

        <el-table-column label="Status Ruangan" min-width="160" v-if="!isMobile">
          <template #default="{ row }">
            <div class="rooms-toggle-list">
              <div
                v-for="room in (row.rooms || [])"
                :key="room.id"
                class="room-toggle-item"
              >
                <span class="room-toggle-name">{{ room.name }}</span>
                <el-switch
                  :model-value="room.is_active"
                  :loading="togglingRoom === room.id"
                  size="small"
                  :disabled="!can('settings.branches')"
                  @change="handleToggleRoom(room)"
                />
              </div>
              <span v-if="!row.rooms?.length" class="u-text-xs u-text-muted">—</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="Alamat" min-width="130">
          <template #default="{ row }">
            <span class="u-text-sm u-text-secondary">{{ row.address }}</span>
          </template>
        </el-table-column>

        <el-table-column label="Jam Operasional" min-width="200" v-if="!isTablet && !isMobile">
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
                <div class="holiday-scroll">
                  <div
                    v-for="h in getHoursInfo(row).holidays"
                    :key="h.date"
                    class="holiday-row"
                  >
                    <el-icon class="holiday-dot"><Calendar /></el-icon>
                    <span class="holiday-date">{{ formatHolidayDate(h.date) }}</span>
                    <span class="holiday-time">{{ h.open_time }} – {{ h.close_time }}</span>
                  </div>
                </div>
              </template>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="Kontak" min-width="140" v-if="!isTablet && !isMobile">
          <template #default="{ row }">
            <span class="u-text-xs u-text-secondary">{{ row.whatsapp || '—' }}</span>
          </template>
        </el-table-column>

        <el-table-column label="Aksi" width="120" align="right" fixed="right">
          <template #default="{ row }">
            <div class="row-actions">
              <el-tooltip v-if="can('settings.branches')" :content="row.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'" placement="top">
                <el-button
                  size="small" circle plain
                  :type="row.status === 'active' ? 'warning' : 'success'"
                  @click="toggleStatus(row)"
                >
                  <el-icon><component :is="row.status === 'active' ? 'VideoPause' : 'VideoPlay'" /></el-icon>
                </el-button>
              </el-tooltip>
              <el-tooltip v-if="can('settings.branches')" content="Edit" placement="top">
                <el-button size="small" circle plain @click="$router.push(`/store/${row.id}/edit`)">
                  <el-icon><Edit /></el-icon>
                </el-button>
              </el-tooltip>
              <el-tooltip v-if="can('settings.branches')" content="Hapus" placement="top">
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
        <TablePagination
          v-model:page="page"
          v-model:page-size="perPage"
          :total="total"
          @change="fetchStores"
        />
      </div>
      </div>
    </el-card>

    <!-- Global Holidays Reference Card -->
    <el-card shadow="never" class="global-holiday-card u-mt-3">
      <div class="gh-header">
        <div>
          <div class="gh-title">
            <el-icon class="u-text-danger"><Calendar /></el-icon>
            Tanggal Merah Global
          </div>
          <div class="gh-desc">Berlaku untuk semua cabang. Kelola di <router-link to="/settings/global-holidays" class="gh-link">Settings → Tanggal Merah Global</router-link>.</div>
        </div>
        <el-tag size="small" type="danger" plain>{{ globalHolidays.length }} hari libur</el-tag>
      </div>

      <div class="holiday-empty" v-if="globalHolidays.length === 0">
        Belum ada tanggal merah global yang dikonfigurasi.
      </div>
      <div v-else class="gh-scroll">
        <div class="gh-list">
          <div v-for="h in globalHolidays" :key="h.id" class="gh-item">
            <div class="gh-dot"><el-icon class="u-text-danger u-text-xs"><Calendar /></el-icon></div>
            <div class="holiday-main">
              <div class="holiday-title">{{ h.name }}</div>
              <div class="u-text-xs u-text-secondary">{{ formatDate(h.date) }}</div>
            </div>
            <div class="holiday-meta" v-if="h.description">{{ h.description }}</div>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { usePermission } from '@/composables/usePermission'
import { useBreakpoint } from '@/composables/useBreakpoint'
import { ElMessage, ElMessageBox } from 'element-plus'
import { notifyError } from '@/utils/notify'
import { getStores, deleteStore as apiDelete, updateStore, updateStoreRoom, getGlobalHolidays } from '@/api/store/storeApi'
import { getImageUrl } from '@/utils/imageHelper'
import PageHeader from '@/components/ui/PageHeader.vue'
import StatStrip from '@/components/ui/StatStrip.vue'
import FilterBar from '@/components/ui/FilterBar.vue'
import TablePagination from '@/components/ui/TablePagination.vue'

const { can } = usePermission()
const { isMobile, isTablet } = useBreakpoint()
const loading = ref(false)
const storeList = ref([])
const search = ref('')
const statusFilter = ref(null)
const page = ref(1)
const perPage = ref(10)
const total = ref(0)
const stats = reactive({ total: 0, active: 0, inactive: 0, total_rooms: 0 })
const togglingRoom = ref(null)
const globalHolidays = ref([])
let debounceTimer = null

// Filter changes start again at page 1; the pager keeps calling fetchStores.
const applyFilters = () => {
  page.value = 1
  fetchStores()
}

const debouncedFetch = () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(applyFilters, 400)
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
  } catch (e) {
    notifyError(e, 'Gagal mengubah status')
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
  applyFilters()
}

const handleToggleRoom = async (room) => {
  if (togglingRoom.value === room.id) return
  const next = room.is_active ? false : true
  try {
    togglingRoom.value = room.id
    await updateStoreRoom(room.id, { is_active: next })
    room.is_active = next
    ElMessage.success(`Ruangan ${next ? 'diaktifkan' : 'dinonaktifkan'}`)
  } catch (e) {
    notifyError(e, 'Gagal mengubah status ruangan')
  } finally {
    togglingRoom.value = null
  }
}

const fetchGlobalHolidays = async () => {
  try {
    const { data } = await getGlobalHolidays()
    globalHolidays.value = data.data || []
  } catch {}
}

const formatDate = (val) => {
  if (!val) return '—'
  try {
    return new Date(val).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
  } catch { return val }
}

onMounted(() => {
  fetchStores()
  fetchGlobalHolidays()
})
</script>

<style scoped>

.store-cell { display:flex; align-items:center; gap:12px; }
.store-thumb {
  width:44px; height:34px; border-radius:6px;
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
.holiday-scroll { max-height:140px; overflow-y:auto; display:flex; flex-direction:column; gap:2px; }
.holiday-row { display:flex; align-items:center; gap:4px; }
.holiday-date { font-size:10px; font-weight:600; color:var(--color-danger); width:50px; flex-shrink:0; }
.holiday-time { font-size:10px; color:var(--text-muted); font-variant-numeric:tabular-nums; }

.rooms-toggle-list { display:flex; flex-direction:column; gap:4px; max-height:120px; overflow-y:auto; }
.room-toggle-item { display:flex; align-items:center; justify-content:space-between; gap:8px; }
.room-toggle-name { font-size:12px; color:var(--text-secondary); flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }

/* Global Holiday Card */
.gh-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px; gap:8px; }
.gh-title  { display:flex; align-items:center; gap:6px; font-size:13px; font-weight:700; color:var(--text-primary); margin-bottom:3px; }
.gh-desc   { font-size:11px; color:var(--text-secondary); }
.gh-link   { color:var(--color-primary-light); text-decoration:none; }
.gh-link:hover { text-decoration:underline; }
.gh-scroll { max-height:160px; overflow-y:auto; }
.gh-list   { display:grid; grid-template-columns:repeat(auto-fill, minmax(260px, 1fr)); gap:6px; }
.gh-item   { display:flex; align-items:flex-start; gap:8px; padding:8px 10px; background:var(--bg-main); border-radius:6px; border:1px solid var(--border-color); }
.gh-dot    { width:22px; height:22px; border-radius:6px; background:rgba(239,68,68,0.1); display:flex; align-items:center; justify-content:center; flex-shrink:0; margin-top:1px; }

.table-footer { display:flex; justify-content:space-between; align-items:center; margin-top:10px; padding-top:8px; border-top:1px solid var(--border-color); }
.footer-info { font-size:13px; color:var(--text-secondary); }

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
.filter-status { width: 140px; }
.m-card-actions { display: flex; gap: var(--space-1); }
.holiday-dot { font-size: var(--font-size-xs); color: var(--danger); flex-shrink: 0; }
.holiday-empty { text-align: center; padding: var(--space-5); font-size: var(--font-size-xs); color: var(--text-muted); }
.holiday-main { flex: 1; min-width: 0; }
.holiday-title { font-size: var(--font-size-xs); font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.holiday-meta { font-size: var(--font-size-xs); color: var(--text-muted); max-width: 160px; text-align: right; flex-shrink: 0; }
</style>
