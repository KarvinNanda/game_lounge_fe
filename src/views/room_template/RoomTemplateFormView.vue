<template>
  <div>
    <!-- Header -->
    <div class="page-header">
      <div>
        <div class="breadcrumb">Store → Rooms → {{ isEdit ? 'Edit' : 'Tambah' }}</div>
        <h1 class="page-title">{{ isEdit ? 'Edit Room' : 'Tambah Room' }}</h1>
        <p class="page-desc">{{ isEdit ? 'Perbarui informasi tipe ruangan.' : 'Buat tipe ruangan baru sebagai standar di setiap store.' }}</p>
      </div>
    </div>

    <div class="form-layout">
      <!-- Left: Info + Image -->
      <el-card shadow="never" class="form-card">
        <div class="form-section-title">Informasi Room</div>

        <el-form :model="form" :rules="rules" ref="formRef" label-position="top">
          <el-form-item label="Nama Room" prop="name">
            <el-input v-model="form.name" placeholder="Contoh: VIP Room, Standard Room" maxlength="100" show-word-limit />
          </el-form-item>

          <el-form-item label="Kapasitas">
            <div class="capacity-row">
              <div class="capacity-field">
                <label class="cap-label">Min</label>
                <el-input-number v-model="form.capacity_min" :min="1" :max="form.capacity_max" style="width:100%" controls-position="right" />
              </div>
              <div class="capacity-sep">—</div>
              <div class="capacity-field">
                <label class="cap-label">Max</label>
                <el-input-number v-model="form.capacity_max" :min="form.capacity_min" style="width:100%" controls-position="right" />
              </div>
              <span class="cap-unit">orang</span>
            </div>
          </el-form-item>

          <el-form-item label="Deskripsi">
            <el-input
              v-model="form.description"
              type="textarea"
              :rows="3"
              placeholder="Deskripsi singkat ruangan (opsional)"
              maxlength="255"
              show-word-limit
            />
          </el-form-item>

          <el-form-item label="Status">
            <div class="status-toggle">
              <div class="status-option" :class="{ active: form.is_active }" @click="form.is_active = true">
                <el-icon style="color:var(--color-success)"><CircleCheck /></el-icon>
                <div>
                  <div class="status-option-title">Aktif</div>
                  <div class="status-option-desc">Dapat digunakan di store</div>
                </div>
              </div>
              <div class="status-option" :class="{ active: !form.is_active }" @click="form.is_active = false">
                <el-icon style="color:var(--color-danger)"><CircleClose /></el-icon>
                <div>
                  <div class="status-option-title">Nonaktif</div>
                  <div class="status-option-desc">Disembunyikan dari store</div>
                </div>
              </div>
            </div>
          </el-form-item>
        </el-form>

        <!-- Image Upload -->
        <div class="form-section-title" style="margin-top:24px">Foto Room</div>
        <div class="image-upload-area" :class="{ 'has-image': imagePreview }" @click="triggerFileInput" @dragover.prevent @drop.prevent="onDrop">
          <input ref="fileInput" type="file" accept="image/jpeg,image/png,image/webp" style="display:none" @change="onFileChange" />
          <template v-if="!imagePreview">
            <div class="upload-placeholder">
              <el-icon size="36" style="color:var(--color-primary)"><UploadFilled /></el-icon>
              <p class="upload-title">Klik atau drag & drop foto</p>
              <p class="upload-hint">JPG, PNG, WEBP · Maks. 2MB · Rekomendasi 1280×720 px</p>
            </div>
          </template>
          <template v-else>
            <div class="image-preview-wrap">
              <img :src="imagePreview" class="image-preview-img" />
              <el-button
                size="small" type="danger" circle class="image-remove-btn"
                @click.stop="removeImage"
              >
                <el-icon><Close /></el-icon>
              </el-button>
            </div>
          </template>
        </div>
      </el-card>

      <!-- Right: Facility Selector + Preview -->
      <div class="right-col">
        <!-- Facility Selector -->
        <el-card shadow="never" class="form-card">
          <div class="form-section-title">
            Fasilitas
            <span class="section-badge">{{ selectedFacilityIds.length }} dipilih</span>
          </div>
          <p class="section-desc">Pilih fasilitas yang tersedia di tipe ruangan ini.</p>

          <el-input
            v-model="facilitySearch"
            placeholder="Cari fasilitas..."
            prefix-icon="Search"
            size="small"
            clearable
            style="margin-bottom:12px"
          />

          <div class="facility-list" v-loading="facilitiesLoading">
            <div
              v-for="f in filteredFacilities"
              :key="f.id"
              class="facility-item"
              :class="{ selected: selectedFacilityIds.includes(f.id) }"
              @click="toggleFacility(f.id)"
            >
              <el-checkbox
                :model-value="selectedFacilityIds.includes(f.id)"
                @change="toggleFacility(f.id)"
                @click.stop
              />
              <div class="fac-icon-wrap">
                <img v-if="f.icon_url" :src="getImageUrl(f.icon_url)" :alt="f.name" class="fac-icon" />
                <el-icon v-else size="14" style="color:var(--text-muted)"><Picture /></el-icon>
              </div>
              <span class="fac-name">{{ f.name }}</span>
              <el-tag v-if="f.category?.name" size="small" type="info" plain class="fac-cat">{{ f.category.name }}</el-tag>
            </div>

            <div v-if="filteredFacilities.length === 0 && !facilitiesLoading" class="empty-facilities">
              <el-icon size="24" style="color:var(--text-muted)"><Box /></el-icon>
              <p>{{ facilitySearch ? 'Fasilitas tidak ditemukan' : 'Belum ada fasilitas' }}</p>
              <router-link to="/facility/create" class="link-add-facility">+ Tambah Fasilitas</router-link>
            </div>
          </div>
        </el-card>

        <!-- Preview Card -->
        <el-card shadow="never" class="form-card preview-card">
          <div class="form-section-title">Preview</div>
          <div class="preview-room">
            <div class="preview-img-wrap">
              <img v-if="imagePreview" :src="imagePreview" class="preview-img" />
              <div v-else class="preview-img-placeholder">
                <el-icon size="24" style="color:var(--text-muted)"><Picture /></el-icon>
              </div>
            </div>
            <div class="preview-info">
              <div class="preview-name">{{ form.name || 'Nama Room' }}</div>
              <div class="preview-capacity">
                <el-icon><User /></el-icon>
                {{ form.capacity_min }}–{{ form.capacity_max }} orang
              </div>
              <div class="preview-facilities" v-if="selectedFacilityIds.length">
                <template v-for="fid in selectedFacilityIds.slice(0, 6)" :key="fid">
                  <img
                    v-if="getFacility(fid)?.icon_url"
                    :src="getImageUrl(getFacility(fid)?.icon_url)"
                    :alt="getFacility(fid)?.name"
                    :title="getFacility(fid)?.name"
                    class="preview-fac-icon"
                  />
                </template>
              </div>
              <div class="preview-desc" v-if="form.description">{{ form.description }}</div>
            </div>
          </div>
        </el-card>
      </div>
    </div>

    <!-- Footer -->
    <div class="form-footer">
      <el-button @click="$router.push('/room-template')">Batal</el-button>
      <el-button type="primary" :loading="saving" @click="save">
        <el-icon><Finished /></el-icon>
        {{ isEdit ? 'Simpan Perubahan' : 'Tambah Room' }}
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { createRoomTemplate, updateRoomTemplate, getRoomTemplateById } from '@/api/room_template/roomTemplateApi'
import { getFacilities } from '@/api/facility/facilityApi'
import { uploadImage, getImageUrl } from '@/utils/imageHelper'

