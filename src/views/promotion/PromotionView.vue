<template>
  <div>
    <!-- Header -->
    <div class="page-header">
      <div>
        <div class="breadcrumb">Dashboard > Promotion</div>
        <h1 class="page-title">Promotion / Voucher</h1>
        <p class="page-desc">Kelola voucher promo dan kirim ke customer (member only)</p>
      </div>
      <el-button v-if="can('promotion.create')" type="primary" @click="openForm(null)">
        <el-icon><Plus /></el-icon> Buat Voucher Baru
      </el-button>
    </div>

    <!-- Stats Cards -->
    <div class="stats-grid">
      <el-card shadow="never" class="stat-card">
        <div class="stat-icon" style="background:rgba(124,58,237,0.15)">
          <el-icon size="20" style="color:var(--color-primary)"><Ticket /></el-icon>
        </div>
        <div>
          <div class="stat-value">{{ stats.total_voucher || 0 }}</div>
          <div class="stat-label">Total Voucher</div>
          <div class="stat-sub">Semua voucher</div>
        </div>
      </el-card>
      <el-card shadow="never" class="stat-card">
        <div class="stat-icon" style="background:rgba(59,130,246,0.15)">
          <el-icon size="20" style="color:var(--color-info)"><Promotion /></el-icon>
        </div>
        <div>
          <div class="stat-value">{{ stats.total_sent || 0 }}</div>
          <div class="stat-label">Total Terkirim</div>
          <div class="stat-sub">Voucher terkirim</div>
        </div>
      </el-card>
      <el-card shadow="never" class="stat-card">
        <div class="stat-icon" style="background:rgba(16,185,129,0.15)">
          <el-icon size="20" style="color:var(--color-success)"><CircleCheck /></el-icon>
        </div>
        <div>
          <div class="stat-value">{{ stats.total_used || 0 }}</div>
          <div class="stat-label">Total Digunakan</div>
          <div class="stat-sub">Voucher digunakan</div>
        </div>
      </el-card>
      <el-card shadow="never" class="stat-card">
        <div class="stat-icon" style="background:rgba(245,158,11,0.15)">
          <el-icon size="20" style="color:var(--color-warning)"><Money /></el-icon>
        </div>
        <div>
          <div class="stat-value" style="font-size:18px">{{ formatRp(stats.total_discount || 0) }}</div>
          <div class="stat-label">Total Diskon</div>
          <div class="stat-sub">Dari semua voucher</div>
        </div>
      </el-card>
    </div>

    <!-- Filter -->
    <el-card shadow="never" style="margin-top:16px">
      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
        <el-input v-model="filters.search" placeholder="Cari nama atau kode voucher..."
          prefix-icon="Search" style="width:260px" clearable @input="debounceSearch" />
        <el-select v-model="filters.status" placeholder="Semua Status" clearable style="width:140px" @change="fetchVouchers">
          <el-option label="Aktif" value="active" />
          <el-option label="Kadaluwarsa" value="expired" />
          <el-option label="Nonaktif" value="inactive" />
        </el-select>
        <el-select v-model="filters.type" placeholder="Semua Jenis" clearable style="width:160px" @change="fetchVouchers">
          <el-option label="Booking Ruangan" value="booking" />
          <el-option label="Play Credits" value="play_credits" />
          <el-option label="Keduanya" value="both" />
        </el-select>
        <el-button plain @click="resetFilters"><el-icon><RefreshRight /></el-icon> Reset</el-button>
      </div>
    </el-card>

    <!-- Table -->
    <el-card shadow="never" style="margin-top:14px">
      <div v-if="isMobile" class="m-card-list">
        <div class="m-card" v-for="row in voucherList" :key="row.id">
          <div class="m-card-icon" :style="{ background: getCodeColor(row.type) }">
            <span style="font-size:9px;font-weight:800;color:var(--text-primary);letter-spacing:-0.5px">{{ row.code?.slice(0,4) }}</span>
          </div>
          <div class="m-card-body">
            <div class="m-card-title">{{ row.name }}</div>
            <div class="m-card-meta">
              {{ row.discount_type === 'percentage' ? row.discount_value + '%' : formatRp(row.discount_value) }} diskon · {{ getTypeLabel(row.type) }}
            </div>
          </div>
          <div class="m-card-end">
            <el-tag :type="getStatusTag(row.status)" size="small">{{ getStatusLabel(row.status) }}</el-tag>
            <div style="display:flex;gap:4px">
              <el-button v-if="can('promotion.edit')" size="small" circle plain @click="openForm(row)"><el-icon><Edit /></el-icon></el-button>
              <el-button v-if="can('promotion.edit')" size="small" circle plain type="danger" @click="handleDelete(row)"><el-icon><Delete /></el-icon></el-button>
            </div>
          </div>
        </div>
      </div>

      <div class="table-wrap">
      <el-table :data="voucherList" v-loading="loading" size="small" style="width:100%">

        <!-- Kode -->
        <el-table-column label="VOUCHER" min-width="200">
          <template #default="{ row }">
            <div style="display:flex;align-items:center;gap:10px">
              <div class="code-badge" :style="{ background: getCodeColor(row.type) }">
                {{ row.code }}
              </div>
              <div>
                <div style="font-weight:600;font-size:13px">{{ row.name }}</div>
                <div style="font-size:11px;color:var(--text-secondary)">{{ row.description || '-' }}</div>
              </div>
            </div>
          </template>
        </el-table-column>

        <!-- Jenis -->
        <el-table-column label="JENIS" width="140">
          <template #default="{ row }">
            <el-tag :type="getTypeTag(row.type)" size="small">{{ getTypeLabel(row.type) }}</el-tag>
          </template>
        </el-table-column>

        <!-- Target Ruangan -->
        <el-table-column label="RUANGAN" width="130" v-if="!isTablet && !isMobile">
          <template #default="{ row }">
            <span v-if="row.is_all_room_types" style="font-size:12px;color:var(--color-primary-light)">Semua</span>
            <span v-else style="font-size:12px;color:var(--text-secondary)">
              {{ row.room_templates?.map(rt => rt.name).join(', ') || '-' }}
            </span>
          </template>
        </el-table-column>

        <!-- Diskon -->
        <el-table-column label="DISKON" width="150">
          <template #default="{ row }">
            <div>
              <span style="font-weight:600">
                {{ row.discount_type === 'percentage' ? row.discount_value + '%' : formatRp(row.discount_value) }}
              </span>
              <div v-if="row.discount_type === 'percentage' && row.max_discount" style="font-size:10px;color:var(--text-secondary)">
                Maks. {{ formatRp(row.max_discount) }}
              </div>
            </div>
          </template>
        </el-table-column>

        <!-- Berlaku -->
        <el-table-column label="BERLAKU" width="180" v-if="!isTablet && !isMobile">
          <template #default="{ row }">
            <div style="font-size:12px">
              <div>{{ formatDate(row.start_date) }}</div>
              <div style="color:var(--text-secondary)">
                {{ row.end_date ? '– ' + formatDate(row.end_date) : '– Tanpa batas' }}
              </div>
            </div>
          </template>
        </el-table-column>

        <!-- Penggunaan -->
        <el-table-column label="PENGGUNAAN" width="140" v-if="!isTablet && !isMobile">
          <template #default="{ row }">
            <div style="font-size:12px">
              <span style="font-weight:600;color:var(--color-primary)">{{ row.used_count }}</span>
              <span style="color:var(--text-secondary)"> / {{ row.total_members }} member</span>
            </div>
          </template>
        </el-table-column>

        <!-- Terkirim -->
        <el-table-column label="TERKIRIM" width="110" v-if="!isTablet && !isMobile">
          <template #default="{ row }">
            <div style="display:flex;align-items:center;gap:4px;font-size:12px">
              <span style="font-weight:600">{{ row.total_sent || 0 }}</span>
              <span v-if="row.send_channel" style="color:var(--text-secondary)">
                <el-icon v-if="row.send_channel === 'email' || row.send_channel === 'all'" size="12"><Message /></el-icon>
                <el-icon v-if="row.send_channel === 'whatsapp' || row.send_channel === 'all'" size="12"><ChatDotRound /></el-icon>
              </span>
            </div>
          </template>
        </el-table-column>

        <!-- Status -->
        <el-table-column label="STATUS" width="110">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.status)" size="small">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- Aksi -->
        <el-table-column label="AKSI" width="110" fixed="right">
          <template #default="{ row }">
            <div style="display:flex;gap:4px">
              <el-tooltip content="Detail" placement="top">
                <el-button size="small" circle plain @click="viewDetail(row)">
                  <el-icon><View /></el-icon>
                </el-button>
              </el-tooltip>
              <el-tooltip v-if="can('promotion.edit')" content="Edit" placement="top">
                <el-button size="small" circle plain @click="openForm(row)">
                  <el-icon><Edit /></el-icon>
                </el-button>
              </el-tooltip>
              <el-tooltip v-if="can('promotion.edit')" content="Hapus" placement="top">
                <el-button size="small" circle plain type="danger" @click="handleDelete(row)">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- Pagination -->
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:14px;padding-top:10px;border-top:1px solid var(--border-color)">
        <span style="font-size:12px;color:var(--text-secondary)">
          Menampilkan {{ voucherList.length }} dari {{ total }} data
        </span>
        <el-pagination
          v-model:current-page="filters.page"
          v-model:page-size="filters.per_page"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="sizes, prev, pager, next"
          @size-change="fetchVouchers"
          @current-change="fetchVouchers"
        />
      </div>
      </div>
    </el-card>

    <!-- ════════════════════════════════════════════════════════
         DRAWER: Create / Edit Voucher
    ════════════════════════════════════════════════════════ -->
    <el-drawer
      v-model="formVisible"
      :title="editingVoucher ? 'Edit Voucher' : 'Buat Voucher Baru'"
      direction="rtl"
      :size="isMobile ? '100%' : '480px'"
      :destroy-on-close="true"
    >
      <div style="padding:0 4px">
        <el-form :model="form" :rules="formRules" ref="formRef" label-position="top">

          <!-- Nama -->
          <el-form-item label="Nama Voucher *" prop="name">
            <el-input v-model="form.name" placeholder="Contoh: Diskon VIP 10%"
              @blur="autoGenerateCode" />
          </el-form-item>

          <!-- Kode -->
          <el-form-item label="Kode Voucher *" prop="code">
            <div style="display:flex;gap:8px;width:100%">
              <el-input
                v-model="form.code"
                placeholder="VIP10"
                style="flex:1"
                @input="form.code = form.code.toUpperCase()"
              />
              <el-button @click="handleGenerateCode" :loading="generatingCode">
                <el-icon><MagicStick /></el-icon> Generate
              </el-button>
            </div>
          </el-form-item>

          <!-- Deskripsi -->
          <el-form-item label="Deskripsi (Opsional)">
            <el-input v-model="form.description" type="textarea" :rows="2"
              placeholder="Deskripsi singkat voucher..." maxlength="150" show-word-limit />
          </el-form-item>

          <!-- Masa Berlaku -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
            <el-form-item label="Tanggal Mulai *" prop="start_date">
              <el-date-picker v-model="form.start_date" type="date"
                value-format="YYYY-MM-DD" style="width:100%" />
            </el-form-item>
            <el-form-item label="Tanggal Berakhir">
              <el-date-picker v-model="form.end_date" type="date"
                value-format="YYYY-MM-DD" style="width:100%"
                :disabled="form.no_end_date" placeholder="Pilih tanggal" />
            </el-form-item>
          </div>
          <el-checkbox
            v-model="form.no_end_date"
            @change="(v) => { if (v) form.end_date = '' }"
            style="margin-top:-8px;margin-bottom:12px"
          >
            Tanpa Tanggal Berakhir
          </el-checkbox>

          <!-- Jenis Voucher -->
          <el-form-item label="Jenis Voucher *" prop="type">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
              <div class="type-option" :class="{ active: form.type === 'booking' || form.type === 'both' }"
                @click="form.type = form.type === 'both' ? 'play_credits' : (form.type === 'play_credits' ? 'both' : 'booking')">
                <el-icon><Calendar /></el-icon>
                <div>
                  <div style="font-weight:600;font-size:12px">Booking Ruangan</div>
                  <div style="font-size:10px;color:var(--text-secondary)">Diskon sewa ruangan</div>
                </div>
              </div>
              <div class="type-option" :class="{ active: form.type === 'play_credits' || form.type === 'both' }"
                @click="form.type = form.type === 'both' ? 'booking' : (form.type === 'booking' ? 'both' : 'play_credits')">
                <el-icon><Coin /></el-icon>
                <div>
                  <div style="font-weight:600;font-size:12px">Play Credits</div>
                  <div style="font-size:10px;color:var(--text-secondary)">Diskon beli credits</div>
                </div>
              </div>
            </div>
            <div style="font-size:11px;color:var(--text-muted);margin-top:6px">
              Aktifkan keduanya untuk voucher yang berlaku di booking dan play credits
            </div>
          </el-form-item>

          <!-- Diskon -->
          <el-form-item label="Tipe Diskon *" prop="discount_type">
            <el-radio-group v-model="form.discount_type" style="display:flex;gap:16px">
              <el-radio label="percentage">Persentase (%)</el-radio>
              <el-radio label="nominal">Nominal (Rp)</el-radio>
            </el-radio-group>
          </el-form-item>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
            <el-form-item
              :label="form.discount_type === 'percentage' ? 'Nilai Diskon (%)' : 'Nilai Diskon (Rp)'"
              prop="discount_value"
            >
              <el-input-number
                v-model="form.discount_value"
                :min="0"
                :max="form.discount_type === 'percentage' ? 100 : undefined"
                style="width:100%"
              />
            </el-form-item>
            <el-form-item label="Maksimal Diskon (Rp)" v-if="form.discount_type === 'percentage'">
              <el-input-number
                v-model="form.max_discount"
                :min="0" style="width:100%"
                :formatter="v => v ? `Rp ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : ''"
                :parser="v => v.replace(/Rp\s?|(\.*)/g, '')"
              />
            </el-form-item>
            <el-form-item label="Minimum Pembelian (Rp)" v-else>
              <el-input-number
                v-model="form.min_purchase"
                :min="0" style="width:100%"
                :formatter="v => v ? `Rp ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : ''"
                :parser="v => v.replace(/Rp\s?|(\.*)/g, '')"
              />
            </el-form-item>
          </div>

          <el-form-item v-if="form.discount_type === 'percentage'" label="Minimum Pembelian (Rp)">
            <el-input-number
              v-model="form.min_purchase"
              :min="0" style="width:100%"
              :formatter="v => v ? `Rp ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : ''"
              :parser="v => v.replace(/Rp\s?|(\.*)/g, '')"
            />
          </el-form-item>

          <!-- Cabang -->
          <el-form-item label="Cabang yang Berlaku *">
            <el-checkbox
              v-model="form.is_all_stores"
              @change="(v) => { if (v) form.store_ids = [] }"
              style="margin-bottom:8px"
            >Semua Cabang</el-checkbox>
            <el-select
              v-if="!form.is_all_stores"
              v-model="form.store_ids"
              multiple
              placeholder="Pilih cabang"
              style="width:100%"
            >
              <el-option v-for="s in allStores" :key="s.id" :label="s.name" :value="s.id" />
            </el-select>
          </el-form-item>

          <!-- Target Ruangan -->
          <el-form-item label="Target Ruangan">
            <el-radio-group v-model="form.is_all_room_types" style="display:flex;gap:16px;margin-bottom:8px"
              @change="() => { if (form.is_all_room_types) voucherRoomTemplateIds.value = [] }">
              <el-radio :label="true">Semua Ruangan</el-radio>
              <el-radio :label="false">Ruangan Tertentu</el-radio>
            </el-radio-group>
            <div v-if="!form.is_all_room_types" class="room-type-grid">
              <el-checkbox-group v-model="voucherRoomTemplateIds">
                <el-checkbox
                  v-for="rt in roomTemplates"
                  :key="rt.id"
                  :label="rt.id"
                  class="room-type-checkbox"
                >{{ rt.name }}</el-checkbox>
              </el-checkbox-group>
              <div v-if="!roomTemplates.length" style="font-size:12px;color:var(--text-muted);padding:6px 0">
                Tidak ada tipe ruangan tersedia
              </div>
            </div>
            <div class="recipient-preview" v-if="loadingRecipient">
              <el-icon size="12"><Loading /></el-icon>
              <span>Menghitung member yang memenuhi syarat...</span>
            </div>
            <div class="recipient-preview" v-else-if="recipientCount !== null">
              <el-icon size="12"><UserFilled /></el-icon>
              <span>
                <strong>{{ recipientCount }}</strong> member yang memenuhi syarat
              </span>
            </div>
          </el-form-item>

          <!-- Channel Pengiriman (hanya saat create) -->
          <el-form-item v-if="!editingVoucher" label="Kirim Notifikasi ke Member">
            <div class="channel-grid">
              <div class="channel-option" :class="{ active: form.send_channel === 'email' }"
                @click="form.send_channel = form.send_channel === 'email' ? '' : 'email'">
                <el-icon size="18"><Message /></el-icon>
                <span>Email</span>
              </div>
              <div class="channel-option" :class="{ active: form.send_channel === 'whatsapp' }"
                @click="form.send_channel = form.send_channel === 'whatsapp' ? '' : 'whatsapp'">
                <el-icon size="18"><ChatDotRound /></el-icon>
                <span>WhatsApp</span>
              </div>
              <div class="channel-option" :class="{ active: form.send_channel === 'all' }"
                @click="form.send_channel = form.send_channel === 'all' ? '' : 'all'">
                <el-icon size="18"><Promotion /></el-icon>
                <span>Semua</span>
              </div>
            </div>
            <div
              v-if="!form.send_channel"
              style="font-size:11px;color:var(--text-muted);margin-top:6px;display:flex;align-items:center;gap:4px"
            >
              <el-icon size="12"><InfoFilled /></el-icon>
              Tidak dipilih = voucher dibuat tanpa mengirim notifikasi
            </div>
            <div
              v-else
              style="font-size:11px;color:var(--color-success);margin-top:6px;display:flex;align-items:center;gap:4px"
            >
              <el-icon size="12"><CircleCheck /></el-icon>
              Notifikasi akan dikirim ke semua member aktif saat voucher disimpan
            </div>
          </el-form-item>

          <!-- Status (edit only) -->
          <el-form-item v-if="editingVoucher" label="Status">
            <el-switch v-model="form.is_active" active-text="Aktif" inactive-text="Nonaktif" />
          </el-form-item>
        </el-form>

        <AuditTrail
          v-if="editingVoucher"
          :created-by="editingVoucher.created_by"
          :updated-by="editingVoucher.updated_by"
          :created-at="editingVoucher.created_at"
          :updated-at="editingVoucher.updated_at"
        />

        <!-- Footer -->
        <div style="display:flex;gap:10px;margin-top:20px;padding-top:16px;border-top:1px solid var(--border-color)">
          <el-button style="flex:1" @click="formVisible = false">Batal</el-button>
          <el-button type="primary" style="flex:1" :loading="formLoading" @click="handleSubmit">
            <el-icon><Check /></el-icon>
            {{ editingVoucher ? 'Simpan Perubahan' : (form.send_channel ? 'Simpan & Kirim' : 'Simpan Voucher') }}
          </el-button>
        </div>
      </div>
    </el-drawer>

    <!-- ════════════════════════════════════════════════════════
         DIALOG: Detail Voucher + Usage List
    ════════════════════════════════════════════════════════ -->
    <el-drawer v-model="detailVisible" title="Detail Voucher" direction="rtl" :size="isMobile ? '100%' : '540px'">
      <div v-if="selectedVoucher">

        <!-- Voucher Header Banner -->
        <div class="voucher-banner" :style="{ background: getBannerGradient(selectedVoucher.type) }">
          <div>
            <div class="code-badge-lg">{{ selectedVoucher.code }}</div>
            <div style="font-size:18px;font-weight:800;color:#fff;margin-top:8px">{{ selectedVoucher.name }}</div>
            <div v-if="selectedVoucher.description" style="font-size:12px;color:rgba(255,255,255,0.7);margin-top:4px">
              {{ selectedVoucher.description }}
            </div>
          </div>
          <div style="text-align:right">
            <div style="font-size:28px;font-weight:900;color:#fff">
              {{ selectedVoucher.discount_type === 'percentage'
                ? selectedVoucher.discount_value + '%'
                : formatRp(selectedVoucher.discount_value) }}
            </div>
            <div style="font-size:11px;color:rgba(255,255,255,0.65)">
              {{ selectedVoucher.discount_type === 'percentage' ? 'Diskon' : 'Potongan' }}
            </div>
            <el-tag :type="getStatusTag(selectedVoucher.status)" size="small" style="margin-top:6px">
              {{ getStatusLabel(selectedVoucher.status) }}
            </el-tag>
          </div>
        </div>

        <!-- Info Grid -->
        <div class="detail-grid">
          <div class="detail-row">
            <span>Jenis</span>
            <el-tag :type="getTypeTag(selectedVoucher.type)" size="small">
              {{ getTypeLabel(selectedVoucher.type) }}
            </el-tag>
          </div>
          <div class="detail-row" v-if="selectedVoucher.discount_type === 'percentage' && selectedVoucher.max_discount">
            <span>Maks. Diskon</span><strong>{{ formatRp(selectedVoucher.max_discount) }}</strong>
          </div>
          <div class="detail-row" v-if="selectedVoucher.min_purchase">
            <span>Min. Pembelian</span><strong>{{ formatRp(selectedVoucher.min_purchase) }}</strong>
          </div>
          <div class="detail-row">
            <span>Masa Berlaku</span>
            <span>
              {{ formatDate(selectedVoucher.start_date) }} –
              {{ selectedVoucher.end_date ? formatDate(selectedVoucher.end_date) : 'Tanpa batas' }}
            </span>
          </div>
          <div class="detail-row">
            <span>Cabang</span>
            <span v-if="selectedVoucher.is_all_stores" style="color:var(--color-primary-light)">Semua Cabang</span>
            <span v-else>{{ selectedVoucher.stores?.map(s => s.store?.name).join(', ') || '-' }}</span>
          </div>
          <div class="detail-row">
            <span>Target Ruangan</span>
            <span v-if="selectedVoucher.is_all_room_types" style="color:var(--color-primary-light)">Semua Ruangan</span>
            <span v-else>{{ selectedVoucher.room_templates?.map(rt => rt.name).join(', ') || '-' }}</span>
          </div>
          <div class="detail-row">
            <span>Penggunaan</span>
            <span>
              <strong style="color:var(--color-primary)">{{ selectedVoucher.used_count }}</strong>
              <span style="color:var(--text-secondary)"> / {{ selectedVoucher.total_members }} member</span>
            </span>
          </div>
          <div class="detail-row">
            <span>Terkirim</span><span>{{ selectedVoucher.total_sent || 0 }} member</span>
          </div>
        </div>

        <!-- Usage list -->
        <div style="margin-top:16px" v-if="selectedVoucher.usages?.length">
          <div style="font-size:13px;font-weight:700;margin-bottom:10px;color:var(--text-primary)">
            Riwayat Penggunaan ({{ selectedVoucher.usages.length }})
          </div>
          <el-table :data="selectedVoucher.usages.slice(0, 5)" size="small" max-height="200">
            <el-table-column label="Customer" min-width="140">
              <template #default="{ row }">{{ row.customer?.name || '-' }}</template>
            </el-table-column>
            <el-table-column label="Diskon" width="120">
              <template #default="{ row }">{{ formatRp(row.discount_amount) }}</template>
            </el-table-column>
            <el-table-column label="Digunakan" width="160">
              <template #default="{ row }">{{ formatDateTime(row.used_at) }}</template>
            </el-table-column>
          </el-table>
        </div>
        <div v-else style="text-align:center;padding:20px;color:var(--text-muted);font-size:13px">
          Belum ada yang menggunakan voucher ini
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { usePermission } from '@/composables/usePermission'
import { useBreakpoint } from '@/composables/useBreakpoint'
import { ElMessage, ElMessageBox } from 'element-plus'
import AuditTrail from '@/components/AuditTrail.vue'
import {
  getVouchers, getVoucherById, generateCode,
  createVoucher, updateVoucher, deleteVoucher,
  getVoucherRecipientCount
} from '@/api/voucher/voucherApi'
import { getStores } from '@/api/store/storeApi'
import { getRoomTemplates } from '@/api/room_template/roomTemplateApi'

