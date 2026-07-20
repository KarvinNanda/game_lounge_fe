<template>
  <div class="booking-page">

    <!-- ── Header ──────────────────────────────────────────── -->
    <div class="page-header">
      <div>
        <div class="breadcrumb">Dashboard > Bookings</div>
        <h1 class="page-title">Booking Dashboard</h1>
        <p class="page-desc">Kelola jadwal dan booking ruangan</p>
      </div>
      <div style="display:flex;gap:10px;align-items:center">
        <el-dropdown v-if="can('bookings.create')" @command="handleNewBookingCommand" trigger="click">
          <el-button type="primary">
            <el-icon><Plus /></el-icon>
            New Booking
            <el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="regular" style="padding:10px 16px">
                <div style="display:flex;align-items:center;gap:10px">
                  <el-icon size="18" style="color:var(--color-primary)"><CalendarIcon /></el-icon>
                  <div>
                    <div style="font-weight:600;font-size:13px">Regular Booking</div>
                    <div style="font-size:11px;color:var(--text-secondary)">Booking per ruangan</div>
                  </div>
                </div>
              </el-dropdown-item>
              <el-dropdown-item command="event" style="padding:10px 16px">
                <div style="display:flex;align-items:center;gap:10px">
                  <el-icon size="18" style="color:#D97706"><Star /></el-icon>
                  <div>
                    <div style="font-weight:600;font-size:13px">Event Booking</div>
                    <div style="font-size:11px;color:var(--text-secondary)">Booking 1 gedung penuh</div>
                  </div>
                </div>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <!-- ── New Booking Mode Banner ──────────────────────────── -->
    <div v-if="isNewBookingMode && !isNewBookingForm" class="new-booking-banner">
      <el-icon size="16"><InfoFilled /></el-icon>
      <span>NEW BOOKING MODE — Klik slot kosong pada kalender untuk membuat booking baru.</span>
      <el-button size="small" text style="color:white;margin-left:auto" @click="toggleNewBookingMode">Batalkan</el-button>
    </div>

    <!-- ── Filter Bar ────────────────────────────────────────── -->
    <div class="filter-bar">
      <!-- Tanggal -->
      <el-date-picker
        v-model="selectedDate"
        type="date"
        format="DD MMM YYYY"
        value-format="YYYY-MM-DD"
        style="width:200px"
        @change="loadDashboard"
      />
      <!-- Cabang — badge jika terkunci ke 1 store, dropdown jika bisa pilih -->
      <div v-if="isStoreLocked" class="store-locked-badge">
        <el-icon><Location /></el-icon>
        <span>{{ lockedStoreName }}</span>
      </div>
      <el-select
        v-else
        v-model="selectedStore"
        placeholder="Pilih Cabang"
        style="width:220px"
        @change="loadDashboard"
      >
        <el-option
          v-for="s in accessibleStores"
          :key="s.id"
          :label="s.name"
          :value="s.id"
        />
      </el-select>
      <!-- Ruangan -->
      <el-select v-model="selectedRoom" placeholder="Semua Ruangan" clearable style="width:170px" @change="loadDashboard">
        <el-option v-for="r in allRooms" :key="r.id" :label="r.name" :value="r.id" />
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

    <div class="main-area">
      <!-- ── Calendar Grid ──────────────────────────────────── -->
      <div class="grid-area" :class="{ 'with-panel': !!selectedBooking || isNewBookingForm }">

        <!-- Date Navigation -->
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <el-button circle plain @click="changeDate(-1)"><el-icon><ArrowLeft /></el-icon></el-button>
          <span style="font-weight:700;font-size:15px;display:flex;align-items:center;gap:6px">
            <el-icon style="color:var(--color-primary)"><CalendarIcon /></el-icon>
            {{ formatDateDisplay(selectedDate) }}
          </span>
          <el-button circle plain @click="changeDate(1)"><el-icon><ArrowRight /></el-icon></el-button>
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
                  @click="handleEventClick(event)"
                >
                  <el-icon size="18" style="color:#EEEDFE;margin-bottom:4px"><Star /></el-icon>
                  <div class="event-block-title">EVENT</div>
                  <div class="event-block-name">{{ event.event_name }}</div>
                  <div class="event-block-time">{{ event.start_time?.slice(0,5) }} – {{ event.end_time?.slice(0,5) }}</div>
                  <div v-if="event.booking_scope === 'per_room_type'"
                       style="font-size:9px;opacity:0.75;margin-top:2px">Per Tipe Ruangan</div>
                </div>
              </template>
            </div>

            <!-- Empty state -->
            <div v-if="roomGroups.length === 0 && !loading" class="empty-grid-state">
              <el-icon size="40" style="color:var(--text-muted)"><CalendarIcon /></el-icon>
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
                    <div style="font-weight:600;font-size:12px">{{ room.name }}</div>
                    <div style="font-size:10px;color:var(--text-muted)">{{ room.room_template?.name }}</div>
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
                    @click="handleSlotClick(room, slot, idx)"
                  />

                  <!-- Booking blocks -->
                  <div
                    v-for="bk in getBookingsForRoom(room.id)" :key="bk.id"
                    class="booking-block"
                    :class="[getBlockClass(bk), { 'ending-soon': bk.is_ending_soon }]"
                    :style="getBookingBlockStyle(bk)"
                    @click.stop="handleBookingClick(bk)"
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

      <!-- ── Right Panel ────────────────────────────────────── -->
      <transition name="slide">

        <!-- Detail Booking Panel -->
        <div v-if="selectedBooking && !isNewBookingForm" class="right-panel">
          <div class="panel-header">
            <span style="font-size:13px;font-weight:700;letter-spacing:0.5px">DETAIL BOOKING</span>
            <el-button circle text @click="selectedBooking = null"><el-icon><Close /></el-icon></el-button>
          </div>

          <!-- Status badge -->
          <el-tag :type="getStatusTagType(selectedBooking.status)" style="margin-bottom:14px">
            {{ selectedBooking.status?.toUpperCase() }}
          </el-tag>

          <!-- Customer info -->
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;padding:12px;background:var(--bg-main);border-radius:8px">
            <el-avatar :size="42" style="background:linear-gradient(135deg,#0282DE,#0262b0);font-weight:700">
              {{ selectedBooking.customer_name?.[0]?.toUpperCase() }}
            </el-avatar>
            <div>
              <div style="font-weight:700;font-size:14px">{{ selectedBooking.customer_name }}</div>
              <el-tag v-if="selectedBooking.customer?.type" size="small"
                :type="selectedBooking.customer?.type === 'member' ? 'warning' : 'info'"
                style="margin-top:2px">
                {{ selectedBooking.customer?.type === 'member' ? 'Member' : 'Regular' }}
              </el-tag>
              <div v-if="selectedBooking.customer_whatsapp" style="font-size:11px;color:var(--text-secondary);margin-top:2px">
                📱 {{ selectedBooking.customer_whatsapp }}
              </div>
            </div>
          </div>

          <!-- Booking info grid -->
          <div class="info-section-title">INFORMASI BOOKING</div>
          <div class="info-grid">
            <div class="info-row">
              <span>Booking ID</span>
              <strong style="font-family:monospace;color:var(--color-primary)">{{ selectedBooking.booking_code }}</strong>
            </div>
            <div class="info-row">
              <span>Room</span>
              <span>{{ selectedBooking.room?.name }}</span>
            </div>
            <div class="info-row">
              <span>Tanggal</span>
              <span>{{ formatDateDisplay(selectedBooking.booking_date) }}</span>
            </div>
            <div class="info-row">
              <span>Waktu</span>
              <span>{{ selectedBooking.start_time?.slice(0,5) }} – {{ selectedBooking.end_time?.slice(0,5) }} ({{ selectedBooking.duration_hours }} Jam)</span>
            </div>
            <div class="info-row">
              <span>Total Harga</span>
              <strong style="color:var(--color-primary)">{{ formatRp(selectedBooking.total_price) }}</strong>
            </div>
            <div class="info-row">
              <span>Payment</span>
              <span>{{ selectedBooking.payment_method === 'play_credits' ? '🎮 Play Credits' : '💵 Cash' }}</span>
            </div>
          </div>

          <!-- Cancel reason (if cancelled) -->
          <div v-if="selectedBooking.status === 'cancelled'"
               style="margin-top:12px;background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:8px;padding:10px;font-size:12px;color:var(--color-danger)">
            <div style="font-weight:700;margin-bottom:4px">Alasan Pembatalan</div>
            {{ selectedBooking.cancel_reason || '-' }}
          </div>

          <!-- Ending soon warning -->
          <div v-if="selectedBooking.is_ending_soon" class="ending-soon-alert">
            <el-icon><WarningFilled /></el-icon>
            Sesi akan berakhir dalam kurang dari 30 menit!
          </div>

          <!-- Aksi Cepat -->
          <div v-if="selectedBooking.status !== 'cancelled' && selectedBooking.status !== 'completed' && (can('bookings.edit') || can('bookings.cancel'))"
               style="margin-top:16px">
            <div class="info-section-title">AKSI CEPAT</div>
            <el-button v-if="can('bookings.edit')" style="width:100%;margin-bottom:8px;justify-content:flex-start" plain
              @click="openCompleteConfirm">
              <el-icon><CircleCheck /></el-icon> Mark as Completed
            </el-button>
            <el-button v-if="can('bookings.cancel')" type="danger" plain style="width:100%;justify-content:flex-start"
              @click="openCancelForm">
              <el-icon><CircleClose /></el-icon> Cancel Booking
            </el-button>
          </div>

          <!-- Catatan -->
          <div style="margin-top:16px" v-if="selectedBooking.notes">
            <div class="info-section-title">CATATAN</div>
            <p style="font-size:12px;color:var(--text-secondary);background:var(--bg-main);padding:10px;border-radius:6px">
              {{ selectedBooking.notes }}
            </p>
          </div>

          <AuditTrail
            :created-by="selectedBooking.created_by"
            :updated-by="selectedBooking.updated_by"
            :created-at="selectedBooking.created_at"
            :updated-at="selectedBooking.updated_at"
          />
        </div>

        <!-- Event Booking Form Panel -->
        <div v-else-if="isEventBookingForm" class="right-panel">
          <div class="panel-header">
            <span style="font-size:14px;font-weight:700">EVENT BOOKING BARU</span>
            <el-button circle text @click="isEventBookingForm = false"><el-icon><Close /></el-icon></el-button>
          </div>

          <div class="event-form-badge">
            <el-icon><Star /></el-icon>
            <span v-if="eventForm.booking_scope === 'full_venue'">Booking seluruh gedung — semua ruangan terblokir</span>
            <span v-else>Booking per tipe ruangan — pilih tipe yang diblokir</span>
          </div>

          <el-form :model="eventForm" label-position="top">
            <el-form-item label="Nama Event *">
              <el-input v-model="eventForm.event_name"
                placeholder="Contoh: Birthday Party, Tournament PS5"
                maxlength="150" show-word-limit />
            </el-form-item>

            <!-- BARU: Description -->
            <el-form-item label="Deskripsi (Opsional)">
              <el-input
                v-model="eventForm.description"
                type="textarea"
                :rows="3"
                placeholder="Contoh: Paket ini sudah termasuk FnB 1 paket per orang, dekorasi, dan akses semua ruangan lantai 4."
                maxlength="500"
                show-word-limit
              />
              <div style="font-size:11px;color:var(--text-muted);margin-top:4px">
                💡 Deskripsi ini akan ditampilkan kepada customer di halaman konfirmasi booking.
              </div>
            </el-form-item>

            <!-- Customer Search — sama dengan regular booking -->
            <el-form-item label="Customer (Opsional)">
              <el-select
                v-model="eventForm.customer_id"
                filterable remote
                :remote-method="searchCustomers"
                :loading="customerSearchLoading"
                placeholder="Cari nama / WhatsApp customer..."
                style="width:100%"
                clearable
                @change="onEventCustomerChange"
              >
                <el-option
                  v-for="c in customerOptions"
                  :key="c.id"
                  :label="c.name"
                  :value="c.id"
                >
                  <div style="display:flex;justify-content:space-between;align-items:center;gap:6px">
                    <span style="font-weight:600;font-size:13px">{{ c.name }} - {{ c.whatsapp }}</span>
                    <el-tag :type="c.type === 'member' ? 'warning' : 'info'" size="small">
                      {{ c.type === 'member' ? 'Member' : 'Regular' }}
                    </el-tag>
                  </div>
                  <div v-if="c.whatsapp || c.phone" style="display:flex;align-items:center;gap:4px;margin-top:2px">
                    <span style="font-size:10px;font-weight:600;color:#25D366;">WA</span>
                    <span style="font-size:10px;color:var(--text-secondary)">{{ c.whatsapp || c.phone }}</span>
                  </div>
                </el-option>
              </el-select>
              <div style="font-size:10px;color:var(--text-muted);margin-top:2px">
                Kosongkan untuk penyelenggara baru — isi manual di bawah
              </div>
            </el-form-item>

            <!-- Nama Customer — auto-fill jika dipilih dari search, bisa diedit manual -->
            <el-form-item label="Nama Penyelenggara *">
              <el-input v-model="eventForm.customer_name" placeholder="Nama penyelenggara" />
            </el-form-item>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
              <el-form-item label="WhatsApp">
                <el-input v-model="eventForm.customer_whatsapp" placeholder="08xx-xxxx" />
              </el-form-item>
              <el-form-item label="Email">
                <el-input v-model="eventForm.customer_email" placeholder="email@..." />
              </el-form-item>
            </div>

            <!-- Tanggal -->
            <el-form-item label="Tanggal *">
              <el-date-picker v-model="eventForm.booking_date" type="date"
                value-format="YYYY-MM-DD" format="dddd, DD MMM YYYY" style="width:100%"
                @change="previewEventPriceCalc" />
            </el-form-item>

            <!-- Tipe Durasi -->
            <el-form-item label="Tipe Durasi *">
              <el-radio-group v-model="eventForm.duration_type" @change="previewEventPriceCalc">
                <el-radio-button value="hourly">🕐 Per Jam</el-radio-button>
                <el-radio-button value="full_day">📅 Full 1 Hari</el-radio-button>
              </el-radio-group>
              <div style="font-size:11px;color:var(--text-secondary);margin-top:5px">
                <template v-if="eventForm.duration_type === 'full_day'">
                  Seluruh jam operasional akan diblokir. Harga = harga event per hari.
                </template>
                <template v-else>
                  Tentukan jam mulai dan selesai booking.
                </template>
              </div>
            </el-form-item>

            <!-- Jam (hanya jika hourly) -->
            <div v-if="eventForm.duration_type === 'hourly'"
                 style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
              <el-form-item label="Jam Mulai *">
                <el-time-picker v-model="eventForm.start_time" format="HH:mm"
                  value-format="HH:mm" style="width:100%" @change="previewEventPriceCalc" />
              </el-form-item>
              <el-form-item label="Jam Selesai *">
                <el-time-picker v-model="eventForm.end_time" format="HH:mm"
                  value-format="HH:mm" style="width:100%" @change="previewEventPriceCalc" />
              </el-form-item>
            </div>

            <!-- Info full_day -->
            <div v-else class="info-box" style="margin-bottom:12px">
              <el-icon><InfoFilled /></el-icon>
              <span>Jam akan otomatis disesuaikan dengan jam operasional store pada tanggal tersebut.</span>
            </div>

            <!-- Scope Ruangan -->
            <el-form-item label="Scope Ruangan *">
              <el-radio-group v-model="eventForm.booking_scope">
                <el-radio-button value="full_venue">🏠 Full 1 Gedung</el-radio-button>
                <el-radio-button value="per_room_type">📋 Per Tipe Ruangan</el-radio-button>
              </el-radio-group>
            </el-form-item>

            <!-- Pilih tipe ruangan (per_room_type) -->
            <el-form-item v-if="eventForm.booking_scope === 'per_room_type'"
              label="Tipe Ruangan yang Diblokir *">
              <div v-if="loadingRoomTemplates" style="color:var(--text-muted);font-size:12px">
                <el-icon class="is-loading"><Loading /></el-icon> Memuat tipe ruangan...
              </div>
              <div v-else-if="!storeRoomTemplates.length" style="color:var(--text-muted);font-size:12px">
                Pilih cabang terlebih dahulu
              </div>
              <el-checkbox-group v-else v-model="eventSelectedRoomTemplateIds"
                style="display:flex;flex-wrap:wrap;gap:6px">
                <el-checkbox v-for="rt in storeRoomTemplates" :key="rt.id" :value="rt.id"
                  style="margin:0">
                  {{ rt.name }}
                </el-checkbox>
              </el-checkbox-group>
              <!-- <div style="font-size:11px;color:var(--text-muted);margin-top:5px">
                Semua unit dari tipe yang dipilih akan diblokir.
              </div> -->
            </el-form-item>

            <!-- Preview harga -->
            <div v-if="eventPricePreview" class="price-preview-box">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
                <div style="font-size:11px;color:var(--text-secondary)">KALKULASI HARGA</div>
                <span
                  v-if="eventPricePreview.day_type"
                  :class="['day-type-badge', eventPricePreview.day_type === 'weekday' ? 'weekday' : 'weekend']"
                >
                  {{ eventPricePreview.day_type === 'weekday' ? 'Weekday' : 'Weekend / Hari Libur' }}
                </span>
              </div>
              <div v-if="eventPricePreview.active_price" style="font-size:11px;color:var(--text-secondary)">
                Harga aktif: <strong>{{ formatRp(eventPricePreview.active_price) }}</strong>/hari
              </div>
              <div v-if="eventPricePreview.duration_hours" style="font-size:11px;color:var(--text-secondary)">
                Durasi: <strong>{{ eventPricePreview.duration_hours }} jam</strong>
                <template v-if="eventPricePreview.formula">
                  &nbsp;·&nbsp; {{ eventPricePreview.formula }}
                </template>
              </div>
              <div style="font-size:18px;font-weight:700;color:var(--color-primary);margin-top:6px">
                {{ formatRp(eventPricePreview.total_price) }}
              </div>
            </div>

            <el-form-item label="Catatan">
              <el-input v-model="eventForm.notes" type="textarea" :rows="2" />
            </el-form-item>
          </el-form>

          <el-button type="primary" style="width:100%;margin-top:8px"
            :loading="creatingEvent"
            :disabled="!eventForm.event_name || !eventForm.customer_name || !eventForm.booking_date ||
              (eventForm.duration_type === 'hourly' && (!eventForm.start_time || !eventForm.end_time)) ||
              (eventForm.booking_scope === 'per_room_type' && !eventSelectedRoomTemplateIds.length)"
            @click="handleCreateEventBooking">
            Konfirmasi Event Booking
          </el-button>
        </div>

        <!-- Event Detail Panel -->
        <div v-else-if="selectedEvent" class="right-panel">
          <div class="panel-header">
            <span style="font-size:14px;font-weight:700">DETAIL EVENT</span>
            <el-button circle text @click="selectedEvent = null"><el-icon><Close /></el-icon></el-button>
          </div>

          <el-tag type="warning" style="margin-bottom:12px">
            <el-icon><Star /></el-icon> {{ selectedEvent.status?.toUpperCase() }}
          </el-tag>

          <div class="info-section-title">INFORMASI EVENT</div>
          <div class="info-grid">
            <div class="info-row"><span>Nama Event</span><strong>{{ selectedEvent.event_name }}</strong></div>
            <div v-if="selectedEvent?.description" class="detail-row">
              <span class="detail-label" style="color:var(--text-secondary);font-size:12px">
                Deskripsi
              </span>
              <p style="margin:0;font-size:13px;line-height:1.5;white-space:pre-wrap;word-break:break-word">
                {{ selectedEvent.description }}
              </p>
            </div>
            <div class="info-row"><span>Customer</span><span>{{ selectedEvent.customer_name }}</span></div>
            <div class="info-row"><span>Tanggal</span><span>{{ formatDateDisplay(selectedEvent.booking_date) }}</span></div>
            <div class="info-row">
              <span>Waktu</span>
              <span>{{ selectedEvent.start_time?.slice(0,5) }} – {{ selectedEvent.end_time?.slice(0,5) }} ({{ selectedEvent.duration_hours }} Jam)</span>
            </div>
            <div class="info-row">
              <span>Total Harga</span>
              <strong style="color:var(--color-primary)">{{ formatRp(selectedEvent.total_price) }}</strong>
            </div>
          </div>

          <div v-if="selectedEvent.status !== 'cancelled' && selectedEvent.status !== 'completed'"
               style="margin-top:16px">
            <div class="info-section-title">AKSI</div>
            <el-button type="danger" plain style="width:100%" @click="openCancelEventForm">
              <el-icon><CircleClose /></el-icon> Batalkan Event
            </el-button>
          </div>

          <div v-if="selectedEvent.cancel_reason" class="cancel-info">
            <div style="font-weight:600;margin-bottom:4px">Alasan Pembatalan</div>
            {{ selectedEvent.cancel_reason }}
          </div>
        </div>

        <!-- New Booking Form Panel -->
        <div v-else-if="isNewBookingForm" class="right-panel">
          <div class="panel-header">
            <span style="font-size:13px;font-weight:700;letter-spacing:0.5px">BOOKING BARU</span>
            <el-button circle text @click="closeNewBookingForm"><el-icon><Close /></el-icon></el-button>
          </div>

          <!-- Room info chip -->
          <div class="room-chip">
            <el-icon style="color:var(--color-primary)"><Location /></el-icon>
            <span style="font-weight:600;font-size:13px">{{ newBookingForm.room_name }}</span>
            <span style="color:var(--text-muted);font-size:11px">• {{ newBookingForm.start_time }} – {{ newBookingForm.end_time }}</span>
          </div>

          <el-form :model="newBookingForm" ref="newBookingFormRef" label-position="top" size="small">

            <!-- Customer Search -->
            <el-form-item label="Customer (Opsional)" prop="customer_id">
              <el-select
                v-model="newBookingForm.customer_id"
                filterable remote :remote-method="searchCustomers"
                :loading="customerSearchLoading"
                placeholder="Cari nama / WhatsApp customer..."
                style="width:100%"
                @change="onCustomerChange"
                clearable
              >
                <el-option v-for="c in customerOptions" :key="c.id"
                  :label="c.name" :value="c.id">
                  <div style="display:flex;justify-content:space-between;align-items:center;gap:6px">
                    <span style="font-weight:600;font-size:13px">{{ c.name }} - {{ c.whatsapp }}</span>
                    <el-tag :type="c.type === 'member' ? 'warning' : 'info'" size="small">
                      {{ c.type === 'member' ? 'Member' : 'Regular' }}
                    </el-tag>
                  </div>
                  <div v-if="c.whatsapp || c.phone" style="display:flex;align-items:center;gap:4px;margin-top:2px">
                    <span style="font-size:10px;font-weight:600;color:#25D366;">WA</span>
                    <span style="font-size:10px;color:var(--text-secondary);font-variant-numeric:tabular-nums">{{ c.whatsapp || c.phone }}</span>
                  </div>
                </el-option>
              </el-select>
              <div style="font-size:10px;color:var(--text-muted);margin-top:2px">
                Kosongkan untuk walk-in tanpa data
              </div>
            </el-form-item>

            <!-- Nama Customer -->
            <el-form-item label="Nama Customer *" prop="customer_name"
              :rules="[{ required: true, message: 'Nama wajib diisi', trigger: 'blur' }]">
              <el-input v-model="newBookingForm.customer_name" placeholder="Nama customer" />
            </el-form-item>

            <!-- Kontak -->
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
              <el-form-item label="WhatsApp">
                <el-input v-model="newBookingForm.customer_whatsapp" placeholder="08xx-xxxx" />
              </el-form-item>
              <el-form-item label="Email">
                <el-input v-model="newBookingForm.customer_email" placeholder="email@..." />
              </el-form-item>
            </div>

            <!-- Tanggal -->
            <el-form-item label="Tanggal Booking">
              <el-date-picker v-model="newBookingForm.booking_date" type="date"
                value-format="YYYY-MM-DD" style="width:100%"
                @change="recalculatePrice" />
            </el-form-item>

            <!-- Jam -->
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
              <el-form-item label="Jam Mulai *">
                <el-time-picker v-model="newBookingForm.start_time" format="HH:mm"
                  value-format="HH:mm" style="width:100%" @change="recalculatePrice" />
              </el-form-item>
              <el-form-item label="Jam Selesai *">
                <el-time-picker v-model="newBookingForm.end_time" format="HH:mm"
                  value-format="HH:mm" style="width:100%" @change="recalculatePrice" />
              </el-form-item>
            </div>

            <!-- Durasi Quick Select -->
            <el-form-item label="Tambah Durasi">
              <div style="display:flex;gap:2px;flex-wrap:wrap">
                <el-button
                  v-for="d in [1, 2, 3, 4, 5, 6, 8,10]" :key="d" size="small"
                  :type="newBookingForm.duration_hours === d ? 'primary' : 'default'"
                  @click="setDuration(d)"
                >{{ d }}j</el-button>
              </div>
            </el-form-item>

            <!-- Kalkulasi Harga -->
            <div v-if="priceCalcLoading" style="text-align:center;padding:12px;color:var(--text-muted);font-size:12px">
              <el-icon class="is-loading"><Loading /></el-icon> Menghitung harga...
            </div>
            <div v-else-if="priceCalc" class="price-breakdown-box">
              <div v-for="item in priceCalc.breakdown" :key="item.time_range" class="breakdown-row">
                <span style="font-size:11px;color:var(--text-secondary)">{{ item.description }}</span>
                <span style="font-size:12px;font-weight:600">{{ formatRp(item.amount) }}</span>
              </div>
              <!-- <div v-if="priceCalc.has_flash_sale" class="breakdown-row" style="color:var(--color-danger)">
                <span style="font-size:11px">⚡ Flash Sale: {{ priceCalc.flash_sale_name }}</span>
                <span style="font-size:12px">- {{ formatRp(priceCalc.flash_discount) }}</span>
              </div> -->

              <!-- Voucher discount preview -->
              <template v-if="voucherDiscount">
                <div v-if="voucherDiscount.invalid" class="breakdown-row voucher-invalid-row">
                  <span style="font-size:11px">🎟️ Voucher {{ newBookingForm.voucher_code }}</span>
                  <span style="font-size:11px">{{ voucherDiscount.reason }}</span>
                </div>
                <div v-else class="breakdown-row voucher-discount-row">
                  <span style="font-size:11px">
                    🎟️ {{ selectedVoucherData?.name }}
                    <span style="opacity:0.7">({{ selectedVoucherData?.discount_type === 'percentage' ? selectedVoucherData.discount_value + '%' : formatRp(selectedVoucherData.discount_value) }})</span>
                  </span>
                  <span style="font-size:12px;font-weight:700">- {{ formatRp(voucherDiscount.amount) }}</span>
                </div>
              </template>

              <div class="breakdown-total">
                <span>Total Bayar</span>
                <strong style="font-size:15px" :style="{ color: voucherDiscount && !voucherDiscount.invalid ? 'var(--color-success)' : 'var(--color-primary)' }">
                  {{ formatRp(voucherDiscount && !voucherDiscount.invalid ? voucherDiscount.finalPrice : priceCalc.final_price) }}
                </strong>
              </div>
              <div v-if="voucherDiscount && !voucherDiscount.invalid"
                   style="text-align:right;font-size:10px;color:var(--text-muted);margin-top:2px;text-decoration:line-through">
                Sebelum diskon: {{ formatRp(priceCalc.final_price) }}
              </div>
            </div>

            <!-- Play Credits -->
            <div v-if="availableCredits.length > 0" class="credits-section">
              <div style="font-size:11px;font-weight:700;margin-bottom:8px;color:var(--color-success)">
                🎮 Pakai Play Credits?
              </div>
              <div style="display:flex;flex-direction:column;gap:6px">

                <!-- Opsi: Cash -->
                <div
                  :class="['payment-option', newBookingForm.payment_method === 'cash' ? 'payment-option--selected' : '']"
                  @click="newBookingForm.payment_method = 'cash'; newBookingForm.play_credit_id = null"
                >
                  <div class="payment-option__check">
                    <el-icon v-if="newBookingForm.payment_method === 'cash'"><Check /></el-icon>
                  </div>
                  <span style="font-size:12px;font-weight:600">💵 Cash</span>
                  <span style="font-size:11px;color:var(--text-secondary);margin-left:4px">— Bayar langsung</span>
                </div>

                <!-- Opsi: Play Credits -->
                <div
                  v-for="cr in availableCredits" :key="cr.id"
                  :class="['payment-option', newBookingForm.play_credit_id === cr.id && newBookingForm.payment_method !== 'cash' ? 'payment-option--selected' : '']"
                  @click="newBookingForm.play_credit_id = cr.id; newBookingForm.payment_method = 'play_credits'"
                >
                  <div class="payment-option__check">
                    <el-icon v-if="newBookingForm.play_credit_id === cr.id && newBookingForm.payment_method !== 'cash'"><Check /></el-icon>
                  </div>
                  <div style="display:flex;flex-direction:column;gap:1px">
                    <span style="font-size:12px;font-weight:700">🎮 {{ cr.package?.name }}</span>
                    <span style="font-size:11px;color:var(--text-secondary)">
                      {{ cr.remaining_hours }} Jam tersisa
                      <span style="color:var(--text-muted)">&nbsp;·&nbsp; exp. {{ formatDate(cr.expires_at) }}</span>
                    </span>
                  </div>
                </div>

              </div>
            </div>

            <!-- Voucher -->
            <el-form-item v-if="selectedCustomerIsMember" label="Voucher (Opsional)">
              <el-select
                v-model="newBookingForm.voucher_code"
                placeholder="Pilih voucher..."
                filterable clearable style="width:100%"
                :loading="voucherOptionsLoading"
                no-data-text="Tidak ada voucher tersedia"
              >
                <el-option
                  v-for="v in availableVouchers"
                  :key="v.code"
                  :label="v.name"
                  :value="v.code"
                >
                  <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
                    <div>
                      <span style="font-family:monospace;font-size:11px;font-weight:800;color:var(--color-primary)">{{ v.code }}</span>
                      <span style="margin-left:8px;font-size:12px">{{ v.name }}</span>
                    </div>
                    <span style="font-size:12px;font-weight:700;color:var(--color-success);flex-shrink:0">
                      {{ v.discount_type === 'percentage' ? v.discount_value + '%' : formatRp(v.discount_value) }}
                    </span>
                  </div>
                  <div v-if="v.end_date" style="font-size:10px;color:var(--text-muted);margin-top:1px">
                    Berlaku s/d {{ formatDate(v.end_date) }}
                  </div>
                </el-option>
              </el-select>
              <div v-if="!voucherOptionsLoading && availableVouchers.length === 0"
                   style="font-size:11px;color:var(--text-muted);margin-top:3px">
                Tidak ada voucher booking yang tersedia untuk customer ini
              </div>
            </el-form-item>

            <!-- Catatan -->
            <el-form-item label="Catatan (Opsional)">
              <el-input v-model="newBookingForm.notes" type="textarea" :rows="2"
                placeholder="Catatan untuk booking ini..." />
            </el-form-item>
          </el-form>

          <el-button type="primary" style="width:100%;margin-top:8px"
            :loading="creatingBooking" :disabled="!priceCalc && !priceCalcLoading" @click="openConfirmModal">
            Lanjutkan →
          </el-button>
        </div>

      </transition>
    </div>

    <!-- ════════════════════════════════════════════════════════
         MODAL: Konfirmasi Booking
    ════════════════════════════════════════════════════════ -->
    <el-dialog v-model="showConfirmModal" title="KONFIRMASI BOOKING" width="420px" align-center>
      <div v-if="priceCalc">
        <!-- Customer summary -->
        <div style="display:flex;align-items:center;gap:12px;padding:12px;background:var(--bg-main);border-radius:8px;margin-bottom:16px">
          <el-avatar :size="40" style="background:linear-gradient(135deg,#0282DE,#0262b0);font-weight:700;flex-shrink:0">
            {{ newBookingForm.customer_name?.[0]?.toUpperCase() }}
          </el-avatar>
          <div>
            <div style="font-weight:700">{{ newBookingForm.customer_name }}</div>
            <div style="font-size:12px;color:var(--text-secondary)">
              {{ newBookingForm.customer_whatsapp || newBookingForm.customer_email || 'Walk-in' }}
            </div>
          </div>
        </div>

        <div class="confirm-row"><span>Room</span><strong>{{ newBookingForm.room_name }}</strong></div>
        <div class="confirm-row">
          <span>Tanggal</span>
          <span>{{ formatDateDisplay(newBookingForm.booking_date) }}</span>
        </div>
        <div class="confirm-row">
          <span>Waktu</span>
          <span>{{ newBookingForm.start_time }} – {{ newBookingForm.end_time }} ({{ newBookingForm.duration_hours }} Jam)</span>
        </div>

        <div style="background:var(--bg-card-hover);border:1px solid var(--border-color);border-radius:8px;padding:12px;margin:12px 0">
          <div v-for="item in priceCalc.breakdown" :key="item.time_range"
               style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:5px">
            <span style="color:var(--text-secondary)">{{ item.description }}</span>
            <span>{{ formatRp(item.amount) }}</span>
          </div>
          <div v-if="priceCalc.has_flash_sale"
               style="display:flex;justify-content:space-between;font-size:12px;color:var(--color-danger);margin-bottom:5px">
            <span>⚡ Flash Sale</span>
            <span>- {{ formatRp(priceCalc.flash_discount) }}</span>
          </div>
          <!-- Voucher discount di confirm modal -->
          <div v-if="voucherDiscount && !voucherDiscount.invalid"
               style="display:flex;justify-content:space-between;font-size:12px;color:var(--color-success);margin-bottom:5px">
            <span>🎟️ {{ selectedVoucherData?.name }}</span>
            <span>- {{ formatRp(voucherDiscount.amount) }}</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding-top:8px;border-top:1px solid var(--border-color);font-weight:700">
            <span>Total Bayar</span>
            <span style="font-size:16px" :style="{ color: voucherDiscount && !voucherDiscount.invalid ? 'var(--color-success)' : 'var(--color-primary)' }">
              {{ formatRp(voucherDiscount && !voucherDiscount.invalid ? voucherDiscount.finalPrice : priceCalc.final_price) }}
            </span>
          </div>
        </div>

        <div class="confirm-row">
          <span>Payment</span>
          <span>{{ newBookingForm.payment_method === 'play_credits' ? '🎮 Play Credits' : '💵 Cash' }}</span>
        </div>
        <div v-if="newBookingForm.voucher_code" class="confirm-row">
          <span>Voucher</span>
          <span style="font-family:monospace;font-weight:700;color:var(--color-primary)">{{ newBookingForm.voucher_code }}</span>
        </div>
      </div>

      <template #footer>
        <el-button @click="showConfirmModal = false">Kembali</el-button>
        <el-button type="primary" :loading="creatingBooking" @click="handleCreateBooking">
          <el-icon><Check /></el-icon> Konfirmasi Booking
        </el-button>
      </template>
    </el-dialog>

    <!-- ════════════════════════════════════════════════════════
         MODAL: Booking Berhasil
    ════════════════════════════════════════════════════════ -->
    <el-dialog v-model="showSuccessModal" :show-close="false" width="380px" align-center>
      <div style="text-align:center;padding:12px 0 20px">
        <el-icon size="60" style="color:var(--color-success)"><CircleCheckFilled /></el-icon>
        <h3 style="margin:12px 0 4px;font-size:18px">Booking Berhasil!</h3>
        <p style="color:var(--text-secondary);font-size:13px;margin-bottom:16px">
          Booking ruangan telah dikonfirmasi.
        </p>
        <div style="background:var(--bg-main);border:1px solid var(--border-color);border-radius:10px;padding:16px;display:inline-block;min-width:200px">
          <div style="font-size:10px;color:var(--text-secondary);margin-bottom:6px;letter-spacing:1px">BOOKING ID</div>
          <div style="font-size:24px;font-weight:800;color:var(--color-primary);letter-spacing:3px;font-family:monospace">
            {{ createdBookingCode }}
          </div>
        </div>
        <p v-if="newBookingForm.customer_whatsapp || newBookingForm.customer_email"
           style="font-size:12px;color:var(--text-secondary);margin-top:12px">
          Konfirmasi dikirim ke customer
          <span v-if="newBookingForm.customer_email"> via email</span>
          <span v-if="newBookingForm.customer_whatsapp"> & WhatsApp</span>.
        </p>
        <div style="display:flex;gap:10px;justify-content:center;margin-top:20px">
          <el-button @click="viewCreatedBooking">Lihat di Kalender</el-button>
          <el-button type="primary" @click="resetForNewBooking">+ Booking Lain</el-button>
        </div>
      </div>
    </el-dialog>

    <!-- ════════════════════════════════════════════════════════
         DIALOG: Cancel Event Booking
    ════════════════════════════════════════════════════════ -->
    <el-dialog v-model="showCancelEventDialog" title="Batalkan Event Booking" width="400px" align-center>
      <p style="font-size:13px;color:var(--text-secondary);margin-bottom:14px">
        Masukkan alasan pembatalan event
        <strong style="color:var(--text-primary)">{{ selectedEvent?.event_name }}</strong>.
      </p>
      <el-form :model="cancelEventForm" ref="cancelEventFormRef">
        <el-form-item prop="reason"
          :rules="[{ required: true, min: 5, message: 'Alasan minimal 5 karakter', trigger: 'blur' }]">
          <el-input v-model="cancelEventForm.reason" type="textarea" :rows="3"
            placeholder="Alasan pembatalan..." />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCancelEventDialog = false">Kembali</el-button>
        <el-button type="danger" :loading="cancellingEvent" @click="handleCancelEvent">
          Konfirmasi Batalkan
        </el-button>
      </template>
    </el-dialog>

    <!-- ════════════════════════════════════════════════════════
         DIALOG: Cancel Booking
    ════════════════════════════════════════════════════════ -->
    <el-dialog v-model="showCancelDialog" title="Batalkan Booking" width="400px" align-center>
      <p style="font-size:13px;color:var(--text-secondary);margin-bottom:14px">
        Masukkan alasan pembatalan booking
        <strong style="color:var(--text-primary)">{{ selectedBooking?.booking_code }}</strong>.
      </p>
      <el-form :model="cancelForm" ref="cancelFormRef">
        <el-form-item prop="reason" :rules="[{ required: true, min: 5, message: 'Alasan minimal 5 karakter', trigger: 'blur' }]">
          <el-input v-model="cancelForm.reason" type="textarea" :rows="3"
            placeholder="Contoh: Customer tidak jadi hadir, request pembatalan dari customer..." />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCancelDialog = false">Kembali</el-button>
        <el-button type="danger" :loading="cancellingBooking" @click="handleCancelBooking">
          Konfirmasi Batalkan
        </el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { usePermission } from '@/composables/usePermission'
