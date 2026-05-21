<template>
  <div>
    <!-- Header -->
    <div class="page-header">
      <div>
        <div class="breadcrumb">Store → Stores → {{ isEdit ? 'Edit Store' : 'Buat Store Baru' }}</div>
        <h1 class="page-title">{{ isEdit ? 'Edit Store' : 'Buat Store Baru' }}</h1>
        <p class="page-desc">Lengkapi informasi cabang secara bertahap.</p>
      </div>
    </div>

    <!-- Steps -->
    <el-card shadow="never" class="steps-card" style="margin-bottom:20px">
      <el-steps :active="currentStep" finish-status="success" align-center>
        <el-step :title="isMobile ? 'Informasi' : 'Informasi Cabang'" />
        <el-step :title="isMobile ? 'Jam' : 'Jam Operasional'" />
        <el-step title="Room Setup" />
        <el-step :title="isMobile ? 'Review' : 'Review & Simpan'" />
      </el-steps>
    </el-card>

    <!-- ── Step 0: Info Cabang ── -->
    <el-card shadow="never" v-show="currentStep === 0">
      <div class="step-header">
        <el-icon size="26" style="color:var(--color-primary)"><Shop /></el-icon>
        <div>
          <h3 class="step-title">Informasi Cabang</h3>
          <p class="step-desc">Masukkan informasi dasar cabang Anda.</p>
        </div>
      </div>
      <el-form :model="form" :rules="infoRules" ref="infoFormRef" label-position="top" style="margin-top:20px">
        <div class="two-col">
          <div>
            <el-form-item label="Nama Cabang *" prop="name">
              <el-input v-model="form.name" placeholder="Contoh: Quantum Jelambar" />
            </el-form-item>
            <el-form-item label="Alamat Lengkap *" prop="address">
              <el-input v-model="form.address" type="textarea" :rows="3" placeholder="Jl. Jelambar Utama No. 45..." />
            </el-form-item>
            <div class="two-col-inner">
              <el-form-item label="No. WhatsApp *" prop="whatsapp">
                <el-input v-model="form.whatsapp" placeholder="0812-3456-7890" />
              </el-form-item>
              <el-form-item label="Kode Pos">
                <el-input v-model="form.postal_code" placeholder="11460" />
              </el-form-item>
            </div>
            <el-form-item label="Deskripsi">
              <el-input v-model="form.description" type="textarea" :rows="2" placeholder="Deskripsi singkat cabang (opsional)" maxlength="255" show-word-limit />
            </el-form-item>
            <el-form-item label="Link Google Maps *" prop="link_gmaps">
              <el-input v-model="form.link_gmaps" placeholder="https://maps.google.com/..." />
            </el-form-item>
            <el-form-item label="Status Cabang">
              <div class="status-toggle">
                <div class="status-option" :class="{ active: form.status === 'active' }" @click="form.status = 'active'">
                  <el-icon style="color:var(--color-success)"><CircleCheck /></el-icon>
                  <div><div class="so-title">Aktif</div><div class="so-desc">Cabang dapat digunakan</div></div>
                </div>
                <div class="status-option" :class="{ active: form.status === 'inactive' }" @click="form.status = 'inactive'">
                  <el-icon style="color:var(--color-danger)"><CircleClose /></el-icon>
                  <div><div class="so-title">Nonaktif</div><div class="so-desc">Cabang tidak ditampilkan</div></div>
                </div>
              </div>
            </el-form-item>
          </div>

          <div>
            <el-form-item label="Foto Cabang">
              <div class="photo-upload" :class="{ 'has-img': form.photo_preview }" @click="triggerPhotoInput" @dragover.prevent @drop.prevent="onPhotoDrop">
                <input ref="photoInput" type="file" accept="image/jpeg,image/png,image/webp" style="display:none" @change="onPhotoChange" />
                <template v-if="!form.photo_preview">
                  <div class="upload-placeholder">
                    <el-icon size="32" style="color:var(--color-primary)"><UploadFilled /></el-icon>
                    <p class="up-title">Klik atau drag & drop foto</p>
                    <p class="up-hint">JPG, PNG, WEBP · Maks. 2MB · 1280×720 px</p>
                  </div>
                </template>
                <template v-else>
                  <img :src="form.photo_preview" class="photo-preview-img" />
                  <el-button size="small" type="danger" circle class="photo-remove-btn" @click.stop="removePhoto">
                    <el-icon><Close /></el-icon>
                  </el-button>
                </template>
              </div>
            </el-form-item>
          </div>
        </div>
      </el-form>
    </el-card>

    <!-- ── Step 1: Jam Operasional ── -->
    <el-card shadow="never" v-show="currentStep === 1">
      <div class="step-header">
        <el-icon size="26" style="color:var(--color-primary)"><Clock /></el-icon>
        <div>
          <h3 class="step-title">Jam Operasional</h3>
          <p class="step-desc">Atur jam buka dan tutup cabang Anda.</p>
        </div>
      </div>
      <div :style="{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 280px', gap:'20px', marginTop:'20px' }">
        <div style="display:flex;flex-direction:column;gap:12px">
          <div class="hours-card">
            <div class="hours-header">
              <div>
                <div class="hours-label">Senin – Kamis</div>
                <div class="hours-sub">Hari kerja</div>
              </div>
              <el-switch v-model="form.weekday_active" />
            </div>
            <div v-if="form.weekday_active" class="hours-inputs">
              <el-form-item label="Buka"><el-time-picker v-model="form.weekday_open" format="HH:mm" value-format="HH:mm" placeholder="10:00" style="width:100%" /></el-form-item>
              <el-form-item label="Tutup"><el-time-picker v-model="form.weekday_close" format="HH:mm" value-format="HH:mm" placeholder="23:00" style="width:100%" /></el-form-item>
            </div>
          </div>

          <div class="hours-card">
            <div class="hours-header">
              <div>
                <div class="hours-label">Jumat – Minggu</div>
                <div class="hours-sub">Akhir pekan</div>
              </div>
              <el-switch v-model="form.weekend_active" />
            </div>
            <div v-if="form.weekend_active" class="hours-inputs">
              <el-form-item label="Buka"><el-time-picker v-model="form.weekend_open" format="HH:mm" value-format="HH:mm" placeholder="10:00" style="width:100%" /></el-form-item>
              <el-form-item label="Tutup"><el-time-picker v-model="form.weekend_close" format="HH:mm" value-format="HH:mm" placeholder="23:00" style="width:100%" /></el-form-item>
            </div>
          </div>

          <div class="hours-card">
            <div class="hours-header">
              <div>
                <div class="hours-label">Hari Libur Nasional</div>
                <div class="hours-sub">Jam khusus tanggal merah</div>
              </div>
              <el-switch v-model="form.holiday_active" />
            </div>
            <div v-if="form.holiday_active" style="margin-top:12px">
              <el-table :data="form.holidays" size="small" style="margin-bottom:8px">
                <el-table-column label="Tanggal" min-width="140">
                  <template #default="{ row }">
                    <el-date-picker v-model="row.date" type="date" format="DD/MM/YYYY" value-format="YYYY-MM-DD" size="small" style="width:100%" />
                  </template>
                </el-table-column>
                <el-table-column label="Buka" width="110">
                  <template #default="{ row }">
                    <el-time-picker v-model="row.open_time" format="HH:mm" value-format="HH:mm" size="small" style="width:100%" />
                  </template>
                </el-table-column>
                <el-table-column label="Tutup" width="110">
                  <template #default="{ row }">
                    <el-time-picker v-model="row.close_time" format="HH:mm" value-format="HH:mm" size="small" style="width:100%" />
                  </template>
                </el-table-column>
                <el-table-column width="50" align="center">
                  <template #default="{ $index }">
                    <el-button size="small" type="danger" circle plain @click="form.holidays.splice($index, 1)"><el-icon><Delete /></el-icon></el-button>
                  </template>
                </el-table-column>
              </el-table>
              <el-button plain style="width:100%" @click="form.holidays.push({ date:'', open_time:'10:00', close_time:'23:00' })">
                <el-icon><Plus /></el-icon> Tambah Tanggal
              </el-button>
            </div>
          </div>
        </div>

        <div class="info-box">
          <div class="info-box-title"><el-icon><InfoFilled /></el-icon> Info</div>
          <p style="font-size:12px;color:var(--text-secondary);margin-bottom:10px">Jam operasional digunakan untuk:</p>
          <div v-for="t in infoTips" :key="t" class="info-tip"><el-icon style="color:var(--color-primary);flex-shrink:0"><Check /></el-icon><span>{{ t }}</span></div>
        </div>
      </div>
    </el-card>

    <!-- ── Step 2: Room Setup ── -->
    <el-card shadow="never" v-show="currentStep === 2">
      <div class="step-header">
        <el-icon size="26" style="color:var(--color-primary)"><Grid /></el-icon>
        <div>
          <h3 class="step-title">{{ isEdit ? 'Manajemen Ruangan' : 'Room Setup' }}</h3>
          <p class="step-desc">{{ isEdit ? 'Aktifkan / nonaktifkan ruangan per tipe. Ruangan nonaktif tidak bisa dibooking.' : 'Pilih tipe ruangan yang tersedia di cabang ini dan tentukan jumlah unitnya.' }}</p>
        </div>
      </div>

      <!-- ── EDIT MODE: Manajemen Ruangan with tabs ── -->
      <div v-if="isEdit" style="margin-top:20px">
        <!-- Summary bar -->
        <div class="room-summary-bar">
          <span>Total: <strong>{{ storeRooms.length }}</strong> ruangan</span>
          <span style="color:var(--color-success)">Aktif: <strong>{{ storeRooms.filter(r => r.is_active).length }}</strong></span>
          <span style="color:var(--text-secondary)">Nonaktif: <strong>{{ storeRooms.filter(r => !r.is_active).length }}</strong></span>
        </div>

        <div v-if="roomGroupsByTemplate.length === 0" style="text-align:center;padding:32px;color:var(--text-muted);font-size:13px">
          Tidak ada ruangan di cabang ini.
        </div>

        <!-- Tabs per template -->
        <el-tabs v-else v-model="activeRoomTemplateTab" type="border-card" class="room-mgmt-tabs">
          <el-tab-pane
            v-for="group in roomGroupsByTemplate"
            :key="group.templateId"
            :label="`${group.templateName} (${group.rooms.length})`"
            :name="String(group.templateId)"
          >
            <div class="room-mgmt-list">
              <div
                v-for="room in group.rooms"
                :key="room.id"
                class="room-mgmt-row"
                :class="{ 'room-mgmt-inactive': !room.is_active }"
              >
                <div class="room-mgmt-info">
                  <span class="room-mgmt-name">{{ room.name }}</span>
                  <el-tag :type="room.is_active ? 'success' : 'danger'" size="small">
                    {{ room.is_active ? 'Aktif' : 'Nonaktif' }}
                  </el-tag>
                </div>
                <el-switch
                  v-model="room.is_active"
                  :loading="togglingRoomId === room.id"
                  active-text="Aktif"
                  inactive-text="Nonaktif"
                  @change="(val) => handleToggleRoom(room, val)"
                />
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>

      <!-- ── CREATE MODE: Room template selection ── -->
      <div v-else style="margin-top:20px">
        <!-- Desktop/Tablet table -->
        <el-table v-if="!isMobile" :data="roomTemplates" style="width:100%" v-loading="roomsLoading">
          <el-table-column width="50">
            <template #default="{ row }"><el-checkbox v-model="row.selected" /></template>
          </el-table-column>
          <el-table-column label="Tipe Room" min-width="220">
            <template #default="{ row }">
              <div style="display:flex;align-items:center;gap:12px">
                <div class="room-thumb">
                  <img v-if="row.image_url" :src="getImageUrl(row.image_url)" />
                  <el-icon v-else size="16" style="color:var(--text-muted)"><Picture /></el-icon>
                </div>
                <div>
                  <div style="font-weight:600;font-size:13px">{{ row.name }}</div>
                  <div style="font-size:11px;color:var(--text-secondary)">{{ row.capacity_min }}–{{ row.capacity_max }} orang</div>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="Fasilitas" min-width="180">
            <template #default="{ row }">
              <div style="display:flex;gap:4px;flex-wrap:wrap;align-items:center">
                <img v-for="f in row.facilities?.slice(0,4)" :key="f.id" :src="getImageUrl(f.icon_url)" :title="f.name" style="width:20px;height:20px;object-fit:contain;border-radius:3px;background:var(--bg-main)" />
                <span v-if="row.facilities?.length > 4" style="font-size:11px;color:var(--text-secondary)">+{{ row.facilities.length - 4 }}</span>
                <span v-if="!row.facilities?.length" style="font-size:12px;color:var(--text-muted)">—</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="Jumlah Unit" width="160">
            <template #default="{ row }">
              <div v-if="row.selected" style="display:flex;align-items:center;gap:6px">
                <el-button size="small" circle plain @click="row.unit_count = Math.max(1, row.unit_count - 1)"><el-icon><Minus /></el-icon></el-button>
                <span style="width:28px;text-align:center;font-weight:700;font-size:14px">{{ row.unit_count }}</span>
                <el-button size="small" circle plain @click="row.unit_count++"><el-icon><Plus /></el-icon></el-button>
              </div>
              <span v-else style="color:var(--text-muted);font-size:12px">—</span>
            </template>
          </el-table-column>
        </el-table>

        <!-- Mobile card list -->
        <div v-else v-loading="roomsLoading" class="room-card-list">
          <div v-for="row in roomTemplates" :key="row.id" class="room-card" :class="{ selected: row.selected }" @click="row.selected = !row.selected">
            <div style="display:flex;align-items:center;gap:12px;flex:1;min-width:0">
              <el-checkbox v-model="row.selected" @click.stop />
              <div class="room-thumb">
                <img v-if="row.image_url" :src="getImageUrl(row.image_url)" />
                <el-icon v-else size="16" style="color:var(--text-muted)"><Picture /></el-icon>
              </div>
              <div style="min-width:0">
                <div style="font-weight:600;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{ row.name }}</div>
                <div style="font-size:11px;color:var(--text-secondary)">{{ row.capacity_min }}–{{ row.capacity_max }} orang</div>
              </div>
            </div>
            <div v-if="row.selected" style="display:flex;align-items:center;gap:6px;flex-shrink:0" @click.stop>
              <el-button size="small" circle plain @click="row.unit_count = Math.max(1, row.unit_count - 1)"><el-icon><Minus /></el-icon></el-button>
              <span style="width:28px;text-align:center;font-weight:700;font-size:14px">{{ row.unit_count }}</span>
              <el-button size="small" circle plain @click="row.unit_count++"><el-icon><Plus /></el-icon></el-button>
            </div>
          </div>
        </div>

        <div class="info-box" style="margin-top:12px;flex-direction:row;align-items:center;gap:8px">
          <el-icon style="color:var(--color-info)"><InfoFilled /></el-icon>
          <span>Jumlah unit = banyaknya ruangan dengan tipe yang sama di cabang ini.</span>
        </div>
      </div><!-- end v-else create mode -->

    </el-card>

    <!-- ── Step 3: Review ── -->
    <el-card shadow="never" v-show="currentStep === 3">
      <div class="step-header">
        <el-icon size="26" style="color:var(--color-primary)"><Finished /></el-icon>
        <div>
          <h3 class="step-title">Review & Konfirmasi</h3>
          <p class="step-desc">Periksa kembali sebelum menyimpan.</p>
        </div>
      </div>
      <div :style="{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:'14px', marginTop:'20px' }">
        <div class="review-box">
          <div class="review-title">Informasi Cabang</div>
          <div style="display:flex;gap:12px;margin-top:10px">
            <img v-if="form.photo_preview" :src="form.photo_preview" style="width:80px;height:60px;border-radius:8px;object-fit:cover;flex-shrink:0" />
            <div style="display:flex;flex-direction:column;gap:6px">
              <div class="rv-row"><span>Nama</span><span>{{ form.name || '—' }}</span></div>
              <div class="rv-row"><span>WhatsApp</span><span>{{ form.whatsapp || '—' }}</span></div>
              <div class="rv-row"><span>Status</span><el-tag :type="form.status === 'active' ? 'success' : 'danger'" size="small">{{ form.status }}</el-tag></div>
            </div>
          </div>
          <div class="rv-row" style="margin-top:8px"><span>Alamat</span><span style="text-align:right;max-width:180px">{{ form.address || '—' }}</span></div>
        </div>

        <div class="review-box">
          <div class="review-title">Jam Operasional</div>
          <div style="display:flex;flex-direction:column;gap:6px;margin-top:10px">
            <div class="rv-row"><span>Senin – Kamis</span><span>{{ form.weekday_active ? `${form.weekday_open} – ${form.weekday_close}` : '—' }}</span></div>
            <div class="rv-row"><span>Jumat – Minggu</span><span>{{ form.weekend_active ? `${form.weekend_open} – ${form.weekend_close}` : '—' }}</span></div>
            <div class="rv-row"><span>Hari Libur</span><span>{{ form.holidays.length }} tanggal</span></div>
          </div>
        </div>
      </div>
      <div class="review-box" style="margin-top:12px">
        <div class="review-title">Room Setup — {{ selectedRooms.length }} tipe dipilih</div>
        <el-table :data="selectedRooms" size="small" style="margin-top:10px">
          <el-table-column label="Room" prop="name" min-width="160" />
          <el-table-column label="Kapasitas" width="120"><template #default="{ row }">{{ row.capacity_min }}–{{ row.capacity_max }} orang</template></el-table-column>
          <el-table-column label="Jumlah Unit" width="110"><template #default="{ row }">{{ row.unit_count }} unit</template></el-table-column>
        </el-table>
      </div>
    </el-card>

    <!-- Footer Nav -->
    <div class="step-footer" :class="{ 'review-footer': currentStep === 3 && isMobile }">
      <el-button v-if="currentStep > 0" @click="currentStep--" :class="{ 'review-back-btn': currentStep === 3 && isMobile }">
        <el-icon><ArrowLeft /></el-icon> Kembali
      </el-button>
      <div :style="currentStep === 3 && isMobile
        ? { display:'flex', gap:'8px', flex:'1' }
        : { marginLeft:'auto', display:'flex', gap:'10px' }">
        <el-button v-if="currentStep === 3" plain :loading="saving" @click="saveDraft" :style="currentStep === 3 && isMobile ? { flex:'1' } : {}">
          <el-icon><DocumentAdd /></el-icon> {{ isMobile ? 'Draft' : 'Simpan sebagai Draft' }}
        </el-button>
        <el-button v-if="currentStep < 3" plain @click="saveAndExit" :loading="saving">Simpan & Keluar</el-button>
        <el-button v-if="currentStep < 3" type="primary" @click="nextStep">
          Lanjut <el-icon><ArrowRight /></el-icon>
        </el-button>
        <el-button v-if="currentStep === 3" type="primary" :loading="saving" @click="saveStore" :style="currentStep === 3 && isMobile ? { flex:'1' } : {}">
          <el-icon><Check /></el-icon> {{ isMobile ? 'Simpan' : 'Simpan Store' }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useBreakpoint } from '@/composables/useBreakpoint'
