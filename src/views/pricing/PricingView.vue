<template>
  <div>
    <!-- Header -->
    <PageHeader
      breadcrumb="Pricing → Panel"
      title="Pricing Panel"
      description="Kelola harga bermain untuk setiap cabang. Perubahan harga akan otomatis tersinkron ke website booking."
    />

    <!-- Filter -->
    <FilterBar>
      <el-input
        v-model="search"
        placeholder="Cari cabang..."
        prefix-icon="Search"
        style="width:300px"
        clearable
        @input="debouncedFetch"
      />
      <el-select v-model="statusFilter" placeholder="Semua Status" clearable style="width:180px" @change="fetchPricings">
        <el-option label="Sudah Setup" value="has_pricing" />
        <el-option label="Belum Setup" value="no_pricing" />
      </el-select>
    </FilterBar>

    <!-- Stats -->
    <StatStrip :items="[
      { label: 'Total Cabang', value: pricingList.length },
      { label: 'Sudah Setup', value: pricingList.filter(i => i.has_pricing).length, tone: 'success' },
      { label: 'Belum Setup', value: pricingList.filter(i => !i.has_pricing).length, tone: 'warning' },
    ]" />

    <!-- Store Cards Grid -->
    <div v-loading="loading" class="pricing-grid">
      <div v-for="item in filteredList" :key="item.id" class="pricing-card">
        <div class="card-image">
          <img v-if="item.photo_url" :src="getImageUrl(item.photo_url)" :alt="item.name" class="card-img" />
          <div v-else class="img-placeholder">
            <el-icon size="28"><Shop /></el-icon>
          </div>
          <el-tag
            :type="item.status === 'active' ? 'success' : 'warning'"
            class="status-badge"
            size="small"
          >
            {{ item.status === 'active' ? 'Aktif' : 'Draft' }}
          </el-tag>
          <div v-if="item.has_pricing" class="pricing-badge">
            <el-icon style="font-size:10px"><Check /></el-icon> Pricing OK
          </div>
        </div>

        <div class="card-body">
          <div class="card-name">{{ item.name }}</div>
          <div class="card-location" v-if="item.address">
            <el-icon><Location /></el-icon>
            <span>{{ item.address }}</span>
          </div>

          <template v-if="item.has_pricing">
            <div class="card-updated" v-if="item.last_updated_at">
              <el-icon><Clock /></el-icon>
              <span>Update: {{ formatDate(item.last_updated_at) }}</span>
            </div>
            <div class="card-rules">
              <span class="rule-badge rule-hh">
                <el-icon><Clock /></el-icon> Happy Hour
              </span>
              <span class="rule-badge rule-pkg">
                <el-icon><Box /></el-icon> Paket
              </span>
            </div>
          </template>
          <template v-else>
            <div class="no-pricing-hint">
              <el-icon><WarningFilled /></el-icon>
              Pricing belum dikonfigurasi
            </div>
          </template>
        </div>

        <el-button
          v-if="can('pricing.edit')"
          type="primary"
          style="width:100%;border-radius:0 0 10px 10px"
          @click="goToEdit(item)"
        >
          <el-icon><Edit /></el-icon> Edit Pricing →
        </el-button>
        <div
          v-else
          style="width:100%;padding:9px 0;text-align:center;font-size:13px;color:var(--text-muted);border-top:1px solid var(--border-color)"
        >
          <el-icon><View /></el-icon> View Only
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <EmptyState v-if="!loading && filteredList.length === 0" title="Tidak ada data pricing ditemukan">
      <template #icon><el-icon size="48"><Money /></el-icon></template>
    </EmptyState>

    <!-- Pagination -->
    <div v-if="total > perPage" style="display:flex;justify-content:flex-end;margin-top:20px">
      <TablePagination v-model:page="page" :page-size="perPage" :total="total" :sizes="false" @change="fetchPricings" />
    </div>

    <!-- Info Box -->
    <div class="info-box" style="margin-top:20px">
      <el-icon style="color:var(--color-info);flex-shrink:0"><InfoFilled /></el-icon>
      <span>Harga yang telah dipublish akan otomatis digunakan di website booking dan sistem booking admin.</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePermission } from '@/composables/usePermission'
