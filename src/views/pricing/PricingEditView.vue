<template>
  <div>
    <!-- Back -->
    <el-button class="flush-list" text @click="$router.push('/pricing')">
      <el-icon><ArrowLeft /></el-icon> Kembali ke Pricing Panel
    </el-button>

    <!-- Header -->
    <PageHeader :breadcrumb="`Pricing → ${storeName}`" :title="`Edit Pricing – ${storeName}`" description="Atur harga bermain untuk cabang ini.">
      <template #actions>
        <el-button v-if="can('pricing.edit')" type="primary" :loading="saving" @click="handleSaveAll">
          <el-icon><Check /></el-icon> Simpan & Publish
        </el-button>
      </template>
    </PageHeader>

    <!-- Info Bar -->
    <el-card shadow="never" class="u-mb-2">
      <div class="info-bar">
        <div class="info-bar-item">
          <span class="ib-label">CABANG</span>
          <span class="ib-value">{{ storeName || '—' }}</span>
        </div>
        <div class="ib-divider" />
        <div class="info-bar-item">
          <span class="ib-label">STATUS PRICING</span>
          <el-tag type="success" size="small" class="u-mt-1">Aktif</el-tag>
        </div>
        <div class="ib-divider" />
        <div class="info-bar-item">
          <span class="ib-label">TERAKHIR DIUPDATE</span>
          <span class="ib-value">{{ lastUpdated }}</span>
        </div>
        <div class="ib-divider" />
        <div class="info-bar-item">
          <span class="ib-label">TERAPLIKASI DI</span>
          <span class="ib-value u-text-xs">Website Booking, Booking Admin & Walk-in</span>
        </div>
      </div>
    </el-card>

    <!-- Tabs -->
    <el-tabs v-model="activeTab" type="card" v-loading="loading">

      <!-- ───────────────── Tab: Ringkasan ───────────────── -->
      <el-tab-pane label="Ringkasan" name="ringkasan">
        <div class="tab-grid u-mt-4">
          <div>
            <!-- HH Prices Summary -->
            <el-card shadow="never" class="u-mb-4">
              <div class="section-header">
                <div>
                  <div class="sh-title">1. Harga Happy Hour <span class="sh-sub">(Per Jam)</span></div>
                  <div class="sh-desc">Berlaku Weekday (Senin–Kamis) pada jam yang ditentukan.</div>
                </div>
                <el-button size="small" plain @click="activeTab = 'happy_hour'">
                  <el-icon><Edit /></el-icon> Edit
                </el-button>
              </div>
              <el-table :data="happyHourPriceRows" size="small" class="u-mt-3">
                <el-table-column label="Tipe Ruangan" min-width="180">
                  <template #default="{ row }">
                    <span class="cell-text">{{ row.room_template?.name }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="Harga / Jam" min-width="150">
                  <template #default="{ row }">
                    <span v-if="row.price_per_hour > 0" class="u-fw-semibold u-text-action">
                      Rp {{ formatPrice(row.price_per_hour) }}
                    </span>
                    <span v-else class="u-text-xs u-text-muted">Belum diatur</span>
                  </template>
                </el-table-column>
              </el-table>
            </el-card>

            <!-- Package Prices Summary -->
            <el-card shadow="never">
              <div class="section-header">
                <div>
                  <div class="sh-title">2. Harga Normal <span class="sh-sub">(Paket)</span></div>
                  <div class="sh-desc">Berlaku jam Normal Weekday + seluruh jam Weekend & Tanggal Merah.</div>
                </div>
                <el-button size="small" plain @click="activeTab = 'paket'">
                  <el-icon><Edit /></el-icon> Edit Semua
                </el-button>
              </div>
              <el-table :data="packageEditRows" size="small" class="u-mt-3">
                <el-table-column label="Tipe Ruangan" min-width="160" fixed>
                  <template #default="{ row }">
                    <span class="cell-text">{{ row.name }}</span>
                  </template>
                </el-table-column>
                <el-table-column v-for="dur in standardDurations" :key="dur" :label="`${dur} Jam`" width="110">
                  <template #default="{ row }">
                    <span class="u-text-xs">{{ getPackagePrice(row.id, dur) }}</span>
                  </template>
                </el-table-column>
              </el-table>
            </el-card>
          </div>

          <!-- Right Sidebar -->
          <div>
            <!-- HH Schedules -->
            <!-- <el-card shadow="never" class="u-mb-3">
              <div class="sh-title u-mb-3">
                Jadwal Happy Hour <span class="sh-sub">(Weekday Only)</span>
              </div>
              <div v-if="happyHourSchedules.length === 0" class="u-text-xs u-text-muted u-mb-2">
                Belum ada jadwal
              </div>
              <div v-for="s in happyHourSchedules" :key="s.id" class="schedule-row">
                <el-icon class="u-text-action"><Clock /></el-icon>
                <span>{{ s.start_time }} – {{ s.end_time }}</span>
                <el-button class="push-right" v-if="can('pricing.edit')" size="small" circle plain type="danger" @click="removeSchedule(s.id)">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
              <el-button v-if="can('pricing.edit')" class="u-w-full u-mt-2" plain size="small" @click="showAddSchedule = true">
                <el-icon><Plus /></el-icon> Tambah Rentang
              </el-button>
              <div class="note-box u-mt-2">
                <el-icon><WarningFilled /></el-icon>
                Happy Hour hanya dihitung per jam, tidak berlaku untuk paket 3/5/8/10 jam.
              </div>
            </el-card> -->

            <!-- Rules Summary -->
            <el-card shadow="never">
              <div class="sh-title u-mb-3">3. Rule Pricing</div>
              <div v-for="rule in rulesSummary" :key="rule.title" class="rule-item">
                <el-icon class="ok-icon"><CircleCheck /></el-icon>
                <div>
                  <div class="label-xs">{{ rule.title }}</div>
                  <div class="u-text-xs u-text-secondary u-mt-1">{{ rule.desc }}</div>
                </div>
              </div>
              <el-button class="u-w-full u-mt-3" plain size="small" @click="activeTab = 'preview'">
                <el-icon><View /></el-icon> Lihat Simulator Harga
              </el-button>
            </el-card>
          </div>
        </div>
      </el-tab-pane>

      <!-- ───────────────── Tab: Happy Hour ───────────────── -->
      <el-tab-pane label="Happy Hour" name="happy_hour">
        <div class="tab-grid u-mt-4">
          <div>
            <el-card shadow="never" class="u-mb-4">
              <div class="sh-title u-mb-1">Jadwal Happy Hour</div>
              <div class="sh-desc u-mb-4">Hanya berlaku untuk Weekday (Senin–Kamis).</div>

              <div class="empty-note" v-if="happyHourSchedules.length === 0">
                Belum ada jadwal Happy Hour
              </div>
              <div v-for="s in happyHourSchedules" :key="s.id" class="schedule-row-lg">
                <el-icon class="u-text-action"><Clock /></el-icon>
                <span class="card-title">{{ s.start_time }} – {{ s.end_time }}</span>
                <el-button class="push-right" v-if="can('pricing.edit')" size="small" type="danger" plain circle @click="removeSchedule(s.id)">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>

              <el-button v-if="can('pricing.edit')" class="u-w-full u-mt-2" @click="showAddSchedule = true">
                <el-icon><Plus /></el-icon> Tambah Rentang Waktu
              </el-button>
            </el-card>

            <el-card shadow="never">
              <div class="sh-title u-mb-1">Harga Happy Hour (Per Jam)</div>
              <div class="sh-desc u-mb-4">Harga per jam untuk setiap tipe ruangan saat Happy Hour.</div>

              <el-table :data="happyHourPriceRows">
                <el-table-column label="Tipe Ruangan" min-width="180">
                  <template #default="{ row }">
                    <span class="fw-medium">{{ row.room_template?.name }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="Harga per Jam" min-width="200">
                  <template #default="{ row }">
                    <el-input-number class="input-date"
                      v-model="row.price_per_hour"
                      :min="0"
                      :step="5000"
                     
                      :formatter="v => `Rp ${String(v).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`"
                      :parser="v => v.replace(/Rp\s?|\./g, '')"
                    />
                  </template>
                </el-table-column>
              </el-table>

              <el-button type="primary" class="u-mt-3" :loading="savingHH" @click="saveHappyHourPrices(true)">
                <el-icon><Check /></el-icon> Simpan Harga Happy Hour
              </el-button>
            </el-card>
          </div>

          <el-card shadow="never">
            <div class="sh-title u-mb-3">Catatan</div>
            <div class="note-box">
              <el-icon><WarningFilled /></el-icon>
              Happy Hour hanya dihitung per jam dan tidak berlaku untuk paket (3, 5, 8, 10 jam).
            </div>
            <div class="rules-note">
              <div>• Berlaku Weekday saja (Senin–Kamis)</div>
              <div>• Jika booking melewati jam HH, sistem otomatis split</div>
              <div>• Harga HH selalu per jam, bukan paket</div>
            </div>
          </el-card>
        </div>
      </el-tab-pane>

      <!-- ───────────────── Tab: Paket Normal ───────────────── -->
      <el-tab-pane label="Paket Normal" name="paket">
        <div class="u-mt-4">
          <el-card shadow="never">
            <div class="card-head">
              <div>
                <div class="sh-title">Harga Paket Normal</div>
                <div class="sh-desc">Berlaku jam Normal Weekday dan seluruh jam Weekend & Tanggal Merah.</div>
              </div>
              <el-button size="small" plain @click="showAddCustom = true">
                <el-icon><Plus /></el-icon> Tambah Durasi Custom
              </el-button>
            </div>

            <el-table :data="packageEditRows">
              <el-table-column label="Tipe Ruangan" min-width="160" fixed>
                <template #default="{ row }">
                  <span class="cell-text">{{ row.name }}</span>
                </template>
              </el-table-column>
              <el-table-column
                v-for="dur in allDurations"
                :key="dur"
                :label="`${dur} Jam`"
                width="140"
              >
                <template #default="{ row }">
                  <el-input-number class="input-price"
                    v-model="row.prices[dur]"
                    :min="0"
                    :step="5000"
                    size="small"
                   
                    :formatter="v => String(v).replace(/\B(?=(\d{3})+(?!\d))/g, '.')"
                    :parser="v => v.replace(/\./g, '')"
                  />
                </template>
              </el-table-column>
            </el-table>

            <el-button type="primary" class="u-mt-3" :loading="savingPackages" @click="savePackagePrices(true)">
              <el-icon><Check /></el-icon> Simpan Semua Harga Paket
            </el-button>
          </el-card>
        </div>
      </el-tab-pane>

      <!-- ───────────────── Tab: Flash Sale ───────────────── -->
      <el-tab-pane label="Flash Sale" name="flash_sale">
        <div class="u-mt-4">
          <div class="u-flex u-justify-between u-mb-3">
            <div>
              <div class="sh-title">Flash Sale</div>
              <div class="sh-desc">Potongan harga nominal untuk ruangan tertentu pada jam & tanggal tertentu.</div>
            </div>
            <el-button v-if="can('pricing.edit')" type="primary" @click="openFlashSaleForm(null)">
              <el-icon><Plus /></el-icon> Tambah Flash Sale
            </el-button>
          </div>

          <el-card shadow="never">
            <el-table :data="flashSales" v-loading="loadingFS" empty-text="Belum ada flash sale">
              <el-table-column label="Nama" min-width="160" prop="name" />
              <el-table-column label="Ruangan" width="160">
                <template #default="{ row }">
                  <span class="u-text-xs">{{ row.room_template?.name || '—' }}</span>
                </template>
              </el-table-column>
              <el-table-column label="Harga / Jam" width="140">
                <template #default="{ row }">
                  <span class="u-text-action u-fw-semibold">
                    Rp {{ formatPrice(row.price_per_hour) }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column label="Tanggal" width="200">
                <template #default="{ row }">
                  <span class="u-text-xs">{{ formatDate(row.date_from) }} – {{ formatDate(row.date_to) }}</span>
                </template>
              </el-table-column>
              <el-table-column label="Jam" width="130">
                <template #default="{ row }">
                  <span class="u-text-xs">{{ row.time_from }} – {{ row.time_to }}</span>
                </template>
              </el-table-column>
              <el-table-column label="Status" width="100">
                <template #default="{ row }">
                  <el-tag :type="row.is_active ? 'success' : 'info'" size="small">
                    {{ row.is_active ? 'Aktif' : 'Nonaktif' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="Aksi" width="100" align="right" fixed="right">
                <template #default="{ row }">
                  <div class="row-actions">
                    <el-tooltip v-if="can('pricing.edit')" content="Edit" placement="top">
                      <el-button size="small" circle plain @click="openFlashSaleForm(row)">
                        <el-icon><Edit /></el-icon>
                      </el-button>
                    </el-tooltip>
                    <el-tooltip v-if="can('pricing.edit')" content="Hapus" placement="top">
                      <el-button size="small" circle plain type="danger" @click="handleDeleteFS(row.id)">
                        <el-icon><Delete /></el-icon>
                      </el-button>
                    </el-tooltip>
                  </div>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </div>
      </el-tab-pane>

      <!-- ───────────────── Tab: Preview / Simulator ───────────────── -->
      <el-tab-pane label="Simulator Harga" name="preview">
        <div class="tab-grid u-mt-4">
          <el-card shadow="never">
            <div class="sh-title u-mb-4">Simulator Harga Booking</div>
            <el-form :model="calcForm" label-position="top">
              <el-form-item label="Tanggal Booking">
                <el-date-picker
                  v-model="calcForm.booking_date"
                  type="date"
                  format="dddd, DD MMM YYYY"
                  value-format="YYYY-MM-DD"
                  class="u-w-full"
                />
              </el-form-item>
              <el-form-item label="Tipe Ruangan">
                <el-select v-model="calcForm.room_template_id" class="u-w-full" placeholder="Pilih tipe ruangan">
                  <el-option v-for="t in roomTemplates" :key="t.id" :label="t.name" :value="t.id" />
                </el-select>
              </el-form-item>
              <div :style="{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:'14px' }">
                <el-form-item label="Jam Mulai">
                  <el-time-picker v-model="calcForm.start_time" format="HH:mm" value-format="HH:mm" class="u-w-full" />
                </el-form-item>
                <el-form-item label="Jam Selesai">
                  <el-time-picker v-model="calcForm.end_time" format="HH:mm" value-format="HH:mm" class="u-w-full" />
                </el-form-item>
              </div>
              <el-button type="primary" class="u-w-full" :loading="calculating" @click="runCalculation">
                <el-icon><Odometer /></el-icon> Hitung Sekarang
              </el-button>
            </el-form>

            <!-- Result -->
            <template v-if="calcResult">
              <div class="section-divider">
                <div class="u-flex u-justify-between u-mb-3">
                  <div class="sh-title">Hasil Perhitungan</div>
                  <el-tag type="info">{{ calcResult.total_hours }} Jam Total</el-tag>
                </div>

                <div v-for="(item, i) in calcResult.breakdown" :key="i" class="breakdown-row">
                  <div class="split-row-spaced">
                    <span class="label-sm">{{ item.time_range }}</span>
                    <el-tag :type="item.type === 'Happy Hour' ? 'warning' : 'info'" size="small">{{ item.type }}</el-tag>
                  </div>
                  <div class="split-row">
                    <span class="u-text-xs u-text-secondary">{{ item.description }}</span>
                    <span class="value-strong">Rp {{ formatPrice(item.amount) }}</span>
                  </div>
                </div>

                <!-- <div v-if="calcResult.has_flash_sale" class="breakdown-row input-invalid">
                  <div class="split-row">
                    <span class="u-text-sm u-text-danger u-fw-semibold">
                      Flash Sale: {{ calcResult.flash_sale_name }}
                    </span>
                    <span class="u-text-danger u-fw-semibold">
                      – Rp {{ formatPrice(calcResult.flash_discount) }}
                    </span>
                  </div>
                </div> -->

                <div class="total-row">
                  <span>TOTAL</span>
                  <span class="u-text-action">Rp {{ formatPrice(calcResult.final_price) }}</span>
                </div>
                <p class="u-text-xs u-text-success u-mt-1">
                  <el-icon aria-hidden="true"><Check /></el-icon> Perhitungan sudah sesuai aturan yang aktif.
                </p>
              </div>
            </template>
          </el-card>

          <el-card shadow="never">
            <div class="sh-title u-mb-3">Catatan Penting</div>
            <ul class="notes-list">
              <li>Happy Hour hanya berlaku di Weekday (Senin–Kamis).</li>
              <li>Weekend & Tanggal Merah selalu menggunakan paket normal.</li>
              <li>Sistem selalu memilih kombinasi paket termurah.</li>
              <li>Flash Sale dipotong dari total akhir (prioritas tertinggi).</li>
              <li>Jika durasi melewati jam HH, sistem auto-split per bagian.</li>
            </ul>
          </el-card>
        </div>
      </el-tab-pane>

      <!-- ───────────────── Tab: Harga Event ───────────────── -->
      <el-tab-pane label="Harga Event" name="event_price">
        <div class="calc-card">
          <el-card shadow="never">
            <template #header>
              <div class="u-flex u-gap-2">
                <el-icon class="event-star"><Star /></el-icon>
                <span class="u-fw-bold">Harga Event Booking</span>
              </div>
            </template>

            <div class="note-box u-mb-4">
              <el-icon><InfoFilled /></el-icon>
              <span class="u-text-xs">
                Harga untuk booking 1 gedung penuh (event). Kalkulasi proporsional:
                <strong>(Harga per hari ÷ 24) × durasi jam = total harga event</strong>.
                Contoh: Rp 1.000.000/hari, event 6 jam = Rp 250.000.
              </span>
            </div>

            <div class="calc-row">
              <el-form-item class="grow-flush" label="Harga per Hari (Rp)">
                <el-input-number
                  v-model="eventPrice"
                  :min="0"
                  :step="100000"
                  class="u-w-full"
                  :formatter="v => `Rp ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')"
                  :parser="v => Number(v.replace(/[^0-9]/g, ''))"
                />
              </el-form-item>
              <el-button type="primary" :loading="savingEvent" @click="saveEventPrice">
                Simpan
              </el-button>
            </div>
          </el-card>
        </div>
      </el-tab-pane>

    </el-tabs>

    <!-- ── Dialog: Tambah Jadwal HH ── -->
    <el-drawer v-model="showAddSchedule" title="Tambah Jadwal Happy Hour" direction="rtl" :size="isMobile ? '100%' : '380px'">
      <el-form :model="scheduleForm" label-position="top">
        <div :style="{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:'14px' }">
          <el-form-item label="Jam Mulai">
            <el-time-picker v-model="scheduleForm.start_time" format="HH:mm" value-format="HH:mm" class="u-w-full" />
          </el-form-item>
          <el-form-item label="Jam Selesai">
            <el-time-picker v-model="scheduleForm.end_time" format="HH:mm" value-format="HH:mm" class="u-w-full" />
          </el-form-item>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="showAddSchedule = false">Batal</el-button>
        <el-button type="primary" :loading="savingSchedule" @click="handleAddSchedule">Tambah</el-button>
      </template>
    </el-drawer>

    <!-- ── Drawer: Tambah Durasi Custom ── -->
    <el-drawer v-model="showAddCustom" title="Tambah Durasi Custom" direction="rtl" :size="isMobile ? '100%' : '340px'">
      <el-form label-position="top">
        <el-form-item label="Durasi (jam)">
          <el-input-number v-model="customDuration" :min="1" :max="24" class="u-w-full" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddCustom = false">Batal</el-button>
        <el-button type="primary" @click="addCustomDuration">Tambah Durasi</el-button>
      </template>
    </el-drawer>

    <!-- ── Drawer: Flash Sale Form ── -->
    <el-drawer
      v-model="showFlashSaleForm"
      :title="editingFS ? 'Edit Flash Sale' : 'Tambah Flash Sale'"
      direction="rtl"
      :size="isMobile ? '100%' : '480px'"
    >
      <el-form :model="fsForm" label-position="top">
        <el-form-item label="Nama Flash Sale">
          <el-input v-model="fsForm.name" placeholder="Contoh: Flash Sale Siang VIP Room" />
        </el-form-item>
        <el-form-item label="Tipe Ruangan">
          <el-select v-model="fsRoomTemplateId" class="u-w-full" placeholder="Pilih tipe ruangan">
            <el-option v-for="t in roomTemplates" :key="t.id" :label="t.name" :value="t.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="Harga per Jam Flash Sale (Rp)">
          <el-input-number
            v-model="fsForm.price_per_hour"
            :min="0"
            :step="5000"
            class="u-w-full"
            :formatter="v => `Rp ${String(v).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`"
            :parser="v => v.replace(/Rp\s?|\./g, '')"
          />
        </el-form-item>
        <div :style="{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:'14px' }">
          <el-form-item label="Tanggal Mulai">
            <el-date-picker v-model="fsForm.date_from" type="date" value-format="YYYY-MM-DD" class="u-w-full" />
          </el-form-item>
          <el-form-item label="Tanggal Selesai">
            <el-date-picker v-model="fsForm.date_to" type="date" value-format="YYYY-MM-DD" class="u-w-full" />
          </el-form-item>
        </div>
        <div :style="{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:'14px' }">
          <el-form-item label="Jam Mulai">
            <el-time-picker v-model="fsForm.time_from" format="HH:mm" value-format="HH:mm" class="u-w-full" />
          </el-form-item>
          <el-form-item label="Jam Selesai">
            <el-time-picker v-model="fsForm.time_to" format="HH:mm" value-format="HH:mm" class="u-w-full" />
          </el-form-item>
        </div>
        <el-form-item label="Status">
          <el-switch v-model="fsForm.is_active" active-text="Aktif" inactive-text="Nonaktif" />
        </el-form-item>
      </el-form>
      <AuditTrail
        v-if="editingFS"
        :created-by="editingFS.created_by"
        :updated-by="editingFS.updated_by"
        :created-at="editingFS.created_at"
        :updated-at="editingFS.updated_at"
      />
      <template #footer>
        <el-button @click="showFlashSaleForm = false">Batal</el-button>
        <el-button type="primary" :loading="savingFS" @click="handleSaveFS">
          {{ editingFS ? 'Simpan Perubahan' : 'Tambah Flash Sale' }}
        </el-button>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { usePermission } from '@/composables/usePermission'
import { useBreakpoint } from '@/composables/useBreakpoint'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { notifyError } from '@/utils/notify'
import AuditTrail from '@/components/AuditTrail.vue'
import {
  getPricingByStore, updatePricingConfig,
  addHappyHourSchedule, deleteHappyHourSchedule,
  upsertHappyHourPrices, upsertPackagePrices,
  getFlashSales, createFlashSale, updateFlashSale, deleteFlashSale,
  calculatePrice,
} from '@/api/pricing/pricingApi'
import { getRoomTemplates } from '@/api/room_template/roomTemplateApi'
import { getEventPrice, upsertEventPrice } from '@/api/booking/eventBookingApi'
import PageHeader from '@/components/ui/PageHeader.vue'
import { businessDayWIB } from '@/utils/bookingTime'

const { can } = usePermission()
const { isMobile } = useBreakpoint()
const route = useRoute()
const router = useRouter()
const storeId = route.params.storeId

// ── State ─────────────────────────────────────────────────────
const activeTab = ref('ringkasan')
const loading = ref(false)
const saving = ref(false)
const savingHH = ref(false)
const savingPackages = ref(false)
const savingConfig = ref(false)
const savingSchedule = ref(false)
const savingFS = ref(false)
const loadingFS = ref(false)
const calculating = ref(false)
const savingEvent = ref(false)
const eventPrice  = ref(0)

const storeName = ref('')
const lastUpdated = ref('—')
const roomTemplates = ref([])
const happyHourSchedules = ref([])
const happyHourPriceRows = ref([])
const packageEditRows = ref([])
const flashSales = ref([])
const calcResult = ref(null)

const standardDurations = [1, 3, 5, 8, 10]
const allDurations = ref([1, 3, 5, 8, 10])

const pricingConfig = reactive({
  is_happy_hour_enabled: true,
  is_mixed_time_enabled: true,
  edge_case_2h: 'two_x_1h',
  edge_case_4h: '3h_plus_1h',
})

const calcForm = reactive({
  booking_date: businessDayWIB(),
  room_template_id: null,
  start_time: '13:00',
  end_time: '20:00',
})

// Dialogs
const showAddSchedule = ref(false)
const showAddCustom = ref(false)
const showFlashSaleForm = ref(false)
const editingFS = ref(null)
const customDuration = ref(2)
const scheduleForm = reactive({ start_time: '10:00', end_time: '15:00' })
// fsRoomTemplateId is a standalone ref — el-select v-model on reactive()
// nested properties can silently fail to propagate; ref() is always reliable.
const fsRoomTemplateId = ref(null)
const fsForm = reactive({
  name: '', price_per_hour: 0,
  date_from: '', date_to: '', time_from: '12:00', time_to: '13:00', is_active: true,
})

const rulesSummary = [
  { title: 'Happy Hour', desc: 'Berlaku Weekday (Senin–Kamis) pada jam yang ditentukan, dihitung per jam.' },
  { title: 'Normal Hour (Weekday)', desc: 'Di luar jam Happy Hour, menggunakan harga paket termurah.' },
  { title: 'Weekend & Tanggal Merah', desc: 'Seluruh jam menggunakan harga paket normal.' },
]

// ── Load Data ─────────────────────────────────────────────────
const loadPricing = async () => {
  loading.value = true
  try {
    const { data } = await getPricingByStore(storeId)
    const p = data.data

    storeName.value = p.store?.name || ''
    lastUpdated.value = p.updated_at
      ? new Date(p.updated_at).toLocaleString('id-ID') : '-'

    Object.assign(pricingConfig, {
      is_happy_hour_enabled: p.is_happy_hour_enabled,
      is_mixed_time_enabled: p.is_mixed_time_enabled,
      edge_case_2h: p.edge_case_2h,
      edge_case_4h: p.edge_case_4h,
    })

    happyHourSchedules.value = p.happy_hour_schedules || []

    // FIX Bug 2: paksa Number() agar tipe cocok saat .find()
    const hhPrices = p.happy_hour_prices || []
    happyHourPriceRows.value = roomTemplates.value.map(t => {
      const existing = hhPrices.find(pp => Number(pp.room_template_id) === Number(t.id))
      return {
        room_template_id: t.id,
        room_template: t,
        price_per_hour: existing ? Number(existing.price_per_hour) : 0,
        db_id: existing?.id || null
      }
    })

    // FIX Bug 3: build package rows dengan type casting yang benar
    buildPackageRows(p.package_prices || [])
  } catch (e) {
    notifyError(e, 'Gagal memuat data pricing')
  } finally {
    loading.value = false
  }
}

const buildPackageRows = (packagePrices) => {
  // Kumpulkan semua durasi unik (standar + custom)
  const durSet = new Set(standardDurations)
  packagePrices.forEach(p => durSet.add(Number(p.duration_hours)))
  allDurations.value = Array.from(durSet).sort((a, b) => a - b)

  packageEditRows.value = roomTemplates.value.map(t => {
    const prices = {}
    allDurations.value.forEach(dur => {
      // FIX: Number() casting agar .find() tidak gagal karena type mismatch
      const existing = packagePrices.find(
        p => Number(p.room_template_id) === Number(t.id) && Number(p.duration_hours) === dur
      )
      prices[dur] = existing ? Number(existing.price) : 0
    })
    return { id: t.id, name: t.name, prices }
  })
}

const loadFlashSales = async () => {
  loadingFS.value = true
  try {
    const { data } = await getFlashSales(storeId)
    flashSales.value = data.data || []
  } catch {
    flashSales.value = []
  } finally {
    loadingFS.value = false
  }
}

// ── Save Actions ──────────────────────────────────────────────
const handleSaveAll = async () => {
  saving.value = true
  try {
    await savePricingConfig(false)
    await saveHappyHourPrices(false)
    await savePackagePrices(false)
    ElMessage.success('Pricing berhasil disimpan & dipublish')
    router.push('/pricing')
  } catch (e) {
    notifyError(e, 'Gagal menyimpan pricing')
  } finally {
    saving.value = false
  }
}

const savePricingConfig = async (showMsg = true) => {
  savingConfig.value = true
  try {
    await updatePricingConfig(storeId, pricingConfig)
    if (showMsg) ElMessage.success('Aturan berhasil disimpan')
  } finally {
    savingConfig.value = false
  }
}

const saveHappyHourPrices = async (showMsg = true) => {
  savingHH.value = true
  try {
    const prices = happyHourPriceRows.value.map(r => ({
      room_template_id: r.room_template_id,
      price_per_hour: r.price_per_hour,
    }))
    await upsertHappyHourPrices(storeId, { prices })
    if (showMsg) ElMessage.success('Harga Happy Hour berhasil disimpan')
  } finally {
    savingHH.value = false
  }
}

const savePackagePrices = async (showMsg = true) => {
  savingPackages.value = true
  try {
    const prices = []
    packageEditRows.value.forEach(row => {
      allDurations.value.forEach(dur => {
        if (row.prices[dur] > 0) {
          prices.push({
            room_template_id: row.id,
            duration_hours: dur,
            price: row.prices[dur],
            is_custom: !standardDurations.includes(dur),
          })
        }
      })
    })
    await upsertPackagePrices(storeId, { prices })
    if (showMsg) ElMessage.success('Harga paket berhasil disimpan')
  } finally {
    savingPackages.value = false
  }
}

// ── Schedule ──────────────────────────────────────────────────
const handleAddSchedule = async () => {
  savingSchedule.value = true
  try {
    await addHappyHourSchedule(storeId, scheduleForm)
    ElMessage.success('Jadwal berhasil ditambahkan')
    showAddSchedule.value = false
    Object.assign(scheduleForm, { start_time: '10:00', end_time: '15:00' })
    await loadPricing()
  } catch (e) {
    notifyError(e, 'Gagal menambahkan jadwal')
  } finally {
    savingSchedule.value = false
  }
}

const removeSchedule = async (id) => {
  try {
    await ElMessageBox.confirm('Hapus jadwal ini?', 'Konfirmasi', {
      type: 'warning', confirmButtonText: 'Hapus', cancelButtonText: 'Batal',
    })
    await deleteHappyHourSchedule(storeId, id)
    ElMessage.success('Jadwal dihapus')
    await loadPricing()
  } catch {}
}

// ── Custom Duration ───────────────────────────────────────────
const addCustomDuration = () => {
  if (!allDurations.value.includes(customDuration.value)) {
    allDurations.value = [...allDurations.value, customDuration.value].sort((a, b) => a - b)
    packageEditRows.value.forEach(row => { row.prices[customDuration.value] = 0 })
    ElMessage.success(`Durasi ${customDuration.value} jam ditambahkan`)
  } else {
    ElMessage.warning('Durasi sudah ada')
  }
  showAddCustom.value = false
}

// ── Flash Sale ────────────────────────────────────────────────
const openFlashSaleForm = (sale) => {
  editingFS.value = sale
  if (sale) {
    fsRoomTemplateId.value = sale.room_template_id ?? null
    Object.assign(fsForm, {
      name: sale.name,
      price_per_hour: sale.price_per_hour,
      date_from: sale.date_from?.split('T')[0] || '',
      date_to: sale.date_to?.split('T')[0] || '',
      time_from: sale.time_from,
      time_to: sale.time_to,
      is_active: sale.is_active,
    })
  } else {
    fsRoomTemplateId.value = null
    Object.assign(fsForm, {
      name: '', price_per_hour: 0,
      date_from: '', date_to: '', time_from: '12:00', time_to: '13:00', is_active: true,
    })
  }
  showFlashSaleForm.value = true
}

const handleSaveFS = async () => {
  savingFS.value = true
  // Build payload: fsForm (reactive) + fsRoomTemplateId (standalone ref, always correct)
  const payload = { ...fsForm, room_template_id: fsRoomTemplateId.value }
  try {
    if (editingFS.value) {
      await updateFlashSale(editingFS.value.id, payload)
    } else {
      await createFlashSale(storeId, payload)
    }
    ElMessage.success('Flash sale berhasil disimpan')
    showFlashSaleForm.value = false
    await loadFlashSales()
  } catch (e) {
    notifyError(e, 'Gagal menyimpan flash sale')
  } finally {
    savingFS.value = false
  }
}

const handleDeleteFS = async (id) => {
  try {
    await ElMessageBox.confirm('Hapus flash sale ini?', 'Konfirmasi', {
      type: 'warning', confirmButtonText: 'Hapus', cancelButtonText: 'Batal',
    })
    await deleteFlashSale(id)
    ElMessage.success('Flash sale dihapus')
    await loadFlashSales()
  } catch {}
}

// ── Calculator ────────────────────────────────────────────────
const runCalculation = async () => {
  if (!calcForm.room_template_id || !calcForm.booking_date) {
    ElMessage.warning('Lengkapi semua field kalkulator')
    return
  }
  calculating.value = true
  try {
    const { data } = await calculatePrice({ store_id: storeId, ...calcForm })
    calcResult.value = data.data
  } catch (e) {
    notifyError(e, 'Gagal menghitung harga')
  } finally {
    calculating.value = false
  }
}

// ── Helpers ───────────────────────────────────────────────────
const formatPrice = (v) => (v || 0).toLocaleString('id-ID')
const formatDate = (d) => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}
const getPackagePrice = (templateId, dur) => {
  const row = packageEditRows.value.find(r => r.id === templateId)
  const price = row?.prices?.[dur] || 0
  return price > 0 ? `Rp ${formatPrice(price)}` : '—'
}

const saveEventPrice = async () => {
  savingEvent.value = true
  try {
    await upsertEventPrice(storeId, { price_per_day: eventPrice.value })
    ElMessage.success('Harga event berhasil disimpan')
  } catch (e) { notifyError(e, 'Gagal menyimpan harga event') }
  finally { savingEvent.value = false }
}

onMounted(async () => {
  const { data } = await getRoomTemplates({ per_page: 100 })
  roomTemplates.value = data.data || []
  if (roomTemplates.value.length > 0) {
    calcForm.room_template_id = roomTemplates.value[0].id
  }
  await loadPricing()
  await loadFlashSales()
  // Load event price (graceful — tidak crash jika BE belum ada)
  try {
    const { data: epData } = await getEventPrice(storeId)
    eventPrice.value = epData.data?.price_per_day || 0
  } catch { eventPrice.value = 0 }
})
</script>

<style scoped>
/* Info bar */
.info-bar { display:flex; gap:0; flex-wrap:wrap; }
.info-bar-item { display:flex; flex-direction:column; flex:1; padding:0 12px; }
.info-bar-item:first-child { padding-left:0; }
.ib-label { font-size:9px; font-weight:700; color:var(--text-muted); letter-spacing:0.5px; margin-bottom:2px; }
.ib-value { font-size:12px; font-weight:600; color:var(--text-primary); }
.ib-divider { width:1px; background:var(--border-color); margin:0 4px; }

/* Tab layout */
.tab-grid { display:grid; grid-template-columns:1fr 300px; gap:20px; }
@media (max-width:639px) { .tab-grid { grid-template-columns:1fr; } }

/* Section header */
.section-header { display:flex; justify-content:space-between; align-items:flex-start; }
.sh-title { font-size:14px; font-weight:700; color:var(--text-primary); }
.sh-sub { font-size:12px; font-weight:400; color:var(--text-secondary); }
.sh-desc { font-size:12px; color:var(--text-secondary); margin-top:2px; }

/* Schedule rows */
.schedule-row { display:flex; align-items:center; gap:8px; font-size:13px; color:var(--text-primary); padding:6px 0; border-bottom:1px solid var(--border-color); }
.schedule-row:last-of-type { border-bottom:none; }
.schedule-row-lg { display:flex; align-items:center; gap:10px; background:var(--bg-main); border-radius:8px; padding:10px 14px; margin-bottom:8px; }

/* Rule items */
.rule-item { display:flex; align-items:flex-start; gap:10px; margin-bottom:10px; }

/* Priority */
.priority-row { display:flex; align-items:center; gap:10px; margin-bottom:10px; }
.priority-num {
  width:22px; height:22px; border-radius:50%;
  background:var(--color-primary); color:var(--text-on-action);
  display:flex; align-items:center; justify-content:center;
  font-size:11px; font-weight:700; flex-shrink:0;
}

/* Toggle row */
.toggle-row { display:flex; justify-content:space-between; align-items:center; }

/* Breakdown */
.breakdown-row {
  background:var(--bg-main); border:1px solid var(--border-color);
  border-radius:8px; padding:10px 12px; margin-bottom:8px;
}
.total-row {
  display:flex; justify-content:space-between; align-items:center;
  padding:12px 0; border-top:2px solid var(--color-primary);
  margin-top:8px; font-size:16px; font-weight:700; color:var(--text-primary);
}

/* Notes */
.notes-list { padding-left:16px; font-size:12px; color:var(--text-secondary); line-height:1.9; }

/* Note box */
.note-box {
  background:rgba(245,158,11,0.08); border:1px solid rgba(245,158,11,0.2);
  border-radius:6px; padding:8px 10px; font-size:12px; color:var(--warning);
  display:flex; align-items:flex-start; gap:6px;
}

/* C3: former inline styles */
.input-invalid { border-color: var(--danger); }
.event-star { color: var(--warning); }
.ok-icon { color: var(--success); flex-shrink: 0; }
.calc-row { display: flex; align-items: flex-end; gap: var(--space-3); max-width: 400px; }
.row-actions { display: flex; gap: var(--space-1); justify-content: flex-end; }
.split-row { display: flex; justify-content: space-between; }
.card-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-4); }
.split-row-spaced { display: flex; justify-content: space-between; margin-bottom: var(--space-1); }
.grow-flush { flex: 1; margin: 0; }
.empty-note { font-size: var(--font-size-xs); color: var(--text-muted); margin-bottom: var(--space-3); padding: var(--space-3); background: var(--surface-page); border-radius: var(--radius-lg); text-align: center; }
.label-xs { font-size: var(--font-size-xs); font-weight: 600; color: var(--text-primary); }
.label-sm { font-size: var(--font-size-sm); font-weight: 600; color: var(--text-primary); }
.fw-medium { font-weight: 500; }
.cell-text { font-weight: 500; font-size: var(--font-size-sm); }
.value-strong { font-weight: 600; color: var(--text-primary); }
.card-title { font-weight: 600; font-size: var(--font-size-base); }
.push-right { margin-left: auto; }
.rules-note { margin-top: var(--space-3); font-size: var(--font-size-xs); color: var(--text-secondary); line-height: 1.7; }
.calc-card { margin-top: var(--space-4); max-width: 700px; }
.section-divider { margin-top: var(--space-5); padding-top: var(--space-4); border-top: 1px solid var(--border); }
.flush-list { padding: 0; margin-bottom: var(--space-2); }
.input-price { width: 120px; }
.input-date { width: 180px; }
</style>
