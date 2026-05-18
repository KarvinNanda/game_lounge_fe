<template>
  <div class="sales-page">

    <!-- ── Header ──────────────────────────────────────────── -->
    <div class="page-header">
      <div>
        <div class="breadcrumb">Dashboard</div>
        <h1 class="page-title">Dashboard</h1>
        <p class="page-desc">Laporan pendapatan &amp; transaksi penjualan</p>
      </div>
      <el-dropdown @command="handleExport">
        <el-button size="small">
          <el-icon><Download /></el-icon> Export
          <el-icon class="el-icon--right"><ArrowDown /></el-icon>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="excel"><el-icon><DocumentChecked /></el-icon> Export ke Excel</el-dropdown-item>
            <el-dropdown-item command="pdf"><el-icon><Document /></el-icon> Export ke PDF</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <!-- ── Filter Bar ─────────────────────────────────────── -->
    <div class="filter-bar">
      <div class="period-buttons">
        <el-button
          v-for="p in periods" :key="p.value"
          :type="filters.period === p.value ? 'primary' : 'default'"
          size="small"
          @click="setPeriod(p.value)"
        >{{ p.label }}</el-button>
        <el-button
          :type="filters.period === 'custom' ? 'primary' : 'default'"
          size="small"
          @click="filters.period = 'custom'"
        ><el-icon><Calendar /></el-icon> Custom</el-button>
      </div>

      <el-select v-model="filters.store_id" placeholder="Semua Cabang" clearable size="small" :style="{ width: isMobile ? '100%' : '160px' }" @change="loadAll">
        <el-option v-for="s in stores" :key="s.id" :label="s.name" :value="s.id" />
      </el-select>

      <el-select v-model="filters.type" size="small" :style="{ width: isMobile ? '100%' : '130px' }" @change="loadAll">
        <el-option label="All Type"     value="all" />
        <el-option label="Booking"      value="booking" />
        <el-option label="Play Credits" value="play_credits" />
      </el-select>

      <el-date-picker
        v-if="filters.period === 'custom'"
        v-model="customRange"
        type="daterange"
        format="DD MMM YY"
        value-format="YYYY-MM-DD"
        range-separator="–"
        start-placeholder="Dari"
        end-placeholder="Sampai"
        size="small"
        style="width:230px"
        @change="onCustomRangeChange"
      />

      <div class="date-badge" v-if="summary">
        <el-icon style="font-size:11px"><Calendar /></el-icon>
        {{ formatDateShort(summary.date_from) }} – {{ formatDateShort(summary.date_to) }}
      </div>
    </div>

    <!-- ── Stats Row (5 cards) ──────────────────────────────── -->
    <div v-loading="loading" class="stats-grid">
      <div class="stat-card" v-for="stat in statCards" :key="stat.key">
        <div class="stat-icon-box" :style="{ background: stat.iconBg }">
          <el-icon size="16" :style="{ color: stat.iconColor }"><component :is="stat.icon" /></el-icon>
        </div>
        <div class="stat-body">
          <div class="stat-label">{{ stat.label }}</div>
          <div class="stat-value">{{ stat.value }}</div>
          <div v-if="stat.change !== null && stat.change !== undefined"
            class="stat-change" :class="stat.change >= 0 ? 'pos' : 'neg'">
            <el-icon size="10"><component :is="stat.change >= 0 ? 'ArrowUp' : 'ArrowDown'" /></el-icon>
            {{ Math.abs(stat.change) }}% vs {{ prevPeriodLabel }}
          </div>
        </div>
      </div>
    </div>

    <!-- ── Charts: Trend (left) + Revenue by Type (right) ─── -->
    <div class="charts-top">

      <!-- Sales Trend -->
      <el-card shadow="never" class="trend-card">
        <div class="card-header-row">
          <span class="card-title">Sales Trend</span>
          <el-select v-model="filters.granularity" size="small" style="width:100px" @change="loadTrend">
            <el-option label="Daily"   value="daily" />
            <el-option label="Weekly"  value="weekly" />
            <el-option label="Monthly" value="monthly" />
          </el-select>
        </div>
        <div v-if="trendData.length === 0 && !loading" class="trend-empty">
          <el-icon size="32" style="color:var(--color-primary);opacity:.35"><TrendCharts /></el-icon>
          <div>Belum ada data trend untuk periode ini</div>
        </div>
        <div v-else ref="trendChartRef" class="trend-chart" style="width:100%;height:220px" />
      </el-card>

      <!-- Revenue by Type -->
      <el-card shadow="never" class="type-card">
        <div class="card-header-row" style="margin-bottom:10px">
          <span class="card-title">Revenue by Type</span>
        </div>
        <div class="donut-wrap">
          <div ref="donutChartRef" class="donut-chart" />
          <div class="donut-legend">
            <div v-for="item in (summary?.revenue_by_type || [])" :key="item.type" class="legend-item">
              <div class="legend-dot" :style="{ background: item.type === 'booking' ? 'var(--color-primary)' : 'var(--color-success)' }" />
              <div class="legend-body">
                <div class="legend-top">
                  <span class="legend-name">{{ item.label }}</span>
                  <span class="legend-pct">{{ item.percentage }}%</span>
                </div>
                <div class="legend-rev">{{ formatRp(item.revenue) }}</div>
              </div>
            </div>
            <div class="legend-total">
              <span>Total</span>
              <strong>{{ formatRp(summary?.stats?.total_revenue || 0) }}</strong>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- ── Revenue by Branch & Room Type (side by side) ────── -->
    <div class="charts-bottom">

      <!-- Revenue by Branch -->
      <el-card shadow="never" class="rev-card">
        <div class="card-header-row" style="margin-bottom:8px">
          <span class="card-title">Revenue by Branch</span>
        </div>
        <div v-if="!summary?.revenue_by_branch?.length" class="empty-rev">Belum ada data</div>
        <div v-else class="rev-list">
          <div v-for="b in summary.revenue_by_branch" :key="b.store_id" class="rev-row">
            <div class="rev-info">
              <div class="rev-name">{{ b.store_name }}</div>
              <div class="rev-bar-wrap">
                <div class="rev-bar" :style="{ width: b.percentage + '%', background: 'var(--color-primary)' }" />
              </div>
            </div>
            <div class="rev-right">
              <div class="rev-amount">{{ formatRp(b.revenue) }}</div>
              <div class="rev-pct">{{ b.percentage?.toFixed(0) }}%</div>
            </div>
          </div>
        </div>
        <div class="rev-footer">
          <span>Total</span>
          <strong>{{ formatRp(summary?.stats?.total_revenue || 0) }}</strong>
        </div>
      </el-card>

      <!-- Revenue by Room Type -->
      <el-card shadow="never" class="rev-card">
        <div class="card-header-row" style="margin-bottom:8px">
          <span class="card-title">Revenue by Room Type</span>
        </div>
        <div v-if="!summary?.revenue_by_room_type?.length" class="empty-rev">Belum ada data</div>
        <div v-else class="rev-list">
          <div v-for="r in summary.revenue_by_room_type" :key="r.room_template_id" class="rev-row">
            <div class="rev-info">
              <div class="rev-name">{{ r.name }}</div>
              <div class="rev-bar-wrap">
                <div class="rev-bar" :style="{ width: r.percentage + '%', background: 'var(--color-primary-light)' }" />
              </div>
            </div>
            <div class="rev-right">
              <div class="rev-amount">{{ formatRp(r.revenue) }}</div>
              <div class="rev-pct">{{ r.percentage?.toFixed(0) }}%</div>
            </div>
          </div>
        </div>
        <div class="rev-footer">
          <span>Total</span>
          <strong>{{ formatRp(summary?.stats?.total_revenue || 0) }}</strong>
        </div>
      </el-card>
    </div>

    <!-- ── Detail Penjualan CTA ─────────────────────────────── -->
    <div class="detail-cta" @click="showTransactionModal = true">
      <div class="detail-cta-left">
        <div class="detail-cta-icon">
          <el-icon size="16"><List /></el-icon>
        </div>
        <div>
          <div class="detail-cta-title">Detail Transaksi Penjualan</div>
          <div class="detail-cta-sub">
            {{ summary?.stats?.total_transactions || 0 }} transaksi · booking &amp; play credits
          </div>
        </div>
      </div>
      <el-button size="small" class="cta-btn">
        Lihat Semua &nbsp;→
      </el-button>
    </div>

    <!-- ════════════════════════════════════════════════════════
         MODAL: Detail Penjualan
    ════════════════════════════════════════════════════════ -->
    <el-drawer v-model="showTransactionModal" title="Detail Penjualan" direction="rtl" :size="isMobile ? '100%' : '860px'">
      <div class="tx-toolbar">
        <el-select v-model="txFilter" size="small" style="width:150px"
          @change="() => { txPage = 1; loadTransactions() }">
          <el-option label="All Type"     value="all" />
          <el-option label="Booking"      value="booking" />
          <el-option label="Play Credits" value="play_credits" />
        </el-select>
        <div style="margin-left:auto;font-size:12px;font-weight:600;color:var(--text-secondary)">
          {{ txTotal }} transaksi
        </div>
      </div>

      <el-table :data="transactions" v-loading="txLoading" size="small">
        <el-table-column label="Tanggal" width="110">
          <template #default="{ row }">
            <div style="font-size:12px;font-weight:700">{{ formatDate(row.date) }}</div>
            <div style="font-size:11px;color:var(--text-secondary)">{{ row.time }}</div>
          </template>
        </el-table-column>
        <el-table-column label="Tipe" width="110">
          <template #default="{ row }">
            <el-tag :type="row.type === 'booking' ? '' : 'success'" size="small">
              {{ row.type === 'booking' ? 'Booking' : 'Play Credits' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Customer" min-width="140">
          <template #default="{ row }">
            <span style="font-size:12px;font-weight:700">{{ row.customer_name }}</span>
          </template>
        </el-table-column>
        <el-table-column label="Keterangan" min-width="160">
          <template #default="{ row }">
            <span style="font-size:12px;color:var(--text-secondary)">{{ row.description }}</span>
          </template>
        </el-table-column>
        <el-table-column label="Cabang" min-width="120">
          <template #default="{ row }">
            <span style="font-size:12px;font-weight:600">{{ row.store_name }}</span>
          </template>
        </el-table-column>
        <el-table-column label="Jumlah" width="130">
          <template #default="{ row }">
            <span style="font-weight:800;color:var(--color-primary)">{{ formatRp(row.amount) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="Status" width="90">
          <template #default="{ row }">
            <el-tag type="success" size="small">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
      </el-table>

      <div style="display:flex;justify-content:flex-end;margin-top:12px">
        <el-pagination v-model:current-page="txPage" :total="txTotal"
          layout="prev, pager, next" :page-size="20" @change="loadTransactions" />
      </div>

      <template #footer>
        <el-button @click="showTransactionModal = false">Tutup</el-button>
        <el-dropdown @command="handleExport">
          <el-button type="primary" size="small">
            <el-icon><Download /></el-icon> Export
            <el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="excel">Export ke Excel</el-dropdown-item>
              <el-dropdown-item command="pdf">Export ke PDF</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </template>
    </el-drawer>

  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { useBreakpoint } from '@/composables/useBreakpoint'
import * as echarts from 'echarts'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { getSalesSummary, getSalesTrend, getTransactions } from '@/api/sales/salesApi'
import { getStores } from '@/api/store/storeApi'

// ── Breakpoint ────────────────────────────────────────────────
const { isMobile, isTablet } = useBreakpoint()

// ── State ─────────────────────────────────────────────────────
const loading      = ref(false)
const summary      = ref(null)
const trendData    = ref([])
const stores       = ref([])
const customRange  = ref(null)

const trendChartRef = ref(null)
const donutChartRef = ref(null)
let trendChart = null
let donutChart = null

const filters = reactive({
  period:      'today',
  store_id:    '',
  type:        'all',
  date_from:   '',
  date_to:     '',
  granularity: 'daily',
})

const showTransactionModal = ref(false)
const txLoading = ref(false)
const transactions = ref([])
const txTotal      = ref(0)
const txPage       = ref(1)
const txFilter     = ref('all')

// ── Constants ─────────────────────────────────────────────────
const periods = [
  { label: 'Today',      value: 'today' },
  { label: 'Yesterday',  value: 'yesterday' },
  { label: 'This Week',  value: 'this_week' },
  { label: 'This Month', value: 'this_month' },
]

// ── Computed ──────────────────────────────────────────────────
const prevPeriodLabel = computed(() => ({
  today:      'kemarin',
  yesterday:  '2 hari lalu',
  this_week:  'minggu lalu',
  this_month: 'bulan lalu',
}[filters.period] || 'sebelumnya'))

const statCards = computed(() => {
  const s = summary.value?.stats
  if (!s) return []
  return [
    { key: 'total_revenue',   label: 'Total Revenue',         icon: 'Wallet',       iconBg: 'rgba(2,130,222,0.12)',   iconColor: 'var(--color-primary)',       value: formatRp(s.total_revenue),       change: s.total_revenue_change },
    { key: 'booking_revenue', label: 'Booking Revenue',       icon: 'Calendar',     iconBg: 'rgba(25,185,238,0.12)',  iconColor: 'var(--color-primary-light)', value: formatRp(s.booking_revenue),     change: s.booking_revenue_change },
    { key: 'credits_revenue', label: 'Play Credits Revenue',  icon: 'Coin',         iconBg: 'rgba(16,185,129,0.12)', iconColor: 'var(--color-success)',       value: formatRp(s.credits_revenue),     change: s.credits_revenue_change },
    { key: 'total_tx',        label: 'Total Transaksi',       icon: 'ShoppingCart', iconBg: 'rgba(245,158,11,0.12)', iconColor: 'var(--color-warning)',       value: String(s.total_transactions ?? 0), change: s.transactions_change },
    { key: 'avg',             label: 'Rata-rata / Transaksi', icon: 'TrendCharts',  iconBg: 'rgba(239,68,68,0.12)',  iconColor: 'var(--color-danger)',        value: formatRp(s.avg_per_transaction), change: s.avg_change },
  ]
})

// ── Helpers ───────────────────────────────────────────────────
const formatRp        = (v) => `Rp ${(v || 0).toLocaleString('id-ID')}`
const formatDate      = (d) => d ? new Date(d).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' }) : '-'
const formatDateShort = (d) => d ? new Date(d).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'2-digit' }) : '-'

const buildParams = () => ({
  period:    filters.period,
  store_id:  filters.store_id || undefined,
  type:      filters.type,
  date_from: filters.date_from || undefined,
  date_to:   filters.date_to   || undefined,
})

// theme-aware colors (no bg on chart — transparent)
const isLight      = () => document.body.classList.contains('light-mode')
const ctColor      = () => isLight() ? '#2d4a6e' : '#C9D4E2'
const gridColor    = () => isLight() ? '#c0d4f0' : '#0e3272'

// ── Helpers: parse trend response (try beberapa kemungkinan struktur) ──
const parseTrendData = (resData) => {
  // Kemungkinan struktur yang dikembalikan backend:
  //   { data: [...] }           → resData.data       (paling umum)
  //   { data: { items: [...] } }→ resData.data.items
  //   { data: { trend: [...] } }→ resData.data.trend
  //   { items: [...] }          → resData.items
  //   [...]                     → resData sendiri array
  const d = resData?.data
  if (Array.isArray(d))               return d
  if (Array.isArray(d?.items))        return d.items
  if (Array.isArray(d?.trend))        return d.trend
  if (Array.isArray(d?.data))         return d.data
  if (Array.isArray(resData?.items))  return resData.items
  if (Array.isArray(resData))         return resData
  console.warn('[SalesTrend] Struktur response tidak dikenali:', resData)
  return []
}

// ── Load ──────────────────────────────────────────────────────
const loadAll = async () => {
  loading.value = true
  try {
    const params = buildParams()
    const [sRes, tRes] = await Promise.all([
      getSalesSummary(params),
      getSalesTrend({ ...params, granularity: filters.granularity }),
    ])
    summary.value = sRes.data.data

    // Debug: lihat raw response trend di console browser
    console.log('[SalesTrend] raw response:', tRes.data)
    trendData.value = parseTrendData(tRes.data)
    console.log('[SalesTrend] parsed items:', trendData.value)

    await nextTick()
    renderTrendChart()
    renderDonutChart()
  } catch (err) {
    console.error('[SalesTrend] loadAll error:', err)
    ElMessage.error('Gagal memuat data sales')
  } finally {
    loading.value = false
  }
}

const loadTrend = async () => {
  try {
    const { data } = await getSalesTrend({ ...buildParams(), granularity: filters.granularity })
    console.log('[SalesTrend] loadTrend raw:', data)
    trendData.value = parseTrendData(data)
    renderTrendChart()
  } catch {}
}

const loadTransactions = async () => {
  txLoading.value = true
  try {
    const { data } = await getTransactions({ ...buildParams(), type: txFilter.value, page: txPage.value, per_page: 20 })
    transactions.value = data.data || []
    txTotal.value      = data.meta?.total || 0
  } catch { transactions.value = [] }
  finally { txLoading.value = false }
}

// ── Period ────────────────────────────────────────────────────
const setPeriod = (period) => {
  filters.period = period; filters.date_from = ''; filters.date_to = ''; customRange.value = null
  loadAll()
}
const onCustomRangeChange = (val) => {
  if (val) { filters.date_from = val[0]; filters.date_to = val[1]; loadAll() }
}

// ── Charts ────────────────────────────────────────────────────
const renderTrendChart = () => {
  if (!trendChartRef.value || !trendData.value?.length) return
  try {
    if (!trendChart) trendChart = echarts.init(trendChartRef.value)
    trendChart.resize()
  } catch (e) {
    console.error('[SalesTrend] ECharts init failed:', e)
    return
  }

  const tc = ctColor()
  const gc = gridColor()
  const labels     = trendData.value.map(d => d.label)
  const totalRev   = trendData.value.map(d => d.total_revenue)
  const bookingRev = trendData.value.map(d => d.booking_revenue)
  const creditsRev = trendData.value.map(d => d.credits_revenue)

  trendChart.setOption({
    tooltip: {
      trigger: 'axis',
      textStyle: { color: tc, fontSize: 12 },
      formatter: (params) => {
        const label = params[0].axisValue
        const rows = params.map(p =>
          `<div style="display:flex;justify-content:space-between;gap:18px">
            <span style="color:${p.color}">● ${p.seriesName}</span>
            <strong>${formatRp(p.value)}</strong>
          </div>`
        ).join('')
        return `<div style="font-size:12px"><strong>${label}</strong><div style="margin-top:6px">${rows}</div></div>`
      },
    },
    legend: {
      data: ['Total', 'Booking', 'Play Credits'],
      textStyle: { color: tc, fontSize: 11 },
      icon: 'circle', itemWidth: 7, itemHeight: 7, top: 2,
    },
    xAxis: {
      type: 'category', data: labels,
      axisLine: { lineStyle: { color: gc } },
      axisLabel: { color: tc, fontSize: 10 },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: tc, fontSize: 10, formatter: (v) => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : `${(v/1000).toFixed(0)}K` },
      splitLine: { lineStyle: { color: gc, type: 'dashed' } },
      axisLine: { show: false },
    },
    series: [
      {
        name: 'Total', type: 'line', data: totalRev, smooth: true,
        itemStyle: { color: '#0282DE' }, lineStyle: { color: '#0282DE', width: 2.5 },
        areaStyle: { color: new echarts.graphic.LinearGradient(0,0,0,1, [
          { offset: 0, color: 'rgba(2,130,222,0.18)' },
          { offset: 1, color: 'rgba(2,130,222,0.01)' },
        ]) },
      },
      {
        name: 'Booking', type: 'line', data: bookingRev, smooth: true,
        itemStyle: { color: '#19B9EE' }, lineStyle: { color: '#19B9EE', width: 2 },
      },
      {
        name: 'Play Credits', type: 'line', data: creditsRev, smooth: true,
        itemStyle: { color: '#10B981' }, lineStyle: { color: '#10B981', width: 2 },
      },
    ],
    grid: { left: 56, right: 16, top: 36, bottom: 28 },
  })
  // Re-resize after a tick in case the flex container fully settled after render
  setTimeout(() => trendChart?.resize(), 60)
}

const renderDonutChart = () => {
  if (!donutChartRef.value) return
  if (!donutChart) donutChart = echarts.init(donutChartRef.value)

  const data = (summary.value?.revenue_by_type || []).map(t => ({ name: t.label, value: t.revenue }))
  donutChart.setOption({
    tooltip: { trigger: 'item', formatter: (p) => `${p.name}: ${formatRp(p.value)} (${p.percent}%)` },
    color: ['#0282DE', '#10B981'],
    series: [{
      type: 'pie', radius: ['52%', '80%'], data,
      label: { show: false },
      emphasis: { itemStyle: { shadowBlur: 6, shadowColor: 'rgba(0,0,0,0.2)' } },
    }],
  })
}

// ── Export ────────────────────────────────────────────────────
const handleExport = async (format) => {
  ElMessage.info('Mengambil data...')
  try {
    const { data } = await getTransactions({ ...buildParams(), type: txFilter.value, page: 1, per_page: 9999 })
    const rows = data.data || []
    format === 'excel' ? exportToExcel(rows) : exportToPDF(rows)
  } catch { ElMessage.error('Gagal export') }
}

const exportToExcel = (rows) => {
  const ws = XLSX.utils.aoa_to_sheet([
    ['Tanggal','Waktu','Tipe','Customer','Keterangan','Cabang','Jumlah (Rp)','Status'],
    ...rows.map(r => [r.date, r.time, r.type === 'booking' ? 'Booking' : 'Play Credits', r.customer_name, r.description, r.store_name, r.amount, r.status]),
  ])
  ws['!cols'] = [{ wch:12 },{ wch:8 },{ wch:12 },{ wch:20 },{ wch:24 },{ wch:18 },{ wch:15 },{ wch:10 }]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Sales Detail')
  XLSX.writeFile(wb, `sales_${filters.date_from || filters.period}.xlsx`)
  ElMessage.success('Excel berhasil didownload')
}

const exportToPDF = (rows) => {
  const doc = new jsPDF({ orientation: 'landscape' })
  doc.setFontSize(16); doc.setTextColor(2,130,222); doc.text('QUANTUM GAMING CENTER', 14, 15)
  doc.setFontSize(11); doc.setTextColor(50,50,50); doc.text('Sales Report', 14, 22)
  if (summary.value) {
    const s = summary.value.stats
    doc.setFontSize(9); doc.setTextColor(100,100,100)
    doc.text(`Period: ${summary.value.date_from} – ${summary.value.date_to}`, 14, 30)
    doc.text(`Total: ${formatRp(s.total_revenue)} | Booking: ${formatRp(s.booking_revenue)} | Credits: ${formatRp(s.credits_revenue)} | Tx: ${s.total_transactions}`, 14, 36)
  }
  autoTable(doc, {
    startY: 42,
    head: [['Tanggal','Tipe','Customer','Keterangan','Cabang','Jumlah','Status']],
    body: rows.map(r => [`${r.date} ${r.time}`, r.type === 'booking' ? 'Booking' : 'Play Credits', r.customer_name, r.description, r.store_name, `Rp ${(r.amount||0).toLocaleString('id-ID')}`, r.status]),
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [2,130,222], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [240,246,255] },
  })
  doc.save(`sales_${filters.date_from || filters.period}.pdf`)
  ElMessage.success('PDF berhasil didownload')
}

