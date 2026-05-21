<template>
  <div class="customer-layout">

    <!-- ══════════════════════════════════════════════════════════
         LEFT PANEL — List Customer
    ══════════════════════════════════════════════════════════ -->
    <div class="list-panel">
      <!-- Header -->
      <div class="panel-header">
        <div>
          <h1 class="page-title">Customer / Member Management</h1>
          <p class="page-desc">Kelola data pelanggan dan riwayat transaksi</p>
        </div>
        <div style="display:flex;gap:8px">
          <el-button v-if="can('customers.create')" @click="openForm(null)">
            <el-icon><Plus /></el-icon> Add Customer
          </el-button>
        </div>
      </div>

      <!-- Filters -->
      <div class="filter-bar">
        <el-input
          v-model="filters.search"
          placeholder="Search customer name or WhatsApp..."
          prefix-icon="Search"
          style="flex:1;min-width:180px"
          clearable
          @input="debounceFetch"
        />
        <el-select v-model="filters.status" placeholder="Semua Status" clearable style="width:140px" @change="fetchCustomers">
          <el-option label="Active" value="active" />
          <el-option label="Inactive" value="inactive" />
        </el-select>
        <el-select v-model="filters.gender" placeholder="Semua Gender" clearable style="width:140px" @change="fetchCustomers">
          <el-option label="Laki-laki" value="male" />
          <el-option label="Perempuan" value="female" />
        </el-select>
        <el-button plain @click="resetFilters"><el-icon><RefreshRight /></el-icon> Reset</el-button>
      </div>

      <!-- Mobile Card List -->
      <div v-if="isMobile" class="m-card-list">
        <div class="m-card" v-for="row in customerList" :key="row.id" @click="selectCustomer(row)" style="cursor:pointer">
          <div class="m-card-icon" style="background:var(--color-primary);color:#fff;font-weight:700;font-size:16px">
            {{ row.name?.[0]?.toUpperCase() }}
          </div>
          <div class="m-card-body">
            <div class="m-card-title">{{ row.name }}</div>
            <div class="m-card-meta">{{ row.whatsapp }} · {{ row.total_visit || 0 }}x visit</div>
          </div>
          <div class="m-card-end" style="align-items:center;flex-direction:row;gap:6px">
            <el-tag :type="row.type === 'member' ? 'warning' : 'info'" size="small">{{ row.type === 'member' ? 'Member' : 'Regular' }}</el-tag>
            <el-dropdown trigger="click" @command="(cmd) => handleCommand(cmd, row)">
              <el-button size="small" circle plain @click.stop><el-icon><MoreFilled /></el-icon></el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="view"><el-icon><View /></el-icon> Lihat Detail</el-dropdown-item>
                  <el-dropdown-item v-if="can('customers.edit')" command="edit"><el-icon><Edit /></el-icon> Edit Customer</el-dropdown-item>
                  <el-dropdown-item command="resend"><el-icon><Message /></el-icon> Resend Password</el-dropdown-item>
                  <el-dropdown-item v-if="can('customers.edit')" command="delete" style="color:var(--color-danger)"><el-icon><Delete /></el-icon> Delete Customer</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </div>

      <!-- Table -->
      <div class="table-wrapper table-wrap">
        <el-table
          :data="customerList"
          v-loading="loading"
          highlight-current-row
          @row-click="selectCustomer"
          style="width:100%"
          :row-class-name="({ row }) => row.id === selectedCustomer?.id ? 'selected-row' : ''"
        >
          <!-- Customer (avatar + name + badge) -->
          <el-table-column label="CUSTOMER" min-width="180">
            <template #default="{ row }">
              <div style="display:flex;align-items:center;gap:10px">
                <!-- <el-avatar :size="36" :src="row.avatar_url" style="flex-shrink:0">
                  {{ row.name?.[0]?.toUpperCase() }}
                </el-avatar> -->
                <div>
                  <div style="font-weight:600;font-size:13px">{{ row.name }}</div>
                  <el-tag :type="row.type === 'member' ? 'warning' : 'info'" size="small" style="margin-top:2px">
                    {{ row.type === 'member' ? 'Member' : 'Regular' }}
                  </el-tag>
                </div>
              </div>
            </template>
          </el-table-column>

          <!-- WhatsApp -->
          <el-table-column label="WHATSAPP" width="150">
            <template #default="{ row }">
              <div style="display:flex;align-items:center;gap:6px;font-size:12px">
                <span style="color:#25D366">●</span>
                {{ row.whatsapp }}
              </div>
            </template>
          </el-table-column>

          <!-- Last Visit -->
          <el-table-column label="LAST VISIT" width="130">
            <template #default="{ row }">
              <div style="font-size:12px">
                <div>{{ row.last_visit_date || '-' }}</div>
                <div style="color:var(--text-secondary)">{{ row.last_visit_time || '' }}</div>
              </div>
            </template>
          </el-table-column>

          <!-- Total Visit -->
          <el-table-column label="TOTAL VISIT" width="100">
            <template #default="{ row }">
              <span style="font-weight:600">{{ row.total_visit || 0 }}x</span>
            </template>
          </el-table-column>

          <!-- Favorite Room -->
          <el-table-column label="FAVORITE ROOM" width="140">
            <template #default="{ row }">
              <el-tag v-if="row.favorite_room" size="small">{{ row.favorite_room }}</el-tag>
              <span v-else style="color:var(--text-muted);font-size:12px">-</span>
            </template>
          </el-table-column>

          <!-- Total Spent -->
          <el-table-column label="TOTAL SPENT" width="130">
            <template #default="{ row }">
              <span style="font-size:12px;font-weight:600">{{ formatRp(row.total_spent || 0) }}</span>
            </template>
          </el-table-column>

          <!-- Status -->
          <el-table-column label="STATUS" width="90">
            <template #default="{ row }">
              <el-tag :type="row.status === 'active' ? 'success' : 'danger'" size="small">
                {{ row.status === 'active' ? 'Active' : 'Inactive' }}
              </el-tag>
            </template>
          </el-table-column>

          <!-- Aksi -->
          <el-table-column label="AKSI" width="80" fixed="right">
            <template #default="{ row }">
              <div style="display:flex;gap:4px">
                <el-dropdown trigger="click" @command="(cmd) => handleCommand(cmd, row)">
                  <el-button size="small" circle plain @click.stop>
                    <el-icon><MoreFilled /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item v-if="can('customers.edit')" command="edit"><el-icon><Edit /></el-icon> Edit Customer</el-dropdown-item>
                      <el-dropdown-item command="resend"><el-icon><Message /></el-icon> Resend Password</el-dropdown-item>
                      <el-dropdown-item v-if="can('customers.edit')" command="delete" style="color:var(--color-danger)"><el-icon><Delete /></el-icon> Delete Customer</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- Pagination -->
      <div class="pagination-bar">
        <span style="font-size:12px;color:var(--text-secondary)">
          Showing {{ (filters.page - 1) * filters.per_page + 1 }}–{{ Math.min(filters.page * filters.per_page, total) }} of {{ total }} customers
        </span>
        <el-pagination
          v-model:current-page="filters.page"
          v-model:page-size="filters.per_page"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="sizes, prev, pager, next"
          @change="fetchCustomers"
        />
      </div>
    </div>

    <!-- ══════════════════════════════════════════════════════════
         RIGHT PANEL — Customer Detail
    ══════════════════════════════════════════════════════════ -->
    <div class="detail-panel" v-if="selectedCustomer">

      <!-- ── Profile Card ── -->
      <div class="profile-card">
        <div class="profile-avatar">{{ selectedCustomer.name?.[0]?.toUpperCase() }}</div>
        <div class="profile-info">
          <div class="profile-name">{{ selectedCustomer.name }}</div>
          <div class="profile-tags">
            <el-tag :type="selectedCustomer.status === 'active' ? 'success' : 'danger'" size="small">
              {{ selectedCustomer.status === 'active' ? 'Active' : 'Inactive' }}
            </el-tag>
            <el-tag :type="selectedCustomer.type === 'member' ? 'warning' : 'info'" size="small">
              {{ selectedCustomer.type === 'member' ? 'Member' : 'Regular' }}
            </el-tag>
          </div>
          <div class="profile-contacts">
            <span><el-icon><Phone /></el-icon>{{ selectedCustomer.whatsapp }}</span>
            <span v-if="selectedCustomer.email"><el-icon><Message /></el-icon>{{ selectedCustomer.email }}</span>
          </div>
        </div>
      </div>

      <!-- ── Stats Row ── -->
      <div class="dp-stats">
        <div class="dp-stat">
          <div class="dp-stat-val">{{ selectedCustomer.total_visit || 0 }}x</div>
          <div class="dp-stat-lbl">Visit</div>
        </div>
        <div class="dp-stat-divider" />
        <div class="dp-stat">
          <div class="dp-stat-val">{{ selectedCustomer.total_booking || 0 }}</div>
          <div class="dp-stat-lbl">Booking</div>
        </div>
        <div class="dp-stat-divider" />
        <div class="dp-stat">
          <div class="dp-stat-val dp-stat-money">{{ formatRpShort(selectedCustomer.total_spent || 0) }}</div>
          <div class="dp-stat-lbl">Total Spent</div>
        </div>
      </div>

      <!-- ── Quick Actions ── -->
      <div class="dp-actions">
        <button class="dp-action-btn dp-action-wa dp-action-full" @click="openWhatsApp(selectedCustomer.whatsapp)">
          <el-icon><ChatDotRound /></el-icon><span>Chat WhatsApp</span>
        </button>
        <div v-if="can('customers.edit')" class="dp-action-row">
          <button class="dp-action-btn dp-action-edit" @click="openForm(selectedCustomer)">
            <el-icon><Edit /></el-icon><span>Edit</span>
          </button>
          <button class="dp-action-btn dp-action-del" @click="handleDelete(selectedCustomer)">
            <el-icon><Delete /></el-icon><span>Hapus</span>
          </button>
        </div>
      </div>

      <!-- ── Info Pribadi ── -->
      <div class="dp-section">
        <div class="dp-section-title">Informasi Pribadi</div>
        <div class="dp-info-list">
          <div class="dp-info-item">
            <span class="dp-info-key">Tanggal Lahir</span>
            <span class="dp-info-val">{{ formatDob(selectedCustomer.date_of_birth) }}</span>
          </div>
          <div class="dp-info-item">
            <span class="dp-info-key">Gender</span>
            <span class="dp-info-val">{{ selectedCustomer.gender === 'male' ? 'Laki-laki' : selectedCustomer.gender === 'female' ? 'Perempuan' : '-' }}</span>
          </div>
          <div class="dp-info-item">
            <span class="dp-info-key">Pekerjaan</span>
            <span class="dp-info-val">{{ selectedCustomer.occupation || '-' }}</span>
          </div>
          <div class="dp-info-item">
            <span class="dp-info-key">Bergabung</span>
            <span class="dp-info-val">{{ formatDate(selectedCustomer.created_at) }}</span>
          </div>
        </div>
      </div>

      <!-- ── Favorite Room ── -->
      <div class="dp-section" v-if="selectedCustomer.favorite_room_types?.length">
        <div class="dp-section-title">Favorite Room</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px">
          <el-tag v-for="fav in selectedCustomer.favorite_room_types" :key="fav.id" size="small" type="info">
            {{ fav.room_template?.name }}
          </el-tag>
        </div>
      </div>

      <!-- ── Catatan ── -->
      <div class="dp-section">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <div class="dp-section-title" style="margin-bottom:0">Catatan</div>
          <button v-if="!editingNotes && can('customers.edit')" class="dp-link-btn" @click="startEditNotes">
            <el-icon><Edit /></el-icon> Edit
          </button>
        </div>
        <div v-if="!editingNotes" class="dp-notes-box">
          {{ selectedCustomer.notes || 'Belum ada catatan.' }}
        </div>
        <div v-else>
          <el-input v-model="notesInput" type="textarea" :rows="3" placeholder="Tambahkan catatan..." />
          <div style="display:flex;gap:6px;margin-top:8px;justify-content:flex-end">
            <el-button size="small" @click="cancelEditNotes">Batal</el-button>
            <el-button size="small" type="primary" :loading="savingNotes" @click="saveNotes">Simpan</el-button>
          </div>
        </div>
      </div>

      <!-- ── Riwayat Booking ── -->
      <div class="dp-section">
        <div class="dp-section-title">Riwayat Booking</div>
        <div v-if="!selectedCustomer.recent_bookings?.length" class="dp-empty-center">
          Belum ada riwayat booking
        </div>
        <div v-else class="dp-booking-list">
          <div v-for="(b, i) in selectedCustomer.recent_bookings" :key="i" class="dp-booking-item">
            <div class="dp-booking-left">
              <div class="dp-booking-room">{{ b.room }}</div>
              <div class="dp-booking-meta">{{ b.date }} &middot; {{ b.duration }}</div>
            </div>
            <div class="dp-booking-right">
              <div class="dp-booking-total">{{ formatRp(b.total) }}</div>
              <el-tag type="success" size="small">{{ b.status }}</el-tag>
            </div>
          </div>
        </div>
        <button class="dp-link-btn dp-see-all">Lihat Semua Riwayat &rarr;</button>
      </div>

    </div>

    <!-- Empty detail state -->
    <div class="detail-panel empty-detail" v-else>
      <el-icon size="40" style="color:var(--text-muted)"><UserFilled /></el-icon>
      <p style="color:var(--text-muted);margin-top:10px;font-size:13px">Pilih customer untuk melihat detail</p>
    </div>

    <!-- ══════════════════════════════════════════════════════════
         DIALOG — Add / Edit Customer
    ══════════════════════════════════════════════════════════ -->
    <el-drawer
      v-model="formVisible"
      :title="editingCustomer ? 'Edit Customer' : 'Add Customer'"
      direction="rtl"
      :size="isMobile ? '100%' : '520px'"
      :destroy-on-close="true"
    >
      <el-form :model="form" :rules="formRules" ref="formRef" label-position="top">
        <div :style="{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:'14px' }">
          <el-form-item label="Nama Lengkap *" prop="name" style="grid-column:1/-1">
            <el-input v-model="form.name" placeholder="Contoh: Viking Pratama" />
          </el-form-item>

          <el-form-item label="No. WhatsApp *" prop="whatsapp">
            <el-input v-model="form.whatsapp" placeholder="0812-3456-7890" />
          </el-form-item>

          <el-form-item label="Email">
            <el-input v-model="form.email" placeholder="email@gmail.com" />
            <div style="font-size:11px;color:var(--text-muted);margin-top:2px">
              Password akan dikirim ke email ini
            </div>
          </el-form-item>

          <el-form-item label="Tanggal Lahir">
            <el-date-picker
              v-model="form.date_of_birth"
              type="date"
              format="DD MMMM YYYY"
              value-format="YYYY-MM-DD"
              style="width:100%"
            />
          </el-form-item>

          <el-form-item label="Gender">
            <el-select v-model="form.gender" placeholder="Pilih gender" style="width:100%">
              <el-option label="Laki-laki" value="male" />
              <el-option label="Perempuan" value="female" />
            </el-select>
          </el-form-item>

          <el-form-item label="Pekerjaan">
            <el-input v-model="form.occupation" placeholder="Contoh: Mahasiswa, Karyawan" />
          </el-form-item>

          <el-form-item label="Tipe Customer">
            <el-select v-model="form.type" style="width:100%">
              <el-option label="Regular" value="regular" />
              <el-option label="Member" value="member" />
            </el-select>
          </el-form-item>

          <el-form-item v-if="editingCustomer" label="Status">
            <el-select v-model="form.status" style="width:100%">
              <el-option label="Active" value="active" />
              <el-option label="Inactive" value="inactive" />
            </el-select>
          </el-form-item>

          <el-form-item label="Favorite Room" style="grid-column:1/-1">
            <el-select
              v-model="form.favorite_room_ids"
              multiple
              placeholder="Pilih room favorit"
              style="width:100%"
            >
              <el-option
                v-for="t in roomTemplates"
                :key="t.id"
                :label="t.name"
                :value="t.id"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="Catatan" style="grid-column:1/-1">
            <el-input
              v-model="form.notes"
              type="textarea"
              :rows="2"
              placeholder="Catatan tentang customer ini..."
            />
          </el-form-item>
        </div>

        <!-- Info: auto generate password -->
        <div v-if="!editingCustomer" style="background:rgba(124,58,237,0.08);border:1px solid rgba(124,58,237,0.2);border-radius:8px;padding:10px 12px;font-size:12px;color:#a78bfa;margin-top:4px;display:flex;align-items:flex-start;gap:6px">
          <el-icon style="flex-shrink:0;margin-top:1px"><InfoFilled /></el-icon>
          Password akan di-generate otomatis dari nama customer dan dikirim ke email (jika diisi).
        </div>

        <AuditTrail
          v-if="editingCustomer"
          :created-by="editingCustomer.created_by"
          :updated-by="editingCustomer.updated_by"
          :created-at="editingCustomer.created_at"
          :updated-at="editingCustomer.updated_at"
        />
      </el-form>

      <template #footer>
        <el-button @click="formVisible = false">Batal</el-button>
        <el-button type="primary" :loading="formLoading" @click="handleSubmit">
          {{ editingCustomer ? 'Simpan Perubahan' : 'Tambah Customer' }}
        </el-button>
      </template>
    </el-drawer>

    <!-- ── Mobile Detail Drawer ───────────────────────────── -->
    <el-drawer
      v-model="detailDrawerVisible"
      direction="rtl"
      size="100%"
      :title="selectedCustomer?.name || 'Detail Customer'"
      :destroy-on-close="false"
    >
      <div v-if="selectedCustomer">
        <!-- Profile -->
        <div class="profile-card" style="padding:0 0 14px">
          <div class="profile-avatar">{{ selectedCustomer.name?.[0]?.toUpperCase() }}</div>
          <div class="profile-info">
            <div class="profile-name">{{ selectedCustomer.name }}</div>
            <div class="profile-tags">
              <el-tag :type="selectedCustomer.status === 'active' ? 'success' : 'danger'" size="small">{{ selectedCustomer.status === 'active' ? 'Active' : 'Inactive' }}</el-tag>
              <el-tag :type="selectedCustomer.type === 'member' ? 'warning' : 'info'" size="small">{{ selectedCustomer.type === 'member' ? 'Member' : 'Regular' }}</el-tag>
            </div>
            <div class="profile-contacts">
              <span><el-icon><Phone /></el-icon>{{ selectedCustomer.whatsapp }}</span>
              <span v-if="selectedCustomer.email"><el-icon><Message /></el-icon>{{ selectedCustomer.email }}</span>
            </div>
          </div>
        </div>
        <!-- Stats -->
        <div class="dp-stats">
          <div class="dp-stat"><div class="dp-stat-val">{{ selectedCustomer.total_visit || 0 }}x</div><div class="dp-stat-lbl">Visit</div></div>
          <div class="dp-stat-divider" />
          <div class="dp-stat"><div class="dp-stat-val">{{ selectedCustomer.total_booking || 0 }}</div><div class="dp-stat-lbl">Booking</div></div>
          <div class="dp-stat-divider" />
          <div class="dp-stat"><div class="dp-stat-val dp-stat-money">{{ formatRpShort(selectedCustomer.total_spent || 0) }}</div><div class="dp-stat-lbl">Total Spent</div></div>
        </div>
        <!-- Actions -->
        <div class="dp-actions">
          <button class="dp-action-btn dp-action-wa dp-action-full" @click="openWhatsApp(selectedCustomer.whatsapp)"><el-icon><ChatDotRound /></el-icon><span>Chat WhatsApp</span></button>
          <div v-if="can('customers.edit')" class="dp-action-row">
            <button class="dp-action-btn dp-action-edit" @click="openForm(selectedCustomer); detailDrawerVisible = false"><el-icon><Edit /></el-icon><span>Edit</span></button>
            <button class="dp-action-btn dp-action-del" @click="handleDelete(selectedCustomer)"><el-icon><Delete /></el-icon><span>Hapus</span></button>
          </div>
        </div>
        <!-- Info -->
        <div class="dp-section">
          <div class="dp-section-title">Informasi Pribadi</div>
          <div class="dp-info-list">
            <div class="dp-info-item"><span class="dp-info-key">Tanggal Lahir</span><span class="dp-info-val">{{ formatDob(selectedCustomer.date_of_birth) }}</span></div>
            <div class="dp-info-item"><span class="dp-info-key">Gender</span><span class="dp-info-val">{{ selectedCustomer.gender === 'male' ? 'Laki-laki' : selectedCustomer.gender === 'female' ? 'Perempuan' : '-' }}</span></div>
            <div class="dp-info-item"><span class="dp-info-key">Pekerjaan</span><span class="dp-info-val">{{ selectedCustomer.occupation || '-' }}</span></div>
            <div class="dp-info-item"><span class="dp-info-key">Bergabung</span><span class="dp-info-val">{{ formatDate(selectedCustomer.created_at) }}</span></div>
          </div>
        </div>
        <!-- Catatan -->
        <div class="dp-section">
          <div class="dp-section-title">Catatan</div>
          <div class="dp-notes-box">{{ selectedCustomer.notes || 'Belum ada catatan.' }}</div>
        </div>
        <!-- Booking -->
        <div class="dp-section" v-if="selectedCustomer.recent_bookings?.length">
          <div class="dp-section-title">Riwayat Booking</div>
          <div class="dp-booking-list">
            <div v-for="(b, i) in selectedCustomer.recent_bookings.slice(0,5)" :key="i" class="dp-booking-item">
              <div class="dp-booking-left"><div class="dp-booking-room">{{ b.room }}</div><div class="dp-booking-meta">{{ b.date }}</div></div>
              <div class="dp-booking-right"><div class="dp-booking-total">{{ formatRp(b.total) }}</div><el-tag type="success" size="small">{{ b.status }}</el-tag></div>
            </div>
          </div>
        </div>
      </div>
    </el-drawer>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { usePermission } from '@/composables/usePermission'