import { ElMessage } from 'element-plus'
import { createStore, updateStore, getStoreById, toggleStoreRoom } from '@/api/store/storeApi'
import { getRoomTemplates } from '@/api/room_template/roomTemplateApi'
import { uploadImage, getImageUrl } from '@/utils/imageHelper'

const router = useRouter()
const route = useRoute()
const { isMobile } = useBreakpoint()
const isEdit = computed(() => !!route.params.id)
const currentStep = ref(0)
const saving = ref(false)
const roomsLoading = ref(false)
const infoFormRef = ref()
const photoInput = ref()
const roomTemplates = ref([])

const infoTips = [
  'Slot booking yang tersedia',
  'Tampilan jam di halaman store',
  'Kalkulasi durasi paket',
]

const form = reactive({
  name: '', address: '', whatsapp: '', postal_code: '', description: '',
  photo_url: '', photo_preview: null, photo_file: null, link_gmaps: '',
  status: 'active',
  weekday_active: true, weekday_open: '10:00', weekday_close: '23:00',
  weekend_active: true, weekend_open: '10:00', weekend_close: '23:00',
  holiday_active: false, holidays: [],
})

const infoRules = {
  name: [{ required: true, message: 'Nama cabang wajib diisi', trigger: 'blur' }],
  address: [{ required: true, message: 'Alamat wajib diisi', trigger: 'blur' }],
  whatsapp: [{ required: true, message: 'No. WhatsApp wajib diisi', trigger: 'blur' }],
  link_gmaps: [{ required: true, message: 'Link Google Maps wajib diisi', trigger: 'blur' }],
}

