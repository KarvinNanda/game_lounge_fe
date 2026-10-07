<template>
  <div class="grid-area" :class="{ 'with-panel': withPanel }">

    <!-- Date Navigation -->
    <div class="u-flex u-justify-between u-mb-3">
      <el-button circle plain @click="emit('change-date', -1)"><el-icon><ArrowLeft /></el-icon></el-button>
      <span class="grid-date-title">
        <el-icon class="u-text-action"><CalendarIcon /></el-icon>
        {{ formatDateDisplay(date) }}
      </span>
      <el-button circle plain @click="emit('change-date', 1)"><el-icon><ArrowRight /></el-icon></el-button>
    </div>

    <!-- Room Type Tabs -->
    <div class="room-type-tabs" v-if="roomGroups.length > 0">
      <button
        v-for="group in roomGroups"
        :key="group.templateName"
        class="room-type-tab"
        :class="{ active: (activeRoomTab || roomGroups[0]?.templateName) === group.templateName }"
        @click="activeRoomTab = group.templateName"
      >
        {{ group.templateName }}
        <span class="tab-count">{{ group.rooms.length }}</span>
      </button>
    </div>

    <!-- Grid Container -->
    <div v-loading="loading" class="grid-scroll-wrapper">
      <div class="grid-container" :style="{ width: gridTotalWidth + 'px' }">

        <!-- Time Header -->
        <div class="grid-row header-row">
          <div class="room-label-cell header-label-cell">RUANGAN</div>
          <div
            v-for="(slot, idx) in timeSlots" :key="idx"
            class="time-header-cell"
            :style="{ width: SLOT_WIDTH + 'px' }"
          >{{ slot }}</div>
        </div>

        <!-- Event Booking Merged Blocks — absolute overlay per tab room type -->
        <div class="event-overlay-container" v-if="eventBookings.length > 0">
          <template v-for="event in eventBookings" :key="event.id">
            <div
              v-if="isRoomTabInEvent(event)"
              class="event-merged-block"
              :style="getEventBlockStyle(event)"
              @click="emit('event-click', event)"
            >
              <el-icon class="event-block-icon" size="18"><Star /></el-icon>
              <div class="event-block-title">EVENT</div>
              <div class="event-block-name">{{ event.event_name }}</div>
              <div class="event-block-time">{{ event.start_time?.slice(0,5) }} – {{ event.end_time?.slice(0,5) }}</div>
              <div class="event-block-scope" v-if="event.booking_scope === 'per_room_type'"
                  >Per Tipe Ruangan</div>
            </div>
          </template>
        </div>

        <!-- Empty state -->
        <div v-if="roomGroups.length === 0 && !loading" class="empty-grid-state">
          <el-icon size="40" class="u-text-muted"><CalendarIcon /></el-icon>
          <p>Belum ada data ruangan. Pilih cabang terlebih dahulu.</p>
        </div>

        <!-- Room rows — only active tab's group -->
        <template v-if="activeRoomGroup">
          <div
            v-for="room in activeRoomGroup.rooms" :key="room.id"
            class="grid-row room-row"
          >
            <!-- Room label -->
            <div class="room-label-cell">
              <div>
                <div class="u-fw-semibold u-text-xs">{{ room.name }}</div>
                <div class="u-text-xs u-text-muted">{{ room.room_template?.name }}</div>
              </div>
            </div>

            <!-- Slots & Booking blocks -->
            <div
              class="slots-area"
              :style="{ width: (timeSlots.length * SLOT_WIDTH) + 'px' }"
            >
              <!-- Empty slot cells (for click in New Booking Mode) -->
              <div
                v-for="(slot, idx) in timeSlots" :key="idx"
                class="empty-slot"
                :style="{ left: (idx * SLOT_WIDTH) + 'px', width: SLOT_WIDTH + 'px' }"
                :class="{ clickable: isNewBookingMode }"
                @click="emit('slot-click', room, slot, idx)"
              />

              <!-- Booking blocks -->
              <div
                v-for="bk in getBookingsForRoom(room.id)" :key="bk.id"
                class="booking-block"
                :class="[getBlockClass(bk), { 'ending-soon': bk.is_ending_soon }]"
                :style="getBookingBlockStyle(bk)"
                @click.stop="emit('booking-click', bk)"
              >
                <div class="block-name">{{ bk.customer_name }}</div>
                <div class="block-time">{{ bk.start_time?.slice(0,5) }} - {{ bk.end_time?.slice(0,5) }}</div>
              </div>
            </div>
          </div>
        </template>

      </div>
    </div><!-- end grid-scroll-wrapper -->

    <!-- Footer hint -->
    <div class="grid-footer">
      <el-icon><InfoFilled /></el-icon>
      {{ isNewBookingMode ? 'Klik slot kosong untuk membuat booking baru' : 'Klik pada blok booking untuk melihat detail' }}
    </div>
  </div>