import { useAuthStore } from '@/stores/authStore'
import { ElMessage, ElMessageBox } from 'element-plus'
import AuditTrail from '@/components/AuditTrail.vue'
import {
  getDashboard, createBooking, cancelBooking, completeBooking,
  getAvailableCredits, calculatePrice
} from '@/api/booking/bookingApi'
import {
  getEventDashboard, createEventBooking, cancelEventBooking, previewEventPrice
} from '@/api/booking/eventBookingApi'
import { getStores, getEffectiveOperatingHours } from '@/api/store/storeApi'
import { getCustomers } from '@/api/customer/customerApi'
import api, { publicApi } from '@/api/index'

const { can } = usePermission()
const authStore = useAuthStore()

// ── Constants ─────────────────────────────────────────────────
const SLOT_WIDTH = 100  // px per jam

// ── State ─────────────────────────────────────────────────────
// Dynamic open/close hour — updated by generateTimeSlots based on effective operating hours
const OPEN_HOUR_REF  = ref(10)
const CLOSE_HOUR_REF = ref(26)  // 26 = 02:00 next day

const effectiveHours = ref(null) // { open_time, close_time, is_holiday, holiday_name, holiday_type }

const loading = ref(false)
const stores = ref([])
const selectedStore = ref('')
const selectedDate = ref(new Date().toISOString().split('T')[0])
const selectedRoom = ref('')
const operatingHours = ref('10:00 – 02:00')