const selectedRooms = computed(() => roomTemplates.value.filter(r => r.selected))

// ── Manajemen Ruangan (edit mode) ─────────────────────────────
const storeRooms        = ref([])
const togglingRoomId    = ref(null)
const activeRoomTemplateTab = ref(null)

const roomGroupsByTemplate = computed(() => {
  if (!storeRooms.value.length) return []
  const groups = {}
  for (const room of storeRooms.value) {
    const tid   = room.room_template?.id || 0
    const tname = room.room_template?.name || 'Lainnya'
    if (!groups[tid]) groups[tid] = { templateId: tid, templateName: tname, rooms: [] }
    groups[tid].rooms.push(room)
  }
  return Object.values(groups).sort((a, b) => a.templateName.localeCompare(b.templateName))
})

const handleToggleRoom = async (room, isActive) => {
  togglingRoomId.value = room.id
  try {
    await toggleStoreRoom(room.id, isActive)
    ElMessage.success(`${room.name} berhasil ${isActive ? 'diaktifkan' : 'dinonaktifkan'}`)
  } catch {
    room.is_active = !isActive
    ElMessage.error('Gagal mengubah status ruangan')
  } finally {
    togglingRoomId.value = null
  }
}

const triggerPhotoInput = () => photoInput.value?.click()