const { can } = usePermission()
const { isMobile, isTablet } = useBreakpoint()

// ── State ─────────────────────────────────────────────────────
const loading = ref(false)
const voucherList = ref([])
const total = ref(0)
const stats = reactive({ total_voucher: 0, total_sent: 0, total_used: 0, total_discount: 0 })
const allStores = ref([])
const roomTemplates = ref([])
const recipientCount = ref(null)
const loadingRecipient = ref(false)

const filters = reactive({ search: '', status: null, type: null, page: 1, per_page: 10 })

const formVisible = ref(false)
const formLoading = ref(false)
const generatingCode = ref(false)
const formRef = ref()
const editingVoucher = ref(null)

const detailVisible = ref(false)
const selectedVoucher = ref(null)

// Standalone ref for room_template_ids — el-checkbox-group v-model is more reliable with ref()
const voucherRoomTemplateIds = ref([])

const form = reactive({
  name: '', code: '', description: '', type: 'booking',
  discount_type: 'percentage', discount_value: 10,
  max_discount: 0, min_purchase: 0,
  start_date: '', end_date: '', no_end_date: false,
  send_channel: '', is_all_stores: true, store_ids: [],
  is_all_room_types: true,
  is_active: true,
})

const formRules = {
  name: [{ required: true, message: 'Nama voucher wajib diisi', trigger: 'blur' }],
  code: [{ required: true, message: 'Kode voucher wajib diisi', trigger: 'blur' }],
  type: [{ required: true, message: 'Jenis voucher wajib dipilih', trigger: 'change' }],
  discount_type: [{ required: true, message: 'Tipe diskon wajib dipilih', trigger: 'change' }],
  discount_value: [{ required: true, type: 'number', min: 0, message: 'Nilai diskon wajib diisi', trigger: 'blur' }],
  start_date: [{ required: true, message: 'Tanggal mulai wajib diisi', trigger: 'change' }],
}