const dashboardData = ref(null)
const allRooms = ref([])
const timeSlots = ref([])

const isNewBookingMode = ref(false)
const isNewBookingForm = ref(false)
const selectedBooking = ref(null)

const customerOptions = ref([])
const customerSearchLoading = ref(false)
const availableCredits = ref([])
const availableVouchers = ref([])
const voucherOptionsLoading = ref(false)
const priceCalc = ref(null)
const priceCalcLoading = ref(false)

const creatingBooking = ref(false)
const cancellingBooking = ref(false)

const showConfirmModal = ref(false)
const showSuccessModal = ref(false)
const showCancelDialog = ref(false)
const createdBookingCode = ref('')

const newBookingFormRef = ref()
const cancelFormRef = ref()

const newBookingForm = reactive({
  store_id: '', room_id: '', room_name: '',
  customer_id: '', customer_name: '',
  customer_whatsapp: '', customer_email: '',
  booking_date: '', start_time: '', end_time: '',
  duration_hours: 1,
  payment_method: 'cash', play_credit_id: '',
  voucher_code: '', notes: ''
})

const cancelForm = reactive({ reason: '' })

// ── Event Booking State ───────────────────────────────────────
const eventBookings         = ref([])
const isEventBookingForm    = ref(false)
const creatingEvent         = ref(false)
const showCancelEventDialog = ref(false)
const cancellingEvent       = ref(false)
const selectedEvent         = ref(null)
const eventPricePreview     = ref(null)

