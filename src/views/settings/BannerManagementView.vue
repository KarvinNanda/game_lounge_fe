<template>
  <div>
    <!-- Header -->
    <div class="page-header">
      <div>
        <div class="breadcrumb">Settings → Kelola Banner</div>
        <h1 class="page-title">Kelola Banner</h1>
        <p class="page-desc">
          Banner slider yang tampil di halaman home customer.
          Drag untuk mengubah urutan, atau gunakan tombol panah.
        </p>
      </div>
      <el-button type="primary" @click="openForm(null)">
        <el-icon><Plus /></el-icon> Tambah Banner
      </el-button>
    </div>

    <!-- Info -->
    <div class="info-box" style="margin-bottom:16px">
      <el-icon><InfoFilled /></el-icon>
      <span>
        Banner yang aktif akan tampil sebagai slider di halaman home customer.
        Urutkan dari atas ke bawah sesuai yang ingin ditampilkan pertama.
      </span>
    </div>

    <!-- List Banner -->
    <div v-loading="loading">
      <div v-if="!banners.length" style="text-align:center;padding:40px;color:var(--text-secondary)">
        Belum ada banner. Klik "Tambah Banner" untuk mulai.
      </div>

      <div v-else class="banner-list">
        <div
          v-for="(banner, index) in banners"
          :key="banner.id"
          class="banner-card"
          :class="{ 'banner-inactive': !banner.is_active }"
        >
          <!-- Thumbnail -->
          <div class="banner-thumb">
            <img
              :src="getImageUrl(banner.image_url)"
              :alt="banner.title"
              style="width:100%;height:100%;object-fit:cover;border-radius:6px"
              @error="e => e.target.src = '/placeholder-banner.png'"
            />
            <div v-if="!banner.is_active" class="inactive-overlay">Nonaktif</div>
          </div>

          <!-- Info -->
          <div class="banner-info">
            <div class="banner-title">{{ banner.title }}</div>
            <div v-if="banner.subtitle" class="banner-subtitle">{{ banner.subtitle }}</div>
            <div class="banner-desc">
              {{ banner.description?.slice(0, 80) }}{{ banner.description?.length > 80 ? '...' : '' }}
            </div>
            <div style="display:flex;gap:8px;margin-top:8px">
              <el-tag :type="banner.is_active ? 'success' : 'danger'" size="small">
                {{ banner.is_active ? 'Aktif' : 'Nonaktif' }}
              </el-tag>
              <el-tag type="info" size="small">Urutan {{ banner.sort_order + 1 }}</el-tag>
            </div>
          </div>

          <!-- Aksi -->
          <div class="banner-actions">
            <!-- Reorder: biru aktif, abu disabled -->
            <el-button
              size="small" circle
              :type="index === 0 ? 'info' : 'primary'"
              :plain="index !== 0"
              :disabled="index === 0"
              @click="moveUp(index)"
              title="Geser ke atas"
            >
              <el-icon><ArrowUp /></el-icon>
            </el-button>
            <el-button
              size="small" circle
              :type="index === banners.length - 1 ? 'info' : 'primary'"
              :plain="index !== banners.length - 1"
              :disabled="index === banners.length - 1"
              @click="moveDown(index)"
              title="Geser ke bawah"
            >
              <el-icon><ArrowDown /></el-icon>
            </el-button>

            <div class="action-divider" />

            <!-- Toggle + Edit + Delete: satu baris -->
            <el-switch
              v-model="banner.is_active"
              :loading="togglingId === banner.id"
              @change="() => handleToggle(banner)"
              title="Aktif/Nonaktif"
            />
            <el-button size="small" circle type="warning" plain @click="openForm(banner)" title="Edit banner">
              <el-icon><Edit /></el-icon>
            </el-button>
            <el-button size="small" circle type="danger" plain @click="handleDelete(banner)" title="Hapus banner">
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- ════════════════════════════════════════════
         DRAWER: Form Tambah / Edit Banner
    ════════════════════════════════════════════ -->
    <el-drawer
      v-model="formVisible"
      :title="editingItem ? 'Edit Banner' : 'Tambah Banner Baru'"
      direction="rtl"
      size="520px"
    >
      <el-form :model="form" ref="formRef" label-position="top" style="padding:0 4px">

        <!-- Upload gambar banner -->
        <el-form-item label="Gambar Banner (untuk slider) *" prop="image_url"
          :rules="[{ required: true, message: 'Gambar banner wajib diupload' }]">
          <div class="upload-area">
            <img
              v-if="form.image_url"
              :src="getImageUrl(form.image_url)"
              style="width:100%;max-height:160px;object-fit:cover;border-radius:8px;margin-bottom:8px"
            />
            <el-upload
              action="#"
              :show-file-list="false"
              :before-upload="(file) => handleUpload(file, 'image_url')"
              accept="image/*"
            >
              <el-button size="small" plain>
                <el-icon><Upload /></el-icon>
                {{ form.image_url ? 'Ganti Gambar Banner' : 'Upload Gambar Banner' }}
              </el-button>
            </el-upload>
            <div style="font-size:11px;color:var(--text-muted);margin-top:4px">
              Ukuran ideal: 1200×400px. Format: JPG, PNG, WebP
            </div>
          </div>
        </el-form-item>

        <!-- Upload gambar detail (opsional) -->
        <!-- <el-form-item label="Gambar Detail (opsional — untuk halaman detail banner)">
          <div class="upload-area">
            <img
              v-if="form.detail_image_url"
              :src="getImageUrl(form.detail_image_url)"
              style="width:100%;max-height:120px;object-fit:cover;border-radius:8px;margin-bottom:8px"
            />
            <el-upload
              action="#"
              :show-file-list="false"
              :before-upload="(file) => handleUpload(file, 'detail_image_url')"
              accept="image/*"
            >
              <el-button size="small" plain>
                <el-icon><Upload /></el-icon>
                {{ form.detail_image_url ? 'Ganti Gambar Detail' : 'Upload Gambar Detail' }}
              </el-button>
            </el-upload>
            <div style="font-size:11px;color:var(--text-muted);margin-top:4px">
              Kosongkan jika ingin pakai gambar banner yang sama
            </div>
          </div>
        </el-form-item> -->

        <!-- Judul -->
        <el-form-item label="Judul Banner *" prop="title"
          :rules="[{ required: true, message: 'Judul wajib diisi', trigger: 'blur' }]">
          <el-input v-model="form.title" placeholder="Contoh: Main PS5 Mulai 18RB / Jam" />
        </el-form-item>

        <!-- Subtitle -->
        <!-- <el-form-item label="Subtitle (opsional)">
          <el-input v-model="form.subtitle" placeholder="Contoh: Game terlengkap, harga hemat" />
        </el-form-item> -->

        <!-- Deskripsi detail -->
        <el-form-item label="Deskripsi Detail">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="6"
            placeholder="Tulis informasi detail yang muncul ketika customer klik banner ini.&#10;Contoh: fasilitas, syarat, harga lengkap, dll."
          />
          <div style="font-size:11px;color:var(--text-muted);margin-top:4px">
            Tampil di halaman detail ketika customer mengklik banner
          </div>
        </el-form-item>

        <!-- Status -->
        <el-form-item label="Status">
          <div style="display:flex;align-items:center;gap:10px">
            <el-switch v-model="form.is_active" />
            <span style="font-size:13px">{{ form.is_active ? 'Aktif (tampil di home customer)' : 'Nonaktif (tersembunyi)' }}</span>
          </div>
        </el-form-item>

      </el-form>

      <template #footer>
        <div style="display:flex;gap:10px">
          <el-button style="flex:1" @click="formVisible = false">Batal</el-button>
          <el-button type="primary" style="flex:1" :loading="saving" @click="handleSave">
            {{ editingItem ? 'Simpan Perubahan' : 'Buat Banner' }}
          </el-button>
        </div>
      </template>
    </el-drawer>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getBannersAdmin, createBanner, updateBanner,
  deleteBanner, toggleBanner, reorderBanners
} from '@/api/banner/bannerApi'
import { uploadImage, getImageUrl } from '@/utils/imageHelper'