// ── Room Templates ────────────────────────────────────────────
const fetchRoomTemplates = async () => {
  try {
    const { data } = await getRoomTemplates({ per_page: 100 })
    roomTemplates.value = data.data || []
  } catch {}
}

// ── Recipient Count Preview ────────────────────────────────────
const fetchRecipientCount = async () => {
  if (!formVisible.value) return
  loadingRecipient.value = true
  recipientCount.value = null
  try {
    const params = {
      is_all_room_types: form.is_all_room_types,
      room_template_ids: form.is_all_room_types ? [] : voucherRoomTemplateIds.value,
    }
    const { data } = await getVoucherRecipientCount(params)
    recipientCount.value = data.data?.count ?? data.count ?? null
  } catch { recipientCount.value = null }
  finally { loadingRecipient.value = false }
}

watch([() => form.is_all_room_types, voucherRoomTemplateIds], () => {
  if (formVisible.value) fetchRecipientCount()
}, { deep: true })

// ── Debounce ──────────────────────────────────────────────────
let debounceTimer = null
const debounceSearch = () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => { filters.page = 1; fetchVouchers() }, 400)
}

// ── Fetch ─────────────────────────────────────────────────────
const fetchVouchers = async () => {
  loading.value = true
  try {
    const { data } = await getVouchers({ ...filters })
    voucherList.value = data.data || []
    total.value = data.meta?.total || 0
    if (data.stats) Object.assign(stats, data.stats)
  } catch { voucherList.value = [] }
  finally { loading.value = false }
}

