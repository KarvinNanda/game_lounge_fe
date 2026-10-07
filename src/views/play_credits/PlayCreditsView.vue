<template>
  <div>
    <!-- Header -->
    <PageHeader breadcrumb="Dashboard > Play Credits" title="Play Credits" />

    <!-- 2 Tabs -->
    <el-tabs v-model="activeTab" type="card" @tab-change="onTabChange">

      <!-- ════════════════════════════════════════════════════════
           TAB 1: Play Credits Package
      ════════════════════════════════════════════════════════ -->
      <el-tab-pane name="packages">
        <template #label>
          <span><el-icon><Coin /></el-icon> Play Credits Package</span>
        </template>

        <div class="u-mt-4">
          <!-- Header Tab -->
          <div class="detail-head">
            <div>
              <h3 class="detail-name">Play Credits Package</h3>
              <p class="u-text-xs u-text-secondary">Kelola paket play credits yang tersedia untuk dijual</p>
            </div>
            <el-button v-if="can('play_credits.create')" type="primary" @click="openPackageForm(null)">
              <el-icon><Plus /></el-icon> Create New Package
            </el-button>
          </div>

          <!-- Filter -->
          <div class="summary-row">
            <el-input class="filter-search" v-model="pkgFilter.search" placeholder="Search package name..." prefix-icon="Search"
              clearable @input="debouncePkg" />
            <el-select class="filter-w150" v-model="pkgFilter.status" placeholder="Semua Status" clearable @change="applyPkgFilters">
              <el-option label="Aktif" value="active" />
              <el-option label="Nonaktif" value="inactive" />
            </el-select>
          </div>

          <!-- Package Table -->
          <el-card shadow="never">
            <div v-if="isMobile" class="m-card-list u-mb-3">
              <div class="m-card" v-for="row in packageList" :key="row.id">
                <div class="m-card-icon">
                  <img class="img-40-cover" v-if="row.icon_url" :src="getImageUrl(row.icon_url)" />
                  <el-icon v-else size="18" class="u-text-action"><Coin /></el-icon>
                </div>
                <div class="m-card-body">
                  <div class="m-card-title">{{ row.name }}</div>
                  <div class="m-card-meta">{{ row.total_hours }} Jam · {{ formatRp(row.price) }}</div>
                </div>
                <div class="m-card-end">
                  <el-tag :type="row.is_active ? 'success' : 'danger'" size="small">{{ row.is_active ? 'Aktif' : 'Nonaktif' }}</el-tag>
                  <div class="m-card-actions">
                    <el-button v-if="can('play_credits.edit')" size="small" circle plain @click="openPackageForm(row)"><el-icon><Edit /></el-icon></el-button>
                    <el-button v-if="can('play_credits.edit')" size="small" circle plain type="danger" @click="handleDeletePackage(row)"><el-icon><Delete /></el-icon></el-button>
                  </div>
                </div>
              </div>
            </div>

            <div class="table-wrap">
            <el-table :data="packageList" v-loading="pkgLoading" size="small" class="u-w-full">

              <el-table-column label="NAMA PAKET" min-width="220">
                <template #default="{ row }">
                  <div class="u-flex u-gap-3">
                    <div class="pkg-icon-wrap">
                      <img class="img-44-cover" v-if="row.icon_url" :src="getImageUrl(row.icon_url)"
                        />
                      <div v-else class="pkg-icon-placeholder img-44"><el-icon size="20"><Coin /></el-icon></div>
                    </div>
                    <div>
                      <div class="u-fw-semibold u-text-sm">{{ row.name }}</div>
                      <div class="u-text-xs u-text-secondary">{{ row.description || '-' }}</div>
                    </div>
                  </div>
                </template>
              </el-table-column>

              <el-table-column label="TOTAL JAM" width="110">
                <template #default="{ row }">
                  <span class="u-fw-semibold">{{ row.total_hours }} Jam</span>
                </template>
              </el-table-column>

              <el-table-column label="CABANG BERLAKU" min-width="180" v-if="!isTablet && !isMobile">
                <template #default="{ row }">
                  <span v-if="row.apply_to_all_stores" class="u-text-xs u-text-secondary">Semua Cabang</span>
                  <span v-else class="u-text-xs">
                    {{ row.package_stores?.map(s => s.store?.name).join(', ') || '-' }}
                  </span>
                </template>
              </el-table-column>

              <el-table-column label="HARGA" width="130">
                <template #default="{ row }">
                  <span class="u-fw-semibold u-text-action">{{ formatRp(row.price) }}</span>
                </template>
              </el-table-column>

              <el-table-column label="MASA BERLAKU" width="120" v-if="!isTablet && !isMobile">
                <template #default="{ row }">{{ row.validity_days }} Hari</template>
              </el-table-column>

              <el-table-column label="STATUS" width="100">
                <template #default="{ row }">
                  <el-tag :type="row.is_active ? 'success' : 'danger'" size="small">
                    {{ row.is_active ? 'Aktif' : 'Nonaktif' }}
                  </el-tag>
                </template>
              </el-table-column>

              <el-table-column label="AKSI" width="90" fixed="right">
                <template #default="{ row }">
                  <div class="row-gap-sm">
                    <el-button v-if="can('play_credits.edit')" size="small" circle plain @click="openPackageForm(row)">
                      <el-icon><Edit /></el-icon>
                    </el-button>
                    <el-button v-if="can('play_credits.edit')" size="small" circle plain type="danger" @click="handleDeletePackage(row)">
                      <el-icon><Delete /></el-icon>
                    </el-button>
                  </div>
                </template>
              </el-table-column>
            </el-table>

            <div class="u-flex u-justify-between u-mt-3">
              <span class="u-text-xs u-text-secondary">
                Showing {{ packageList.length }} to {{ pkgTotal }} packages
              </span>
              <TablePagination v-model:page="pkgFilter.page" :page-size="pkgFilter.per_page" :total="pkgTotal" :sizes="false" @change="fetchPackages" />
            </div>
            </div>
          </el-card>
        </div>
      </el-tab-pane>

      <!-- ════════════════════════════════════════════════════════
           TAB 2: Member Play Credits
      ════════════════════════════════════════════════════════ -->
      <el-tab-pane name="members">
        <template #label>
          <span><el-icon><User /></el-icon> Member Play Credits</span>
        </template>

        <div class="u-mt-4">
          <!-- Header Tab -->
          <div class="detail-head-tight">
            <div>
              <h3 class="detail-name-tight">Member Play Credits (Aktif)</h3>
              <p class="u-text-xs u-text-secondary">Daftar paket Play Credits aktif yang dimiliki member.</p>
            </div>
            <el-button v-if="can('play_credits.create')" type="primary" @click="openAssignDialog">
              <el-icon><Plus /></el-icon> Assign Credits
            </el-button>
          </div>

          <!-- Info -->
          <div class="info-box u-mb-3">
            <el-icon><InfoFilled /></el-icon>
            Menampilkan paket yang masih aktif dan belum kedaluwarsa.
          </div>

          <!-- Filters -->
          <div class="filter-row">
            <el-input class="filter-w200" v-model="memberFilter.search" placeholder="Search nama member..."
              prefix-icon="Search" clearable @input="debounceMembers" />
            <el-select class="filter-w150" v-model="memberFilter.package_id" placeholder="Semua Paket" clearable @change="applyMemberFilters">
              <el-option v-for="p in activePackages" :key="p.id" :label="p.name" :value="p.id" />
            </el-select>
            <el-select class="filter-w140" v-model="memberFilter.status" placeholder="Semua Status" clearable @change="applyMemberFilters">
              <el-option label="Aktif" value="active" />
              <el-option label="Kadaluwarsa" value="expired" />
            </el-select>
            <el-input class="filter-w180" v-model="memberFilter.whatsapp" placeholder="No. WhatsApp"
              clearable @input="debounceMembers">
              <template #prepend><el-icon><Phone /></el-icon></template>
            </el-input>
            <el-button plain @click="resetMemberFilter"><el-icon><RefreshRight /></el-icon> Reset Filter</el-button>
          </div>

          <!-- Member Credits Table -->
          <el-card shadow="never">
            <div v-if="isMobile" class="m-card-list u-mb-3">
              <div class="m-card" v-for="row in memberCreditList" :key="row.id">
                <div class="m-card-icon m-card-avatar">
                  {{ row.customer?.name?.[0]?.toUpperCase() }}
                </div>
                <div class="m-card-body">
                  <div class="m-card-title">{{ row.customer?.name }}</div>
                  <div class="m-card-meta">{{ row.package?.name }} · {{ row.remaining_hours }} Jam sisa</div>
                </div>
                <div class="m-card-end">
                  <el-tag :type="row.is_expired ? 'danger' : 'success'" size="small">{{ row.is_expired ? 'Kadaluwarsa' : 'Aktif' }}</el-tag>
                  <el-button v-if="can('play_credits.edit')" size="small" circle plain @click="openEditCredit(row)"><el-icon><Edit /></el-icon></el-button>
                </div>
              </div>
            </div>

            <div class="table-wrap">
            <el-table :data="memberCreditList" v-loading="memberLoading" size="small" class="u-w-full">

              <!-- Member -->
              <el-table-column label="MEMBER" min-width="180">
                <template #default="{ row }">
                  <div class="u-flex u-gap-2">
                    <el-avatar :size="36" :src="row.customer?.avatar_url">
                      {{ row.customer?.name?.[0]?.toUpperCase() }}
                    </el-avatar>
                    <div>
                      <div class="u-flex u-gap-1">
                        <span class="u-fw-semibold u-text-sm">{{ row.customer?.name }}</span>
                        <el-tag size="small" type="warning">Member</el-tag>
                      </div>
                      <div class="u-text-xs u-text-success">
                        {{ row.customer?.whatsapp }}
                      </div>
                    </div>
                  </div>
                </template>
              </el-table-column>

              <!-- Paket -->
              <el-table-column label="PAKET" width="140">
                <template #default="{ row }">
                  <div class="u-flex u-gap-2">
                    <div class="pkg-icon-wrap img-28">
                      <img class="img-28-cover" v-if="row.package?.icon_url" :src="getImageUrl(row.package?.icon_url)"
                        />
                      <div v-else class="pkg-icon-placeholder avatar-28">
                        <el-icon><Coin /></el-icon>
                      </div>
                    </div>
                    <span class="pkg-meta">{{ row.package?.name }}</span>
                  </div>
                </template>
              </el-table-column>

              <!-- Total Jam -->
              <el-table-column label="TOTAL JAM" width="100">
                <template #default="{ row }">
                  <span class="u-text-xs">{{ row.total_hours }} Jam</span>
                </template>
              </el-table-column>

              <!-- Sisa Jam -->
              <el-table-column label="SISA JAM" width="100">
                <template #default="{ row }">
                  <span :style="{ color: getHoursColor(row.percent_used), fontWeight: 600, fontSize: '13px' }">
                    {{ row.remaining_hours }} Jam
                  </span>
                </template>
              </el-table-column>

              <!-- % Terpakai -->
              <el-table-column label="% TERPAKAI" width="130">
                <template #default="{ row }">
                  <div>
                    <div class="u-text-xs u-mb-1">{{ row.percent_used }}%</div>
                    <el-progress
                      :percentage="row.percent_used"
                      :color="getProgressColor(row.percent_used)"
                      :show-text="false"
                      :stroke-width="6"
                    />
                  </div>
                </template>
              </el-table-column>

              <!-- Masa Berlaku -->
              <el-table-column label="MASA BERLAKU" width="160">
                <template #default="{ row }">
                  <div class="u-text-xs">{{ formatDate(row.expires_at) }}</div>
                  <div :style="{ fontSize: '11px', color: row.days_left <= 3 ? 'var(--color-danger)' : 'var(--text-secondary)' }">
                    {{ row.is_expired ? 'Kadaluwarsa' : `(${row.days_left} hari lagi)` }}
                  </div>
                </template>
              </el-table-column>

              <!-- Cabang Berlaku -->
              <el-table-column label="CABANG BERLAKU" min-width="160">
                <template #default="{ row }">
                  <template v-if="row.package?.apply_to_all_stores">
                    <span class="u-text-xs u-text-secondary">Semua Cabang</span>
                  </template>
                  <template v-else>
                    <el-tag class="store-tag"
                      v-for="ps in row.package?.package_stores?.slice(0, 2)"
                      :key="ps.id" size="small"
                     
                    >{{ ps.store?.name }}</el-tag>
                    <el-tag v-if="row.package?.package_stores?.length > 2" size="small" type="info">
                      +{{ row.package.package_stores.length - 2 }}
                    </el-tag>
                  </template>
                </template>
              </el-table-column>

              <!-- Dibeli Pada -->
              <el-table-column label="DIBELI PADA" width="130">
                <template #default="{ row }">
                  <div class="u-text-xs">
                    <div>{{ formatDate(row.purchased_at) }}</div>
                    <div class="u-text-secondary">{{ formatTime(row.purchased_at) }} WIB</div>
                  </div>
                </template>
              </el-table-column>

              <!-- Aksi -->
              <el-table-column label="AKSI" width="70" fixed="right">
                <template #default="{ row }">
                  <el-button v-if="can('play_credits.edit')" size="small" circle plain @click="openEditCredit(row)">
                    <el-icon><Edit /></el-icon>
                  </el-button>
                </template>
              </el-table-column>
            </el-table>

            <div class="u-flex u-justify-between u-mt-3">
              <span class="u-text-xs u-text-secondary">
                Menampilkan {{ memberCreditList.length }} dari {{ memberTotal }} paket aktif
              </span>
              <TablePagination v-model:page="memberFilter.page" :page-size="memberFilter.per_page" :total="memberTotal" :sizes="false" @change="fetchMemberCredits" />
            </div>
            </div>
          </el-card>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- ════════════════════════════════════════════════════════
         DIALOG: Create / Edit Package
    ════════════════════════════════════════════════════════ -->
    <el-drawer
      v-model="packageFormVisible"
      :title="editingPackage ? 'Edit Package' : 'Create New Package'"
      direction="rtl"
      :size="isMobile ? '100%' : '760px'"
      :destroy-on-close="true"
    >
      <div :style="{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 280px', gap:'20px' }">
        <!-- Left: Form -->
        <el-form :model="pkgForm" :rules="pkgRules" ref="pkgFormRef" label-position="top">
          <!-- <el-form-item label="Icon / Photo">
            <div class="u-flex u-gap-3">
              <div class="pkg-icon-wrap img-72">
                <img class="img-72-cover" v-if="pkgIconPreview" :src="pkgIconPreview"
                  />
                <div v-else class="pkg-icon-placeholder img-72">
                  <el-icon size="24"><Coin /></el-icon>
                </div>
              </div>
              <div>
                <el-upload :auto-upload="false" :show-file-list="false" :on-change="onIconChange" accept="image/*">
                  <el-button plain><el-icon><UploadFilled /></el-icon> Upload Image</el-button>
                </el-upload>
                <div class="u-text-xs u-text-muted u-mt-1">
                  Disarankan ukuran 512x512px (1:1)
                </div>
              </div>
            </div>
          </el-form-item> -->

          <el-form-item label="Nama Paket *" prop="name">
            <el-input v-model="pkgForm.name" placeholder="Paket 10 Jam" />
          </el-form-item>

          <el-form-item label="Total Jam *" prop="total_hours">
            <el-input-number v-model="pkgForm.total_hours" :min="0.5" :step="0.5" class="u-w-full" />
          </el-form-item>

          <el-form-item label="Cabang yang Berlaku *">
            <div class="u-mb-2">
              <el-checkbox v-model="pkgForm.apply_to_all_stores" @change="(v) => { if (v) pkgForm.store_ids = [] }">
                Semua Cabang
              </el-checkbox>
            </div>
            <el-select
              v-if="!pkgForm.apply_to_all_stores"
              v-model="pkgForm.store_ids"
              multiple
              placeholder="Pilih cabang"
              class="u-w-full"
            >
              <el-option v-for="s in allStores" :key="s.id" :label="s.name" :value="s.id" />
            </el-select>
            <div class="u-text-xs u-text-muted u-mt-1">
              Paket hanya dapat digunakan di cabang yang dipilih
            </div>
          </el-form-item>

          <div :style="{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:'14px' }">
            <el-form-item label="Harga *" prop="price">
              <el-input-number
                v-model="pkgForm.price" :min="0" :step="10000" class="u-w-full"
                :formatter="v => `Rp ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')"
                :parser="v => v.replace(/Rp\s?|(\.*)/g, '')"
              />
            </el-form-item>
            <el-form-item label="Masa Berlaku *" prop="validity_days">
              <el-input-number v-model="pkgForm.validity_days" :min="1" class="u-w-full" />
            </el-form-item>
          </div>

          <el-form-item label="Deskripsi (Opsional)">
            <el-input v-model="pkgForm.description" type="textarea" :rows="3"
              placeholder="Deskripsi singkat paket..." maxlength="200" show-word-limit />
          </el-form-item>

          <el-form-item v-if="editingPackage" label="Status">
            <el-switch v-model="pkgForm.is_active" active-text="Aktif" inactive-text="Nonaktif" />
          </el-form-item>
        </el-form>

        <!-- Right: Preview -->
        <div>
          <h4 class="u-text-sm u-fw-bold u-mb-3">Preview Paket</h4>
          <div class="package-preview">
            <!-- <div class="pkg-icon-wrap img-64-spaced">
              <img class="img-64-cover" v-if="pkgIconPreview" :src="pkgIconPreview"
                />
              <div v-else class="pkg-icon-placeholder img-64">
                <el-icon size="20"><Coin /></el-icon>
              </div>
            </div> -->
            <div class="detail-title">
              {{ pkgForm.name || 'Nama Paket' }}
            </div>
            <el-tag size="small" class="u-mb-2">Play Credits Package</el-tag>
            <p class="u-text-xs u-text-secondary u-mb-3">
              {{ pkgForm.description || 'Deskripsi paket' }}
            </p>
            <div class="preview-row"><el-icon><Clock /></el-icon><span>Total Jam</span><span>{{ pkgForm.total_hours || 0 }} Jam</span></div>
            <div class="preview-row">
              <el-icon><Shop /></el-icon>
              <span>Cabang</span>
              <span v-if="pkgForm.apply_to_all_stores">Semua Cabang</span>
              <span v-else-if="pkgForm.store_ids?.length">{{ pkgForm.store_ids.length }} Cabang</span>
              <span v-else class="u-text-muted">-</span>
            </div>
            <div class="preview-row u-text-action">
              <el-icon><Money /></el-icon><span>Harga</span><strong>{{ formatRp(pkgForm.price) }}</strong>
            </div>
            <div class="preview-row"><el-icon><Calendar /></el-icon><span>Masa Berlaku</span><span>{{ pkgForm.validity_days || 0 }} Hari</span></div>
            <div class="note-box u-mt-2 u-text-xs">
              <el-icon><InfoFilled /></el-icon>
              Paket ini hanya dapat digunakan di cabang yang dipilih.
            </div>
          </div>
        </div>

        <AuditTrail
          v-if="editingPackage"
          :created-by="editingPackage.created_by"
          :updated-by="editingPackage.updated_by"
          :created-at="editingPackage.created_at"
          :updated-at="editingPackage.updated_at"
        />
      </div>

      <template #footer>
        <el-button @click="packageFormVisible = false">Batal</el-button>
        <el-button type="primary" :loading="pkgFormLoading" @click="handleSavePackage">
          <el-icon><Check /></el-icon> Konfirmasi {{ editingPackage ? 'Update' : 'Buat' }} Package
        </el-button>
      </template>
    </el-drawer>

    <!-- ════════════════════════════════════════════════════════
         DRAWER: Assign Credits ke Customer
    ════════════════════════════════════════════════════════ -->
    <el-drawer v-model="assignDialogVisible" title="Assign Play Credits ke Customer" direction="rtl" :size="isMobile ? '100%' : '440px'">
      <el-form :model="assignForm" :rules="assignRules" ref="assignFormRef" label-position="top">
        <el-form-item label="Customer (Member) *" prop="customer_id">
          <el-select
            v-model="assignForm.customer_id"
            filterable
            :loading="customerOptionsLoading"
            loading-text="Memuat daftar member..."
            placeholder="Pilih atau ketik nama member..."
            no-data-text="Tidak ada member ditemukan"
            class="u-w-full"
          >
            <el-option
              v-for="c in customerOptions"
              :key="c.id"
              :label="c.name"
              :value="c.id"
            >
              <div class="u-flex u-gap-2">
                <el-avatar class="tag-xs" :size="28">
                  {{ c.name?.[0]?.toUpperCase() }}
                </el-avatar>
                <div>
                  <div class="pkg-name">{{ c.name }}</div>
                  <div class="pkg-bonus">{{ c.whatsapp }}</div>
                </div>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="Paket *" prop="package_id">
          <el-select v-model="assignForm.package_id" placeholder="Pilih paket" class="u-w-full"
            @change="onPackageSelect">
            <el-option v-for="p in activePackages" :key="p.id"
              :label="`${p.name} — ${formatRp(p.price)} (${p.validity_days} hari)`" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="Jumlah Pembayaran">
          <div class="readonly-field">
            <span class="u-text-sm u-fw-bold u-text-action">
              {{ assignForm.payment_amount ? formatRp(assignForm.payment_amount) : '—' }}
            </span>
            <span class="u-text-xs u-text-muted">Mengikuti harga paket</span>
          </div>
        </el-form-item>
        <el-form-item label="Catatan">
          <el-input v-model="assignForm.notes" type="textarea" :rows="2" placeholder="Catatan opsional..." />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="assignDialogVisible = false">Batal</el-button>
        <el-button type="primary" :loading="assignLoading" @click="handleAssign">Assign Credits</el-button>
      </template>
    </el-drawer>

    <!-- ════════════════════════════════════════════════════════
         DRAWER: Edit Play Credits (slide from right)
    ════════════════════════════════════════════════════════ -->
    <el-drawer v-model="editCreditVisible" title="Edit Play Credits" direction="rtl" :size="isMobile ? '100%' : '380px'">
      <div class="drawer-body" v-if="editingCredit">

        <!-- Member Info -->
        <div class="drawer-section">
          <div class="section-label">Informasi Member</div>
          <div class="u-flex u-gap-3">
            <el-avatar :size="44" :src="editingCredit.customer?.avatar_url">
              {{ editingCredit.customer?.name?.[0]?.toUpperCase() }}
            </el-avatar>
            <div>
              <div class="u-fw-bold">{{ editingCredit.customer?.name }}</div>
              <div class="u-text-xs u-text-success">{{ editingCredit.customer?.whatsapp }}</div>
            </div>
          </div>
        </div>

        <!-- Package Info -->
        <div class="drawer-section">
          <div class="section-label">Informasi Paket</div>
          <div class="member-chip">
            <div class="pkg-icon-wrap img-36">
              <img class="img-36-cover" v-if="editingCredit.package?.icon_url" :src="getImageUrl(editingCredit.package?.icon_url)"
                />
              <div v-else class="pkg-icon-placeholder avatar-36">
                <el-icon><Coin /></el-icon>
              </div>
            </div>
            <div>
              <div class="u-fw-semibold u-text-sm">{{ editingCredit.package?.name }}</div>
              <div class="u-text-xs u-text-secondary">
                Dibeli {{ formatDate(editingCredit.purchased_at) }}, {{ formatTime(editingCredit.purchased_at) }} WIB
              </div>
            </div>
          </div>
        </div>

        <!-- Durasi Jam -->
        <div class="drawer-section">
          <div class="section-label">Durasi Jam</div>
          <div class="three-col">
            <div class="hour-stat">
              <div class="hour-value">{{ editingCredit.total_hours }} Jam</div>
              <div class="hour-label">Total Jam</div>
            </div>
            <div class="hour-stat">
              <div class="hour-value" :style="{ color: getHoursColor(editingCredit.percent_used) }">
                {{ editingCredit.remaining_hours }} Jam
              </div>
              <div class="hour-label">Sisa Jam</div>
            </div>
            <div class="hour-stat">
              <div class="hour-value">{{ editingCredit.percent_used }}%</div>
              <div class="hour-label">% Terpakai</div>
              <el-progress :percentage="editingCredit.percent_used" :color="getProgressColor(editingCredit.percent_used)" :show-text="false" :stroke-width="4" class="u-mt-1" />
            </div>
          </div>
        </div>

        <!-- Tambah / Kurangi Jam -->
        <div class="drawer-section">
          <div class="section-label u-flex u-gap-1">
            Tambah / Kurangi Jam
            <el-tooltip content="Gunakan untuk koreksi jam jika ada kegagalan sistem" placement="top">
              <el-icon class="u-text-muted"><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
          <div class="stack">
            <div class="adjust-option" :class="{ active: adjustType === 'add' }" @click="adjustType = 'add'; adjustHours = 0">
              <el-radio v-model="adjustType" label="add">
                <span class="u-fw-semibold">Tambah Jam</span>
              </el-radio>
              <div class="option-hint">Jam akan ditambahkan ke sisa paket.</div>
              <div class="option-extra" v-if="adjustType === 'add'">
                <el-input-number class="input-w120" v-model="adjustHours" :min="0" :step="0.5" />
                <span class="u-text-xs u-text-secondary">Jam</span>
              </div>
            </div>
            <div class="adjust-option" :class="{ active: adjustType === 'subtract' }" @click="adjustType = 'subtract'; adjustHours = 0">
              <el-radio v-model="adjustType" label="subtract">
                <span class="u-fw-semibold">Kurangi Jam</span>
              </el-radio>
              <div class="option-hint">Jam akan dikurangi dari sisa paket.</div>
              <div class="option-extra" v-if="adjustType === 'subtract'">
                <el-input-number class="input-w120" v-model="adjustHours" :min="0" :max="editingCredit.remaining_hours" :step="0.5" />
                <span class="u-text-xs u-text-secondary">Jam</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Masa Berlaku -->
        <div class="drawer-section">
          <div class="section-label">Masa Berlaku</div>
          <div class="usage-row">
            <span class="u-text-secondary">Tanggal Berakhir Saat Ini</span>
            <span :style="{ color: editingCredit.days_left <= 3 ? 'var(--color-danger)' : 'var(--text-primary)' }">
              {{ formatDate(editingCredit.expires_at) }} ({{ editingCredit.days_left }} hari lagi)
            </span>
          </div>
          <div class="u-flex u-gap-2">
            <el-input-number v-model="extendDays" :min="0" class="u-flex-1" />
            <span class="u-text-xs u-text-secondary">Hari</span>
          </div>
          <div v-if="extendDays > 0" class="u-text-xs u-mt-2">
            <span class="u-text-secondary">Tanggal Berakhir Setelah Perubahan: </span>
            <span class="u-text-success u-fw-semibold">{{ computedNewExpiry }}</span>
          </div>
        </div>

        <!-- Cabang -->
        <div class="drawer-section">
          <div class="section-label">Cabang yang Berlaku</div>
          <div class="tag-list">
            <template v-if="editingCredit.package?.apply_to_all_stores">
              <el-tag>Semua Cabang</el-tag>
            </template>
            <template v-else>
              <el-tag v-for="ps in editingCredit.package?.package_stores" :key="ps.id">
                {{ ps.store?.name }}
              </el-tag>
            </template>
          </div>
        </div>

        <!-- Notes -->
        <div class="drawer-section">
          <div class="section-label">Catatan Perubahan</div>
          <el-input v-model="adjustNotes" type="textarea" :rows="2" placeholder="Alasan perubahan (opsional)..." />
        </div>

        <!-- Footer -->
        <div class="drawer-footer">
          <el-button class="u-flex-1" @click="editCreditVisible = false">Batal</el-button>
          <el-button type="primary" class="u-flex-1" :loading="adjustLoading" @click="handleAdjustCredit">
            <el-icon><Check /></el-icon> Simpan Perubahan
          </el-button>
        </div>
      </div>
    </el-drawer>

  </div>
