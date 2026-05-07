<template>
  <div>
    <!-- Header -->
    <div class="page-header">
      <div>
        <div class="breadcrumb">Settings → Profil</div>
        <h1 class="page-title">Profil Saya</h1>
        <p class="page-desc">Informasi akun yang sedang login.</p>
      </div>
    </div>

    <div class="profile-layout">
      <!-- Left: Identity Card -->
      <div class="left-col">
        <el-card shadow="never" class="identity-card">
          <div class="avatar-wrap">
            <div class="avatar-circle">{{ initials }}</div>
            <div class="avatar-ring" />
          </div>
          <div class="identity-name">{{ staff?.username }}</div>
          <div class="identity-email">{{ staff?.email }}</div>
          <div class="identity-role">
            <el-tag type="info" size="small">{{ staff?.role?.name || '—' }}</el-tag>
          </div>

          <div class="identity-meta">
            <div class="meta-item" v-if="staff?.phone">
              <el-icon><Phone /></el-icon>
              <span>{{ staff.phone }}</span>
            </div>
            <div class="meta-item">
              <el-icon><OfficeBuilding /></el-icon>
              <span v-if="staff?.is_all_stores">Semua Cabang</span>
              <span v-else-if="staff?.staff_stores?.length">
                {{ staff.staff_stores.map(ss => ss.store?.name).join(', ') }}
              </span>
              <span v-else style="color:var(--text-muted)">—</span>
            </div>
          </div>
        </el-card>
      </div>

      <!-- Right: Detail + Change Password -->
      <div class="right-col">
        <!-- Info Detail -->
        <el-card shadow="never" class="detail-card">
          <div class="section-title">Informasi Akun</div>
          <div class="info-grid">
            <div class="info-row">
              <span class="info-label">Username</span>
              <span class="info-value">{{ staff?.username || '—' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Email</span>
              <span class="info-value">{{ staff?.email || '—' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">No. Handphone</span>
              <span class="info-value">{{ staff?.phone || '—' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Role</span>
              <span class="info-value">{{ staff?.role?.name || '—' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Akses Cabang</span>
              <span class="info-value">
                <template v-if="staff?.is_all_stores">
                  <el-tag size="small" type="success" plain>Semua Cabang</el-tag>
                </template>
                <template v-else-if="staff?.staff_stores?.length">
                  <div style="display:flex;flex-wrap:wrap;gap:4px">
                    <el-tag v-for="ss in staff.staff_stores" :key="ss.id" size="small" plain>
                      {{ ss.store?.name }}
                    </el-tag>
                  </div>
                </template>
                <span v-else style="color:var(--text-muted)">—</span>
              </span>
            </div>
            <div class="info-row" v-if="staff?.role?.permissions?.length">
              <span class="info-label">Permissions</span>
              <span class="info-value">
                <div style="display:flex;flex-wrap:wrap;gap:4px">
                  <el-tag
                    v-for="p in staff.role.permissions.slice(0, 8)"
                    :key="p"
                    size="small"
                    type="info"
                    plain
                  >{{ p }}</el-tag>
                  <el-tag v-if="staff.role.permissions.length > 8" size="small" type="info">
                    +{{ staff.role.permissions.length - 8 }} lainnya
                  </el-tag>
                </div>
              </span>
            </div>
          </div>
        </el-card>

        <!-- Ganti Password -->
        <el-card shadow="never" class="detail-card">
          <div class="section-title">Ganti Password</div>
          <el-form :model="pwForm" :rules="pwRules" ref="pwFormRef" label-position="top">
            <el-form-item label="Password Lama" prop="old_password">
              <el-input
                v-model="pwForm.old_password"
                type="password"
                placeholder="Masukkan password saat ini"
                show-password
              />
            </el-form-item>
            <div class="two-col-form">
              <el-form-item label="Password Baru" prop="new_password">
                <el-input
                  v-model="pwForm.new_password"
                  type="password"
                  placeholder="Minimal 6 karakter"
                  show-password
                />
              </el-form-item>
              <el-form-item label="Konfirmasi Password" prop="confirm_password">
                <el-input
                  v-model="pwForm.confirm_password"
                  type="password"
                  placeholder="Ulangi password baru"
                  show-password
                />
              </el-form-item>
            </div>
            <div style="display:flex;justify-content:flex-end">
              <el-button type="primary" :loading="changingPw" @click="changePassword">
                <el-icon><Lock /></el-icon> Simpan Password
              </el-button>
            </div>
          </el-form>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/authStore'
import { updateStaff } from '@/api/staff/staffApi'

const authStore = useAuthStore()
const staff = computed(() => authStore.staff)
const pwFormRef = ref()
const changingPw = ref(false)

const initials = computed(() => {
  const name = staff.value?.username || ''
  return name.slice(0, 2).toUpperCase()
})

const pwForm = reactive({
  old_password: '',
  new_password: '',
  confirm_password: '',
})

const pwRules = {
  old_password: [{ required: true, message: 'Password lama wajib diisi', trigger: 'blur' }],
  new_password: [{ required: true, min: 6, message: 'Password minimal 6 karakter', trigger: 'blur' }],
  confirm_password: [
    { required: true, message: 'Konfirmasi password wajib diisi', trigger: 'blur' },
    {
      validator: (_, val, cb) => {
        if (val !== pwForm.new_password) cb(new Error('Password tidak cocok'))
        else cb()
      },
      trigger: 'blur',
    },
  ],
}

const changePassword = async () => {
  await pwFormRef.value.validate(async (valid) => {
    if (!valid) return
    changingPw.value = true
    try {
      await updateStaff(staff.value.id, {
        old_password: pwForm.old_password,
        password: pwForm.new_password,
      })
      ElMessage.success('Password berhasil diperbarui')
      Object.assign(pwForm, { old_password: '', new_password: '', confirm_password: '' })
      pwFormRef.value.resetFields()
    } catch (e) {
      ElMessage.error(e?.response?.data?.message || 'Gagal mengubah password')
    } finally {
      changingPw.value = false
    }
  })
}
</script>

<style scoped>
.page-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:24px; }
.breadcrumb { font-size:12px; color:var(--text-muted); margin-bottom:4px; }
.page-title { font-size:22px; font-weight:700; color:var(--text-primary); }
.page-desc { font-size:13px; color:var(--text-secondary); margin-top:4px; }

.profile-layout { display:grid; grid-template-columns:280px 1fr; gap:16px; align-items:start; }
.left-col { display:flex; flex-direction:column; gap:16px; }
.right-col { display:flex; flex-direction:column; gap:16px; }

/* Identity Card */
.identity-card {
  border-color:var(--border-color) !important;
  text-align:center; padding:8px 0;
}
.avatar-wrap { position:relative; display:inline-block; margin-bottom:16px; }
.avatar-circle {
  width:80px; height:80px; border-radius:50%;
  background:var(--color-primary);
  display:flex; align-items:center; justify-content:center;
  font-size:28px; font-weight:800; color:#fff;
  letter-spacing:1px; position:relative; z-index:1;
}
.avatar-ring {
  position:absolute; inset:-4px;
  border-radius:50%; border:2px solid var(--color-primary);
  opacity:0.3;
}
.identity-name { font-size:18px; font-weight:700; color:var(--text-primary); margin-bottom:4px; }
.identity-email { font-size:12px; color:var(--text-secondary); margin-bottom:10px; }
.identity-role { margin-bottom:20px; }
.identity-meta {
  display:flex; flex-direction:column; gap:10px;
  border-top:1px solid var(--border-color); padding-top:16px; text-align:left;
}
.meta-item { display:flex; align-items:flex-start; gap:8px; font-size:12px; color:var(--text-secondary); }
.meta-item .el-icon { margin-top:1px; flex-shrink:0; color:var(--text-muted); }

/* Detail Card */
.detail-card { border-color:var(--border-color) !important; }
.section-title {
  font-size:14px; font-weight:700; color:var(--text-primary);
  margin-bottom:20px; padding-bottom:10px;
  border-bottom:1px solid var(--border-color);
}
.info-grid { display:flex; flex-direction:column; gap:0; }
.info-row {
  display:flex; align-items:flex-start; gap:16px;
  padding:10px 0; border-bottom:1px solid var(--border-color);
}
.info-row:last-child { border-bottom:none; }
.info-label { font-size:12px; color:var(--text-muted); width:130px; flex-shrink:0; padding-top:2px; }
.info-value { font-size:13px; color:var(--text-primary); font-weight:500; flex:1; }

/* Password form */
.two-col-form { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
</style>