const resetFilters = () => {
  Object.assign(filters, { search: '', status: null, type: null, page: 1 })
  fetchVouchers()
}

// ── Form ──────────────────────────────────────────────────────
const openForm = (voucher) => {
  editingVoucher.value = voucher
  Object.assign(form, {
    name: voucher?.name || '',
    code: voucher?.code || '',
    description: voucher?.description || '',
    type: voucher?.type || 'booking',
    discount_type: voucher?.discount_type || 'percentage',
    discount_value: Number(voucher?.discount_value) || 10,
    max_discount: Number(voucher?.max_discount) || 0,
    min_purchase: Number(voucher?.min_purchase) || 0,
    start_date: voucher?.start_date?.split('T')[0] || '',
    end_date: voucher?.end_date?.split('T')[0] || '',
    no_end_date: !voucher?.end_date,
    send_channel: '',
    is_all_stores: voucher?.is_all_stores ?? true,
    store_ids: voucher?.stores?.map(s => s.store_id) || [],
    is_all_room_types: voucher?.is_all_room_types ?? true,
    is_active: voucher?.is_active ?? true,
  })
  voucherRoomTemplateIds.value = voucher?.room_templates?.map(rt => rt.id) || []
  recipientCount.value = null
  formVisible.value = true
}

const autoGenerateCode = async () => {
  if (!editingVoucher.value && form.name && !form.code) {
    await handleGenerateCode()
  }
}