</template>

<script setup>
// Booking calendar: room-type tabs, date navigation, booking and event
// blocks. Owns only view state (active tab); every action is an event.
import { ref, computed, watch } from 'vue'
import { formatDateDisplay } from '@/utils/format'
import {
  SLOT_WIDTH, bookingBlockStyle, blockClass,
  eventBlockStyle, isEventInRoomGroup, groupRoomsByTemplate,
} from '@/utils/bookingGrid'

const props = defineProps({
  date: { type: String, default: '' },
  store: { type: String, default: '' },
  loading: { type: Boolean, default: false },
  dashboardData: { type: Object, default: null },
  timeSlots: { type: Array, default: () => [] },
  openHour: { type: Number, default: 10 },
  eventBookings: { type: Array, default: () => [] },
  isNewBookingMode: { type: Boolean, default: false },
  withPanel: { type: Boolean, default: false },
})
const emit = defineEmits(['change-date', 'slot-click', 'booking-click', 'event-click'])

const roomGroups = computed(() => groupRoomsByTemplate(props.dashboardData?.rooms || []))

// ── Room Type Tab ─────────────────────────────────────────────
const activeRoomTab = ref(null)

const activeRoomGroup = computed(() => {
  if (!roomGroups.value.length) return null
  if (!activeRoomTab.value) return roomGroups.value[0]
  return roomGroups.value.find(g => g.templateName === activeRoomTab.value) || roomGroups.value[0]
})

watch(() => [props.store, props.date], () => {
  activeRoomTab.value = null
})

const gridTotalWidth = computed(() => 140 + props.timeSlots.length * SLOT_WIDTH)

// ── Grid Logic ────────────────────────────────────────────────
const getBookingsForRoom = (roomId) => {
  if (!props.dashboardData?.rooms) return []
  const room = props.dashboardData.rooms.find(r => r.id === roomId)
  return room?.bookings || []
}

const getBookingBlockStyle = (bk) => bookingBlockStyle(bk, props.openHour)
const getBlockClass = (bk) => blockClass(bk.status)

// Apakah tab room type yang sedang aktif termasuk dalam event ini?
const isRoomTabInEvent = (event) => isEventInRoomGroup(event, activeRoomGroup.value?.rooms || [])
// Untuk per_room_type, tinggi disesuaikan dengan jumlah room di tab aktif
const getEventBlockStyle = (event) =>
  eventBlockStyle(event, props.openHour, activeRoomGroup.value?.rooms?.length || 1)
</script>

<style scoped>
/* ── Grid area ───────────────────────────────────────── */
.grid-area {
  flex: 1; display: flex; flex-direction: column;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px; padding: 14px;
  overflow: hidden; min-width: 0;
}

.grid-scroll-wrapper {
  flex: 1; overflow: auto;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-main);
}

.grid-container { position: relative; }

/* Grid rows */
.grid-row { display: flex; align-items: stretch; }
.grid-row + .grid-row { border-top: 1px solid var(--border-color); }
.header-row {
  background: var(--bg-card-hover);
  position: sticky; top: 0; z-index: 10;
  border-bottom: 2px solid var(--border-color);
}
.group-header-row {
  background: rgba(2,130,222,0.07);
  border-top: 1px solid var(--border-color);
}
.group-header-cell {
  padding: 5px 12px; font-size: 10px; font-weight: 800;
  text-transform: uppercase; letter-spacing: 1.2px;
  color: var(--color-primary-light); width: 100%;
}

/* Room label */
.room-label-cell {
  width: 145px; min-width: 145px; padding: 8px 12px;
  display: flex; align-items: center;
  background: var(--bg-card);
  border-right: 2px solid var(--border-color);
  position: sticky; left: 0; z-index: 5;
}
.header-label-cell {
  font-size: 10px; font-weight: 800; letter-spacing: 1px;
  color: var(--text-secondary); text-transform: uppercase;
}

/* Time header */
.time-header-cell {
  display: flex; align-items: center; justify-content: center;
  padding: 8px 0;
  font-size: 11px; font-weight: 700;
  color: var(--text-secondary);
  border-right: 1px solid var(--border-color);
  flex-shrink: 0;
}