// ── Resize + cleanup ──────────────────────────────────────────
const onResize = () => { trendChart?.resize(); donutChart?.resize() }

watch(showTransactionModal, (val) => { if (val) { txPage.value = 1; loadTransactions() } })

// Re-render trend chart whenever data changes (handles async timing)
watch(trendData, () => nextTick(renderTrendChart), { deep: false })

onMounted(async () => {
  try {
    const { data } = await getStores({ per_page: 100, status: 'active' })
    stores.value = data.data || []
  } catch {}
  await loadAll()
  window.addEventListener('resize', onResize)
  // Belt-and-suspenders: retry chart render after browser layout settles
  setTimeout(() => {
    if (trendData.value?.length) renderTrendChart()
    donutChart?.resize()
  }, 300)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
  trendChart?.dispose()
  donutChart?.dispose()
})
</script>

<style scoped>
/* ── Page wrapper ─────────────────────────────────────── */
.sales-page {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* ── Header ──────────────────────────────────────────── */
.page-header {
  display: flex; justify-content: space-between; align-items: flex-start;
  flex-shrink: 0;
}
.breadcrumb { font-size: 11px; color: var(--text-muted); font-weight: 500; margin-bottom: 3px; letter-spacing: 0.3px; }
.page-title  { font-size: 20px; font-weight: 800; color: var(--text-primary); letter-spacing: -0.3px; line-height: 1.2; }
.page-desc   { font-size: 12px; color: var(--text-secondary); font-weight: 500; margin-top: 2px; }

/* ── Filter Bar ──────────────────────────────────────── */
.filter-bar {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  flex-shrink: 0;
}
.period-buttons { display: flex; gap: 3px; }
.date-badge {
  display: flex; align-items: center; gap: 5px;
  font-size: 11.5px; font-weight: 700; color: var(--text-secondary);
  background: var(--bg-card); border: 1px solid var(--border-color);
  border-radius: 6px; padding: 5px 10px;
}

/* ── Stats Grid ──────────────────────────────────────── */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  flex-shrink: 0;
}
.stat-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  padding: 12px;
  display: flex; align-items: flex-start; gap: 10px;
  transition: box-shadow 0.2s, transform 0.15s;
}
.stat-card:hover { box-shadow: 0 4px 14px rgba(2,130,222,0.13); transform: translateY(-1px); }
.stat-icon-box {
  width: 36px; height: 36px; border-radius: 9px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.stat-body  { flex: 1; min-width: 0; }
.stat-label { font-size: 10.5px; color: var(--text-secondary); font-weight: 700; margin-bottom: 2px; }
.stat-value { font-size: 16px; font-weight: 800; color: var(--text-primary); line-height: 1.2; }
.stat-change {
  font-size: 10.5px; font-weight: 700; margin-top: 3px;
  display: flex; align-items: center; gap: 2px;
}
.pos { color: var(--color-success); }
.neg { color: var(--color-danger); }

/* ── Charts Top Row ──────────────────────────────────── */
.charts-top {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 10px;
  flex-shrink: 0;
}
.trend-card :deep(.el-card__body) { padding: 12px; }
.type-card :deep(.el-card__body) { padding: 12px; }

.card-header-row {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 8px; flex-shrink: 0;
}
.card-title { font-size: 13px; font-weight: 800; color: var(--text-primary); }

.trend-chart { width: 100%; height: 220px; }

/* Donut */
.donut-wrap { display: flex; align-items: center; gap: 10px; }
.donut-chart { width: 130px; height: 130px; flex-shrink: 0; }
.donut-legend { flex: 1; }
.legend-item { display: flex; align-items: flex-start; gap: 7px; margin-bottom: 8px; }
.legend-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; margin-top: 3px; }
.legend-body { flex: 1; }
.legend-top { display: flex; justify-content: space-between; }
.legend-name { font-size: 12px; font-weight: 600; color: var(--text-primary); }
.legend-pct  { font-size: 12px; font-weight: 800; color: var(--text-primary); }
.legend-rev  { font-size: 11px; color: var(--text-secondary); font-weight: 600; margin-top: 1px; }
.legend-total {
  border-top: 1px solid var(--border-color);
  padding-top: 7px;
  display: flex; justify-content: space-between;
  font-size: 12px; font-weight: 700; color: var(--text-primary);
}