const handleGenerateCode = async () => {
  generatingCode.value = true
  try {
    const { data } = await generateCode(form.name)
    form.code = data.data?.code || data.code || ''
  } catch {}
  finally { generatingCode.value = false }
}

const handleSubmit = async () => {
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    formLoading.value = true
    try {
      const payload = {
        ...form,
        end_date: form.no_end_date ? null : form.end_date,
        room_template_ids: form.is_all_room_types ? [] : voucherRoomTemplateIds.value,
      }
      if (editingVoucher.value) {
        await updateVoucher(editingVoucher.value.id, payload)
        ElMessage.success('Voucher berhasil diupdate')
      } else {
        await createVoucher(payload)
        ElMessage.success(
          form.send_channel
            ? 'Voucher berhasil dibuat dan sedang dikirim ke member!'
            : 'Voucher berhasil dibuat'
        )
      }
      formVisible.value = false
      fetchVouchers()
    } catch (e) {
      ElMessage.error(e?.response?.data?.message || 'Gagal menyimpan voucher')
    } finally { formLoading.value = false }
  })
}

const viewDetail = async (row) => {
  try {
    const { data } = await getVoucherById(row.id)
    selectedVoucher.value = data.data
    detailVisible.value = true
  } catch { ElMessage.error('Gagal memuat detail voucher') }
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `Hapus voucher "${row.name}" (${row.code})?`,
      'Konfirmasi',
      { type: 'warning', confirmButtonText: 'Hapus', cancelButtonText: 'Batal' }
    )
    await deleteVoucher(row.id)
    ElMessage.success('Voucher berhasil dihapus')
    fetchVouchers()
  } catch {}
}