const eventForm = reactive({
  store_id:          '',
  event_name:        '',
  description:       '',
  customer_id:       '',
  customer_name:     '',
  customer_whatsapp: '',
  customer_email:    '',
  booking_date:      '',
  start_time:        '',
  end_time:          '',
  notes:             '',
  duration_type:     'hourly',     // 'hourly' | 'full_day'
  booking_scope:     'full_venue', // 'full_venue' | 'per_room_type'
})

// Room template pilihan untuk per_room_type — ref terpisah agar el-checkbox-group reaktif
const eventSelectedRoomTemplateIds = ref([])
const storeRoomTemplates           = ref([])
const loadingRoomTemplates         = ref(false)

const cancelEventForm    = reactive({ reason: '' })
const cancelEventFormRef = ref()

// ── Computed ──────────────────────────────────────────────────
const roomGroups = computed(() => {
  if (!dashboardData.value?.rooms) return []
  const groups = {}
  for (const room of dashboardData.value.rooms) {
    const tname = room.room_template?.name || 'Other'
    if (!groups[tname]) groups[tname] = { templateName: tname, rooms: [] }
    groups[tname].rooms.push(room)
  }
  return Object.values(groups)
})

// ── Room Type Tab (booking grid) ──────────────────────────────
const activeRoomTab = ref(null)

