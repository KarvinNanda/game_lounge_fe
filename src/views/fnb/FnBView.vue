<template>
  <div class="fnb-view">

    <!-- Header -->
    <div class="page-header">
      <div>
        <div class="breadcrumb">Dashboard > FnB</div>
        <h1 class="page-title">Food &amp; Beverage</h1>
        <p class="page-subtitle">Kelola menu FnB dan pantau pesanan dari customer</p>
      </div>
    </div>

    <!-- Tabs -->
    <el-tabs v-model="activeTab" class="fnb-tabs">

      <!-- ── TAB 1: Menu Management ───────────────────────── -->
      <el-tab-pane label="🍔 Menu" name="menu">

        <!-- Toolbar -->
        <div class="toolbar">
          <div class="toolbar-left">
            <el-select v-model="selectedCategory" placeholder="Semua Kategori"
              clearable style="width:200px" @change="fetchItems">
              <el-option label="Semua Kategori" value="" />
              <el-option v-for="cat in categories" :key="cat.id"
                :label="cat.name" :value="cat.id" />
            </el-select>
          </div>
          <div class="toolbar-right">
            <el-button @click="handleSyncMoka" :loading="syncLoading" type="info" plain>
              🔄 Sync dari Moka
            </el-button>
            <el-button @click="openCategoryDialog" plain>
              + Kategori Baru
            </el-button>
            <el-button @click="openItemDialog()" type="primary">
              + Tambah Item
            </el-button>
          </div>
        </div>

        <!-- Category pills -->
        <div class="category-pills">
          <div
            v-for="cat in categories" :key="cat.id"
            class="category-pill"
            :class="{ active: selectedCategory === cat.id }"
          >
            <span @click="selectedCategory = cat.id; fetchItems()">{{ cat.name }}</span>
            <el-icon @click.stop="editCategory(cat)" class="pill-edit-icon">
              <Edit />
            </el-icon>
          </div>
        </div>

        <!-- Items table -->
        <el-table :data="items" v-loading="loadingItems" border stripe>
          <el-table-column label="Item" min-width="200">
            <template #default="{ row }">
              <div style="display:flex;align-items:center;gap:10px">
                <el-avatar v-if="row.image_url" :src="row.image_url" shape="square" :size="40" />
                <el-avatar v-else shape="square" :size="40">🍽️</el-avatar>
                <div>
                  <div style="font-weight:600">{{ row.name }}</div>
                  <div style="font-size:11px;color:var(--text-secondary)">{{ row.category?.name }}</div>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="Harga" width="140">
            <template #default="{ row }">
              <span style="color:var(--color-primary);font-weight:600">
                Rp {{ formatRp(row.price) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="Tersedia" width="110" align="center">
            <template #default="{ row }">
              <el-switch v-model="row.is_available" @change="toggleAvailable(row)" />
            </template>
          </el-table-column>
          <el-table-column label="Status" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="row.is_active ? 'success' : 'danger'" size="small">
                {{ row.is_active ? 'Aktif' : 'Nonaktif' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="Sumber" width="100" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.moka_item_id" type="info" size="small">Moka</el-tag>
              <span v-else style="color:var(--text-muted);font-size:11px">Manual</span>
            </template>
          </el-table-column>
          <el-table-column label="Aksi" width="80" align="center">
            <template #default="{ row }">
              <el-button @click="openItemDialog(row)" size="small" circle plain>
                <el-icon><Edit /></el-icon>
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <div v-if="!items.length && !loadingItems"
          style="text-align:center;padding:40px;color:var(--text-muted)">
          Belum ada item. Klik "+ Tambah Item" atau sync dari Moka.
        </div>
      </el-tab-pane>

      <!-- ── TAB 2: FnB Orders ─────────────────────────────── -->
      <el-tab-pane name="orders">
        <template #label>
          <span style="display:flex;align-items:center;gap:6px">
            📋 Pesanan FnB
            <el-badge v-if="pendingCount > 0" :value="pendingCount" type="danger" />
          </span>
        </template>

        <!-- Filter orders -->
        <div class="toolbar">
          <div class="toolbar-left">
            <el-select v-model="orderFilter.store_id" placeholder="Semua Cabang"
              clearable style="width:180px" @change="fetchOrders">
              <el-option v-for="s in stores" :key="s.id" :label="s.name" :value="s.id" />
            </el-select>
            <el-select v-model="orderFilter.status" placeholder="Semua Status"
              clearable style="width:160px" @change="fetchOrders">
              <el-option label="Menunggu"   value="pending" />
              <el-option label="Disiapkan"  value="preparing" />
              <el-option label="Diantar"    value="delivered" />
              <el-option label="Dibatalkan" value="cancelled" />
            </el-select>
          </div>
          <el-button @click="fetchOrders" plain>
            <el-icon><Refresh /></el-icon> Refresh
          </el-button>
        </div>

        <!-- Orders grid -->
        <div v-loading="loadingOrders" class="orders-grid">
          <div v-if="!orders.length && !loadingOrders" class="empty-state">
            <el-icon size="40" style="color:var(--text-muted)"><Food /></el-icon>
            <p style="margin-top:8px;color:var(--text-secondary)">Tidak ada pesanan FnB</p>
          </div>

          <el-card v-for="order in orders" :key="order.id" class="order-card" shadow="hover">
            <div class="order-header">
              <div>
                <div style="font-weight:700;font-size:14px">{{ order.customer?.name }}</div>
                <div style="font-size:12px;color:var(--text-secondary);margin-top:2px">
                  🚪 {{ order.room?.room_template?.name }} — {{ order.room?.name || 'Unit tidak diketahui' }}
                </div>
                <div style="font-size:11px;color:var(--text-muted);margin-top:2px">
                  {{ formatTime(order.created_at) }}
                </div>
              </div>
              <el-tag :type="statusTagType(order.status)" style="font-weight:600;flex-shrink:0">
                {{ statusLabel(order.status) }}
              </el-tag>
            </div>

            <!-- Items -->
            <div class="order-items">
              <div v-for="item in order.items" :key="item.id" class="order-item-row">
                <span>{{ item.item_name }}</span>
                <span style="color:var(--text-muted)">×{{ item.quantity }}</span>
                <span style="font-weight:600">Rp {{ formatRp(item.price * item.quantity) }}</span>
              </div>
            </div>

            <div class="order-footer">
              <div style="font-weight:700;font-size:13px">
                Total: Rp {{ formatRp(order.total_amount) }}
              </div>
              <div v-if="order.notes" style="font-size:11px;color:var(--text-muted);margin-top:4px">
                📝 {{ order.notes }}
              </div>
            </div>

            <!-- Action buttons -->
            <div class="order-actions">
              <el-button v-if="order.status === 'pending'"
                @click="updateStatus(order.id, 'preparing')"
                type="warning" size="small">
                🍳 Siapkan
              </el-button>
              <el-button v-if="order.status === 'preparing'"
                @click="updateStatus(order.id, 'delivered')"
                type="success" size="small">
                ✅ Tandai Diantar
              </el-button>
              <el-button
                v-if="['pending','preparing'].includes(order.status)"
                @click="updateStatus(order.id, 'cancelled')"
                type="danger" plain size="small">
                ❌ Batalkan
              </el-button>
            </div>
          </el-card>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- ── Dialog: Kategori ───────────────────────────────── -->
    <el-dialog
      v-model="categoryDialogVisible"
      :title="editingCategory ? 'Edit Kategori' : 'Tambah Kategori'"
      width="420px"
    >
      <el-form :model="categoryForm" label-position="top">
        <el-form-item label="Nama Kategori *">
          <el-input v-model="categoryForm.name" placeholder="Contoh: Minuman Dingin" />
        </el-form-item>
        <el-form-item label="Deskripsi">
          <el-input v-model="categoryForm.description" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="Urutan Tampil">
          <el-input-number v-model="categoryForm.sort_order" :min="0" />
        </el-form-item>
        <el-form-item v-if="editingCategory" label="Status">
          <el-switch v-model="categoryForm.is_active"
            active-text="Aktif" inactive-text="Nonaktif" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="categoryDialogVisible = false">Batal</el-button>
        <el-button type="primary" @click="saveCategory" :loading="savingCategory">
          {{ editingCategory ? 'Update' : 'Simpan' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- ── Dialog: Item ───────────────────────────────────── -->
    <el-dialog
      v-model="itemDialogVisible"
      :title="editingItem ? 'Edit Item FnB' : 'Tambah Item FnB'"
      width="520px"
    >
      <el-form :model="itemForm" label-position="top">
        <el-form-item label="Kategori *">
          <el-select v-model="itemForm.category_id" style="width:100%" placeholder="Pilih kategori">
            <el-option v-for="cat in categories" :key="cat.id"
              :label="cat.name" :value="cat.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="Nama Item *">
          <el-input v-model="itemForm.name" placeholder="Contoh: Es Teh Manis" />
        </el-form-item>
        <el-form-item label="Deskripsi">
          <el-input v-model="itemForm.description" type="textarea" :rows="2" />
        </el-form-item>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <el-form-item label="Harga *">
            <el-input-number v-model="itemForm.price" :min="0" :step="500" style="width:100%" />
          </el-form-item>
          <el-form-item label="Urutan Tampil">
            <el-input-number v-model="itemForm.sort_order" :min="0" style="width:100%" />
          </el-form-item>
        </div>
        <div v-if="editingItem" style="display:flex;gap:24px;margin-top:4px">
          <el-form-item label="Tersedia">
            <el-switch v-model="itemForm.is_available" />
          </el-form-item>
          <el-form-item label="Aktif">
            <el-switch v-model="itemForm.is_active" />
          </el-form-item>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="itemDialogVisible = false">Batal</el-button>
        <el-button type="primary" @click="saveItem" :loading="savingItem">
          {{ editingItem ? 'Update' : 'Simpan' }}
        </el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '@/api/index'

// ── State ─────────────────────────────────────────────────────
const activeTab        = ref('menu')
const categories       = ref([])
const items            = ref([])
const orders           = ref([])
const stores           = ref([])
const selectedCategory = ref('')
const loadingItems     = ref(false)
const loadingOrders    = ref(false)
const syncLoading      = ref(false)
const savingCategory   = ref(false)
const savingItem       = ref(false)

const categoryDialogVisible = ref(false)
const itemDialogVisible     = ref(false)
const editingCategory = ref(null)
const editingItem     = ref(null)

const categoryForm = reactive({
  name: '', description: '', sort_order: 0, is_active: true,
})
const itemForm = reactive({
  category_id: null, name: '', description: '',
  price: 0, sort_order: 0, is_available: true, is_active: true,
})
const orderFilter = reactive({ store_id: '', status: 'pending' })

// ── Computed ──────────────────────────────────────────────────
const pendingCount = computed(() =>
  orders.value.filter(o => o.status === 'pending').length
)

// ── Fetch ──────────────────────────────────────────────────────
const fetchCategories = async () => {
  try {
    const { data } = await api.get('/admin/fnb/categories')
    categories.value = data.data || []
  } catch { /* silent */ }
}
const fetchItems = async () => {
  loadingItems.value = true
  try {
    const params = selectedCategory.value ? { category_id: selectedCategory.value } : {}
    const { data } = await api.get('/admin/fnb/items', { params })
    items.value = data.data || []
  } catch { ElMessage.error('Gagal memuat item') }
  finally { loadingItems.value = false }
}
const fetchOrders = async () => {
  loadingOrders.value = true
  try {
    const { data } = await api.get('/admin/fnb/orders', { params: orderFilter })
    orders.value = data.data || []
  } catch { ElMessage.error('Gagal memuat pesanan') }
  finally { loadingOrders.value = false }
}
const fetchStores = async () => {
  try {
    const { data } = await api.get('/admin/stores')
    stores.value = data.data || []
  } catch { /* silent */ }
}

// ── Category CRUD ─────────────────────────────────────────────
const openCategoryDialog = () => {
  editingCategory.value = null
  Object.assign(categoryForm, { name: '', description: '', sort_order: 0, is_active: true })
  categoryDialogVisible.value = true
}
const editCategory = (cat) => {
  editingCategory.value = cat
  Object.assign(categoryForm, {
    name: cat.name, description: cat.description || '',
    sort_order: cat.sort_order || 0, is_active: cat.is_active,
  })
  categoryDialogVisible.value = true
}
const saveCategory = async () => {
  if (!categoryForm.name.trim()) { ElMessage.error('Nama kategori wajib diisi'); return }
  savingCategory.value = true
  try {
    if (editingCategory.value) {
      await api.put(`/admin/fnb/categories/${editingCategory.value.id}`, { ...categoryForm })
      ElMessage.success('Kategori berhasil diupdate')
    } else {
      await api.post('/admin/fnb/categories', { ...categoryForm })
      ElMessage.success('Kategori berhasil dibuat')
    }
    categoryDialogVisible.value = false
    await fetchCategories()
  } catch (e) {
    ElMessage.error(e?.response?.data?.message || 'Gagal menyimpan kategori')
  } finally { savingCategory.value = false }
}

// ── Item CRUD ─────────────────────────────────────────────────
const openItemDialog = (item = null) => {
  editingItem.value = item
  if (item) {
    Object.assign(itemForm, {
      category_id:  item.category_id,
      name:         item.name,
      description:  item.description || '',
      price:        item.price,
      sort_order:   item.sort_order || 0,
      is_available: item.is_available,
      is_active:    item.is_active,
    })
  } else {
    Object.assign(itemForm, {
      category_id:  categories.value[0]?.id || null,
      name: '', description: '', price: 0,
      sort_order: 0, is_available: true, is_active: true,
    })
  }
  itemDialogVisible.value = true
}
const saveItem = async () => {
  if (!itemForm.name.trim() || !itemForm.category_id) {
    ElMessage.error('Nama dan kategori wajib diisi'); return
  }
  savingItem.value = true
  try {
    if (editingItem.value) {
      await api.put(`/admin/fnb/items/${editingItem.value.id}`, { ...itemForm })
      ElMessage.success('Item berhasil diupdate')
    } else {
      await api.post('/admin/fnb/items', { ...itemForm })
      ElMessage.success('Item berhasil ditambahkan')
    }
    itemDialogVisible.value = false
    await fetchItems()
  } catch (e) {
    ElMessage.error(e?.response?.data?.message || 'Gagal menyimpan item')
  } finally { savingItem.value = false }
}
const toggleAvailable = async (row) => {
  try {
    await api.put(`/admin/fnb/items/${row.id}`, {
      category_id:  row.category_id,
      name:         row.name,
      price:        row.price,
      sort_order:   row.sort_order,
      is_available: row.is_available,
      is_active:    row.is_active,
    })
  } catch {
    row.is_available = !row.is_available // rollback
    ElMessage.error('Gagal mengubah ketersediaan')
  }
}

// ── Order actions ─────────────────────────────────────────────
const updateStatus = async (orderId, status) => {
  try {
    await api.put(`/admin/fnb/orders/${orderId}/status`, { status })
    ElMessage.success('Status pesanan diperbarui')
    await fetchOrders()
  } catch { ElMessage.error('Gagal update status pesanan') }
}

// ── Moka Sync ─────────────────────────────────────────────────
const handleSyncMoka = async () => {
  try {
    await ElMessageBox.confirm(
      'Sync akan mengimpor menu dari Moka POS dan memperbarui data yang ada. Lanjutkan?',
      'Konfirmasi Sync Moka', { type: 'info' }
    )
  } catch { return } // user cancel
  syncLoading.value = true
  try {
    const { data } = await api.post('/admin/fnb/sync-moka')
    const d = data.data || {}
    ElMessage.success(
      `Sync berhasil! ${d.categories_synced ?? 0} kategori, ${d.items_synced ?? 0} item diperbarui.`
    )
    await Promise.all([fetchCategories(), fetchItems()])
  } catch (e) {
    ElMessage.error(e?.response?.data?.message || 'Sync Moka gagal. Periksa konfigurasi API key.')
  } finally { syncLoading.value = false }
}

// ── Utils ─────────────────────────────────────────────────────
const statusLabel = (s) =>
  ({ pending: 'Menunggu', preparing: 'Disiapkan', delivered: 'Diantar', cancelled: 'Dibatalkan' }[s] || s)
const statusTagType = (s) =>
  ({ pending: 'warning', preparing: 'primary', delivered: 'success', cancelled: 'danger' }[s])
const formatRp   = (p) => Math.round(p || 0).toLocaleString('id-ID')
const formatTime = (d) =>
  d ? new Date(d).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : ''

// ── Auto-refresh orders (30s) ─────────────────────────────────
let refreshInterval = null
onMounted(async () => {
  await Promise.all([fetchCategories(), fetchItems(), fetchOrders(), fetchStores()])
  refreshInterval = setInterval(fetchOrders, 30000)
})
onUnmounted(() => { if (refreshInterval) clearInterval(refreshInterval) })
</script>

<style scoped>
.page-header   { margin-bottom: 20px }
.breadcrumb    { font-size: 12px; color: var(--text-muted); margin-bottom: 4px }
.page-title    { font-size: 22px; font-weight: 700 }
.page-subtitle { font-size: 13px; color: var(--text-secondary); margin-top: 4px }

/* Toolbar */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 8px;
}
.toolbar-left, .toolbar-right { display: flex; gap: 8px; align-items: center; }

/* Category pills */
.category-pills { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
.category-pill {
  display: inline-flex;
  align-items: center;
  background: var(--bg-card-hover);
  border: 1px solid var(--border-color);
  border-radius: 20px;
  padding: 4px 12px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
}
.category-pill:hover,
.category-pill.active {
  background: var(--color-primary-soft);
  border-color: var(--color-primary);
  color: var(--color-primary-light);
}
.pill-edit-icon {
  margin-left: 6px;
  font-size: 12px;
  opacity: 0.6;
  transition: opacity 0.15s;
}
.pill-edit-icon:hover { opacity: 1; }

/* Orders */
.orders-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
  min-height: 120px;
}
.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 60px 0;
}
.order-card { border-radius: 12px !important; }
.order-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
  gap: 8px;
}
.order-items {
  border-top: 1px solid var(--border-color);
  border-bottom: 1px solid var(--border-color);
  padding: 8px 0;
  margin-bottom: 10px;
}
.order-item-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  padding: 3px 0;
  gap: 8px;
}
.order-item-row span:first-child { flex: 1 }
.order-footer { font-size: 12px; margin-bottom: 12px }
.order-actions { display: flex; gap: 8px; flex-wrap: wrap }
</style>