import { useBreakpoint } from '@/composables/useBreakpoint'
import { ElMessage, ElMessageBox } from 'element-plus'
import AuditTrail from '@/components/AuditTrail.vue'
import {
  getCustomers, getCustomerById,
  createCustomer, updateCustomer,
  updateCustomerNotes, deleteCustomer, resendPassword
} from '@/api/customer/customerApi'
import { getRoomTemplates } from '@/api/room_template/roomTemplateApi'

const { can } = usePermission()
const { isMobile } = useBreakpoint()

// ── State ─────────────────────────────────────────────────────

const loading = ref(false)
const customerList = ref([])
const total = ref(0)
const selectedCustomer = ref(null)
const detailDrawerVisible = ref(false)
const roomTemplates = ref([])

const filters = reactive({
  search: '', status: null, gender: null,
  page: 1, per_page: 10
})

// Notes editing
const editingNotes = ref(false)
const notesInput = ref('')
const savingNotes = ref(false)

// Form dialog
const formVisible = ref(false)
const formLoading = ref(false)
const formRef = ref()
const editingCustomer = ref(null)

const form = reactive({
  name: '', whatsapp: '', email: '',
  date_of_birth: '', gender: '', occupation: '',
  type: 'regular', status: 'active',
  notes: '', favorite_room_ids: []
})