</template>

<script setup>
import { fetchAllPages } from '@/utils/fetchAllPages'
import { ref, reactive, computed, onMounted } from 'vue'
import { usePermission } from '@/composables/usePermission'
import { useBreakpoint } from '@/composables/useBreakpoint'
import { ElMessage, ElMessageBox } from 'element-plus'
import { notifyError } from '@/utils/notify'
import AuditTrail from '@/components/AuditTrail.vue'
import {
  getPackages, getActivePackages, createPackage, updatePackage, deletePackage,
  getMemberCredits, assignCredit, adjustCredit
} from '@/api/play_credits/playCreditsApi'
import { getStores } from '@/api/store/storeApi'
import { getImageUrl } from '@/utils/imageHelper'
import { getCustomers } from '@/api/customer/customerApi'
import PageHeader from '@/components/ui/PageHeader.vue'
import TablePagination from '@/components/ui/TablePagination.vue'

const { can } = usePermission()
const { isMobile, isTablet } = useBreakpoint()

// ── Tab State ─────────────────────────────────────────────────
const activeTab = ref('packages')
const onTabChange = (tab) => {
  if (tab === 'members') fetchMemberCredits()
  else fetchPackages()
}

// ── Shared Data ───────────────────────────────────────────────
const allStores = ref([])
const activePackages = ref([])
const customerOptions = ref([])