/* Room row */
.room-row { height: 56px; }

/* Slots area */
.slots-area { position: relative; flex: 1; }
.empty-slot {
  position: absolute; top: 0; bottom: 0;
  border-right: 1px solid var(--border-color);
  transition: background 0.12s;
}
.empty-slot.clickable:hover {
  background: rgba(2,130,222,0.1);
  cursor: crosshair;
}

/* Booking blocks */
.booking-block {
  position: absolute; top: 5px; bottom: 5px;
  border-radius: 6px; padding: 4px 8px;
  cursor: pointer; overflow: hidden;
  transition: filter var(--motion-fast) var(--ease-out);
  display: flex; flex-direction: column;
  justify-content: center; z-index: 2;
}
.booking-block:hover { filter: brightness(1.08); }

/* Booking blocks — solid colours, white text ≥ 4.5:1 */
.block-upcoming  { background: var(--el-color-primary); color: var(--text-on-action); border: 1px solid var(--el-color-primary-dark-2); }
.block-ongoing   { background: var(--el-color-success); color: var(--text-on-action); border: 1px solid var(--el-color-success-dark-2); }
.block-completed { background: var(--el-color-info);    color: var(--text-on-action); border: 1px solid var(--el-color-info-dark-2); }
.block-cancelled { background: var(--el-color-danger);  color: var(--text-on-action); border: 1px solid var(--el-color-danger-dark-2); text-decoration: line-through; }
.ending-soon     { border-color: var(--warning); box-shadow: 0 0 0 2px rgba(245,158,11,0.3); }

.block-name { font-weight: 700; font-size: 11.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.block-time { font-size: 11px; font-weight: 600; margin-top: 1px; }

/* Empty grid */
.empty-grid-state {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; padding: 56px 20px;
  color: var(--text-muted); font-size: 13px;
  font-weight: 500; gap: 10px;
}

/* ── Room Type Tabs ──────────────────────────────────────── */
.room-type-tabs {
  display:flex; gap:6px; flex-wrap:wrap;
  margin-bottom:10px; padding-bottom:10px;
  border-bottom:1px solid var(--border-color);
}
.room-type-tab {
  display:flex; align-items:center; gap:6px;
  padding:6px 14px; border-radius:8px;
  border:1px solid var(--border-color);
  background:var(--bg-card); color:var(--text-secondary);
  font-size:12px; font-weight:600; cursor:pointer;
  transition:all 0.15s; white-space:nowrap;
}
.room-type-tab:hover {
  border-color:var(--color-primary); color:var(--color-primary);
}
.room-type-tab.active {
  background:var(--color-primary);
  border-color:var(--action); color:var(--text-on-action);
}
.tab-count {
  background:rgba(255,255,255,0.25);
  border-radius:10px; padding:1px 6px;
  font-size:10px; font-weight:700;
}
.room-type-tab:not(.active) .tab-count {
  background:var(--bg-main); color:var(--text-secondary);
}

/* Grid footer */
.grid-footer {
  font-size: 11.5px; color: var(--text-secondary); font-weight: 600;
  display: flex; align-items: center; gap: 6px;
  padding-top: 8px; border-top: 1px solid var(--border-color); margin-top: 8px;
}


/* ── Event blocks ────────────────────────────────────────── */
/* Overlay container — absolute di atas semua room rows */
.event-overlay-container {
  position: absolute;
  top: 36px; /* offset header row height */
  left: 145px; /* offset room label cell width */
  right: 0;
  bottom: 0;
  pointer-events: none;
}

/* Merged event block */
.event-merged-block {
  position: absolute;
  background: var(--event-bg);
  border: 2px solid var(--event-border);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  cursor: pointer;
  pointer-events: auto;
  z-index: 8;
  transition: opacity 0.15s;
}
.event-merged-block:hover { opacity: 0.85; }

.event-block-title { font-size: 11px; font-weight: 700; color: var(--event-text); letter-spacing: 1px; }
.event-block-name  { font-size: 13px; font-weight: 500; color: var(--event-text); text-align: center; padding: 0 8px; }
.event-block-time  { font-size: 11px; color: var(--event-text-muted); }


/* C3: former inline styles */
.grid-date-title { font-weight: 700; font-size: var(--font-size-base); display: flex; align-items: center; gap: var(--space-1); }
.event-block-icon { color: var(--event-text); margin-bottom: var(--space-1); }
.event-block-scope { font-size: var(--font-size-xs); opacity: 0.75; margin-top: var(--space-1); }
</style>