const formRules = {
  name: [{ required: true, message: 'Nama wajib diisi', trigger: 'blur' }],
  whatsapp: [{ required: true, message: 'WhatsApp wajib diisi', trigger: 'blur' }],
}

// ── Debounce Search ───────────────────────────────────────────

let debounceTimer = null
const debounceFetch = () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => { filters.page = 1; fetchCustomers() }, 400)
}

// ── Data Fetching ─────────────────────────────────────────────

const fetchCustomers = async () => {
  loading.value = true
  try {
    const { data } = await getCustomers({
      page: filters.page, per_page: filters.per_page,
      search: filters.search || undefined,
      status: filters.status || undefined,
      gender: filters.gender || undefined,
    })
    customerList.value = data.data || []
    total.value = data.meta?.total || 0
  } catch {
    customerList.value = []
  } finally {
    loading.value = false
  }
}

const selectCustomer = async (row) => {
  try {
    const { data } = await getCustomerById(row.id)
    selectedCustomer.value = data.data
    if (isMobile.value) detailDrawerVisible.value = true
    notesInput.value = data.data.notes || ''
    editingNotes.value = false
  } catch {
    ElMessage.error('Gagal memuat detail customer')
  }
}

const resetFilters = () => {
  Object.assign(filters, { search: '', status: null, gender: null, page: 1 })
  fetchCustomers()
}