// ── Helpers ───────────────────────────────────────────────────
const formatRp = (v) => `Rp ${(v || 0).toLocaleString('id-ID')}`
const formatDate = (d) => d
  ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
  : '-'
const formatDateTime = (d) => d
  ? new Date(d).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  : '-'

const getCodeColor = (type) => ({
  booking:     'rgba(2,130,222,0.15)',
  play_credits:'rgba(16,185,129,0.15)',
  both:        'rgba(245,158,11,0.15)',
}[type] || 'rgba(2,130,222,0.15)')

const getBannerGradient = (type) => ({
  booking:     'linear-gradient(135deg,#0282DE,#0262b0)',
  play_credits:'linear-gradient(135deg,#059669,#047857)',
  both:        'linear-gradient(135deg,#d97706,#b45309)',
}[type] || 'linear-gradient(135deg,#0282DE,#0262b0)')

const getTypeLabel = (t) => ({
  booking:      'Booking',
  play_credits: 'Play Credits',
  both:         'Booking + Credits',
}[t] || t)

const getTypeTag = (t) => ({
  booking:      '',
  play_credits: 'success',
  both:         'warning',
}[t] || 'info')

const getStatusLabel = (s) => ({
  active:   'Aktif',
  expired:  'Kadaluwarsa',
  inactive: 'Nonaktif',
}[s] || s)