// ── Package State ─────────────────────────────────────────────
const pkgLoading = ref(false)
const packageList = ref([])
const pkgTotal = ref(0)
const pkgFilter = reactive({ search: '', status: null, page: 1, per_page: 10 })
const packageFormVisible = ref(false)
const pkgFormLoading = ref(false)
const pkgFormRef = ref()
const editingPackage = ref(null)
const pkgIconPreview = ref(null)
const pkgIconFile = ref(null)

const pkgForm = reactive({
  name: '', total_hours: 5, price: 0, validity_days: 30,
  description: '', is_active: true, apply_to_all_stores: false, store_ids: []
})
const pkgRules = {
  name: [{ required: true, message: 'Nama paket wajib diisi', trigger: 'blur' }],
  total_hours: [{ required: true, type: 'number', min: 0.5, message: 'Total jam wajib diisi', trigger: 'blur' }],
  price: [{ required: true, type: 'number', min: 0, message: 'Harga wajib diisi', trigger: 'blur' }],
  validity_days: [{ required: true, type: 'number', min: 1, message: 'Masa berlaku wajib diisi', trigger: 'blur' }],
}

// ── Member Credits State ──────────────────────────────────────
const memberLoading = ref(false)
const memberCreditList = ref([])
const memberTotal = ref(0)
const memberFilter = reactive({ search: '', package_id: null, status: null, whatsapp: '', page: 1, per_page: 10 })