// ── Form ──────────────────────────────────────────────────────

const openForm = (customer) => {
  editingCustomer.value = customer
  if (customer) {
    Object.assign(form, {
      name: customer.name,
      whatsapp: customer.whatsapp,
      email: customer.email || '',
      date_of_birth: customer.date_of_birth?.split('T')[0] || '',
      gender: customer.gender || '',
      occupation: customer.occupation || '',
      type: customer.type,
      status: customer.status,
      notes: customer.notes || '',
      favorite_room_ids: customer.favorite_room_types?.map(f => f.room_template_id) || []
    })
  } else {
    Object.assign(form, {
      name: '', whatsapp: '', email: '', date_of_birth: '',
      gender: '', occupation: '', type: 'regular', status: 'active',
      notes: '', favorite_room_ids: []
    })
  }
  formVisible.value = true
}

const handleSubmit = async () => {
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    formLoading.value = true
    try {
      if (editingCustomer.value) {
        await updateCustomer(editingCustomer.value.id, form)
        ElMessage.success('Customer berhasil diupdate')
        selectCustomer(editingCustomer.value)
      } else {
        await createCustomer(form)
        ElMessage.success(form.email
          ? 'Customer berhasil dibuat. Password dikirim ke email!'
          : 'Customer berhasil dibuat.')
      }
      formVisible.value = false
      fetchCustomers()
    } catch (e) {
      ElMessage.error(e?.response?.data?.message || 'Gagal menyimpan customer')
    } finally {
      formLoading.value = false
    }
  })
}