const getStatusTag = (s) => ({
  active:   'success',
  expired:  'danger',
  inactive: 'info',
}[s] || 'info')

onMounted(async () => {
  fetchVouchers()
  fetchRoomTemplates()
  try {
    const { data } = await getStores({ per_page: 100, status: 'active' })
    allStores.value = data.data || []
  } catch {}
})
</script>

<style scoped>
/* ── Header ──────────────────────────────────────────── */
.page-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:14px; }
.breadcrumb  { font-size:11px; color:var(--text-muted); font-weight:500; margin-bottom:3px; letter-spacing:0.3px; }
.page-title  { font-size:20px; font-weight:800; color:var(--text-primary); letter-spacing:-0.3px; }
.page-desc   { font-size:12px; color:var(--text-secondary); font-weight:500; margin-top:3px; }

/* ── Stats ───────────────────────────────────────────── */
.stats-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:0; }
.stat-card :deep(.el-card__body) {
  display:flex; align-items:center; gap:14px; padding:16px 18px !important;
}
.stat-icon {
  width:44px; height:44px; border-radius:11px;
  display:flex; align-items:center; justify-content:center; flex-shrink:0;
}
.stat-value { font-size:24px; font-weight:800; color:var(--text-primary); line-height:1.15; }
.stat-label { font-size:12px; font-weight:700; color:var(--text-primary); margin-top:3px; }
.stat-sub   { font-size:11px; font-weight:500; color:var(--text-secondary); margin-top:1px; }