const processPhoto = (file) => {
  if (!file) return
  if (file.size > 2 * 1024 * 1024) { ElMessage.warning('Ukuran file maksimal 2MB'); return }
  form.photo_file = file
  form.photo_preview = URL.createObjectURL(file)
}
const onPhotoChange = (e) => processPhoto(e.target.files[0])
const onPhotoDrop = (e) => processPhoto(e.dataTransfer.files[0])
const removePhoto = () => {
  form.photo_file = null
  form.photo_preview = null
  form.photo_url = ''
  if (photoInput.value) photoInput.value.value = ''
}

const nextStep = async () => {
  if (currentStep.value === 0) {
    infoFormRef.value.validate((v) => { if (v) currentStep.value++ })
  } else {
    currentStep.value++
  }
}

const buildPayload = async (status) => {
  let photo_url = form.photo_url
  if (form.photo_file) {
    photo_url = await uploadImage(form.photo_file, 'stores')
  }
  return {
    name: form.name, address: form.address, whatsapp: form.whatsapp,
    postal_code: form.postal_code, description: form.description,
    photo_url, link_gmaps: form.link_gmaps, status,
    operating_hours: [
      ...(form.weekday_active ? [{ day_type: 'weekday', open_time: form.weekday_open, close_time: form.weekday_close, is_active: true }] : []),
      ...(form.weekend_active ? [{ day_type: 'weekend', open_time: form.weekend_open, close_time: form.weekend_close, is_active: true }] : []),
    ],
    holidays: form.holiday_active ? form.holidays : [],
    rooms: selectedRooms.value.map(r => ({ room_template_id: r.id, unit_count: r.unit_count })),
  }
}