// ── Notes ─────────────────────────────────────────────────────

const startEditNotes = () => {
  notesInput.value = selectedCustomer.value?.notes || ''
  editingNotes.value = true
}

const cancelEditNotes = () => {
  notesInput.value = selectedCustomer.value?.notes || ''
  editingNotes.value = false
}

const saveNotes = async () => {
  savingNotes.value = true
  try {
    const { data } = await updateCustomerNotes(selectedCustomer.value.id, { notes: notesInput.value })
    selectedCustomer.value = data.data
    editingNotes.value = false
    ElMessage.success('Catatan berhasil disimpan')
  } catch {
    ElMessage.error('Gagal menyimpan catatan')
  } finally {
    savingNotes.value = false
  }
}

// ── Commands ──────────────────────────────────────────────────

const handleCommand = async (cmd, row) => {
  if (cmd === 'view') selectCustomer(row)
  if (cmd === 'edit') openForm(row)
  if (cmd === 'resend') await handleResendPassword(row)
  if (cmd === 'delete') await handleDelete(row)
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `Hapus customer "${row.name}"? Tindakan ini tidak dapat dibatalkan.`,
      'Konfirmasi Hapus',
      { type: 'warning', confirmButtonText: 'Hapus', cancelButtonText: 'Batal' }
    )
    await deleteCustomer(row.id)
    ElMessage.success('Customer berhasil dihapus')
    if (selectedCustomer.value?.id === row.id) selectedCustomer.value = null
    fetchCustomers()
  } catch {}
}