// ── State ─────────────────────────────────────────────────────
const loading     = ref(false)
const saving      = ref(false)
const banners     = ref([])
const formVisible = ref(false)
const editingItem = ref(null)
const togglingId  = ref(null)
const formRef     = ref()

const form = reactive({
  title:            '',
  subtitle:         '',
  description:      '',
  image_url:        '',
  detail_image_url: '',
  sort_order:       0,
  is_active:        true,
})

// ── Load ──────────────────────────────────────────────────────
const fetchBanners = async () => {
  loading.value = true
  try {
    const { data } = await getBannersAdmin()
    banners.value = data.data || []
  } catch { ElMessage.error('Gagal memuat banner') }
  finally { loading.value = false }
}

// ── Form ──────────────────────────────────────────────────────
const openForm = (item) => {
  editingItem.value = item
  Object.assign(form, {
    title:            item?.title || '',
    subtitle:         item?.subtitle || '',
    description:      item?.description || '',
    image_url:        item?.image_url || '',
    detail_image_url: item?.detail_image_url || '',
    sort_order:       item?.sort_order ?? banners.value.length,
    is_active:        item?.is_active ?? true,
  })
  formVisible.value = true
}

const handleSave = async () => {
  await formRef.value?.validate(async (valid) => {
    if (!valid) return
    saving.value = true
    try {
      const payload = { ...form }
      if (editingItem.value) {
        await updateBanner(editingItem.value.id, payload)
        ElMessage.success('Banner berhasil diperbarui')
      } else {
        await createBanner(payload)
        ElMessage.success('Banner berhasil dibuat')
      }
      formVisible.value = false
      fetchBanners()
    } catch (e) { ElMessage.error(e?.response?.data?.message || 'Gagal menyimpan') }
    finally { saving.value = false }
  })
}