const router = useRouter()
const route = useRoute()
const isEdit = computed(() => !!route.params.id)

const formRef = ref()
const fileInput = ref()
const saving = ref(false)
const facilitiesLoading = ref(false)
const imagePreview = ref(null)
const imageFile = ref(null)
const facilities = ref([])
const facilitySearch = ref('')
const selectedFacilityIds = ref([])

const form = reactive({
  name: '',
  capacity_min: 2,
  capacity_max: 6,
  description: '',
  image_url: '',
  is_active: true,
})

const rules = {
  name: [{ required: true, message: 'Nama room wajib diisi', trigger: 'blur' }],
}

const filteredFacilities = computed(() => {
  if (!facilitySearch.value.trim()) return facilities.value
  const q = facilitySearch.value.toLowerCase()
  return facilities.value.filter(f => f.name.toLowerCase().includes(q))
})

const getFacility = (id) => facilities.value.find(f => f.id === id)

const toggleFacility = (id) => {
  const idx = selectedFacilityIds.value.indexOf(id)
  if (idx > -1) selectedFacilityIds.value.splice(idx, 1)
  else selectedFacilityIds.value.push(id)
}

const triggerFileInput = () => fileInput.value?.click()

const processFile = (file) => {
  if (!file) return
  if (file.size > 2 * 1024 * 1024) { ElMessage.warning('Ukuran file maksimal 2MB'); return }
  imageFile.value = file
  imagePreview.value = URL.createObjectURL(file)
}
const onFileChange = (e) => processFile(e.target.files[0])
const onDrop = (e) => processFile(e.dataTransfer.files[0])
const removeImage = () => {
  imageFile.value = null
  imagePreview.value = null
  form.image_url = ''
  if (fileInput.value) fileInput.value.value = ''
}