const handleResendPassword = async (row) => {
  if (!row.email) {
    ElMessage.warning('Customer tidak memiliki email')
    return
  }
  try {
    await ElMessageBox.confirm(
      `Kirim ulang password ke ${row.email}?`,
      'Konfirmasi',
      { type: 'info', confirmButtonText: 'Kirim', cancelButtonText: 'Batal' }
    )
    await resendPassword(row.id)
    ElMessage.success('Password berhasil dikirim ulang')
  } catch {}
}

const openWhatsApp = (number) => {
  if (!number) return
  const clean = number.replace(/\D/g, '')
  window.open(`https://wa.me/62${clean.startsWith('0') ? clean.slice(1) : clean}`, '_blank')
}

// ── Helpers ───────────────────────────────────────────────────

const formatRp = (v) => `Rp ${(v || 0).toLocaleString('id-ID')}`
const formatRpShort = (v) => {
  if (!v) return 'Rp 0'
  if (v >= 1_000_000) return `Rp ${(v / 1_000_000).toFixed(1).replace('.0', '')}jt`
  if (v >= 1_000) return `Rp ${(v / 1_000).toFixed(0)}rb`
  return `Rp ${v}`
}

const formatDate = (d) => d
  ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
  : '-'

const formatDob = (d) => {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
}

