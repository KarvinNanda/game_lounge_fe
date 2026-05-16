<template>
  <div>
    <!-- Header -->
    <div class="page-header">
      <div>
        <div class="breadcrumb">Dashboard > Play Credits</div>
        <h1 class="page-title">Play Credits</h1>
      </div>
    </div>

    <!-- 2 Tabs -->
    <el-tabs v-model="activeTab" type="card" @tab-change="onTabChange">

      <!-- ════════════════════════════════════════════════════════
           TAB 1: Play Credits Package
      ════════════════════════════════════════════════════════ -->
      <el-tab-pane name="packages">
        <template #label>
          <span><el-icon><Coin /></el-icon> Play Credits Package</span>
        </template>

        <div style="margin-top:16px">
          <!-- Header Tab -->
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px">
            <div>
              <h3 style="font-size:16px;font-weight:700;margin-bottom:4px">Play Credits Package</h3>
              <p style="font-size:12px;color:var(--text-secondary)">Kelola paket play credits yang tersedia untuk dijual</p>
            </div>
            <el-button type="primary" @click="openPackageForm(null)">
              <el-icon><Plus /></el-icon> Create New Package
            </el-button>
          </div>

          <!-- Filter -->
          <div style="display:flex;gap:10px;margin-bottom:16px">
            <el-input v-model="pkgFilter.search" placeholder="Search package name..." prefix-icon="Search"
              style="width:260px" clearable @input="debouncePkg" />
            <el-select v-model="pkgFilter.status" placeholder="Semua Status" clearable style="width:150px" @change="fetchPackages">
              <el-option label="Aktif" value="active" />
              <el-option label="Nonaktif" value="inactive" />
            </el-select>
          </div>

          <!-- Package Table -->
          <el-card shadow="never">
            <el-table :data="packageList" v-loading="pkgLoading" size="small" style="width:100%">

              <el-table-column label="NAMA PAKET" min-width="220">
                <template #default="{ row }">
                  <div style="display:flex;align-items:center;gap:12px">
                    <div class="pkg-icon-wrap">
                      <img v-if="row.icon_url" :src="getImageUrl(row.icon_url)"
                        style="width:44px;height:44px;border-radius:10px;object-fit:cover" />
                      <div v-else class="pkg-icon-placeholder" style="width:44px;height:44px"><el-icon size="20"><Coin /></el-icon></div>
                    </div>
                    <div>
                      <div style="font-weight:600;font-size:13px">{{ row.name }}</div>
                      <div style="font-size:11px;color:var(--text-secondary)">{{ row.description || '-' }}</div>
                    </div>
                  </div>
                </template>
              </el-table-column>

              <el-table-column label="TOTAL JAM" width="110">
                <template #default="{ row }">
                  <span style="font-weight:600">{{ row.total_hours }} Jam</span>
                </template>
              </el-table-column>

              <el-table-column label="CABANG BERLAKU" min-width="180">
                <template #default="{ row }">
                  <span v-if="row.apply_to_all_stores" style="font-size:12px;color:var(--text-secondary)">Semua Cabang</span>
                  <span v-else style="font-size:12px">
                    {{ row.package_stores?.map(s => s.store?.name).join(', ') || '-' }}
                  </span>
                </template>
              </el-table-column>

              <el-table-column label="HARGA" width="130">
                <template #default="{ row }">
                  <span style="font-weight:600;color:var(--color-primary)">{{ formatRp(row.price) }}</span>
                </template>
              </el-table-column>

              <el-table-column label="MASA BERLAKU" width="120">
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
                  <div style="display:flex;gap:6px">
                    <el-button size="small" circle plain @click="openPackageForm(row)">
                      <el-icon><Edit /></el-icon>
                    </el-button>
                    <el-button size="small" circle plain type="danger" @click="handleDeletePackage(row)">
                      <el-icon><Delete /></el-icon>
                    </el-button>
                  </div>
                </template>
              </el-table-column>
            </el-table>

            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:14px">
              <span style="font-size:12px;color:var(--text-secondary)">
                Showing {{ packageList.length }} to {{ pkgTotal }} packages
              </span>
              <el-pagination v-model:current-page="pkgFilter.page" :total="pkgTotal"
                layout="prev, pager, next" @change="fetchPackages" />
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

        <div style="margin-top:16px">
          <!-- Header Tab -->
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px">
            <div>
              <h3 style="font-size:16px;font-weight:700;margin-bottom:2px">Member Play Credits (Aktif)</h3>
              <p style="font-size:12px;color:var(--text-secondary)">Daftar paket Play Credits aktif yang dimiliki member.</p>
            </div>
            <el-button type="primary" @click="openAssignDialog">
              <el-icon><Plus /></el-icon> Assign Credits
            </el-button>
          </div>

          <!-- Info -->
          <div class="info-box" style="margin-bottom:14px">
            <el-icon><InfoFilled /></el-icon>
            Menampilkan paket yang masih aktif dan belum kedaluwarsa.
          </div>

          <!-- Filters -->
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px">
            <el-input v-model="memberFilter.search" placeholder="Search nama member..."
              prefix-icon="Search" style="width:200px" clearable @input="debounceMembers" />
            <el-select v-model="memberFilter.package_id" placeholder="Semua Paket" clearable style="width:150px" @change="fetchMemberCredits">
              <el-option v-for="p in activePackages" :key="p.id" :label="p.name" :value="p.id" />
            </el-select>
            <el-select v-model="memberFilter.status" placeholder="Semua Status" clearable style="width:140px" @change="fetchMemberCredits">
              <el-option label="Aktif" value="active" />
              <el-option label="Kadaluwarsa" value="expired" />
            </el-select>
            <el-input v-model="memberFilter.whatsapp" placeholder="No. WhatsApp"
              style="width:180px" clearable @input="debounceMembers">
              <template #prepend><el-icon><Phone /></el-icon></template>
            </el-input>
            <el-button plain @click="resetMemberFilter"><el-icon><RefreshRight /></el-icon> Reset Filter</el-button>
          </div>

          <!-- Member Credits Table -->
          <el-card shadow="never">
            <el-table :data="memberCreditList" v-loading="memberLoading" size="small" style="width:100%">

              <!-- Member -->
              <el-table-column label="MEMBER" min-width="180">
                <template #default="{ row }">
                  <div style="display:flex;align-items:center;gap:10px">
                    <el-avatar :size="36" :src="row.customer?.avatar_url">
                      {{ row.customer?.name?.[0]?.toUpperCase() }}
                    </el-avatar>
                    <div>
                      <div style="display:flex;align-items:center;gap:6px">
                        <span style="font-weight:600;font-size:13px">{{ row.customer?.name }}</span>
                        <el-tag size="small" type="warning">Member</el-tag>
                      </div>
                      <div style="font-size:11px;color:var(--color-success)">
                        {{ row.customer?.whatsapp }}
                      </div>
                    </div>
                  </div>
                </template>
              </el-table-column>

              <!-- Paket -->
              <el-table-column label="PAKET" width="140">
                <template #default="{ row }">
                  <div style="display:flex;align-items:center;gap:8px">
                    <div class="pkg-icon-wrap" style="width:28px;height:28px">
                      <img v-if="row.package?.icon_url" :src="getImageUrl(row.package?.icon_url)"
                        style="width:28px;height:28px;border-radius:6px;object-fit:cover" />
                      <div v-else class="pkg-icon-placeholder" style="width:28px;height:28px;font-size:12px">
                        <el-icon><Coin /></el-icon>
                      </div>
                    </div>
                    <span style="font-size:12px;font-weight:500">{{ row.package?.name }}</span>
                  </div>
                </template>
              </el-table-column>

              <!-- Total Jam -->
              <el-table-column label="TOTAL JAM" width="100">
                <template #default="{ row }">
                  <span style="font-size:12px">{{ row.total_hours }} Jam</span>
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
                    <div style="font-size:11px;margin-bottom:4px">{{ row.percent_used }}%</div>
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
                  <div style="font-size:12px">{{ formatDate(row.expires_at) }}</div>
                  <div :style="{ fontSize: '11px', color: row.days_left <= 3 ? 'var(--color-danger)' : 'var(--text-secondary)' }">
                    {{ row.is_expired ? 'Kadaluwarsa' : `(${row.days_left} hari lagi)` }}
                  </div>
                </template>
              </el-table-column>

              <!-- Cabang Berlaku -->
              <el-table-column label="CABANG BERLAKU" min-width="160">
                <template #default="{ row }">
                  <template v-if="row.package?.apply_to_all_stores">
                    <span style="font-size:11px;color:var(--text-secondary)">Semua Cabang</span>
                  </template>
                  <template v-else>
                    <el-tag
                      v-for="ps in row.package?.package_stores?.slice(0, 2)"
                      :key="ps.id" size="small"
                      style="margin-right:4px;margin-bottom:2px"
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
                  <div style="font-size:11px">
                    <div>{{ formatDate(row.purchased_at) }}</div>
                    <div style="color:var(--text-secondary)">{{ formatTime(row.purchased_at) }} WIB</div>
                  </div>
                </template>
              </el-table-column>

              <!-- Aksi -->
              <el-table-column label="AKSI" width="70" fixed="right">
                <template #default="{ row }">
                  <el-button size="small" circle plain @click="openEditCredit(row)">
                    <el-icon><Edit /></el-icon>
                  </el-button>
                </template>
              </el-table-column>
            </el-table>

            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:14px">
              <span style="font-size:12px;color:var(--text-secondary)">
                Menampilkan {{ memberCreditList.length }} dari {{ memberTotal }} paket aktif
              </span>
              <el-pagination v-model:current-page="memberFilter.page" :total="memberTotal"
                layout="prev, pager, next" @change="fetchMemberCredits" />
            </div>
          </el-card>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- ════════════════════════════════════════════════════════
         DIALOG: Create / Edit Package
    ════════════════════════════════════════════════════════ -->
    <el-dialog
      v-model="packageFormVisible"
      :title="editingPackage ? 'Edit Package' : 'Create New Package'"
      width="760px"
      :destroy-on-close="true"
    >
      <div style="display:grid;grid-template-columns:1fr 280px;gap:20px">
        <!-- Left: Form -->
        <el-form :model="pkgForm" :rules="pkgRules" ref="pkgFormRef" label-position="top">
          <!-- <el-form-item label="Icon / Photo">
            <div style="display:flex;align-items:center;gap:12px">
              <div class="pkg-icon-wrap" style="width:72px;height:72px">
                <img v-if="pkgIconPreview" :src="pkgIconPreview"
                  style="width:72px;height:72px;border-radius:12px;object-fit:cover" />
                <div v-else class="pkg-icon-placeholder" style="width:72px;height:72px">
                  <el-icon size="24"><Coin /></el-icon>
                </div>
              </div>
              <div>
                <el-upload :auto-upload="false" :show-file-list="false" :on-change="onIconChange" accept="image/*">
                  <el-button plain><el-icon><UploadFilled /></el-icon> Upload Image</el-button>
                </el-upload>
                <div style="font-size:11px;color:var(--text-muted);margin-top:4px">
                  Disarankan ukuran 512x512px (1:1)
                </div>
              </div>
            </div>
          </el-form-item> -->

          <el-form-item label="Nama Paket *" prop="name">
            <el-input v-model="pkgForm.name" placeholder="Paket 10 Jam" />
          </el-form-item>

          <el-form-item label="Total Jam *" prop="total_hours">
            <el-input-number v-model="pkgForm.total_hours" :min="0.5" :step="0.5" style="width:100%" />
          </el-form-item>

          <el-form-item label="Cabang yang Berlaku *">
            <div style="margin-bottom:8px">
              <el-checkbox v-model="pkgForm.apply_to_all_stores" @change="(v) => { if (v) pkgForm.store_ids = [] }">
                Semua Cabang
              </el-checkbox>
            </div>
            <el-select
              v-if="!pkgForm.apply_to_all_stores"
              v-model="pkgForm.store_ids"
              multiple
              placeholder="Pilih cabang"
              style="width:100%"
            >
              <el-option v-for="s in allStores" :key="s.id" :label="s.name" :value="s.id" />
            </el-select>
            <div style="font-size:11px;color:var(--text-muted);margin-top:4px">
              Paket hanya dapat digunakan di cabang yang dipilih
            </div>
          </el-form-item>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
            <el-form-item label="Harga *" prop="price">
              <el-input-number
                v-model="pkgForm.price" :min="0" :step="10000" style="width:100%"
                :formatter="v => `Rp ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')"
                :parser="v => v.replace(/Rp\s?|(\.*)/g, '')"
              />
            </el-form-item>
            <el-form-item label="Masa Berlaku *" prop="validity_days">
              <el-input-number v-model="pkgForm.validity_days" :min="1" style="width:100%" />
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
          <h4 style="font-size:13px;font-weight:700;margin-bottom:12px">Preview Paket</h4>
          <div class="package-preview">
            <!-- <div class="pkg-icon-wrap" style="width:64px;height:64px;margin-bottom:12px">
              <img v-if="pkgIconPreview" :src="pkgIconPreview"
                style="width:64px;height:64px;border-radius:12px;object-fit:cover" />
              <div v-else class="pkg-icon-placeholder" style="width:64px;height:64px">
                <el-icon size="20"><Coin /></el-icon>
              </div>
            </div> -->
            <div style="font-weight:700;font-size:15px;margin-bottom:4px">
              {{ pkgForm.name || 'Nama Paket' }}
            </div>
            <el-tag size="small" style="margin-bottom:10px">Play Credits Package</el-tag>
            <p style="font-size:12px;color:var(--text-secondary);margin-bottom:14px">
              {{ pkgForm.description || 'Deskripsi paket' }}
            </p>
            <div class="preview-row"><el-icon><Clock /></el-icon><span>Total Jam</span><span>{{ pkgForm.total_hours || 0 }} Jam</span></div>
            <div class="preview-row">
              <el-icon><Shop /></el-icon>
              <span>Cabang</span>
              <span v-if="pkgForm.apply_to_all_stores">Semua Cabang</span>
              <span v-else-if="pkgForm.store_ids?.length">{{ pkgForm.store_ids.length }} Cabang</span>
              <span v-else style="color:var(--text-muted)">-</span>
            </div>
            <div class="preview-row" style="color:var(--color-primary)">
              <el-icon><Money /></el-icon><span>Harga</span><strong>{{ formatRp(pkgForm.price) }}</strong>
            </div>
            <div class="preview-row"><el-icon><Calendar /></el-icon><span>Masa Berlaku</span><span>{{ pkgForm.validity_days || 0 }} Hari</span></div>
            <div class="note-box" style="margin-top:10px;font-size:11px">
              <el-icon><InfoFilled /></el-icon>
              Paket ini hanya dapat digunakan di cabang yang dipilih.
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="packageFormVisible = false">Batal</el-button>
        <el-button type="primary" :loading="pkgFormLoading" @click="handleSavePackage">
          <el-icon><Check /></el-icon> Konfirmasi {{ editingPackage ? 'Update' : 'Buat' }} Package
        </el-button>
      </template>
    </el-dialog>

    <!-- ════════════════════════════════════════════════════════
         DIALOG: Assign Credits ke Customer
    ════════════════════════════════════════════════════════ -->
    <el-dialog v-model="assignDialogVisible" title="Assign Play Credits ke Customer" width="460px">
      <el-form :model="assignForm" :rules="assignRules" ref="assignFormRef" label-position="top">
        <el-form-item label="Customer (Member) *" prop="customer_id">
          <el-select
            v-model="assignForm.customer_id"
            filterable
            :loading="customerOptionsLoading"
            loading-text="Memuat daftar member..."
            placeholder="Pilih atau ketik nama member..."
            no-data-text="Tidak ada member ditemukan"
            style="width:100%"
          >
            <el-option
              v-for="c in customerOptions"
              :key="c.id"
              :label="c.name"
              :value="c.id"
            >
              <div style="display:flex;align-items:center;gap:10px">
                <el-avatar :size="28" style="flex-shrink:0;font-size:11px">
                  {{ c.name?.[0]?.toUpperCase() }}
                </el-avatar>
                <div>
                  <div style="font-size:13px;font-weight:600;line-height:1.3">{{ c.name }}</div>
                  <div style="font-size:11px;color:var(--color-success);line-height:1.3">{{ c.whatsapp }}</div>
                </div>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="Paket *" prop="package_id">
          <el-select v-model="assignForm.package_id" placeholder="Pilih paket" style="width:100%"
            @change="onPackageSelect">
            <el-option v-for="p in activePackages" :key="p.id"
              :label="`${p.name} — ${formatRp(p.price)} (${p.validity_days} hari)`" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="Jumlah Pembayaran">
          <div style="width:100%;height:32px;background:var(--bg-main);border:1px solid var(--border-color);border-radius:6px;padding:0 12px;display:flex;align-items:center;justify-content:space-between">
            <span style="font-size:13px;font-weight:700;color:var(--color-primary)">
              {{ assignForm.payment_amount ? formatRp(assignForm.payment_amount) : '—' }}
            </span>
            <span style="font-size:11px;color:var(--text-muted)">Mengikuti harga paket</span>
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
    </el-dialog>

    <!-- ════════════════════════════════════════════════════════
         DRAWER: Edit Play Credits (slide from right)
    ════════════════════════════════════════════════════════ -->
    <el-drawer v-model="editCreditVisible" title="Edit Play Credits" direction="rtl" size="380px">
      <div v-if="editingCredit" style="padding:0 4px">

        <!-- Member Info -->
        <div class="drawer-section">
          <div class="section-label">Informasi Member</div>
          <div style="display:flex;align-items:center;gap:12px">
            <el-avatar :size="44" :src="editingCredit.customer?.avatar_url">
              {{ editingCredit.customer?.name?.[0]?.toUpperCase() }}
            </el-avatar>
            <div>
              <div style="font-weight:700">{{ editingCredit.customer?.name }}</div>
              <div style="font-size:12px;color:var(--color-success)">{{ editingCredit.customer?.whatsapp }}</div>
            </div>
          </div>
        </div>

        <!-- Package Info -->
        <div class="drawer-section">
          <div class="section-label">Informasi Paket</div>
          <div style="display:flex;align-items:center;gap:10px;background:var(--bg-main);border-radius:8px;padding:10px">
            <div class="pkg-icon-wrap" style="width:36px;height:36px">
              <img v-if="editingCredit.package?.icon_url" :src="getImageUrl(editingCredit.package?.icon_url)"
                style="width:36px;height:36px;border-radius:8px;object-fit:cover" />
              <div v-else class="pkg-icon-placeholder" style="width:36px;height:36px;font-size:12px">
                <el-icon><Coin /></el-icon>
              </div>
            </div>
            <div>
              <div style="font-weight:600;font-size:13px">{{ editingCredit.package?.name }}</div>
              <div style="font-size:11px;color:var(--text-secondary)">
                Dibeli {{ formatDate(editingCredit.purchased_at) }}, {{ formatTime(editingCredit.purchased_at) }} WIB
              </div>
            </div>
          </div>
        </div>

        <!-- Durasi Jam -->
        <div class="drawer-section">
          <div class="section-label">Durasi Jam</div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">
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
              <el-progress :percentage="editingCredit.percent_used" :color="getProgressColor(editingCredit.percent_used)" :show-text="false" :stroke-width="4" style="margin-top:4px" />
            </div>
          </div>
        </div>

        <!-- Tambah / Kurangi Jam -->
        <div class="drawer-section">
          <div class="section-label" style="display:flex;align-items:center;gap:6px">
            Tambah / Kurangi Jam
            <el-tooltip content="Gunakan untuk koreksi jam jika ada kegagalan sistem" placement="top">
              <el-icon style="color:var(--text-muted)"><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
          <div style="display:flex;flex-direction:column;gap:10px">
            <div class="adjust-option" :class="{ active: adjustType === 'add' }" @click="adjustType = 'add'; adjustHours = 0">
              <el-radio v-model="adjustType" label="add">
                <span style="font-weight:600">Tambah Jam</span>
              </el-radio>
              <div style="font-size:11px;color:var(--text-secondary);padding-left:22px">Jam akan ditambahkan ke sisa paket.</div>
              <div v-if="adjustType === 'add'" style="display:flex;align-items:center;gap:8px;margin-top:8px;padding-left:22px">
                <el-input-number v-model="adjustHours" :min="0" :step="0.5" style="width:120px" />
                <span style="font-size:12px;color:var(--text-secondary)">Jam</span>
              </div>
            </div>
            <div class="adjust-option" :class="{ active: adjustType === 'subtract' }" @click="adjustType = 'subtract'; adjustHours = 0">
              <el-radio v-model="adjustType" label="subtract">
                <span style="font-weight:600">Kurangi Jam</span>
              </el-radio>
              <div style="font-size:11px;color:var(--text-secondary);padding-left:22px">Jam akan dikurangi dari sisa paket.</div>
              <div v-if="adjustType === 'subtract'" style="display:flex;align-items:center;gap:8px;margin-top:8px;padding-left:22px">
                <el-input-number v-model="adjustHours" :min="0" :max="editingCredit.remaining_hours" :step="0.5" style="width:120px" />
                <span style="font-size:12px;color:var(--text-secondary)">Jam</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Masa Berlaku -->
        <div class="drawer-section">
          <div class="section-label">Masa Berlaku</div>
          <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:10px">
            <span style="color:var(--text-secondary)">Tanggal Berakhir Saat Ini</span>
            <span :style="{ color: editingCredit.days_left <= 3 ? 'var(--color-danger)' : 'var(--text-primary)' }">
              {{ formatDate(editingCredit.expires_at) }} ({{ editingCredit.days_left }} hari lagi)
            </span>
          </div>
          <div style="display:flex;gap:8px;align-items:center">
            <el-input-number v-model="extendDays" :min="0" style="flex:1" />
            <span style="font-size:12px;color:var(--text-secondary)">Hari</span>
          </div>
          <div v-if="extendDays > 0" style="font-size:12px;margin-top:8px">
            <span style="color:var(--text-secondary)">Tanggal Berakhir Setelah Perubahan: </span>
            <span style="color:var(--color-success);font-weight:600">{{ computedNewExpiry }}</span>
          </div>
        </div>

        <!-- Cabang -->
        <div class="drawer-section">
          <div class="section-label">Cabang yang Berlaku</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
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
        <div style="display:flex;gap:10px;margin-top:20px;padding-top:16px;border-top:1px solid var(--border-color)">
          <el-button style="flex:1" @click="editCreditVisible = false">Batal</el-button>
          <el-button type="primary" style="flex:1" :loading="adjustLoading" @click="handleAdjustCredit">
            <el-icon><Check /></el-icon> Simpan Perubahan
          </el-button>
        </div>
      </div>
    </el-drawer>

  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getPackages, getActivePackages, createPackage, updatePackage, deletePackage,
  getMemberCredits, assignCredit, adjustCredit
} from '@/api/play_credits/playCreditsApi'
import { getStores } from '@/api/store/storeApi'
import { getCustomers } from '@/api/customer/customerApi'

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