/* ── Charts Bottom Row ───────────────────────────────── */
.charts-bottom {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  flex-shrink: 0;
}
.rev-card :deep(.el-card__body) { padding: 12px; }
.rev-list { display: flex; flex-direction: column; gap: 6px; }
.rev-row { display: flex; align-items: center; gap: 10px; }
.rev-info { flex: 1; min-width: 0; }
.rev-name { font-size: 12px; font-weight: 700; color: var(--text-primary); margin-bottom: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.rev-bar-wrap { height: 4px; background: var(--bg-main); border-radius: 3px; overflow: hidden; }
.rev-bar { height: 100%; border-radius: 3px; transition: width 0.4s ease; }
.rev-right { text-align: right; flex-shrink: 0; }
.rev-amount { font-size: 12px; font-weight: 800; color: var(--text-primary); }
.rev-pct    { font-size: 10.5px; color: var(--text-secondary); font-weight: 600; }
.rev-footer {
  border-top: 1px solid var(--border-color);
  margin-top: 7px; padding-top: 7px;
  display: flex; justify-content: space-between;
  font-size: 12px; font-weight: 700; color: var(--text-primary);
}
.empty-rev { font-size: 12px; color: var(--text-muted); text-align: center; padding: 10px 0; }

/* ── Detail CTA ──────────────────────────────────────── */
.detail-cta {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  border-radius: 10px;
  padding: 12px 16px;
  display: flex; align-items: center; justify-content: space-between;
  cursor: pointer;
  transition: box-shadow 0.2s, transform 0.15s;
  flex-shrink: 0;
}
.detail-cta:hover {
  box-shadow: 0 6px 22px rgba(2,130,222,0.45);
  transform: translateY(-1px);
}
.detail-cta-left { display: flex; align-items: center; gap: 12px; }
.detail-cta-icon {
  width: 34px; height: 34px;
  background: rgba(255,255,255,0.18);
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  color: #fff; flex-shrink: 0;
}
.detail-cta-title { font-size: 13px; font-weight: 800; color: #fff; }
.detail-cta-sub   { font-size: 11px; color: rgba(255,255,255,0.78); font-weight: 600; margin-top: 1px; }
.cta-btn {
  background: rgba(255,255,255,0.18) !important;
  color: #fff !important;
  border-color: rgba(255,255,255,0.3) !important;
  font-weight: 700 !important;
}
.cta-btn:hover {
  background: rgba(255,255,255,0.28) !important;
}

/* ── Trend empty state ───────────────────────────────── */
.trend-empty {
  height: 220px; width: 100%;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 10px; color: var(--text-muted); font-size: 12px; font-weight: 600;
}

/* ── Modal toolbar ───────────────────────────────────── */
.tx-toolbar { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }

/* ── Responsive ──────────────────────────────────────── */
@media (max-width:1023px) {
  .stats-grid { grid-template-columns: repeat(3, 1fr); }
  .charts-top { grid-template-columns: 1fr; }
  .charts-bottom { grid-template-columns: 1fr; }
}
@media (max-width:639px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
  .stats-grid .stat-card:last-child { grid-column: 1 / -1; }
  .filter-bar { flex-direction: column; align-items: stretch; }
  .period-buttons { overflow-x: auto; padding-bottom: 2px; white-space: nowrap; }
  .donut-wrap { flex-direction: column; align-items: center; }
  .donut-chart { width: 120px; height: 120px; }
  .donut-legend { width: 100%; }
  .tx-toolbar { flex-wrap: wrap; }
}
</style>