// ── Mount ─────────────────────────────────────────────────────

onMounted(async () => {
  fetchCustomers()
  try {
    const { data } = await getRoomTemplates({ per_page: 100 })
    roomTemplates.value = data.data || []
  } catch {}
})
</script>

<style scoped>
.customer-layout {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 12px;
  height: calc(100vh - 84px);
  overflow: hidden;
}

/* ── Left Panel ── */
.list-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow: hidden;
  min-width: 0;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.page-title { font-size: 17px; font-weight: 700; margin: 0; color: var(--text-primary); }
.page-desc { font-size: 11px; color: var(--text-secondary); margin-top: 1px; }

.filter-bar {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}

.table-wrapper {
  flex: 1;
  overflow-y: auto;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 8px;
}

.pagination-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
  flex-shrink: 0;
}

/* ── Right Panel ── */
.detail-panel {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  padding: 0;
  overflow-y: auto;
  flex-shrink: 0;
}

.empty-detail {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

/* Profile card */
.profile-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 16px 14px;
  border-bottom: 1px solid var(--border-color);
}
.profile-avatar {
  width: 52px; height: 52px; border-radius: 50%;
  background: var(--color-primary);
  display: flex; align-items: center; justify-content: center;
  font-size: 20px; font-weight: 700; color: #fff;
  flex-shrink: 0;
}
.profile-info { flex: 1; min-width: 0; }
.profile-name { font-size: 15px; font-weight: 700; color: var(--text-primary); margin-bottom: 5px; }
.profile-tags { display: flex; gap: 5px; margin-bottom: 6px; }
.profile-contacts { display: flex; flex-direction: column; gap: 2px; font-size: 11px; color: var(--text-secondary); }
.profile-contacts span { display: flex; align-items: center; gap: 4px; }