// ── Debounce ──────────────────────────────────────────────────
let pkgTimer = null
const debouncePkg = () => {
  clearTimeout(pkgTimer)
  pkgTimer = setTimeout(() => { pkgFilter.page = 1; fetchPackages() }, 400)
}
let memberTimer = null
const debounceMembers = () => {
  clearTimeout(memberTimer)
  memberTimer = setTimeout(() => { memberFilter.page = 1; fetchMemberCredits() }, 400)
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
    const { data } = await getCustomers({ type: 'member', per_page: 200 })
    customerOptions.value = data.data || []
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

const onIconChange = (file) => {
  pkgIconFile.value = file.raw
  pkgIconPreview.value = URL.createObjectURL(file.raw)
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
    } catch (e) { ElMessage.error(e?.response?.data?.message || 'Gagal menyimpan paket') }
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
    } catch (e) { ElMessage.error(e?.response?.data?.message || 'Gagal assign credits') }
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
  } catch (e) { ElMessage.error(e?.response?.data?.message || 'Gagal update credits') }
  finally { adjustLoading.value = false }
}

// ── Helpers ───────────────────────────────────────────────────
const formatRp = (v) => `Rp ${(v || 0).toLocaleString('id-ID')}`
const formatDate = (d) => d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'
const formatTime = (d) => d ? new Date(d).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'
const getImageUrl = (path) => path?.startsWith('http') ? path : `${import.meta.env.VITE_API_URL?.replace('/api/v1', '')}${path}`

const getProgressColor = (percent) => {
  if (percent >= 60) return '#ef4444'
  if (percent >= 30) return '#f59e0b'
  return '#10b981'
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
.page-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px; }
.breadcrumb { font-size:11px; color:var(--text-muted); margin-bottom:2px; }
.page-title { font-size:18px; font-weight:700; color:var(--text-primary); }

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
  border-radius:8px; padding:10px 14px; font-size:12px; color:#93c5fd;
  display:flex; align-items:center; gap:8px;
}
.note-box {
  background:rgba(245,158,11,0.08); border:1px solid rgba(245,158,11,0.2);
  border-radius:6px; padding:8px 10px; font-size:12px; color:#fbbf24;
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
</style>