// Assign dialog
const assignDialogVisible = ref(false)
const assignLoading = ref(false)
const assignFormRef = ref()
const assignForm = reactive({ customer_id: '', package_id: '', payment_amount: 0, notes: '' })
const customerOptionsLoading = ref(false)
const assignRules = {
  customer_id: [{ required: true, message: 'Pilih customer', trigger: 'change' }],
  package_id: [{ required: true, message: 'Pilih paket', trigger: 'change' }],
}

// Edit credit drawer
const editCreditVisible = ref(false)
const adjustLoading = ref(false)
const editingCredit = ref(null)
const adjustType = ref('add')
const adjustHours = ref(0)
const extendDays = ref(0)
const adjustNotes = ref('')

const computedNewExpiry = computed(() => {
  if (!editingCredit.value || extendDays.value <= 0) return '-'
  const d = new Date(editingCredit.value.expires_at)
  d.setDate(d.getDate() + extendDays.value)
  const daysLeft = Math.ceil((d - new Date()) / 86400000)
  return `${formatDate(d.toISOString())} (${daysLeft} hari lagi)`
})

// ── Filters ───────────────────────────────────────────────────
// Filter changes start again at page 1; the pagers keep calling the fetch functions.
const applyPkgFilters = () => {
  pkgFilter.page = 1
  fetchPackages()
}
const applyMemberFilters = () => {
  memberFilter.page = 1
  fetchMemberCredits()
}