/* Stats */
.dp-stats {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-main);
}
.dp-stat { flex: 1; text-align: center; }
.dp-stat-val { font-size: 15px; font-weight: 700; color: var(--text-primary); }
.dp-stat-money { font-size: 12px; }
.dp-stat-lbl { font-size: 10px; color: var(--text-muted); margin-top: 1px; }
.dp-stat-divider { width: 1px; height: 28px; background: var(--border-color); }

/* Quick Actions */
.dp-actions {
  display: flex; flex-direction: column;
  gap: 7px; padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
}
.dp-action-btn {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  padding: 8px 12px; border-radius: 8px; font-size: 12px; font-weight: 600;
  cursor: pointer; border: 1px solid transparent; transition: all 0.15s; white-space: nowrap;
}
.dp-action-full { width: 100%; }
.dp-action-row { display: flex; gap: 7px; }
.dp-action-row .dp-action-btn { flex: 1; }
.dp-action-wa {
  background: linear-gradient(135deg, rgba(37,211,102,0.12), rgba(37,211,102,0.06));
  color: #18a34a; border-color: rgba(37,211,102,0.35);
  font-size: 13px; padding: 9px 12px;
}
.dp-action-wa:hover { background: rgba(37,211,102,0.2); box-shadow: 0 2px 8px rgba(37,211,102,0.2); }
.dp-action-edit { background: var(--bg-main); color: var(--text-primary); border-color: var(--border-color); }
.dp-action-edit:hover { border-color: var(--color-primary); color: var(--color-primary-light); background: rgba(2,130,222,0.05); }
.dp-action-del { background: rgba(239,68,68,0.06); color: var(--color-danger); border-color: rgba(239,68,68,0.2); }
.dp-action-del:hover { background: rgba(239,68,68,0.12); }

/* Sections */
.dp-section {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
}
.dp-section:last-child { border-bottom: none; }
.dp-section-title { font-size: 11px; font-weight: 700; color: var(--text-muted); letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 8px; }

/* Info list */
.dp-info-list { display: flex; flex-direction: column; gap: 5px; }
.dp-info-item { display: flex; justify-content: space-between; align-items: center; font-size: 12px; }
.dp-info-key { color: var(--text-secondary); }
.dp-info-val { font-weight: 500; color: var(--text-primary); }

/* Notes */
.dp-notes-box {
  font-size: 12px; color: var(--text-secondary); line-height: 1.6;
  background: var(--bg-main); border-radius: 6px; padding: 8px 10px;
  min-height: 36px;
}

/* Booking list */
.dp-booking-list { display: flex; flex-direction: column; gap: 6px; }
.dp-booking-item {
  display: flex; justify-content: space-between; align-items: center;
  background: var(--bg-main); border-radius: 7px; padding: 8px 10px;
}
.dp-booking-room { font-size: 12px; font-weight: 600; color: var(--text-primary); }
.dp-booking-meta { font-size: 11px; color: var(--text-muted); margin-top: 2px; }
.dp-booking-right { text-align: right; }
.dp-booking-total { font-size: 12px; font-weight: 600; color: var(--text-primary); margin-bottom: 3px; }

/* Misc */
.dp-empty-center { font-size: 12px; color: var(--text-muted); text-align: center; padding: 14px 0; }
.dp-link-btn {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 12px; color: var(--color-primary-light); background: none;
  border: none; cursor: pointer; padding: 0;
}
.dp-link-btn:hover { text-decoration: underline; }
.dp-see-all { display: flex; width: 100%; justify-content: center; margin-top: 8px; }

/* Selected row highlight */
:deep(.selected-row td) { background: rgba(124,58,237,0.07) !important; }
:deep(.el-table__row) { cursor: pointer; }

/* Responsive */
@media (max-width:639px) {
  .customer-layout { grid-template-columns:1fr; height:auto; overflow:visible; }
  .list-panel { overflow:visible; }
  .detail-panel { display:none; } /* replaced by drawer on mobile */
  .table-wrap { display:none; }
  .filter-bar { flex-direction:column; }
  .filter-bar .el-input, .filter-bar .el-select { width:100% !important; }
}
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
</style>