const submit = async (status) => {
  saving.value = true
  try {
    const payload = await buildPayload(status)
    if (isEdit.value) { await updateStore(route.params.id, payload) }
    else { await createStore(payload) }
    ElMessage.success('Store berhasil disimpan!')
    router.push('/store')
  } catch (e) {
    ElMessage.error(e?.response?.data?.message || 'Gagal menyimpan store')
  } finally {
    saving.value = false
  }
}

const saveStore = () => submit(form.status)
const saveDraft = () => submit('draft')
const saveAndExit = async () => {
  if (currentStep.value === 0) {
    infoFormRef.value.validate(async (v) => { if (v) await submit(form.status) })
  } else {
    await submit(form.status)
  }
}

onMounted(async () => {
  roomsLoading.value = true
  try {
    const { data } = await getRoomTemplates({ per_page: 100 })
    roomTemplates.value = (data.data || []).map(r => ({ ...r, selected: false, unit_count: 1 }))
  } catch {} finally {
    roomsLoading.value = false
  }

  if (isEdit.value) {
    try {
      const { data } = await getStoreById(route.params.id)
      const d = data.data
      Object.assign(form, {
        name: d.name, address: d.address, whatsapp: d.whatsapp,
        postal_code: d.postal_code || '', description: d.description || '',
        photo_url: d.photo_url || '', link_gmaps: d.link_gmaps || '',
        status: d.status || 'active',
      })
      if (d.photo_url) form.photo_preview = getImageUrl(d.photo_url)

      const wh = d.operating_hours?.find(o => o.day_type === 'weekday')
      const we = d.operating_hours?.find(o => o.day_type === 'weekend')
      if (wh) { form.weekday_active = wh.is_active; form.weekday_open = wh.open_time; form.weekday_close = wh.close_time }
      if (we) { form.weekend_active = we.is_active; form.weekend_open = we.open_time; form.weekend_close = we.close_time }

      // Load actual rooms for management section
      storeRooms.value = d.rooms || []
    } catch {}
  }
})
</script>