// ── Debounce ──────────────────────────────────────────────────
let pkgTimer = null
const debouncePkg = () => {
  clearTimeout(pkgTimer)
  pkgTimer = setTimeout(applyPkgFilters, 400)
}
let memberTimer = null
const debounceMembers = () => {
  clearTimeout(memberTimer)
  memberTimer = setTimeout(applyMemberFilters, 400)
}

// ── Fetchers ──────────────────────────────────────────────────
const fetchPackages = async () => {
  pkgLoading.value = true
  try {
    const { data } = await getPackages({ ...pkgFilter })
    packageList.value = data.data || []
    pkgTotal.value = data.meta?.total || 0
  } catch { packageList.value = [] }
  finally { pkgLoading.value = false }
}

const fetchMemberCredits = async () => {
  memberLoading.value = true
  try {
    const { data } = await getMemberCredits({ ...memberFilter })
    memberCreditList.value = data.data || []
    memberTotal.value = data.meta?.total || 0
  } catch { memberCreditList.value = [] }
  finally { memberLoading.value = false }
}

const loadMemberCustomers = async () => {
  customerOptionsLoading.value = true
  try {
    customerOptions.value = await fetchAllPages((page) => getCustomers({ type: 'member', ...page }))
  } catch {
    customerOptions.value = []
  } finally {
    customerOptionsLoading.value = false
  }
}

