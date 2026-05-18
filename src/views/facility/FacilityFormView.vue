<template>
  <div>
    <!-- Header -->
    <div class="page-header">
      <div>
        <div class="breadcrumb">Store → Facilities → {{ isEdit ? 'Edit' : 'Tambah' }}</div>
        <h1 class="page-title">{{ isEdit ? 'Edit Fasilitas' : 'Tambah Fasilitas' }}</h1>
        <p class="page-desc">{{ isEdit ? 'Perbarui informasi fasilitas.' : 'Tambah fasilitas baru yang tersedia di store.' }}</p>
      </div>
    </div>

    <div class="form-layout">
      <!-- Left: Fields -->
      <el-card shadow="never" class="form-card">
        <div class="form-section-title">Informasi Fasilitas</div>

        <el-form :model="form" :rules="rules" ref="formRef" label-position="top">
          <el-form-item label="Nama Fasilitas" prop="name">
            <el-input v-model="form.name" placeholder="Contoh: WiFi, AC, PlayStation 5" maxlength="100" show-word-limit />
          </el-form-item>

          <el-form-item label="Kategori" prop="category_id">
            <el-select v-model="form.category_id" placeholder="Pilih kategori" style="width:100%">
              <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
            </el-select>
            <div class="field-hint">
              Belum ada kategori? Kelola di halaman
              <router-link to="/facility-category" class="hint-link">Facility Category</router-link>.
            </div>
          </el-form-item>

          <el-form-item label="Deskripsi">
            <el-input
              v-model="form.description"
              type="textarea"
              :rows="3"
              placeholder="Deskripsi singkat fasilitas (opsional)"
              maxlength="255"
              show-word-limit
            />
          </el-form-item>

          <el-form-item label="Status">
            <div class="status-toggle">
              <div
                class="status-option"
                :class="{ active: form.is_active }"
                @click="form.is_active = true"
              >
                <el-icon style="color:var(--color-success)"><CircleCheck /></el-icon>
                <div>
                  <div class="status-option-title">Aktif</div>
                  <div class="status-option-desc">Ditampilkan & dapat digunakan</div>
                </div>
              </div>
              <div
                class="status-option"
                :class="{ active: !form.is_active }"
                @click="form.is_active = false"
              >
                <el-icon style="color:var(--color-danger)"><CircleClose /></el-icon>
                <div>
                  <div class="status-option-title">Nonaktif</div>
                  <div class="status-option-desc">Disembunyikan dari store</div>
                </div>
              </div>
            </div>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- Right: Icon Upload -->
      <div>
        <el-card shadow="never" class="form-card">
          <div class="form-section-title">Icon Fasilitas</div>

          <div class="icon-upload-area" :class="{ 'has-image': iconPreview }" @click="triggerFileInput" @dragover.prevent @drop.prevent="onDrop">
            <input ref="fileInput" type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" style="display:none" @change="onFileChange" />
            <template v-if="!iconPreview">
              <div class="upload-placeholder">
                <el-icon size="36" style="color:var(--color-primary)"><UploadFilled /></el-icon>
                <p class="upload-title">Klik atau drag & drop icon</p>
                <p class="upload-hint">PNG, JPG, SVG, WEBP · Maks. 2MB · Rekomendasi 512×512 px</p>
              </div>
            </template>
            <template v-else>
              <div class="icon-preview-wrap">
                <img :src="iconPreview" class="icon-preview-img" />
                <el-button
                  size="small"
                  type="danger"
                  circle
                  class="icon-remove-btn"
                  @click.stop="removeIcon"
                >
                  <el-icon><Close /></el-icon>
                </el-button>
              </div>
              <p class="upload-hint" style="margin-top:8px">Klik untuk ganti icon</p>
            </template>
          </div>

          <div class="icon-tips">
            <div class="tip-item"><el-icon style="color:var(--color-primary)"><InfoFilled /></el-icon> Icon akan ditampilkan di daftar fasilitas room</div>
            <div class="tip-item"><el-icon style="color:var(--color-primary)"><InfoFilled /></el-icon> Gunakan background transparan untuk tampilan terbaik</div>
          </div>
        </el-card>
      </div>
    </div>

    <!-- Footer -->
    <div class="form-footer">
      <el-button @click="$router.push('/facility')">Batal</el-button>
      <el-button type="primary" :loading="saving" @click="save">
        <el-icon><Finished /></el-icon>
        {{ isEdit ? 'Simpan Perubahan' : 'Tambah Fasilitas' }}
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { createFacility, updateFacility, getFacilityById, getFacilityCategories } from '@/api/facility/facilityApi'
import { uploadImage, getImageUrl } from '@/utils/imageHelper'

const router = useRouter()
const route = useRoute()
const isEdit = computed(() => !!route.params.id)

const formRef = ref()
const fileInput = ref()
const saving = ref(false)
const iconPreview = ref(null)
const iconFile = ref(null)
const categories = ref([])

const form = reactive({
  name: '',
  category_id: null,
  description: '',
  icon_url: '',
  is_active: true,
})

