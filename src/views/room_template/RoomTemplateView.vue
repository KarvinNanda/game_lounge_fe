<template>
  <div>
    <!-- Header -->
    <div class="page-header">
      <div>
        <div class="breadcrumb">Store → Rooms</div>
        <h1 class="page-title">Rooms</h1>
        <p class="page-desc">Kelola tipe ruangan standar yang digunakan di setiap store.</p>
      </div>
      <el-button v-if="can('rooms.create')" type="primary" @click="$router.push('/room-template/create')">
        <el-icon><Plus /></el-icon> Tambah Room
      </el-button>
    </div>

    <!-- Stats -->
    <div class="stats-row">
      <div class="stat-item">
        <div class="stat-num">{{ stats.total }}</div>
        <div class="stat-lbl">Total Room</div>
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
        <div class="stat-num" style="color:var(--color-info)">{{ stats.used_in_stores }}</div>
        <div class="stat-lbl">Dipakai di Store</div>
      </div>
    </div>

    <!-- Table -->
    <el-card shadow="never" class="table-card">
      <div class="table-toolbar">
        <el-input
          v-model="search"
          placeholder="Cari nama room..."
          prefix-icon="Search"
          style="width:260px"
          clearable
          @input="debouncedFetch"
        />
        <el-button plain @click="search = ''; fetchTemplates()">
          <el-icon><RefreshRight /></el-icon> Reset
        </el-button>
      </div>

      <div v-if="isMobile" class="m-card-list">
        <div class="m-card" v-for="row in templateList" :key="row.id">
          <div class="m-card-icon">
            <img v-if="row.image_url" :src="getImageUrl(row.image_url)" :alt="row.name" />
            <el-icon v-else size="18" style="color:var(--text-muted)"><Picture /></el-icon>
          </div>
          <div class="m-card-body">
            <div class="m-card-title">{{ row.name }}</div>
            <div class="m-card-meta">{{ row.capacity_min }}–{{ row.capacity_max }} orang</div>
          </div>
          <div class="m-card-end">
            <el-tag :type="row.is_active ? 'success' : 'danger'" size="small">{{ row.is_active ? 'Aktif' : 'Nonaktif' }}</el-tag>
            <div style="display:flex;gap:4px">
              <el-button v-if="can('rooms.edit')" size="small" circle plain @click="$router.push(`/room-template/${row.id}/edit`)"><el-icon><Edit /></el-icon></el-button>
              <el-button v-if="can('rooms.delete')" size="small" circle plain type="danger" @click="deleteTemplate(row)"><el-icon><Delete /></el-icon></el-button>
            </div>
          </div>
        </div>
      </div>

      <div class="table-wrap">
      <el-table :data="templateList" v-loading="loading" size="small" style="width:100%" empty-text="Belum ada room template">
        <el-table-column label="Room" min-width="240">
          <template #default="{ row }">
            <div class="room-cell">
              <div class="room-thumb">
                <img v-if="row.image_url" :src="getImageUrl(row.image_url)" :alt="row.name" />
                <el-icon v-else size="20" style="color:var(--text-muted)"><Picture /></el-icon>
              </div>
              <div>
                <div class="cell-name">{{ row.name }}</div>
                <div class="cell-sub" v-if="row.description">{{ row.description }}</div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="Kapasitas" width="130">
          <template #default="{ row }">
            <div style="display:flex;align-items:center;gap:4px">
              <el-icon style="color:var(--text-secondary)"><User /></el-icon>
              <span style="font-size:13px">{{ row.capacity_min }}–{{ row.capacity_max }} orang</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="Fasilitas" min-width="160" v-if="!isTablet && !isMobile">
          <template #default="{ row }">
            <div class="facility-icons" v-if="row.facilities?.length">
              <el-tooltip v-for="f in row.facilities.slice(0,5)" :key="f.id" :content="f.name" placement="top">
                <img
                  v-if="f.icon_url"
                  :src="getImageUrl(f.icon_url)"
                  :alt="f.name"
                  class="facility-icon-img"
                />
                <div v-else class="facility-icon-placeholder">{{ f.name[0] }}</div>
              </el-tooltip>
              <span v-if="row.facilities.length > 5" class="facility-more">+{{ row.facilities.length - 5 }}</span>
            </div>
            <span v-else style="font-size:12px;color:var(--text-muted)">—</span>
          </template>
        </el-table-column>

        <el-table-column label="Status" width="110">
          <template #default="{ row }">
            <el-tag :type="row.is_active ? 'success' : 'danger'" size="small">
              {{ row.is_active ? 'Aktif' : 'Nonaktif' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="Aksi" width="120" align="right" fixed="right">
          <template #default="{ row }">
            <div class="row-actions">
              <el-tooltip v-if="can('rooms.edit')" :content="row.is_active ? 'Nonaktifkan' : 'Aktifkan'" placement="top">
                <el-button
                  size="small" circle plain
                  :type="row.is_active ? 'warning' : 'success'"
                  @click="toggleActive(row)"
                >
                  <el-icon><component :is="row.is_active ? 'VideoPause' : 'VideoPlay'" /></el-icon>
                </el-button>
              </el-tooltip>
              <el-tooltip v-if="can('rooms.edit')" content="Edit" placement="top">
                <el-button size="small" circle plain @click="$router.push(`/room-template/${row.id}/edit`)">
                  <el-icon><Edit /></el-icon>
                </el-button>
              </el-tooltip>
              <el-tooltip v-if="can('rooms.delete')" content="Hapus" placement="top">
                <el-button size="small" circle plain type="danger" @click="deleteTemplate(row)">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div class="table-footer">
        <span class="footer-info">Menampilkan {{ templateList.length }} dari {{ total }} data</span>
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="perPage"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="sizes, prev, pager, next"
          @size-change="fetchTemplates"
          @current-change="fetchTemplates"
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
import { getRoomTemplates, updateRoomTemplate, deleteRoomTemplate as apiDelete } from '@/api/room_template/roomTemplateApi'
import { getImageUrl } from '@/utils/imageHelper'

const { can } = usePermission()
const { isMobile, isTablet } = useBreakpoint()
const loading = ref(false)
const templateList = ref([])
const search = ref('')
const page = ref(1)
const perPage = ref(10)
const total = ref(0)
const stats = reactive({ total: 0, active: 0, inactive: 0, used_in_stores: 0 })
let debounceTimer = null

const debouncedFetch = () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(fetchTemplates, 400)
}

const fetchTemplates = async () => {
  loading.value = true
  try {
    const { data } = await getRoomTemplates({
      page: page.value,
      per_page: perPage.value,
      search: search.value || undefined,
    })
    templateList.value = data.data || []
    total.value = data.meta?.total || 0
    if (data.stats) Object.assign(stats, data.stats)
    else stats.total = total.value
  } catch {
    templateList.value = []
  } finally {
    loading.value = false
  }
}

const toggleActive = async (row) => {
  try {
    await updateRoomTemplate(row.id, { is_active: !row.is_active,name: row.name, capacity_min: row.capacity_min, capacity_max: row.capacity_max,image_url: row.image_url })
    row.is_active = !row.is_active
    ElMessage.success('Status berhasil diperbarui')
  } catch {
    ElMessage.error('Gagal mengubah status')
  }
}

const deleteTemplate = async (row) => {
  try {
    await ElMessageBox.confirm(
      `Hapus room "${row.name}"?`,
      'Konfirmasi Hapus',
      { type: 'warning', confirmButtonText: 'Hapus', cancelButtonText: 'Batal' }
    )
    await apiDelete(row.id)
    ElMessage.success('Room berhasil dihapus')
    fetchTemplates()
  } catch {}
}

onMounted(fetchTemplates)
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

.room-cell { display:flex; align-items:center; gap:12px; }
.room-thumb {
  width:56px; height:42px; border-radius:6px;
  background:var(--bg-main); overflow:hidden;
  display:flex; align-items:center; justify-content:center;
  flex-shrink:0;
}
.room-thumb img { width:100%; height:100%; object-fit:cover; }

.cell-name { font-size:13px; font-weight:600; color:var(--text-primary); }
.cell-sub { font-size:12px; color:var(--text-secondary); margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:180px; }

.facility-icons { display:flex; align-items:center; gap:4px; flex-wrap:wrap; }
.facility-icon-img { width:22px; height:22px; object-fit:contain; border-radius:4px; background:var(--bg-main); }
.facility-icon-placeholder {
  width:22px; height:22px; border-radius:4px;
  background:var(--bg-card-hover); display:flex; align-items:center; justify-content:center;
  font-size:10px; color:var(--text-secondary); font-weight:600;
}
.facility-more { font-size:11px; color:var(--text-muted); }

.row-actions { display:flex; gap:4px; justify-content:flex-end; }

.table-footer { display:flex; justify-content:space-between; align-items:center; margin-top:10px; padding-top:8px; border-top:1px solid var(--border-color); }
.footer-info { font-size:13px; color:var(--text-secondary); }

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