const resetMemberFilter = () => {
  Object.assign(memberFilter, { search: '', package_id: null, status: null, whatsapp: '', page: 1 })
  fetchMemberCredits()
}

const loadActivePackages = async () => {
  try {
    const { data } = await getActivePackages()
    activePackages.value = data.data || []
  } catch {}
}

// ── Package Form ──────────────────────────────────────────────
const openPackageForm = (pkg) => {
  editingPackage.value = pkg
  pkgIconPreview.value = pkg?.icon_url ? getImageUrl(pkg.icon_url) : null
  pkgIconFile.value = null
  Object.assign(pkgForm, {
    name: pkg?.name || '',
    total_hours: pkg?.total_hours || 5,
    price: pkg?.price || 0,
    validity_days: pkg?.validity_days || 30,
    description: pkg?.description || '',
    is_active: pkg?.is_active ?? true,
    apply_to_all_stores: pkg?.apply_to_all_stores ?? false,
    store_ids: pkg?.package_stores?.map(s => s.store_id) || []
  })
  packageFormVisible.value = true
}

const handleSavePackage = async () => {
  await pkgFormRef.value.validate(async (valid) => {
    if (!valid) return
    pkgFormLoading.value = true
    try {
      if (editingPackage.value) {
        await updatePackage(editingPackage.value.id, { ...pkgForm })
        ElMessage.success('Paket berhasil diupdate')
      } else {
        const formData = new FormData()
        formData.append('name', pkgForm.name)
        formData.append('total_hours', pkgForm.total_hours)
        formData.append('price', pkgForm.price)
        formData.append('validity_days', pkgForm.validity_days)
        formData.append('description', pkgForm.description)
        formData.append('is_active', pkgForm.is_active)
        formData.append('apply_to_all_stores', pkgForm.apply_to_all_stores)
        formData.append('store_ids', JSON.stringify(pkgForm.store_ids))
        if (pkgIconFile.value) formData.append('icon', pkgIconFile.value)
        await createPackage(formData)
        ElMessage.success('Paket berhasil dibuat')
      }
      packageFormVisible.value = false
      fetchPackages()
      loadActivePackages()
    } catch (e) { notifyError(e, 'Gagal menyimpan paket') }
    finally { pkgFormLoading.value = false }
  })
}