<style scoped>
.page-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:20px; }
.breadcrumb { font-size:12px; color:var(--text-muted); margin-bottom:4px; }
.page-title { font-size:22px; font-weight:700; color:var(--text-primary); }
.page-desc { font-size:13px; color:var(--text-secondary); margin-top:4px; }

.step-header { display:flex; gap:14px; align-items:flex-start; }
.step-title { font-size:16px; font-weight:700; color:var(--text-primary); margin-bottom:4px; }
.step-desc { font-size:12px; color:var(--text-secondary); }

.two-col { display:grid; grid-template-columns:1fr 320px; gap:24px; }
.two-col-inner { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
@media (max-width:639px) {
  .two-col { grid-template-columns:1fr; }
  .two-col-inner { grid-template-columns:1fr; }
}

/* Status toggle */
.status-toggle { display:flex; gap:10px; }
.status-option {
  flex:1; display:flex; align-items:center; gap:10px;
  padding:10px 12px; border:1px solid var(--border-color);
  border-radius:8px; cursor:pointer; transition:all 0.2s;
}
.status-option.active { border-color:var(--color-primary); background:rgba(124,58,237,0.08); }
.so-title { font-size:13px; font-weight:600; color:var(--text-primary); }
.so-desc { font-size:11px; color:var(--text-secondary); }

/* Photo upload */
.photo-upload {
  border:2px dashed var(--border-color); border-radius:10px;
  min-height:200px; display:flex; align-items:center; justify-content:center;
  cursor:pointer; transition:all 0.2s; position:relative; overflow:hidden;
}
.photo-upload:hover { border-color:var(--color-primary); background:rgba(124,58,237,0.04); }
.photo-upload.has-img { border-style:solid; border-color:var(--color-primary); padding:0; }
.upload-placeholder { display:flex; flex-direction:column; align-items:center; gap:8px; padding:20px; text-align:center; }
.up-title { font-size:13px; font-weight:600; color:var(--text-primary); }
.up-hint { font-size:11px; color:var(--text-muted); }
.photo-preview-img { width:100%; height:200px; object-fit:cover; display:block; }
.photo-remove-btn { position:absolute; top:8px; right:8px; }

/* Hours */
.hours-card { background:var(--bg-main); border:1px solid var(--border-color); border-radius:10px; padding:14px; }
.hours-header { display:flex; justify-content:space-between; align-items:center; }
.hours-label { font-size:13px; font-weight:600; color:var(--text-primary); }
.hours-sub { font-size:11px; color:var(--text-secondary); margin-top:2px; }
.hours-inputs { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:12px; }

/* Info box */
.info-box {
  background:var(--bg-card); border:1px solid var(--border-color);
  border-radius:10px; padding:16px;
  display:flex; flex-direction:column; gap:8px;
  font-size:12px; color:var(--text-secondary);
  height:fit-content;
}
.info-box-title { display:flex; align-items:center; gap:6px; font-weight:700; color:var(--text-primary); font-size:13px; }
.info-tip { display:flex; align-items:flex-start; gap:6px; }

/* Room thumb */
.room-thumb {
  width:52px; height:38px; border-radius:6px;
  background:var(--bg-main); overflow:hidden;
  display:flex; align-items:center; justify-content:center;
  flex-shrink:0;
}
.room-thumb img { width:100%; height:100%; object-fit:cover; }

/* Mobile room card list */
.room-card-list { display:flex; flex-direction:column; gap:8px; }
.room-card {
  display:flex; align-items:center; justify-content:space-between; gap:10px;
  padding:10px 12px; border:1px solid var(--border-color); border-radius:10px;
  background:var(--bg-card); cursor:pointer; transition:border-color 0.2s, background 0.2s;
}
.room-card.selected { border-color:var(--color-primary); background:rgba(124,58,237,0.06); }

/* Review */
.review-box { background:var(--bg-main); border:1px solid var(--border-color); border-radius:10px; padding:14px; }
.review-title { font-size:13px; font-weight:700; color:var(--text-primary); margin-bottom:0; }
.rv-row { display:flex; justify-content:space-between; align-items:center; font-size:12px; gap:8px; }
.rv-row span:first-child { color:var(--text-secondary); white-space:nowrap; }
.rv-row span:last-child { font-weight:500; color:var(--text-primary); text-align:right; }

/* Footer */
.step-footer {
  display:flex; align-items:center;
  margin-top:16px; padding:14px 16px;
  background:var(--bg-card); border:1px solid var(--border-color); border-radius:10px;
}
/* Review step footer on mobile — all 3 buttons in one compact row */
.review-footer { gap:8px; padding:10px 12px; }
.review-back-btn { flex-shrink:0; }

/* ── Manajemen Ruangan (edit mode) ──────────────────────── */
.room-summary-bar {
  display:flex; gap:16px; font-size:12px;
  background:var(--bg-main); border:1px solid var(--border-color);
  border-radius:8px; padding:8px 14px; margin-bottom:12px;
}
.room-mgmt-tabs :deep(.el-tabs__content) { padding:0; }
.room-mgmt-list { display:flex; flex-direction:column; }
.room-mgmt-row {
  display:flex; justify-content:space-between; align-items:center;
  padding:10px 14px; border-bottom:1px solid var(--border-color);
  transition:background 0.15s;
}
.room-mgmt-row:last-child { border-bottom:none; }
.room-mgmt-row:hover { background:var(--bg-main); }
.room-mgmt-inactive { opacity:0.6; }
.room-mgmt-info { display:flex; align-items:center; gap:10px; }
.room-mgmt-name { font-size:13px; font-weight:600; min-width:100px; }

/* Stepper title font */
:deep(.el-step__title) { font-size:12px; }
@media (max-width:639px) {
  :deep(.el-step__title) { font-size:11px; }
  :deep(.el-steps) { padding:0 4px; }
}
</style>