const rules = {
  name: [{ required: true, message: 'Nama fasilitas wajib diisi', trigger: 'blur' }],
  category_id: [{ required: true, message: 'Kategori wajib dipilih', trigger: 'change' }],
}

const triggerFileInput = () => fileInput.value?.click()

const processFile = (file) => {
  if (!file) return
  if (file.size > 2 * 1024 * 1024) {
    ElMessage.warning('Ukuran file maksimal 2MB')
    return
  }
  iconFile.value = file
  iconPreview.value = URL.createObjectURL(file)
}

const onFileChange = (e) => processFile(e.target.files[0])
const onDrop = (e) => processFile(e.dataTransfer.files[0])

const removeIcon = () => {
  iconFile.value = null
  iconPreview.value = null
  form.icon_url = ''
  if (fileInput.value) fileInput.value.value = ''
}

const fetchCategories = async () => {
  try {
    const { data } = await getFacilityCategories()
    categories.value = data.data || []
  } catch {}
}

const save = async () => {
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    saving.value = true
    try {
      // Upload icon if new file selected
      let icon_url = form.icon_url
      if (iconFile.value) {
        icon_url = await uploadImage(iconFile.value, 'facilities')
      }

      const payload = {
        name: form.name,
        category_id: form.category_id,
        description: form.description,
        icon_url,
        is_active: form.is_active,
      }

      if (isEdit.value) {
        await updateFacility(route.params.id, payload)
        ElMessage.success('Fasilitas berhasil diperbarui')
      } else {
        await createFacility(payload)
        ElMessage.success('Fasilitas berhasil ditambahkan')
      }
      router.push('/facility')
    } catch (e) {
      ElMessage.error(e?.response?.data?.message || 'Gagal menyimpan fasilitas')
    } finally {
      saving.value = false
    }
  })
}

onMounted(async () => {
  fetchCategories()
  if (isEdit.value) {
    try {
      const { data } = await getFacilityById(route.params.id)
      const d = data.data
      Object.assign(form, {
        name: d.name,
        category_id: d.category_id,
        description: d.description || '',
        icon_url: d.icon_url || '',
        is_active: d.is_active ?? true,
      })
      if (d.icon_url) iconPreview.value = getImageUrl(d.icon_url)
    } catch {}
  }
})
</script>

<style scoped>
.page-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:24px; }
.breadcrumb { font-size:12px; color:var(--text-muted); margin-bottom:4px; }
.page-title { font-size:22px; font-weight:700; color:var(--text-primary); }
.page-desc { font-size:13px; color:var(--text-secondary); margin-top:4px; }

.form-layout { display:grid; grid-template-columns:1fr 320px; gap:16px; }
@media (max-width:639px) { .form-layout { grid-template-columns:1fr; } }
.form-card { border-color:var(--border-color) !important; }
.form-section-title { font-size:14px; font-weight:700; color:var(--text-primary); margin-bottom:20px; padding-bottom:10px; border-bottom:1px solid var(--border-color); }

.field-hint { font-size:11px; color:var(--text-muted); margin-top:4px; }
.hint-link { color:var(--color-primary-light); text-decoration:none; }
.hint-link:hover { text-decoration:underline; }

/* Status toggle */
.status-toggle { display:flex; gap:10px; }
.status-option {
  flex:1; display:flex; align-items:center; gap:10px;
  padding:12px 14px; border:1px solid var(--border-color);
  border-radius:8px; cursor:pointer; transition:all 0.2s;
}
.status-option:hover { border-color:var(--color-primary); }
.status-option.active { border-color:var(--color-primary); background:rgba(124,58,237,0.08); }
.status-option-title { font-size:13px; font-weight:600; color:var(--text-primary); }
.status-option-desc { font-size:11px; color:var(--text-secondary); margin-top:1px; }

/* Icon upload */
.icon-upload-area {
  border: 2px dashed var(--border-color);
  border-radius: 12px;
  padding: 32px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 180px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.icon-upload-area:hover { border-color:var(--color-primary); background:rgba(124,58,237,0.04); }
.icon-upload-area.has-image { border-style:solid; border-color:var(--color-primary); background:rgba(124,58,237,0.04); }

.upload-placeholder { display:flex; flex-direction:column; align-items:center; gap:10px; }
.upload-title { font-size:13px; font-weight:600; color:var(--text-primary); }
.upload-hint { font-size:11px; color:var(--text-muted); }

.icon-preview-wrap { position:relative; display:inline-block; }
.icon-preview-img { width:80px; height:80px; object-fit:contain; border-radius:12px; background:var(--bg-main); padding:8px; }
.icon-remove-btn { position:absolute; top:-8px; right:-8px; }

.icon-tips { margin-top:14px; display:flex; flex-direction:column; gap:6px; }
.tip-item { display:flex; align-items:center; gap:6px; font-size:11px; color:var(--text-secondary); }

/* Footer */
.form-footer {
  display:flex; justify-content:flex-end; gap:10px;
  margin-top:16px; padding:16px;
  background:var(--bg-card); border:1px solid var(--border-color);
  border-radius:10px;
}
</style>