/* ── Code badge (table) ──────────────────────────────── */
.code-badge {
  display:inline-flex; align-items:center; justify-content:center;
  padding:4px 10px; border-radius:6px;
  font-size:11.5px; font-weight:800; font-family:monospace; letter-spacing:0.7px;
  color:var(--text-primary); white-space:nowrap; flex-shrink:0;
  border: 1px solid rgba(124,58,237,0.2);
}

/* ── Type option cards (drawer) ──────────────────────── */
.type-option {
  display:flex; align-items:center; gap:9px;
  padding:11px 13px; border:1.5px solid var(--border-color);
  border-radius:9px; cursor:pointer; transition:all 0.2s;
  font-size:12.5px; font-weight:600; color:var(--text-secondary);
}
.type-option:hover {
  border-color:var(--color-primary);
  background:rgba(124,58,237,0.07);
  color:var(--text-primary);
}
.type-option.active {
  border-color:var(--color-primary);
  background: rgba(124,58,237,0.12);
  color: var(--color-primary-light);
  font-weight:700;
}

/* ── Channel grid (drawer) ───────────────────────────── */
.channel-grid { display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; }
.channel-option {
  display:flex; align-items:center; justify-content:center; gap:7px;
  padding:11px; border:1.5px solid var(--border-color);
  border-radius:9px; cursor:pointer;
  font-size:12.5px; font-weight:600; color:var(--text-secondary);
  transition:all 0.2s;
}
.channel-option:hover {
  border-color:var(--color-primary);
  background:rgba(124,58,237,0.07);
  color:var(--text-primary);
}
.channel-option.active {
  border-color:var(--color-primary);
  background:rgba(124,58,237,0.14);
  color:var(--color-primary-light);
  font-weight:700;
}

/* ── Detail dialog ───────────────────────────────────── */
.voucher-banner {
  border-radius:12px; padding:20px 22px;
  display:flex; justify-content:space-between; align-items:center;
  margin-bottom:18px;
  box-shadow: 0 6px 24px rgba(0,0,0,0.2);
}
.code-badge-lg {
  display:inline-block; padding:5px 14px; border-radius:6px;
  background:rgba(255,255,255,0.22); color:#fff;
  font-size:14px; font-weight:900; font-family:monospace; letter-spacing:1.5px;
}
.detail-grid { display:flex; flex-direction:column; }
.detail-row {
  display:flex; justify-content:space-between; align-items:center;
  padding:9px 0; border-bottom:1px solid var(--border-color);
  gap: 10px;
}
.detail-row > span:first-child {
  color:var(--text-secondary); font-size:12px; font-weight:600; flex-shrink:0;
}
.detail-row > span:last-child,
.detail-row > strong {
  color:var(--text-primary); font-size:13px; font-weight:600; text-align:right;
}

/* ── Room type targeting ─────────────────────────────────── */
.room-type-grid {
  width:100%; margin-bottom:6px;
}
.room-type-grid :deep(.el-checkbox-group) {
  display:flex; flex-wrap:wrap; gap:6px;
}
.room-type-checkbox :deep(.el-checkbox__label) {
  font-size:12.5px; font-weight:600;
}
.room-type-checkbox {
  border:1.5px solid var(--border-color); border-radius:8px;
  padding:7px 12px; margin:0 !important;
  transition:all 0.18s;
}
.room-type-checkbox:hover {
  border-color:var(--color-primary);
  background:rgba(124,58,237,0.06);
}
.room-type-checkbox.is-checked {
  border-color:var(--color-primary);
  background:rgba(124,58,237,0.12);
}
.recipient-preview {
  display:flex; align-items:center; gap:6px;
  margin-top:8px; padding:8px 12px;
  background:rgba(124,58,237,0.08);
  border:1px solid rgba(124,58,237,0.2);
  border-radius:8px;
  font-size:12px; font-weight:600;
  color:var(--color-primary-light);
}
.recipient-preview strong { font-size:13px; color:var(--color-primary); }

/* Responsive */
@media (max-width:639px) { .table-wrap { display:none; } }
@media (min-width:640px) { .m-card-list { display:none; } }
@media (max-width:639px) { .stats-grid { grid-template-columns:1fr 1fr !important; } }
/* Mobile card list */
.m-card-list { display:flex; flex-direction:column; gap:8px; margin-bottom:8px; }
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