const activeRoomGroup = computed(() => {
  if (!roomGroups.value.length) return null
  if (!activeRoomTab.value) return roomGroups.value[0]
  return roomGroups.value.find(g => g.templateName === activeRoomTab.value) || roomGroups.value[0]
})

watch([selectedStore, selectedDate], () => {
  activeRoomTab.value = null
})

const selectedCustomerIsMember = computed(() => {
  const c = customerOptions.value.find(c => c.id === newBookingForm.customer_id)
  return c?.type === 'member'
})

const gridTotalWidth = computed(() => 140 + timeSlots.value.length * SLOT_WIDTH)

// ── Store Access Filter ───────────────────────────────────────
// Daftar store yang boleh diakses staff ini
const accessibleStores = computed(() => {
  const staff = authStore.staff
  // Super admin atau is_all_stores = true → gunakan semua store dari API
  if (!staff || staff.is_all_stores) return stores.value
  // Staff biasa → hanya store yang di-assign
  return (staff.staff_stores || []).map(ss => ss.store).filter(Boolean)
})

// Dropdown tidak bisa diubah jika staff hanya punya tepat 1 store
const isStoreLocked = computed(() => {
  const staff = authStore.staff
  if (!staff || staff.is_all_stores) return false
  return (staff.staff_stores || []).length === 1
})

// Label badge untuk store terkunci
const lockedStoreName = computed(() => {
  if (!isStoreLocked.value) return ''
  return authStore.staff?.staff_stores?.[0]?.store?.name || ''
})

// ── Voucher Discount Preview ──────────────────────────────────
const selectedVoucherData = computed(() =>
  availableVouchers.value.find(v => v.code === newBookingForm.voucher_code) || null
)

const voucherDiscount = computed(() => {
  const v = selectedVoucherData.value
  const base = priceCalc.value?.final_price
  if (!v || !base) return null

  // Cek minimum pembelian
  if (v.min_purchase && base < v.min_purchase) {
    return { amount: 0, invalid: true, reason: `Min. pembelian ${formatRp(v.min_purchase)}` }
  }

  let amount
  if (v.discount_type === 'percentage') {
    amount = Math.round(base * v.discount_value / 100)
    if (v.max_discount && amount > v.max_discount) amount = v.max_discount
  } else {
    amount = Math.min(v.discount_value, base)
  }

  return { amount, invalid: false, finalPrice: base - amount }
})

// ── Generate Time Slots ───────────────────────────────────────
const generateTimeSlots = (openTime = '10:00:00', closeTime = '02:00:00') => {
  let startHour = parseInt(openTime.split(':')[0])
  let endHour   = parseInt(closeTime.split(':')[0])
  // Handle past midnight: if close <= open treat as next day
  if (endHour <= startHour) endHour += 24

  OPEN_HOUR_REF.value  = startHour
  CLOSE_HOUR_REF.value = endHour

  const slots = []
  for (let h = startHour; h < endHour; h++) {
    const hour = h % 24
    slots.push(`${String(hour).padStart(2,'0')}:00`)
  }
  timeSlots.value = slots
}