import { getPricings } from '@/api/pricing/pricingApi'
import { getImageUrl } from '@/utils/imageHelper'
import PageHeader from '@/components/ui/PageHeader.vue'
import StatStrip from '@/components/ui/StatStrip.vue'
import FilterBar from '@/components/ui/FilterBar.vue'
import TablePagination from '@/components/ui/TablePagination.vue'
import EmptyState from '@/components/ui/EmptyState.vue'

const { can } = usePermission()

const router = useRouter()
const loading = ref(false)
const pricingList = ref([])
const search = ref('')
const statusFilter = ref(null)
const page = ref(1)
const perPage = ref(20)
const total = ref(0)
let debounceTimer = null

const filteredList = computed(() => {
  let list = pricingList.value
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter(i => i.name?.toLowerCase().includes(q) || i.address?.toLowerCase().includes(q))
  }
  if (statusFilter.value === 'has_pricing') list = list.filter(i => i.has_pricing)
  if (statusFilter.value === 'no_pricing') list = list.filter(i => !i.has_pricing)
  return list
})

const debouncedFetch = () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(fetchPricings, 400)
}

const fetchPricings = async () => {
  loading.value = true
  try {
    const { data } = await getPricings({ page: page.value, per_page: perPage.value })
    pricingList.value = data.data || []
    total.value = data.meta?.total || 0
  } catch {
    pricingList.value = []
  } finally {
    loading.value = false
  }
}

// BE auto-create config jika belum ada, langsung navigate ke edit
const goToEdit = (item) => {
  router.push(`/pricing/${item.id}/edit`)
}

const formatDate = (d) => {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

onMounted(() => {
  fetchPricings()
})
</script>

<style scoped>
/* Stats */

/* Grid */
.pricing-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(300px, 1fr)); gap:16px; }

/* Card */
.pricing-card {
  background:var(--bg-card); border:1px solid var(--border-color);
  border-radius:12px; overflow:hidden;
  display:flex; flex-direction:column;
  transition:border-color 0.2s, box-shadow 0.2s;
}
.pricing-card:hover { border-color:var(--color-primary); box-shadow:0 4px 20px rgba(124,58,237,0.1); }

.card-image { position:relative; height:100px; background:var(--bg-card-hover); flex-shrink:0; overflow:hidden; }
.card-img { width:100%; height:100%; object-fit:cover; display:block; }
.img-placeholder { width:100%; height:100%; display:flex; align-items:center; justify-content:center; color:var(--text-muted); }

.status-badge { position:absolute; top:10px; left:10px; }
.pricing-badge {
  position:absolute; top:10px; right:10px;
  background:rgba(16,185,129,0.85); color:#fff;
  font-size:10px; font-weight:600;
  padding:3px 8px; border-radius:20px;
  display:flex; align-items:center; gap:3px;
}

.card-body { padding:10px 12px; flex:1; }
.card-name { font-size:13px; font-weight:700; color:var(--text-primary); margin-bottom:4px; }
.card-location { display:flex; align-items:flex-start; gap:6px; font-size:11px; color:var(--text-secondary); margin-bottom:6px; line-height:1.4; }
.card-updated { display:flex; align-items:center; gap:6px; font-size:11px; color:var(--text-muted); margin-bottom:6px; }

.card-rules { display:flex; gap:8px; flex-wrap:wrap; }
.rule-badge { display:flex; align-items:center; gap:4px; padding:4px 10px; border-radius:20px; font-size:11px; font-weight:600; }
.rule-hh { background:rgba(124,58,237,0.15); color:var(--violet); }
.rule-pkg { background:rgba(16,185,129,0.15); color:var(--success); }

.no-pricing-hint { display:flex; align-items:center; gap:6px; font-size:12px; color:var(--color-warning); margin-top:6px; }

/* Empty */

/* Info */
.info-box {
  background:rgba(59,130,246,0.08); border:1px solid rgba(59,130,246,0.2);
  border-radius:8px; padding:12px 16px;
  display:flex; align-items:center; gap:8px;
  font-size:12px; color:var(--action);
}
</style>