const handleDeletePackage = async (row) => {
  try {
    await ElMessageBox.confirm(`Hapus paket "${row.name}"?`, 'Konfirmasi', { type: 'warning' })
    await deletePackage(row.id)
    ElMessage.success('Paket berhasil dihapus')
    fetchPackages()
  } catch {}
}

// ── Assign Credits ────────────────────────────────────────────
const openAssignDialog = () => {
  Object.assign(assignForm, { customer_id: '', package_id: '', payment_amount: 0, notes: '' })
  assignDialogVisible.value = true
  loadMemberCustomers()
}

const onPackageSelect = (id) => {
  const pkg = activePackages.value.find(p => p.id === id)
  if (pkg) assignForm.payment_amount = pkg.price
}

const handleAssign = async () => {
  await assignFormRef.value.validate(async (valid) => {
    if (!valid) return
    assignLoading.value = true
    try {
      await assignCredit(assignForm)
      ElMessage.success('Credits berhasil di-assign ke customer')
      assignDialogVisible.value = false
      fetchMemberCredits()
    } catch (e) { notifyError(e, 'Gagal assign credits') }
    finally { assignLoading.value = false }
  })
}

// ── Edit Credit ───────────────────────────────────────────────
const openEditCredit = (row) => {
  editingCredit.value = row
  adjustType.value = 'add'
  adjustHours.value = 0
  extendDays.value = 0
  adjustNotes.value = ''
  editCreditVisible.value = true
}

const handleAdjustCredit = async () => {
  const finalAdjustHours = adjustType.value === 'add' ? adjustHours.value : -adjustHours.value
  if (finalAdjustHours === 0 && extendDays.value === 0) {
    ElMessage.warning('Tidak ada perubahan yang dilakukan')
    return
  }
  adjustLoading.value = true
  try {
    await adjustCredit(editingCredit.value.id, {
      adjust_hours: finalAdjustHours,
      extend_days: extendDays.value,
      notes: adjustNotes.value
    })
    ElMessage.success('Credits berhasil diupdate')
    editCreditVisible.value = false
    fetchMemberCredits()
  } catch (e) { notifyError(e, 'Gagal update credits') }
  finally { adjustLoading.value = false }
}

// ── Helpers ───────────────────────────────────────────────────
const formatRp = (v) => `Rp ${(v || 0).toLocaleString('id-ID')}`
const formatDate = (d) => d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'
const formatTime = (d) => d ? new Date(d).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'
const getProgressColor = (percent) => {
  if (percent >= 60) return 'var(--danger)'
  if (percent >= 30) return 'var(--warning)'
  return 'var(--success)'
}
const getHoursColor = (percent) => {
  if (percent >= 60) return 'var(--color-danger)'
  if (percent >= 30) return 'var(--color-warning)'
  return 'var(--color-success)'
}

// ── Mount ─────────────────────────────────────────────────────
onMounted(async () => {
  fetchPackages()
  loadActivePackages()
  try {
    const { data } = await getStores({ per_page: 100, status: 'active' })
    allStores.value = data.data || []
  } catch {}
})
</script>

<style scoped>
.pkg-icon-wrap { position:relative; flex-shrink:0; }
.pkg-icon-placeholder {
  background: linear-gradient(135deg, rgba(124,58,237,0.3), rgba(124,58,237,0.1));
  border-radius:10px; display:flex; align-items:center; justify-content:center;
  color:var(--color-primary); width:100%; height:100%;
}