// ── Load Data ─────────────────────────────────────────────────
const loadDashboard = async () => {
  if (!selectedStore.value || !selectedDate.value) return
  loading.value = true
  try {
    const params = { store_id: selectedStore.value, date: selectedDate.value }
    if (selectedRoom.value) params.room_id = selectedRoom.value

    // Fetch regular booking + event booking + operating hours paralel
    const [dashRes, hoursRes, eventRes] = await Promise.allSettled([
      getDashboard(params),
      getEffectiveOperatingHours(selectedStore.value, selectedDate.value),
      getEventDashboard({ store_id: selectedStore.value, date: selectedDate.value }),
    ])

    if (dashRes.status === 'fulfilled') {
      dashboardData.value = dashRes.value.data.data
      allRooms.value = dashRes.value.data.data?.rooms || []
    } else {
      dashboardData.value = null
      allRooms.value = []
    }

    if (hoursRes.status === 'fulfilled') {
      const eff = hoursRes.value.data.data
      effectiveHours.value = eff
      const openT  = eff?.open_time  || '10:00:00'
      const closeT = eff?.close_time || '02:00:00'
      operatingHours.value = `${openT.slice(0,5)} – ${closeT.slice(0,5)}`
      generateTimeSlots(openT, closeT)
    } else {
      effectiveHours.value = null
      if (dashboardData.value?.operating_hours) operatingHours.value = dashboardData.value.operating_hours
      generateTimeSlots()
    }

    eventBookings.value = eventRes.status === 'fulfilled'
      ? (eventRes.value.data.data || [])
      : []
  } catch {
    ElMessage.error('Gagal memuat jadwal')
    dashboardData.value = null
    allRooms.value = []
    effectiveHours.value = null
    eventBookings.value = []
    generateTimeSlots()
  } finally { loading.value = false }
}

// ── Customer Search ───────────────────────────────────────────
const searchCustomers = async (q) => {
  if (!q || q.length < 2) return
  customerSearchLoading.value = true
  try {
    const { data } = await getCustomers({ search: q, per_page: 20 })
    customerOptions.value = data.data || []
  } catch {}
  finally { customerSearchLoading.value = false }
}

// ── Grid Logic ────────────────────────────────────────────────
const timeToOffset = (timeStr) => {
  if (!timeStr) return 0
  const parts = timeStr.split(':')
  let h = parseInt(parts[0])
  const m = parseInt(parts[1] || 0)
  // Handle past midnight: hours before open belong to next day
  if (h < OPEN_HOUR_REF.value) h += 24
  return ((h - OPEN_HOUR_REF.value) + m / 60) * SLOT_WIDTH
}

const getBookingsForRoom = (roomId) => {
  if (!dashboardData.value?.rooms) return []
  const room = dashboardData.value.rooms.find(r => r.id === roomId)
  return room?.bookings || []
}

const getBookingBlockStyle = (bk) => {
  const startPx = timeToOffset(bk.start_time)
  const endPx = timeToOffset(bk.end_time)
  const width = Math.max(endPx - startPx - 4, 30)
  return { left: startPx + 'px', width: width + 'px' }
}

const getBlockClass = (bk) => ({
  upcoming: 'block-upcoming',
  ongoing: 'block-ongoing',
  completed: 'block-completed',
  cancelled: 'block-cancelled',
}[bk.status] || 'block-upcoming')

// ── Event Booking Helpers ─────────────────────────────────────

// Apakah tab room type yang sedang aktif termasuk dalam event ini?
const isRoomTabInEvent = (event) => {
  // full_venue → tampil di semua tab
  if (!event.booking_scope || event.booking_scope === 'full_venue') return true
  // per_room_type → cek apakah ada room di tab aktif yang template-nya ada di selected list
  let ids = event.selected_room_template_ids
  if (!ids) return false
  if (typeof ids === 'string') {
    try { ids = JSON.parse(ids) } catch { return false }
  }
  if (!Array.isArray(ids) || ids.length === 0) return false
  const tabRooms = activeRoomGroup.value?.rooms || []
  return tabRooms.some(r => ids.includes(r.room_template?.id))
}

// Style (posisi & ukuran) untuk merged event block di grid
// Untuk per_room_type, tinggi disesuaikan dengan jumlah room di tab aktif
const getEventBlockStyle = (event) => {
  const startPx   = timeToOffset(event.start_time)
  const endPx     = timeToOffset(event.end_time)
  const width     = Math.max(endPx - startPx - 4, 20)
  const roomCount = activeRoomGroup.value?.rooms?.length || 1
  const rowHeight = 56
  return {
    left:   startPx + 'px',
    width:  width + 'px',
    height: (roomCount * rowHeight - 8) + 'px',
    top:    '4px',
  }
}

const handleNewBookingCommand = (command) => {
  if (command === 'regular') {
    toggleNewBookingMode()
  } else if (command === 'event') {
    openEventBookingForm()
  }
}

// Fetch room templates milik store ini untuk pilihan per_room_type
const onEventStoreChange = async (storeId) => {
  storeRoomTemplates.value = []
  if (!storeId) return
  loadingRoomTemplates.value = true
  try {
    const { data } = await publicApi.get(`/public/room-templates?store_id=${storeId}`)
    storeRoomTemplates.value = data.data || []
  } catch { /* biarkan kosong */ } finally { loadingRoomTemplates.value = false }
}
watch(() => eventForm.store_id, onEventStoreChange)

const openEventBookingForm = () => {
  Object.assign(eventForm, {
    store_id:          selectedStore.value,
    event_name:        '',
    description:       '',
    customer_id:       '',
    customer_name:     '',
    customer_whatsapp: '',
    customer_email:    '',
    booking_date:      selectedDate.value,
    start_time:        '',
    end_time:          '',
    notes:             '',
    duration_type:     'hourly',
    booking_scope:     'full_venue',
  })
  eventSelectedRoomTemplateIds.value = []
  eventPricePreview.value  = null
  customerOptions.value    = []
  isEventBookingForm.value = true
  isNewBookingMode.value   = false
  selectedBooking.value    = null
  selectedEvent.value      = null
}

// Auto-fill customer data saat dipilih dari dropdown search
const onEventCustomerChange = (customerId) => {
  if (!customerId) {
    // User clear pilihan → reset ke manual entry
    eventForm.customer_name     = ''
    eventForm.customer_whatsapp = ''
    eventForm.customer_email    = ''
    return
  }
  const customer = customerOptions.value.find(c => c.id === customerId)
  if (customer) {
    eventForm.customer_name     = customer.name
    eventForm.customer_whatsapp = customer.whatsapp || ''
    eventForm.customer_email    = customer.email    || ''
  }
}

const previewEventPriceCalc = async () => {
  if (!eventForm.store_id) return
  if (eventForm.duration_type === 'hourly' && (!eventForm.start_time || !eventForm.end_time)) return
  try {
    const params = {
      store_id:      eventForm.store_id,
      duration_type: eventForm.duration_type,
    }
    if (eventForm.booking_date) params.booking_date = eventForm.booking_date
    if (eventForm.duration_type === 'hourly') {
      params.start_time = eventForm.start_time
      params.end_time   = eventForm.end_time
    }
    if (eventForm.duration_type === 'full_day') {
      params.start_time = dashboardData.value.open_time
      params.end_time   = dashboardData.value.close_time
    }
    const { data } = await previewEventPrice(params)
    eventPricePreview.value = data.data
  } catch { eventPricePreview.value = null }
}

const handleCreateEventBooking = async () => {
  creatingEvent.value = true
  try {
    const payload = {
      store_id:          eventForm.store_id,
      event_name:        eventForm.event_name,
      description:       eventForm.description,
      customer_id:       eventForm.customer_id || null,
      customer_name:     eventForm.customer_name,
      customer_whatsapp: eventForm.customer_whatsapp,
      customer_email:    eventForm.customer_email,
      booking_date:      eventForm.booking_date,
      start_time:        eventForm.duration_type === 'hourly' ? eventForm.start_time : '',
      end_time:          eventForm.duration_type === 'hourly' ? eventForm.end_time   : '',
      notes:             eventForm.notes,
      duration_type:     eventForm.duration_type,
      booking_scope:     eventForm.booking_scope,
      selected_room_template_ids: eventForm.booking_scope === 'per_room_type'
        ? eventSelectedRoomTemplateIds.value
        : [],
    }
    await createEventBooking(payload)
    ElMessage.success('Event booking berhasil dibuat!')
    isEventBookingForm.value = false
    loadDashboard()
  } catch (e) {
    ElMessage.error(e?.response?.data?.message || 'Gagal membuat event booking')
  } finally { creatingEvent.value = false }
}

const handleEventClick = (event) => {
  selectedEvent.value      = event
  isNewBookingForm.value   = false
  isEventBookingForm.value = false
  selectedBooking.value    = null
}

const openCancelEventForm = () => {
  cancelEventForm.reason = ''
  showCancelEventDialog.value = true
}

const handleCancelEvent = async () => {
  await cancelEventFormRef.value.validate(async (valid) => {
    if (!valid) return
    cancellingEvent.value = true
    try {
      await cancelEventBooking(selectedEvent.value.id, { reason: cancelEventForm.reason })
      ElMessage.success('Event booking berhasil dibatalkan')
      showCancelEventDialog.value = false
      selectedEvent.value = null
      loadDashboard()
    } catch (e) {
      ElMessage.error(e?.response?.data?.message || 'Gagal membatalkan')
    } finally { cancellingEvent.value = false }
  })
}

