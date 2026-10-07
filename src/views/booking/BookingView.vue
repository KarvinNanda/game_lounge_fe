<template>
  <div class="booking-page">

    <!-- ── Header ──────────────────────────────────────────── -->
    <PageHeader breadcrumb="Dashboard > Bookings" title="Booking Dashboard" description="Kelola jadwal dan booking ruangan">
      <template #actions>
        <el-dropdown v-if="can('bookings.create')" @command="handleNewBookingCommand" trigger="click">
          <el-button type="primary">
            <el-icon><Plus /></el-icon>
            New Booking
            <el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="regular">
                <div class="u-flex u-gap-2 new-booking-option">
                  <el-icon size="18" class="u-text-action"><CalendarIcon /></el-icon>
                  <div>
                    <div class="u-fw-semibold u-text-sm">Regular Booking</div>
                    <div class="u-text-xs u-text-secondary">Booking per ruangan</div>
                  </div>
                </div>
              </el-dropdown-item>
              <el-dropdown-item command="event">
                <div class="u-flex u-gap-2 new-booking-option">
                  <el-icon class="event-option-icon" size="18"><Star /></el-icon>
                  <div>
                    <div class="u-fw-semibold u-text-sm">Event Booking</div>
                    <div class="u-text-xs u-text-secondary">Booking 1 gedung penuh</div>
                  </div>
                </div>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </template>
    </PageHeader>

    <!-- ── New Booking Mode Banner ──────────────────────────── -->
    <div v-if="isNewBookingMode && !isNewBookingForm" class="new-booking-banner">
      <el-icon size="16"><InfoFilled /></el-icon>
      <span>NEW BOOKING MODE — Klik slot kosong pada kalender untuk membuat booking baru.</span>
      <el-button class="banner-cancel" size="small" text @click="toggleNewBookingMode">Batalkan</el-button>
    </div>

    <BookingFilterBar
      v-model:date="selectedDate"
      v-model:store="selectedStore"
      v-model:room="selectedRoom"
      :stores="accessibleStores"
      :rooms="allRooms"
      :no-access="noAccess"
      :is-store-locked="isStoreLocked"
      :locked-store-name="lockedStoreName"
      :operating-hours="operatingHours"
      :effective-hours="effectiveHours"
      @change="loadDashboard"
    />

    <div class="main-area">
      <!-- ── Calendar Grid ──────────────────────────────────── -->
      <BookingGrid
        :date="selectedDate"
        :store="selectedStore"
        :loading="loading"
        :dashboard-data="dashboardData"
        :time-slots="timeSlots"
        :open-hour="openHour"
        :event-bookings="eventBookings"
        :is-new-booking-mode="isNewBookingMode"
        :with-panel="!!selectedBooking || isNewBookingForm"
        @change-date="changeDate"
        @slot-click="handleSlotClick"
        @booking-click="handleBookingClick"
        @event-click="handleEventClick"
      />

      <!-- ── Right Panel ────────────────────────────────────── -->
      <transition name="slide">

        <BookingDetailPanel
          v-if="panelMode === 'detail'"
          :booking="selectedBooking"
          @close="selectedBooking = null"
          @cancelled="selectedBooking = null; loadDashboard()"
          @completed="selectedBooking = null; loadDashboard()"
        />

        <EventBookingPanel
          v-else-if="panelMode === 'event-form'"
          :key="eventFormKey"
          :store="selectedStore"
          :date="selectedDate"
          :dashboard-data="dashboardData"
          @close="isEventBookingForm = false"
          @created="isEventBookingForm = false; loadDashboard()"
        />

        <EventDetailPanel
          v-else-if="panelMode === 'event-detail'"
          :event="selectedEvent"
          @close="selectedEvent = null"
          @cancelled="selectedEvent = null; loadDashboard()"
        />

        <NewBookingPanel
          v-else-if="panelMode === 'new'"
          :selection="newBookingSelection"
          :store="selectedStore"
          :rooms="allRooms"
          @close="closeNewBookingForm"
          @created="loadDashboard"
          @view-booking="isNewBookingForm = false; isNewBookingMode = false"
        />
      </transition>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { usePermission } from '@/composables/usePermission'
import { notifyError } from '@/utils/notify'
import { businessDayWIB, shiftDate } from '@/utils/bookingTime'
import BookingFilterBar from '@/components/booking/BookingFilterBar.vue'
import BookingGrid from '@/components/booking/BookingGrid.vue'
import BookingDetailPanel from '@/components/booking/BookingDetailPanel.vue'
import EventDetailPanel from '@/components/booking/EventDetailPanel.vue'
import EventBookingPanel from '@/components/booking/EventBookingPanel.vue'
import NewBookingPanel from '@/components/booking/NewBookingPanel.vue'
import { useBookingDashboard } from '@/composables/useBookingDashboard'
import { useAllowedStores } from '@/composables/useAllowedStores'
import PageHeader from '@/components/ui/PageHeader.vue'

const { can } = usePermission()

// ── State ─────────────────────────────────────────────────────
const selectedStore = ref('')
const selectedDate = ref(businessDayWIB())
const selectedRoom = ref('')

