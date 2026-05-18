<template>
  <div>
    <!-- Header -->
    <div class="page-header">
      <div>
        <div class="breadcrumb">Store → Facilities</div>
        <h1 class="page-title">Facilities</h1>
        <p class="page-desc">Kelola daftar fasilitas yang tersedia di setiap store.</p>
      </div>
      <el-button v-if="can('settings.branches')" type="primary" @click="$router.push('/facility/create')">
        <el-icon><Plus /></el-icon> Tambah Fasilitas
      </el-button>
    </div>

    <!-- Stats Row -->
    <div class="stats-row">
      <div class="stat-item">
        <div class="stat-num">{{ stats.total }}</div>
        <div class="stat-lbl">Total</div>
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
        <div class="stat-num" style="color:var(--color-primary)">{{ stats.total_categories }}</div>
        <div class="stat-lbl">Kategori</div>
      </div>
    </div>

    <!-- Table -->
    <el-card shadow="never" class="table-card">
      <div class="table-toolbar">
        <div style="display:flex;gap:10px">
          <el-input
            v-model="filters.search"
            placeholder="Cari nama fasilitas..."
            prefix-icon="Search"
            style="width:240px"
            clearable
            @input="debouncedFetch"
          />
          <el-select
            v-model="filters.category_id"
            placeholder="Semua Kategori"
            clearable
            style="width:160px"
            @change="fetchFacilities"
          >
            <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
          <el-select
            v-model="filters.status"
            placeholder="Semua Status"
            clearable
            style="width:140px"
            @change="fetchFacilities"
          >
            <el-option label="Aktif" value="active" />
            <el-option label="Nonaktif" value="inactive" />
          </el-select>
        </div>
        <el-button plain @click="resetFilters">
          <el-icon><RefreshRight /></el-icon> Reset
        </el-button>
      </div>

      <div v-if="isMobile" class="m-card-list">
        <div class="m-card" v-for="row in facilityList" :key="row.id">
          <div class="m-card-icon">
            <img v-if="row.icon_url" :src="getImageUrl(row.icon_url)" :alt="row.name" style="width:28px;height:28px;object-fit:contain" />
            <el-icon v-else size="18" style="color:var(--text-muted)"><Picture /></el-icon>
          </div>
          <div class="m-card-body">
            <div class="m-card-title">{{ row.name }}</div>
            <div class="m-card-meta">{{ row.category?.name || '—' }}</div>
          </div>
          <div class="m-card-end">
            <el-tag :type="row.is_active ? 'success' : 'danger'" size="small">{{ row.is_active ? 'Aktif' : 'Nonaktif' }}</el-tag>
            <div style="display:flex;gap:4px">
              <el-button v-if="can('settings.branches')" size="small" circle plain @click="$router.push(`/facility/${row.id}/edit`)"><el-icon><Edit /></el-icon></el-button>
              <el-button v-if="can('settings.branches')" size="small" circle plain type="danger" @click="deleteFacility(row)"><el-icon><Delete /></el-icon></el-button>
            </div>
          </div>
        </div>
      </div>

      <div class="table-wrap">
      <el-table :data="facilityList" v-loading="loading" size="small" style="width:100%" empty-text="Tidak ada fasilitas ditemukan">
        <el-table-column label="Fasilitas" min-width="220">
          <template #default="{ row }">
            <div class="facility-cell">
              <div>
                <div class="cell-name">{{ row.name }}</div>
                <div class="cell-desc" v-if="row.description">{{ row.description }}</div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="Icon" min-width="120">
          <template #default="{ row }">
            <div class="facility-icon">
                <img v-if="row.icon_url" :src="getImageUrl(row.icon_url)" :alt="row.name" />
                <el-icon v-else size="16" style="color:var(--text-muted)"><Picture /></el-icon>
              </div>
          </template>
        </el-table-column>

        <el-table-column label="Kategori" min-width="160" v-if="!isTablet && !isMobile">
          <template #default="{ row }">
            <el-tag size="small" type="info" plain>{{ row.category?.name || '-' }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="Status" min-width="110">
          <template #default="{ row }">
            <el-tag :type="row.is_active ? 'success' : 'danger'" size="small">
              {{ row.is_active ? 'Aktif' : 'Nonaktif' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="Aksi" min-width="120" align="right" fixed="right">
          <template #default="{ row }">
            <div class="row-actions">
              <el-tooltip v-if="can('settings.branches')" :content="row.is_active ? 'Nonaktifkan' : 'Aktifkan'" placement="top">
                <el-button
                  size="small"
                  circle
                  plain
                  :type="row.is_active ? 'warning' : 'success'"
                  @click="toggleActive(row)"
                >
                  <el-icon><component :is="row.is_active ? 'VideoPause' : 'VideoPlay'" /></el-icon>
                </el-button>
              </el-tooltip>
              <el-tooltip v-if="can('settings.branches')" content="Edit" placement="top">
                <el-button size="small" circle plain @click="$router.push(`/facility/${row.id}/edit`)">
                  <el-icon><Edit /></el-icon>
                </el-button>
              </el-tooltip>
              <el-tooltip v-if="can('settings.branches')" content="Hapus" placement="top">
                <el-button size="small" circle plain type="danger" @click="deleteFacility(row)">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div class="table-footer">
        <span class="footer-info">Menampilkan {{ facilityList.length }} dari {{ pagination.total }} data</span>
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.per_page"
          :total="pagination.total"
          :page-sizes="[10, 20, 50]"
          layout="sizes, prev, pager, next"
          @size-change="fetchFacilities"
          @current-change="fetchFacilities"
        />
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
import { getFacilities, deleteFacility as apiDelete, updateFacility, getFacilityCategories } from '@/api/facility/facilityApi'
import { getImageUrl } from '@/utils/imageHelper'

const { can } = usePermission()
const { isMobile, isTablet } = useBreakpoint()
const loading = ref(false)
const facilityList = ref([])
const categories = ref([])
const stats = reactive({ total: 0, active: 0, inactive: 0, total_categories: 0 })
const pagination = reactive({ page: 1, per_page: 10, total: 0 })
const filters = reactive({ search: '', category_id: null, status: null })
let debounceTimer = null

const debouncedFetch = () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(fetchFacilities, 400)
}

const fetchFacilities = async () => {
  loading.value = true
  try {
    const { data } = await getFacilities({
      page: pagination.page,
      per_page: pagination.per_page,
      search: filters.search || undefined,
      category_id: filters.category_id || undefined,
      is_active: filters.status === 'active' ? true : filters.status === 'inactive' ? false : undefined,
    })
    facilityList.value = data.data || []
    pagination.total = data.meta?.total || 0
    if (data.stats) Object.assign(stats, data.stats)
    else {
      stats.total = pagination.total
    }
  } catch {
    facilityList.value = []
  } finally {
    loading.value = false
  }
}

const fetchCategories = async () => {
  try {
    const { data } = await getFacilityCategories()
    categories.value = data.data || []
    stats.total_categories = categories.value.length
  } catch {}
}

const toggleActive = async (row) => {
  try {
    await updateFacility(row.id, { is_active: !row.is_active,name: row.name, category_id: row.category_id,description: row.description,icon_url: row.icon_url })
    row.is_active = !row.is_active
    ElMessage.success('Status fasilitas diperbarui')
  } catch {
    ElMessage.error('Gagal mengubah status')
  }
}

const deleteFacility = async (row) => {
  try {
    await ElMessageBox.confirm(
      `Hapus fasilitas "${row.name}"?`,
      'Konfirmasi Hapus',
      { type: 'warning', confirmButtonText: 'Hapus', cancelButtonText: 'Batal' }
    )
    await apiDelete(row.id)
    ElMessage.success('Fasilitas berhasil dihapus')
    fetchFacilities()
  } catch {}
}

const resetFilters = () => {
  Object.assign(filters, { search: '', category_id: null, status: null })
  fetchFacilities()
}

onMounted(() => {
  fetchFacilities()
  fetchCategories()
})
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}
.breadcrumb { font-size: 11px; color: var(--text-muted); margin-bottom: 2px; }
.page-title { font-size: 18px; font-weight: 700; color: var(--text-primary); }
.page-desc { font-size: 12px; color: var(--text-secondary); margin-top: 2px; }

/* Stats */
.stats-row {
  display: flex;
  align-items: center;
  gap: 0;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 10px 16px;
  margin-bottom: 12px;
}
.stat-item { text-align: center; flex: 1; }
.stat-num { font-size: 18px; font-weight: 700; color: var(--text-primary); }
.stat-lbl { font-size: 11px; color: var(--text-secondary); margin-top: 1px; }
.stat-divider { width: 1px; height: 28px; background: var(--border-color); margin: 0 4px; }

/* Table */
.table-card { border-color: var(--border-color) !important; }
.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.facility-cell { display: flex; align-items: center; gap: 12px; }
.facility-icon {
  width: 36px; height: 36px;
  background: var(--bg-main);
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; overflow: hidden;
}
.facility-icon img { width: 24px; height: 24px; object-fit: contain; }

.cell-name { font-size: 13px; font-weight: 600; color: var(--text-primary); }
.cell-desc { font-size: 12px; color: var(--text-secondary); margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px; }

.row-actions { display: flex; gap: 4px; justify-content: flex-end; }

.table-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px solid var(--border-color);
}
.footer-info { font-size: 13px; color: var(--text-secondary); }

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
