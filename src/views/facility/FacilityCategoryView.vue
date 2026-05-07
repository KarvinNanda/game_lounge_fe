<template>
  <div>
    <!-- Header -->
    <div class="page-header">
      <div>
        <div class="breadcrumb">Store → Facility Category</div>
        <h1 class="page-title">Facility Category</h1>
        <p class="page-desc">Kelola kategori untuk pengelompokan fasilitas.</p>
      </div>
      <el-button type="primary" @click="openDrawer()">
        <el-icon><Plus /></el-icon> Tambah Kategori
      </el-button>
    </div>

    <!-- Table -->
    <el-card shadow="never" class="table-card">
      <div class="table-toolbar">
        <el-input
          v-model="search"
          placeholder="Cari kategori..."
          prefix-icon="Search"
          style="width:260px"
          clearable
        />
        <span class="total-label">{{ filteredList.length }} kategori</span>
      </div>

      <el-table
        :data="filteredList"
        v-loading="loading"
        style="width:100%"
        empty-text="Belum ada kategori fasilitas"
      >
        <el-table-column label="No" type="index" width="60" />
        <el-table-column label="Nama Kategori" min-width="220">
          <template #default="{ row }">
            <span class="cell-name">{{ row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column label="Jumlah Fasilitas" width="160">
          <template #default="{ row }">
            <el-tag size="small" type="info" plain>{{ row.facility_count || 0 }} fasilitas</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Aksi" width="130" align="right">
          <template #default="{ row }">
            <div class="row-actions">
              <el-button size="small" plain @click="openDrawer(row)">
                <el-icon><Edit /></el-icon> Edit
              </el-button>
              <el-button size="small" plain type="danger" :disabled="(row.facility_count || 0) > 0" @click="deleteCategory(row)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- Drawer Add/Edit -->
    <el-drawer
      v-model="drawerVisible"
      :title="form.id ? 'Edit Kategori' : 'Tambah Kategori'"
      direction="rtl"
      size="380px"
      :destroy-on-close="true"
    >
      <div class="drawer-content">
        <p class="drawer-desc">
          {{ form.id ? 'Ubah nama kategori fasilitas.' : 'Buat kategori baru untuk mengelompokkan fasilitas.' }}
        </p>
        <el-form :model="form" :rules="rules" ref="formRef" label-position="top">
          <el-form-item label="Nama Kategori" prop="name">
            <el-input
              v-model="form.name"
              placeholder="Contoh: Console, Aksesori, Jaringan"
              maxlength="100"
              show-word-limit
            />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <div class="drawer-footer">
          <el-button @click="drawerVisible = false" style="flex:1">Batal</el-button>
          <el-button type="primary" :loading="saving" @click="save" style="flex:1">
            {{ form.id ? 'Simpan Perubahan' : 'Tambah Kategori' }}
          </el-button>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getFacilityCategories,
  createFacilityCategory,
  updateFacilityCategory,
  deleteFacilityCategory,
} from '@/api/facility/facilityApi'

const loading = ref(false)
const saving = ref(false)
const drawerVisible = ref(false)
const formRef = ref()
const categories = ref([])
const search = ref('')

const form = reactive({ id: null, name: '' })
const rules = {
  name: [{ required: true, message: 'Nama kategori wajib diisi', trigger: 'blur' }],
}

const filteredList = computed(() => {
  if (!search.value.trim()) return categories.value
  const q = search.value.toLowerCase()
  return categories.value.filter(c => c.name.toLowerCase().includes(q))
})

const fetchCategories = async () => {
  loading.value = true
  try {
    const { data } = await getFacilityCategories()
    categories.value = data.data || []
  } catch {
    categories.value = []
  } finally {
    loading.value = false
  }
}

const openDrawer = (row = null) => {
  Object.assign(form, row ? { id: row.id, name: row.name } : { id: null, name: '' })
  drawerVisible.value = true
}

const save = async () => {
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    saving.value = true
    try {
      if (form.id) {
        await updateFacilityCategory(form.id, { name: form.name })
        ElMessage.success('Kategori berhasil diperbarui')
      } else {
        await createFacilityCategory({ name: form.name })
        ElMessage.success('Kategori berhasil ditambahkan')
      }
      drawerVisible.value = false
      fetchCategories()
    } catch (e) {
      ElMessage.error(e?.response?.data?.message || 'Gagal menyimpan kategori')
    } finally {
      saving.value = false
    }
  })
}

const deleteCategory = async (row) => {
  try {
    await ElMessageBox.confirm(
      `Yakin hapus kategori "${row.name}"? Pastikan tidak ada fasilitas yang menggunakan kategori ini.`,
      'Hapus Kategori',
      { type: 'warning', confirmButtonText: 'Ya, Hapus', cancelButtonText: 'Batal' }
    )
    await deleteFacilityCategory(row.id)
    ElMessage.success('Kategori berhasil dihapus')
    fetchCategories()
  } catch {}
}

onMounted(fetchCategories)
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}
.breadcrumb { font-size: 12px; color: var(--text-muted); margin-bottom: 4px; }
.page-title { font-size: 22px; font-weight: 700; color: var(--text-primary); }
.page-desc { font-size: 13px; color: var(--text-secondary); margin-top: 4px; }

.table-card { border-color: var(--border-color) !important; }
.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.total-label { font-size: 13px; color: var(--text-muted); }

.cell-name { font-size: 13px; font-weight: 600; color: var(--text-primary); }

.row-actions { display: flex; gap: 6px; justify-content: flex-end; }

.drawer-content { padding: 4px; }
.drawer-desc { font-size: 13px; color: var(--text-secondary); margin-bottom: 20px; }

.drawer-footer {
  display: flex;
  gap: 10px;
  padding: 0 4px;
}
</style>