const save = async () => {
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    saving.value = true
    try {
      let image_url = form.image_url
      if (imageFile.value) {
        image_url = await uploadImage(imageFile.value, 'rooms')
      }
      const payload = {
        name: form.name,
        capacity_min: form.capacity_min,
        capacity_max: form.capacity_max,
        description: form.description,
        image_url,
        facility_ids: selectedFacilityIds.value,
        is_active: form.is_active,
      }
      if (isEdit.value) {
        await updateRoomTemplate(route.params.id, payload)
        ElMessage.success('Room berhasil diperbarui')
      } else {
        await createRoomTemplate(payload)
        ElMessage.success('Room berhasil ditambahkan')
      }
      router.push('/room-template')
    } catch (e) {
      ElMessage.error(e?.response?.data?.message || 'Gagal menyimpan room')
    } finally {
      saving.value = false
    }
  })
}

onMounted(async () => {
  facilitiesLoading.value = true
  try {
    const { data } = await getFacilities({ per_page: 200 })
    facilities.value = data.data || []
  } catch {} finally {
    facilitiesLoading.value = false
  }

  if (isEdit.value) {
    try {
      const { data } = await getRoomTemplateById(route.params.id)
      const d = data.data
      Object.assign(form, {
        name: d.name,
        capacity_min: d.capacity_min,
        capacity_max: d.capacity_max,
        description: d.description || '',
        image_url: d.image_url || '',
        is_active: d.is_active ?? true,
      })
      selectedFacilityIds.value = d.facilities?.map(f => f.id) || []
      if (d.image_url) imagePreview.value = getImageUrl(d.image_url)
    } catch {}
  }
})
</script>

<style scoped>
.page-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:24px; }
.breadcrumb { font-size:12px; color:var(--text-muted); margin-bottom:4px; }
.page-title { font-size:22px; font-weight:700; color:var(--text-primary); }
.page-desc { font-size:13px; color:var(--text-secondary); margin-top:4px; }

.form-layout { display:grid; grid-template-columns:1fr 340px; gap:16px; }
@media (max-width:639px) { .form-layout { grid-template-columns:1fr; } }
.form-card { border-color:var(--border-color) !important; }
.right-col { display:flex; flex-direction:column; gap:16px; }

.form-section-title {
  font-size:14px; font-weight:700; color:var(--text-primary);
  margin-bottom:16px; padding-bottom:10px;
  border-bottom:1px solid var(--border-color);
  display:flex; align-items:center; gap:8px;
}
.section-badge {
  font-size:11px; font-weight:600;
  background:rgba(124,58,237,0.15); color:var(--color-primary-light);
  padding:2px 8px; border-radius:12px; margin-left:auto;
}
.section-desc { font-size:12px; color:var(--text-secondary); margin-bottom:12px; margin-top:-8px; }