// ── New Booking Flow ──────────────────────────────────────────
const toggleNewBookingMode = () => {
  isNewBookingMode.value = !isNewBookingMode.value
  if (!isNewBookingMode.value) {
    isNewBookingForm.value = false
    selectedBooking.value = null
  }
}

const handleSlotClick = (room, slot, idx) => {
  if (!isNewBookingMode.value) return
  const startH = OPEN_HOUR_REF.value + idx
  const startTime = `${String(startH % 24).padStart(2,'0')}:00`
  const endTime = `${String((startH + 1) % 24).padStart(2,'0')}:00`

  Object.assign(newBookingForm, {
    store_id: selectedStore.value,
    room_id: room.id,
    room_name: room.name,
    booking_date: selectedDate.value,
    start_time: startTime,
    end_time: endTime,
    duration_hours: 1,
    customer_id: '', customer_name: '',
    customer_whatsapp: '', customer_email: '',
    payment_method: 'cash', play_credit_id: '',
    voucher_code: '', notes: ''
  })

  priceCalc.value = null
  availableCredits.value = []
  availableVouchers.value = []
  customerOptions.value = []
  selectedBooking.value = null
  isNewBookingForm.value = true
  recalculatePrice()
}

const closeNewBookingForm = () => {
  isNewBookingForm.value = false
  isNewBookingMode.value = false
  selectedBooking.value = null
}

const setDuration = (hours) => {
  newBookingForm.duration_hours = hours
  const startH = parseInt(newBookingForm.start_time.split(':')[0])
  const endH = (startH + hours) % 24
  newBookingForm.end_time = `${String(endH).padStart(2,'0')}:00`
  recalculatePrice()
}

let priceCalcTimer = null
const recalculatePrice = async () => {
  const f = newBookingForm
  if (!f.store_id || !f.booking_date || !f.start_time || !f.end_time) return

  // debounce
  clearTimeout(priceCalcTimer)
  priceCalcTimer = setTimeout(async () => {
    const room = allRooms.value.find(r => r.id === f.room_id)
    if (!room) return

    priceCalcLoading.value = true
    try {
      const { data } = await calculatePrice({
        store_id: f.store_id,
        room_template_id: room.room_template_id || room.room_template?.id,
        booking_date: f.booking_date,
        start_time: f.start_time,
        end_time: f.end_time,
      })
      priceCalc.value = data.data

      // Recalculate duration_hours from start/end
      let sH = parseInt(f.start_time.split(':')[0])
      let eH = parseInt(f.end_time.split(':')[0])
      if (eH < sH) eH += 24
      newBookingForm.duration_hours = eH - sH
    } catch {
      priceCalc.value = null
    } finally {
      priceCalcLoading.value = false
    }

    // Refresh play credits jika tanggal berubah dan customer adalah member
    if (f.customer_id) {
      const customer = customerOptions.value.find(c => c.id === f.customer_id)
      if (customer?.type === 'member') {
        getAvailableCredits(f.customer_id, f.store_id, f.booking_date)
          .then(({ data }) => { availableCredits.value = data.data || [] })
          .catch(() => {})
      }
    }
  }, 600)
}

const loadAvailableVouchers = async (customerId) => {
  voucherOptionsLoading.value = true
  availableVouchers.value = []
  try {
    const { data } = await api.get('/vouchers/customer-available', {
      params: { customer_id: customerId, store_id: newBookingForm.store_id, type: 'booking' }
    })
    availableVouchers.value = data.data || []
  } catch { availableVouchers.value = [] }
  finally { voucherOptionsLoading.value = false }
}

const onCustomerChange = async (customerId) => {
  newBookingForm.voucher_code = ''
  availableVouchers.value = []

  if (!customerId) {
    newBookingForm.customer_name = ''
    newBookingForm.customer_whatsapp = ''
    newBookingForm.customer_email = ''
    availableCredits.value = []
    return
  }
  const customer = customerOptions.value.find(c => c.id === customerId)
  if (customer) {
    newBookingForm.customer_name = customer.name
    newBookingForm.customer_whatsapp = customer.whatsapp || ''
    newBookingForm.customer_email = customer.email || ''
    if (customer.type === 'member') {
      // Load play credits dan vouchers paralel
      const [, ] = await Promise.allSettled([
        getAvailableCredits(customerId, selectedStore.value,newBookingForm.booking_date)
          .then(({ data }) => { availableCredits.value = data.data || [] })
          .catch(() => { availableCredits.value = [] }),
        loadAvailableVouchers(customerId),
      ])
    } else {
      availableCredits.value = []
      newBookingForm.payment_method = 'cash'
    }
  }
}

const openConfirmModal = () => {
  if (!newBookingForm.customer_name.trim()) {
    ElMessage.warning('Nama customer wajib diisi')
    return
  }
  if (!priceCalc.value) {
    ElMessage.warning('Harga belum terhitung. Pastikan waktu booking sudah diisi.')
    return
  }
  showConfirmModal.value = true
}

const handleCreateBooking = async () => {
  creatingBooking.value = true
  try {
    const payload = {
      store_id: newBookingForm.store_id,
      room_id: newBookingForm.room_id,
      customer_id: newBookingForm.customer_id || null,
      customer_name: newBookingForm.customer_name,
      customer_whatsapp: newBookingForm.customer_whatsapp || null,
      customer_email: newBookingForm.customer_email || null,
      booking_date: newBookingForm.booking_date,
      start_time: newBookingForm.start_time,
      end_time: newBookingForm.end_time,
      duration_hours: newBookingForm.duration_hours,
      payment_method: newBookingForm.payment_method === 'cash' ? 'cash' : 'play_credits',
      play_credit_id: newBookingForm.payment_method !== 'cash' ? newBookingForm.play_credit_id : null,
      voucher_code: newBookingForm.voucher_code || null,
      notes: newBookingForm.notes || null,
    }
    const { data } = await createBooking(payload)
    createdBookingCode.value = data.data?.booking_code || data.data?.id || '—'
    showConfirmModal.value = false
    showSuccessModal.value = true
    loadDashboard()
  } catch (e) {
    ElMessage.error(e?.response?.data?.message || 'Gagal membuat booking')
  } finally { creatingBooking.value = false }
}

const viewCreatedBooking = () => {
  showSuccessModal.value = false
  isNewBookingForm.value = false
  isNewBookingMode.value = false
}

const resetForNewBooking = () => {
  showSuccessModal.value = false
  priceCalc.value = null
  availableCredits.value = []
  Object.assign(newBookingForm, {
    customer_id: '', customer_name: '', customer_whatsapp: '', customer_email: '',
    payment_method: 'cash', play_credit_id: '', voucher_code: '', notes: ''
  })
}

// ── Booking Detail Actions ────────────────────────────────────
const handleBookingClick = (bk) => {
  selectedBooking.value = bk
  console.log(bk);
  isNewBookingForm.value = false
  isNewBookingMode.value = false
}

const openCancelForm = () => {
  cancelForm.reason = ''
  showCancelDialog.value = true
}

const handleCancelBooking = async () => {
  await cancelFormRef.value.validate(async (valid) => {
    if (!valid) return
    cancellingBooking.value = true
    try {
      await cancelBooking(selectedBooking.value.id, { reason: cancelForm.reason })
      ElMessage.success('Booking berhasil dibatalkan')
      showCancelDialog.value = false
      selectedBooking.value = null
      loadDashboard()
    } catch (e) {
      ElMessage.error(e?.response?.data?.message || 'Gagal membatalkan booking')
    } finally { cancellingBooking.value = false }
  })
}

const openCompleteConfirm = async () => {
  try {
    await ElMessageBox.confirm(
      'Tandai booking ini sebagai selesai?',
      'Konfirmasi',
      { type: 'success', confirmButtonText: 'Ya, Selesaikan', cancelButtonText: 'Batal' }
    )
    await completeBooking(selectedBooking.value.id)
    ElMessage.success('Booking berhasil diselesaikan')
    selectedBooking.value = null
    loadDashboard()
  } catch {}
}

// ── Date Navigation ───────────────────────────────────────────
const changeDate = (delta) => {
  const d = new Date(selectedDate.value)
  d.setDate(d.getDate() + delta)
  selectedDate.value = d.toISOString().split('T')[0]
  loadDashboard()
}

// ── Helpers ───────────────────────────────────────────────────
const formatRp = (v) => `Rp ${(v || 0).toLocaleString('id-ID')}`

const formatDateDisplay = (d) => {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('id-ID', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
  })
}

const formatDate = (d) => d
  ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
  : '-'

const getStatusTagType = (s) => ({
  upcoming: '', ongoing: 'success', completed: 'info', cancelled: 'danger'
}[s] || 'info')

// ── Mount ─────────────────────────────────────────────────────
onMounted(async () => {
  generateTimeSlots()
  try {
    const staff = authStore.staff

    if (!staff || staff.is_all_stores) {
      // Super admin / all stores → fetch semua store dari API
      const { data } = await getStores({ per_page: 100, status: 'active' })
      stores.value = data.data || []
    } else {
      // Staff biasa → ambil langsung dari data staff, tidak perlu API call
      stores.value = (staff.staff_stores || []).map(ss => ss.store).filter(Boolean)
    }

    if (stores.value.length > 0) {
      selectedStore.value = stores.value[0].id
      await loadDashboard()
    }
  } catch {
    ElMessage.error('Gagal memuat data cabang')
  }
})

