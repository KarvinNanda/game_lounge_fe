<template>
  <!-- ── Filter Bar ────────────────────────────────────────── -->
  <div class="filter-bar">
    <!-- Tanggal -->
    <el-date-picker
      :model-value="date"
      @update:model-value="emit('update:date', $event)"
      type="date"
      format="DD MMM YYYY"
      value-format="YYYY-MM-DD"
      style="width:200px"
      @change="emit('change')"
    />
    <!-- Cabang — badge jika terkunci ke 1 store, dropdown jika bisa pilih -->
    <el-alert v-if="noAccess" type="warning" :closable="false" show-icon
      title="Tidak ada cabang aktif yang bisa Anda akses. Hubungi admin." />
    <div v-else-if="isStoreLocked" class="store-locked-badge">
      <el-icon><Location /></el-icon>
      <span>{{ lockedStoreName }}</span>
    </div>
    <el-select
      v-else
      :model-value="store"
      @update:model-value="emit('update:store', $event)"
      placeholder="Pilih Cabang"
      style="width:220px"
      @change="emit('change')"
    >
      <el-option
        v-for="s in stores"
        :key="s.id"
        :label="s.name"
        :value="s.id"
      />
    </el-select>
    <!-- Ruangan -->
    <el-select :model-value="room" @update:model-value="emit('update:room', $event)" placeholder="Semua Ruangan" clearable style="width:170px" @change="emit('change')">
      <el-option v-for="r in rooms" :key="r.id" :label="r.name" :value="r.id" />
    </el-select>

    <div style="margin-left:auto;display:flex;align-items:center;gap:10px">
      <span style="font-size:11px;color:var(--text-secondary)">
        Jam Operasional: {{ operatingHours }}
      </span>
    </div>
  </div>

  <!-- ── Status Legend ─────────────────────────────────────── -->
  <div class="legend-bar">
    <div class="legend-item"><div class="dot" style="background:var(--color-primary)"></div>Upcoming</div>
    <div class="legend-item"><div class="dot" style="background:#10B981"></div>Ongoing</div>
    <div class="legend-item"><div class="dot" style="background:#94A3B8"></div>Completed</div>
    <div class="legend-item"><div class="dot" style="background:#EF4444"></div>Cancelled</div>
    <div class="legend-item"><div class="dot" style="background:#F59E0B;box-shadow:0 0 0 2px rgba(245,158,11,0.3)"></div>Ending Soon</div>
  </div>

  <!-- ── Holiday Warning Banner ────────────────────────────── -->
  <div v-if="effectiveHours?.is_holiday" class="holiday-banner">
    <el-icon size="16"><WarningFilled /></el-icon>
    <div>
      <span style="font-weight:700">
        {{ effectiveHours.holiday_type === 'global' ? '🗓️ Hari Libur Nasional' : '📅 Tanggal Merah Cabang' }}
        — {{ effectiveHours.holiday_name }}
      </span>
      <span style="margin-left:8px;opacity:0.85">
        Jam operasional: {{ effectiveHours.open_time?.slice(0,5) }} – {{ effectiveHours.close_time?.slice(0,5) }}
        · Happy Hour tidak berlaku
      </span>
    </div>
  </div>
</template>

<script setup>
// Booking page filters: date, branch, room, status legend and holiday banner.
// Emits the new value first, then `change`, so the page reloads with it.
// Multi-root on purpose: keeps the page's DOM exactly as before the split.
defineProps({
  date: { type: String, default: '' },
  store: { type: String, default: '' },
  room: { type: String, default: '' },
  stores: { type: Array, default: () => [] },
  rooms: { type: Array, default: () => [] },
  noAccess: { type: Boolean, default: false },
  isStoreLocked: { type: Boolean, default: false },
  lockedStoreName: { type: String, default: '' },
  operatingHours: { type: String, default: '' },
  effectiveHours: { type: Object, default: null },
})
const emit = defineEmits(['update:date', 'update:store', 'update:room', 'change'])
</script>

<style scoped>
/* ── Filter ──────────────────────────────────────────── */
.filter-bar  { display:flex; align-items:center; gap:10px; flex-wrap:wrap; margin-bottom:8px; }
.legend-bar  { display:flex; gap:16px; align-items:center; font-size:11.5px; color:var(--text-secondary); font-weight:600; margin-bottom:10px; flex-wrap:wrap; }
.legend-item { display:flex; align-items:center; gap:5px; }
.dot         { width:10px; height:10px; border-radius:3px; }

/* ── Holiday Warning Banner ───────────────────────── */
.holiday-banner {
  background: var(--el-color-warning-light-9);
  border: 1px solid var(--el-color-warning-light-7);
  border-radius: var(--radius-lg);
  padding: 10px 14px;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: var(--font-size-sm);
  color: var(--warning);
  margin-bottom: 10px;
  flex-wrap: wrap;
}

/* ── Store Locked Badge ──────────────────────────────────── */
.store-locked-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 12px;
  height: 32px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  cursor: default;
  white-space: nowrap;
}
</style>