// Calendar data for the selected branch + date (dashboard, hours, events)
const {
  loading, dashboardData, allRooms, eventBookings, effectiveHours,
  operatingHours, timeSlots, openHour, load: loadDashboard,
} = useBookingDashboard({ store: selectedStore, date: selectedDate, room: selectedRoom })

const isNewBookingMode = ref(false)
const isNewBookingForm = ref(false)
const selectedBooking = ref(null)

// ── Event Booking State ───────────────────────────────────────
const isEventBookingForm    = ref(false)
const selectedEvent         = ref(null)

// Which right-hand panel shows. Same precedence as the old v-if chain; the
// four flags stay because closing a booking detail opened over an event
// detail must show the event detail again (see spec "Findings").
const panelMode = computed(() => {
  if (selectedBooking.value && !isNewBookingForm.value) return 'detail'
  if (isEventBookingForm.value) return 'event-form'
  if (selectedEvent.value) return 'event-detail'
  if (isNewBookingForm.value) return 'new'
  return 'empty'
})

// ── Store Access Filter ───────────────────────────────────────
// Cabang yang boleh dipakai staff ini (dari store_access di /auth/me).
// Booking selalu butuh satu cabang, jadi tidak ada opsi "Semua Cabang".
const { stores: accessibleStores, noAccess, loadStores } = useAllowedStores({ allowAll: false })

// Dropdown tidak bisa diubah jika staff hanya punya tepat 1 store
const isStoreLocked = computed(() => !noAccess.value && accessibleStores.value.length === 1)
const lockedStoreName = computed(() => (isStoreLocked.value ? accessibleStores.value[0].name : ''))

// ── Event Booking Helpers ─────────────────────────────────────
const handleNewBookingCommand = (command) => {
  if (command === 'regular') {
    toggleNewBookingMode()
  } else if (command === 'event') {
    openEventBookingForm()
  }
}

const eventFormKey = ref(0)
const openEventBookingForm = () => {
  // A new key remounts the panel, which resets its form (as before the split)
  eventFormKey.value++
  isEventBookingForm.value = true
  isNewBookingMode.value   = false
  selectedBooking.value    = null
  selectedEvent.value      = null
}

const handleEventClick = (event) => {
  selectedEvent.value      = event
  isNewBookingForm.value   = false
  isEventBookingForm.value = false
  selectedBooking.value    = null
}

// ── New Booking Flow ──────────────────────────────────────────
const toggleNewBookingMode = () => {
  isNewBookingMode.value = !isNewBookingMode.value
  if (!isNewBookingMode.value) {
    isNewBookingForm.value = false
    selectedBooking.value = null
  }
}

const newBookingSelection = ref(null)
const handleSlotClick = (room, slot, idx) => {
  if (!isNewBookingMode.value) return
  const startH = openHour.value + idx
  newBookingSelection.value = {
    storeId: selectedStore.value,
    roomId: room.id,
    roomName: room.name,
    date: selectedDate.value,
    startTime: `${String(startH % 24).padStart(2,'0')}:00`,
    endTime: `${String((startH + 1) % 24).padStart(2,'0')}:00`,
  }
  selectedBooking.value = null
  isNewBookingForm.value = true
}

const closeNewBookingForm = () => {
  isNewBookingForm.value = false
  isNewBookingMode.value = false
  selectedBooking.value = null
}

// ── Booking Detail Actions ────────────────────────────────────
const handleBookingClick = (bk) => {
  selectedBooking.value = bk
  isNewBookingForm.value = false
  isNewBookingMode.value = false
}

// ── Date Navigation ───────────────────────────────────────────
const changeDate = (delta) => {
  // The date picker is clearable: step from the current business day when it is empty.
  selectedDate.value = shiftDate(selectedDate.value || businessDayWIB(), delta)
  loadDashboard()
}

// ── Mount ─────────────────────────────────────────────────────
onMounted(async () => {
  try {
    selectedStore.value = await loadStores()
    if (selectedStore.value) await loadDashboard()
  } catch (e) {
    notifyError(e, 'Gagal memuat data cabang')
  }
})

</script>

<style scoped>
.booking-page { display:flex; flex-direction:column; min-height:0; }

/* ── Banner ──────────────────────────────────────────── */
.new-booking-banner {
  background: linear-gradient(135deg, var(--action), var(--action-hover));
  color: var(--text-on-action); padding: 10px 16px; border-radius: 8px;
  display: flex; align-items: center; gap: 10px;
  font-size: 13px; font-weight: 700; margin-bottom: 10px;
  letter-spacing: 0.2px;
}

/* ── Main layout ─────────────────────────────────────── */
.main-area {
  display: flex; gap: 14px;
  height: calc(100vh - 255px);
  min-height: 420px;
}

/* ── Right Panel ─────────────────────────────────────── */
.slide-enter-active, .slide-leave-active { transition: all 0.22s ease; }
.slide-enter-from, .slide-leave-to { opacity: 0; transform: translateX(20px); }

/* C3: former inline styles */
/* Dropdown items are teleported and render no scoped root; the inner slot content does get the scope.
   Element Plus already pads items 5px 16px, so this adds the rest of the old 10px 16px. */
.new-booking-option { padding: var(--space-1) 0; }
.event-option-icon { color: var(--warning); }
.banner-cancel { color: var(--text-on-action); margin-left: auto; }
</style>