/* Capacity */
.capacity-row { display:flex; align-items:flex-end; gap:8px; }
.capacity-field { display:flex; flex-direction:column; gap:4px; flex:1; }
.cap-label { font-size:11px; color:var(--text-secondary); }
.capacity-sep { font-size:16px; color:var(--text-muted); padding-bottom:8px; }
.cap-unit { font-size:13px; color:var(--text-secondary); padding-bottom:8px; }

/* Status toggle */
.status-toggle { display:flex; gap:10px; }
.status-option {
  flex:1; display:flex; align-items:center; gap:10px;
  padding:10px 12px; border:1px solid var(--border-color);
  border-radius:8px; cursor:pointer; transition:all 0.2s;
}
.status-option:hover { border-color:var(--color-primary); }
.status-option.active { border-color:var(--color-primary); background:rgba(124,58,237,0.08); }
.status-option-title { font-size:13px; font-weight:600; color:var(--text-primary); }
.status-option-desc { font-size:11px; color:var(--text-secondary); margin-top:1px; }

/* Image upload */
.image-upload-area {
  border:2px dashed var(--border-color); border-radius:10px;
  min-height:160px; display:flex; align-items:center; justify-content:center;
  cursor:pointer; transition:all 0.2s; overflow:hidden;
}
.image-upload-area:hover { border-color:var(--color-primary); background:rgba(124,58,237,0.04); }
.image-upload-area.has-image { border-style:solid; border-color:var(--color-primary); padding:0; }
.upload-placeholder { display:flex; flex-direction:column; align-items:center; gap:8px; padding:20px; text-align:center; }
.upload-title { font-size:13px; font-weight:600; color:var(--text-primary); }
.upload-hint { font-size:11px; color:var(--text-muted); }
.image-preview-wrap { position:relative; width:100%; }
.image-preview-img { width:100%; height:160px; object-fit:cover; display:block; }
.image-remove-btn { position:absolute; top:8px; right:8px; }

/* Facility list */
.facility-list { max-height:280px; overflow-y:auto; display:flex; flex-direction:column; gap:2px; }
.facility-item {
  display:flex; align-items:center; gap:8px;
  padding:8px 10px; border-radius:6px; cursor:pointer;
  transition:background 0.15s; user-select:none;
}
.facility-item:hover { background:var(--bg-card-hover); }
.facility-item.selected { background:rgba(124,58,237,0.1); }
.fac-icon-wrap {
  width:24px; height:24px; border-radius:4px;
  background:var(--bg-main); display:flex; align-items:center; justify-content:center;
  flex-shrink:0; overflow:hidden;
}
.fac-icon { width:18px; height:18px; object-fit:contain; }
.fac-name { font-size:12px; font-weight:500; color:var(--text-primary); flex:1; }
.fac-cat { margin-left:auto; }
.empty-facilities {
  display:flex; flex-direction:column; align-items:center;
  gap:6px; padding:20px; color:var(--text-muted); font-size:12px;
}
.link-add-facility { color:var(--color-primary-light); text-decoration:none; font-size:12px; }

/* Preview */
.preview-card { }
.preview-room { display:flex; flex-direction:column; gap:10px; }
.preview-img-wrap { border-radius:8px; overflow:hidden; }
.preview-img { width:100%; height:120px; object-fit:cover; display:block; }
.preview-img-placeholder {
  width:100%; height:120px;
  background:var(--bg-main); display:flex; align-items:center; justify-content:center;
  border-radius:8px; border:1px solid var(--border-color);
}
.preview-info { display:flex; flex-direction:column; gap:6px; }
.preview-name { font-size:15px; font-weight:700; color:var(--text-primary); }
.preview-capacity { display:flex; align-items:center; gap:4px; font-size:12px; color:var(--text-secondary); }
.preview-facilities { display:flex; gap:4px; flex-wrap:wrap; }
.preview-fac-icon { width:20px; height:20px; object-fit:contain; border-radius:3px; background:var(--bg-main); }
.preview-desc { font-size:12px; color:var(--text-secondary); line-height:1.5; }

/* Footer */
.form-footer {
  display:flex; justify-content:flex-end; gap:10px;
  margin-top:16px; padding:16px;
  background:var(--bg-card); border:1px solid var(--border-color); border-radius:10px;
}
</style>