onUnmounted(() => {
  clearTimeout(priceCalcTimer)
})
</script>

<style scoped>
.booking-page { display:flex; flex-direction:column; min-height:0; }

/* ── Header ──────────────────────────────────────────── */
.page-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:14px; }
.breadcrumb  { font-size:11px; color:var(--text-muted); font-weight:500; margin-bottom:3px; letter-spacing:0.3px; }
.page-title  { font-size:20px; font-weight:800; color:var(--text-primary); letter-spacing:-0.3px; }
.page-desc   { font-size:12px; color:var(--text-secondary); font-weight:500; margin-top:3px; }

/* ── Banner ──────────────────────────────────────────── */
.new-booking-banner {
  background: linear-gradient(135deg, var(--color-primary), #0262b0);
  color: #fff; padding: 10px 16px; border-radius: 8px;
  display: flex; align-items: center; gap: 10px;
  font-size: 13px; font-weight: 700; margin-bottom: 10px;
  letter-spacing: 0.2px;
}

/* ── Filter ──────────────────────────────────────────── */
.filter-bar  { display:flex; align-items:center; gap:10px; flex-wrap:wrap; margin-bottom:8px; }
.legend-bar  { display:flex; gap:16px; align-items:center; font-size:11.5px; color:var(--text-secondary); font-weight:600; margin-bottom:10px; flex-wrap:wrap; }
.legend-item { display:flex; align-items:center; gap:5px; }
.dot         { width:10px; height:10px; border-radius:3px; }

/* ── Holiday Warning Banner ───────────────────────── */
.holiday-banner {
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.35);
  border-radius: 8px;
  padding: 10px 14px;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 12.5px;
  color: #D97706;
  margin-bottom: 10px;
  flex-wrap: wrap;
}
body.light-mode .holiday-banner { color: #92400e; background: rgba(245,158,11,0.08); }

/* ── Main layout ─────────────────────────────────────── */
.main-area {
  display: flex; gap: 14px;
  height: calc(100vh - 255px);
  min-height: 420px;
}

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
  transition: filter 0.15s, transform 0.15s;
  display: flex; flex-direction: column;
  justify-content: center; z-index: 2;
}
.booking-block:hover { filter: brightness(1.12); transform: scaleY(1.03); }

/* Dark mode blocks (default) */
.block-upcoming  { background: rgba(2,130,222,0.25); color: #7DEBFF; border: 1px solid rgba(2,130,222,0.55); }
.block-ongoing   { background: rgba(16,185,129,0.22); color: #86efcd; border: 1px solid rgba(16,185,129,0.5); }
.block-completed { background: rgba(100,116,139,0.18); color: var(--text-secondary); border: 1px solid var(--border-color); }
.block-cancelled { background: rgba(239,68,68,0.14); color: #fca5a5; border: 1px solid rgba(239,68,68,0.35); text-decoration: line-through; }
.ending-soon     { border-color: #F59E0B !important; box-shadow: 0 0 0 2px rgba(245,158,11,0.3); }

.block-name { font-weight: 700; font-size: 11.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.block-time { font-size: 10px; font-weight: 600; opacity: 0.8; margin-top: 1px; }

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
  border-color:var(--color-primary); color:#fff;
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

/* ── Right Panel ─────────────────────────────────────── */
.right-panel {
  width: 426px; min-width: 426px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px; padding: 16px;
  overflow-y: auto; display: flex; flex-direction: column;
  gap: 0;
}

.slide-enter-active, .slide-leave-active { transition: all 0.22s ease; }
.slide-enter-from, .slide-leave-to { opacity: 0; transform: translateX(20px); }

.panel-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 14px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-color);
}

/* Room chip */
.room-chip {
  display: flex; align-items: center; gap: 8px;
  background: rgba(2,130,222,0.1);
  border: 1px solid rgba(2,130,222,0.25);
  border-radius: 8px; padding: 9px 13px; margin-bottom: 14px;
  font-weight: 600;
}

/* Info section */
.info-section-title {
  font-size: 10px; font-weight: 800; letter-spacing: 1.8px;
  text-transform: uppercase; color: var(--text-muted);
  margin: 14px 0 8px;
}
.info-grid { display: flex; flex-direction: column; }
.info-row {
  display: flex; justify-content: space-between; align-items: center;
  font-size: 12.5px; padding: 7px 0;
  border-bottom: 1px solid var(--border-color);
  gap: 8px;
}
/* Label kiri */
.info-row > span:first-child {
  color: var(--text-secondary);
  font-weight: 600;
  flex-shrink: 0;
}
/* Value kanan — teks lebih tebal */
.info-row > span:last-child,
.info-row > strong { color: var(--text-primary); font-weight: 600; text-align: right; }

/* Detail row — untuk blok deskripsi multi-baris di panel event */
.detail-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 7px 0;
  border-bottom: 1px solid var(--border-color);
  font-size: 12.5px;
}
.detail-label {
  font-weight: 600;
  flex-shrink: 0;
}

/* Ending soon */
.ending-soon-alert {
  background: rgba(245,158,11,0.1);
  border: 1px solid rgba(245,158,11,0.35);
  border-radius: 8px; padding: 10px 13px;
  font-size: 12px; font-weight: 700; color: #fbbf24;
  display: flex; align-items: center; gap: 7px; margin-top: 10px;
}

/* Price breakdown */
.price-breakdown-box {
  background: var(--bg-main);
  border: 1px solid var(--border-color);
  border-radius: 8px; padding: 12px; margin: 10px 0;
}
.breakdown-row {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 6px;
}
.breakdown-row > span:first-child {
  color: var(--text-secondary); font-size: 11.5px; font-weight: 600;
}
.breakdown-row > span:last-child {
  font-size: 12.5px; font-weight: 700; color: var(--text-primary);
}
.breakdown-total {
  display: flex; justify-content: space-between; align-items: center;
  padding-top: 9px; border-top: 1px solid var(--border-color);
  font-size: 13px; font-weight: 800; color: var(--text-primary);
}

.voucher-discount-row {
  display: flex; justify-content: space-between; align-items: center;
  color: var(--color-success);
  background: rgba(16,185,129,0.08);
  border: 1px solid rgba(16,185,129,0.2);
  border-radius: 5px;
  margin: 3px 0 6px; padding: 5px 8px;
  font-weight: 700; font-size: 11.5px;
}
.voucher-invalid-row {
  display: flex; justify-content: space-between; align-items: center;
  color: var(--color-danger);
  background: rgba(239,68,68,0.08);
  border: 1px solid rgba(239,68,68,0.2);
  border-radius: 5px;
  margin: 3px 0 6px; padding: 5px 8px;
  font-weight: 700; font-size: 11.5px;
}

/* Credits section */
.credits-section {
  background: rgba(16,185,129,0.07);
  border: 1px solid rgba(16,185,129,0.22);
  border-radius: 8px; padding: 12px; margin-bottom: 12px;
}

/* Payment option cards */
.payment-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border: 1.5px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  background: var(--bg-card);
  transition: border-color 0.15s, background 0.15s;
  user-select: none;
}
.payment-option:hover {
  border-color: var(--color-primary);
  background: rgba(2,130,222,0.04);
}
.payment-option--selected {
  border-color: var(--color-success) !important;
  background: rgba(16,185,129,0.08) !important;
}
.payment-option__check {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 1.5px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 11px;
  color: var(--color-success);
  transition: border-color 0.15s, background 0.15s;
}
.payment-option--selected .payment-option__check {
  border-color: var(--color-success);
  background: var(--color-success);
  color: #fff;
}

/* Confirm modal rows */
.confirm-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 9px 0; border-bottom: 1px solid var(--border-color);
  gap: 10px;
}
.confirm-row > span:first-child {
  color: var(--text-secondary); font-size: 12px; font-weight: 600; flex-shrink: 0;
}
.confirm-row > span:last-child,
.confirm-row > strong { color: var(--text-primary); font-weight: 700; font-size: 13px; text-align: right; }

/* Light mode overrides are in theme.css (global) to avoid :global() compound-selector issues */

/* ── Event Booking ───────────────────────────────────────── */

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
  background: #534AB7;
  border: 2px solid #3C3489;
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

.event-block-title { font-size: 11px; font-weight: 700; color: #EEEDFE; letter-spacing: 1px; }
.event-block-name  { font-size: 13px; font-weight: 500; color: #EEEDFE; text-align: center; padding: 0 8px; }
.event-block-time  { font-size: 11px; color: #AFA9EC; }

/* Event form badge */
.event-form-badge {
  background: rgba(83,74,183,0.1);
  border: 1px solid rgba(83,74,183,0.2);
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 12px;
  color: var(--color-primary);
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 14px;
}

/* Day-type badge inside price preview */
.day-type-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.4px;
  text-transform: uppercase;
}
.day-type-badge.weekday {
  background: rgba(59,130,246,0.12);
  color: #2563EB;
  border: 1px solid rgba(59,130,246,0.3);
}
.day-type-badge.weekend {
  background: rgba(217,119,6,0.12);
  color: #D97706;
  border: 1px solid rgba(217,119,6,0.3);
}

/* Price preview box (event) */
.price-preview-box {
  background: var(--bg-main);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 12px;
  margin: 8px 0 14px;
}

/* Cancel info (event detail) */
.cancel-info {
  margin-top: 12px;
  background: rgba(239,68,68,0.08);
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 12px;
  color: var(--color-danger);
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