// ── Upload gambar ─────────────────────────────────────────────
const handleUpload = async (file, field) => {
  try {
    const url = await uploadImage(file, 'banners')
    form[field] = url
  } catch { ElMessage.error('Gagal upload gambar') }
  return false // prevent auto upload by el-upload
}

// ── Toggle aktif ──────────────────────────────────────────────
const handleToggle = async (banner) => {
  togglingId.value = banner.id
  try {
    await toggleBanner(banner.id)
    ElMessage.success(`Banner ${banner.is_active ? 'diaktifkan' : 'dinonaktifkan'}`)
  } catch {
    banner.is_active = !banner.is_active // rollback
    ElMessage.error('Gagal mengubah status banner')
  } finally { togglingId.value = null }
}

// ── Delete ────────────────────────────────────────────────────
const handleDelete = async (banner) => {
  try {
    await ElMessageBox.confirm(
      `Hapus banner "${banner.title}"? Tindakan ini tidak bisa dibatalkan.`,
      'Konfirmasi Hapus', { type: 'warning' }
    )
    await deleteBanner(banner.id)
    ElMessage.success('Banner berhasil dihapus')
    fetchBanners()
  } catch {}
}

// ── Reorder ───────────────────────────────────────────────────
const saveOrder = async () => {
  try {
    const orders = banners.value.map((b, i) => ({ id: b.id, sort_order: i }))
    await reorderBanners(orders)
    // tidak perlu toast — perubahan sudah terlihat langsung di UI
  } catch { ElMessage.error('Gagal menyimpan urutan') }
}

const moveUp = async (index) => {
  if (index === 0) return
  const arr = [...banners.value]
  ;[arr[index - 1], arr[index]] = [arr[index], arr[index - 1]]
  // update sort_order tiap objek agar tag "Urutan X" langsung sinkron
  arr.forEach((b, i) => { b.sort_order = i })
  banners.value = arr
  await saveOrder()
}

const moveDown = async (index) => {
  if (index === banners.value.length - 1) return
  const arr = [...banners.value]
  ;[arr[index], arr[index + 1]] = [arr[index + 1], arr[index]]
  arr.forEach((b, i) => { b.sort_order = i })
  banners.value = arr
  await saveOrder()
}

onMounted(fetchBanners)
</script>

<style scoped>
.page-header { display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px }
.breadcrumb  { font-size:12px;color:var(--text-muted);margin-bottom:4px }
.page-title  { font-size:22px;font-weight:700 }
.page-desc   { font-size:13px;color:var(--text-secondary);margin-top:4px }

.info-box {
  background:rgba(59,130,246,0.08);border:1px solid rgba(59,130,246,0.2);
  border-radius:8px;padding:10px 14px;font-size:13px;color:#93C5FD;
  display:flex;align-items:flex-start;gap:8px;
}

/* Banner List */
.banner-list { display:flex;flex-direction:column;gap:10px }
.banner-card {
  display:flex;align-items:center;gap:14px;
  background:var(--bg-card);border:1px solid var(--border-color);
  border-radius:10px;padding:12px;transition:all 0.15s;
}
.banner-card:hover { border-color:var(--color-primary) }
.banner-inactive   { opacity:0.55 }

.banner-thumb {
  position:relative;width:140px;min-width:140px;height:76px;
  border-radius:6px;overflow:hidden;background:var(--bg-main);
}
.inactive-overlay {
  position:absolute;inset:0;background:rgba(0,0,0,0.5);
  display:flex;align-items:center;justify-content:center;
  font-size:11px;font-weight:700;color:white;
}

.banner-info     { flex:1;min-width:0 }
.banner-title    { font-size:14px;font-weight:700;margin-bottom:2px }
.banner-subtitle { font-size:12px;color:var(--text-secondary);margin-bottom:2px }
.banner-desc     { font-size:12px;color:var(--text-muted);line-height:1.4 }

.banner-actions {
  display:flex;flex-direction:row;align-items:center;
  gap:6px;flex-shrink:0;
}
.action-divider {
  width:1px;height:24px;background:var(--border-color);margin:0 4px;
}

.upload-area { width:100% }
</style>