.package-preview {
  background:var(--bg-main); border:1px solid var(--border-color);
  border-radius:12px; padding:16px;
}
.preview-row {
  display:flex; align-items:center; gap:8px; font-size:12px;
  padding:8px 0; border-bottom:1px solid var(--border-color);
}
.preview-row span:first-of-type { color:var(--text-secondary); flex:1; }
.preview-row span:last-child, .preview-row strong { margin-left:auto; }

.info-box {
  background:rgba(59,130,246,0.08); border:1px solid rgba(59,130,246,0.2);
  border-radius:8px; padding:10px 14px; font-size:12px; color:var(--action);
  display:flex; align-items:center; gap:8px;
}
.note-box {
  background:rgba(245,158,11,0.08); border:1px solid rgba(245,158,11,0.2);
  border-radius:6px; padding:8px 10px; font-size:12px; color:var(--warning);
  display:flex; align-items:flex-start; gap:6px;
}

.drawer-section { border-bottom:1px solid var(--border-color); padding-bottom:14px; margin-bottom:14px; }
.section-label { font-size:12px; font-weight:700; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:10px; }

.hour-stat { background:var(--bg-main); border:1px solid var(--border-color); border-radius:8px; padding:10px; text-align:center; }
.hour-value { font-size:14px; font-weight:700; margin-bottom:2px; }
.hour-label { font-size:10px; color:var(--text-secondary); }

.adjust-option {
  background:var(--bg-main); border:1px solid var(--border-color);
  border-radius:8px; padding:10px 12px; cursor:pointer; transition:border-color 0.2s;
}
.adjust-option.active { border-color:var(--color-primary); background:rgba(124,58,237,0.05); }

/* Responsive */
@media (max-width:639px) { .table-wrap { display:none; } }
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

/* C3: former inline styles */
.img-72 { width: 72px; height: 72px; }
.img-72-cover { width: 72px; height: 72px; border-radius: 12px; object-fit: cover; }
.img-64-spaced { width: 64px; height: 64px; margin-bottom: var(--space-3); }
.img-64-cover { width: 64px; height: 64px; border-radius: 12px; object-fit: cover; }
.img-64 { width: 64px; height: 64px; }
.img-44-cover { width: 44px; height: 44px; border-radius: var(--radius-lg); object-fit: cover; }
.img-44 { width: 44px; height: 44px; }
.img-40-cover { width: 40px; height: 40px; border-radius: var(--radius-lg); object-fit: cover; }
.avatar-36 { width: 36px; height: 36px; font-size: var(--font-size-xs); }
.img-36-cover { width: 36px; height: 36px; border-radius: var(--radius-lg); object-fit: cover; }
.img-36 { width: 36px; height: 36px; }
.avatar-28 { width: 28px; height: 28px; font-size: var(--font-size-xs); }
.img-28-cover { width: 28px; height: 28px; border-radius: var(--radius-md); object-fit: cover; }
.img-28 { width: 28px; height: 28px; }
.filter-w150 { width: 150px; }
.input-w120 { width: 120px; }
.filter-search { width: 260px; }
.filter-w200 { width: 200px; }
.filter-w180 { width: 180px; }
.filter-w140 { width: 140px; }
.option-hint { font-size: var(--font-size-xs); color: var(--text-secondary); padding-left: 22px; }
.option-extra { display: flex; align-items: center; gap: var(--space-2); margin-top: var(--space-2); padding-left: 22px; }
.readonly-field { width: 100%; height: 32px; background: var(--surface-page); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 0 var(--space-3); display: flex; align-items: center; justify-content: space-between; }
.drawer-body { padding: 0 var(--space-1); }
.store-tag { margin-right: var(--space-1); margin-bottom: var(--space-1); }
.detail-title { font-weight: 700; font-size: var(--font-size-base); margin-bottom: var(--space-1); }
.detail-name { font-size: var(--font-size-lg); font-weight: 700; margin-bottom: var(--space-1); }
.detail-name-tight { font-size: var(--font-size-lg); font-weight: 700; margin-bottom: var(--space-1); }
.pkg-name { font-size: var(--font-size-sm); font-weight: 600; line-height: 1.3; }
.pkg-meta { font-size: var(--font-size-xs); font-weight: 500; }
.pkg-bonus { font-size: var(--font-size-xs); color: var(--success); line-height: 1.3; }
.tag-xs { flex-shrink: 0; font-size: var(--font-size-xs); }
.three-col { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: var(--space-2); }
.usage-row { display: flex; justify-content: space-between; font-size: var(--font-size-xs); margin-bottom: var(--space-2); }
.detail-head-tight { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-1); }
.detail-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-4); }
.filter-row { display: flex; gap: var(--space-2); flex-wrap: wrap; margin-bottom: var(--space-3); }
.tag-list { display: flex; gap: var(--space-1); flex-wrap: wrap; }
.row-gap-sm { display: flex; gap: var(--space-1); }
.m-card-actions { display: flex; gap: var(--space-1); }
.drawer-footer { display: flex; gap: var(--space-2); margin-top: var(--space-5); padding-top: var(--space-4); border-top: 1px solid var(--border); }
.summary-row { display: flex; gap: var(--space-2); margin-bottom: var(--space-4); }
.stack { display: flex; flex-direction: column; gap: var(--space-2); }
.member-chip { display: flex; align-items: center; gap: var(--space-2); background: var(--surface-page); border-radius: var(--radius-lg); padding: var(--space-2); }
.m-card-avatar { background: var(--action); color: var(--text-on-action); font-weight: 700; font-size: var(--font-size-base); }
</style>
