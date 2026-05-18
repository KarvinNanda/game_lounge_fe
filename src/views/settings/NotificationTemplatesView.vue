<template>
  <div>
    <!-- ── Header ── -->
    <div class="page-header">
      <div>
        <div class="breadcrumb">Settings › Template Notifikasi</div>
        <h1 class="page-title">Template Notifikasi</h1>
        <p class="page-desc">Atur kata-kata pesan Email & WhatsApp yang dikirim ke customer.</p>
      </div>
    </div>

    <!-- ── Info box ── -->
    <div class="info-banner">
      <el-icon style="flex-shrink:0;margin-top:1px"><InfoFilled /></el-icon>
      <span>
        Gunakan <strong class="var-inline">&#123;&#123;nama_variabel&#125;&#125;</strong> untuk data dinamis.
        Contoh: <span class="var-inline">&#123;&#123;nama_customer&#125;&#125;</span> akan diganti nama asli saat pesan dikirim.
      </span>
    </div>

    <!-- ── Template Cards ── -->
    <div v-loading="loading" class="template-grid">
      <div
        v-for="tmpl in templates"
        :key="tmpl.notification_key"
        class="template-card"
        @click="openEditor(tmpl)"
      >
        <div class="card-icon" :style="{ background: getIconBg(tmpl.notification_key) }">
          <el-icon size="20" :style="{ color: getIconColor(tmpl.notification_key) }">
            <component :is="getIcon(tmpl.notification_key)" />
          </el-icon>
        </div>

        <div class="card-body">
          <div class="card-name">{{ tmpl.name }}</div>
          <div class="card-desc">{{ tmpl.description }}</div>
          <div class="card-channels">
            <el-tag size="small" :type="tmpl.is_email_active ? 'info' : 'danger'">
              <el-icon style="margin-right:3px"><Message /></el-icon>
              Email {{ tmpl.is_email_active ? 'Aktif' : 'Nonaktif' }}
            </el-tag>
            <el-tag size="small" :type="tmpl.is_whatsapp_active ? 'success' : 'danger'">
              <el-icon style="margin-right:3px"><ChatDotRound /></el-icon>
              WA {{ tmpl.is_whatsapp_active ? 'Aktif' : 'Nonaktif' }}
            </el-tag>
          </div>
        </div>

        <div class="card-edit-hint">
          <el-icon><EditPen /></el-icon>
          <span v-if="!isMobile">Edit</span>
        </div>
      </div>

      <!-- Empty -->
      <div v-if="!loading && templates.length === 0" class="empty-state">
        <el-icon size="36" style="color:var(--text-muted);opacity:.4"><Bell /></el-icon>
        <div style="margin-top:10px;font-size:13px;color:var(--text-muted)">Belum ada template notifikasi</div>
      </div>
    </div>

    <!-- ════════════════════════════════════════════════════════
         DRAWER: Editor Template
    ════════════════════════════════════════════════════════ -->
    <el-drawer
      v-model="editorVisible"
      :title="editingTemplate?.name || 'Edit Template'"
      direction="rtl"
      :size="isMobile ? '100%' : isTablet ? '90%' : '640px'"
      :destroy-on-close="true"
    >
      <div v-if="editingTemplate" class="editor-wrap">

        <!-- Description pill -->
        <div class="editor-desc-pill">
          <el-icon><InfoFilled /></el-icon>
          <span>{{ editingTemplate.description }}</span>
        </div>

        <!-- ── Available Variables ── -->
        <div class="vars-block">
          <div class="vars-heading">
            <el-icon size="12"><Lightning /></el-icon>
            Variabel tersedia — klik untuk sisipkan ke teks
          </div>
          <div class="vars-wrap">
            <div
              v-for="v in parsedVariables"
              :key="v.key"
              class="var-chip"
              @click="insertVariable(v.key)"
              :title="`Sisipkan {{${v.key}}}`"
            >
              <span class="var-code">&#123;&#123;{{ v.key }}&#125;&#125;</span>
              <span class="var-label">{{ v.label }}</span>
            </div>
            <div v-if="parsedVariables.length === 0" style="font-size:11px;color:var(--text-muted)">
              Tidak ada variabel untuk template ini
            </div>
          </div>
        </div>

        <!-- ── Channel Tabs ── -->
        <el-tabs v-model="activeChannel" class="channel-tabs" @tab-change="previewRendered = ''">

          <!-- Email Tab -->
          <el-tab-pane name="email">
            <template #label>
              <span class="tab-label">
                <el-icon><Message /></el-icon> Email
              </span>
            </template>
            <div class="tab-content">
              <div class="channel-toggle">
                <div class="toggle-info">
                  <el-icon size="14"><Message /></el-icon>
                  <span>Kirim via Email</span>
                </div>
                <el-switch v-model="form.is_email_active" active-text="Aktif" inactive-text="Nonaktif" />
              </div>

              <el-form label-position="top">
                <el-form-item label="Subject Email">
                  <el-input
                    ref="emailSubjectRef"
                    v-model="form.email_subject"
                    placeholder="Contoh: Booking Berhasil! Kode: {{kode_booking}}"
                    :disabled="!form.is_email_active"
                    @focus="activeInput = 'email_subject'"
                  />
                </el-form-item>
                <el-form-item label="Isi Pesan Email">
                  <el-input
                    ref="emailBodyRef"
                    v-model="form.email_body"
                    type="textarea"
                    :rows="isMobile ? 8 : 11"
                    :disabled="!form.is_email_active"
                    placeholder="Tulis isi pesan email di sini..."
                    @focus="activeInput = 'email_body'"
                    class="mono-input"
                  />
                </el-form-item>
              </el-form>

              <div class="format-tips">
                <div class="tips-title">💡 Tips Format Email</div>
                <div class="tips-body">
                  Tulis teks biasa, tekan Enter untuk baris baru.<br>
                  Klik variabel di atas untuk sisipkan otomatis.
                </div>
              </div>
            </div>
          </el-tab-pane>

          <!-- WhatsApp Tab -->
          <el-tab-pane name="whatsapp">
            <template #label>
              <span class="tab-label">
                <el-icon><ChatDotRound /></el-icon> WhatsApp
              </span>
            </template>
            <div class="tab-content">
              <div class="channel-toggle">
                <div class="toggle-info">
                  <el-icon size="14"><ChatDotRound /></el-icon>
                  <span>Kirim via WhatsApp</span>
                </div>
                <el-switch v-model="form.is_whatsapp_active" active-text="Aktif" inactive-text="Nonaktif" />
              </div>

              <el-form label-position="top">
                <el-form-item label="Isi Pesan WhatsApp">
                  <el-input
                    ref="waBodyRef"
                    v-model="form.whatsapp_body"
                    type="textarea"
                    :rows="isMobile ? 10 : 14"
                    :disabled="!form.is_whatsapp_active"
                    placeholder="Tulis pesan WhatsApp di sini..."
                    @focus="activeInput = 'whatsapp_body'"
                    class="mono-input"
                  />
                </el-form-item>
              </el-form>

              <div class="format-tips">
                <div class="tips-title">💡 Tips Format WhatsApp</div>
                <div class="tips-body">
                  *teks* untuk <strong>tebal</strong> &nbsp;·&nbsp;
                  _teks_ untuk <em>miring</em> &nbsp;·&nbsp;
                  Emoji langsung ditulis 🎮 ✅
                </div>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>

        <!-- ── Preview ── -->
        <div class="preview-section">
          <div class="preview-header">
            <span class="preview-title">Preview dengan Data Contoh</span>
            <el-button size="small" plain :loading="previewing" @click="handlePreview">
              <el-icon><View /></el-icon> Preview
            </el-button>
          </div>
          <div v-if="previewRendered" class="preview-box">
            <pre class="preview-pre">{{ previewRendered }}</pre>
          </div>
          <div v-else class="preview-placeholder">
            Klik "Preview" untuk melihat tampilan pesan dengan data contoh
          </div>
        </div>

        <!-- ── Drawer Footer ── -->
        <div class="drawer-footer">
          <el-button style="flex:1" @click="editorVisible = false">Batal</el-button>
          <el-button type="primary" style="flex:1" :loading="saving" @click="handleSave">
            <el-icon><Check /></el-icon> Simpan Template
          </el-button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useBreakpoint } from '@/composables/useBreakpoint'
import { getTemplates, updateTemplate, previewTemplate } from '@/api/notification_template/notificationTemplateApi'

const { isMobile, isTablet } = useBreakpoint()

// ── State ─────────────────────────────────────────────────────
const loading        = ref(false)
const saving         = ref(false)
const previewing     = ref(false)
const templates      = ref([])
const editorVisible  = ref(false)
const editingTemplate = ref(null)
const activeChannel  = ref('email')
const activeInput    = ref('email_body')
const previewRendered = ref('')

const emailSubjectRef = ref()
const emailBodyRef    = ref()
const waBodyRef       = ref()

const form = reactive({
  email_subject:      '',
  email_body:         '',
  whatsapp_body:      '',
  is_email_active:    true,
  is_whatsapp_active: true,
})

// ── Computed ──────────────────────────────────────────────────
const parsedVariables = computed(() => {
  if (!editingTemplate.value?.available_variables) return []
  try {
    const raw = editingTemplate.value.available_variables
    return typeof raw === 'string' ? JSON.parse(raw) : raw
  } catch { return [] }
})

// ── API calls ─────────────────────────────────────────────────
const fetchTemplates = async () => {
  loading.value = true
  try {
    const { data } = await getTemplates()
    templates.value = data.data || []
  } catch {
    ElMessage.error('Gagal memuat template notifikasi')
  } finally {
    loading.value = false
  }
}

// ── Editor ────────────────────────────────────────────────────
const openEditor = (tmpl) => {
  editingTemplate.value = tmpl
  Object.assign(form, {
    email_subject:      tmpl.email_subject      || '',
    email_body:         tmpl.email_body         || '',
    whatsapp_body:      tmpl.whatsapp_body       || '',
    is_email_active:    tmpl.is_email_active,
    is_whatsapp_active: tmpl.is_whatsapp_active,
  })
  previewRendered.value = ''
  activeChannel.value = 'email'
  activeInput.value   = 'email_body'
  editorVisible.value = true
}

// Insert variable at cursor position in the active textarea
const insertVariable = (key) => {
  const varText = `{{${key}}}`

  let targetRef   = null
  let targetField = ''

  if (activeChannel.value === 'email') {
    if (activeInput.value === 'email_subject') {
      targetRef   = emailSubjectRef.value
      targetField = 'email_subject'
    } else {
      targetRef   = emailBodyRef.value
      targetField = 'email_body'
    }
  } else {
    targetRef   = waBodyRef.value
    targetField = 'whatsapp_body'
  }

  const el = targetRef?.$el?.querySelector('textarea') || targetRef?.$el?.querySelector('input')
  if (el) {
    const start = el.selectionStart
    const end   = el.selectionEnd
    form[targetField] = form[targetField].substring(0, start) + varText + form[targetField].substring(end)
    setTimeout(() => {
      el.focus()
      el.setSelectionRange(start + varText.length, start + varText.length)
    }, 10)
  } else {
    form[targetField] = (form[targetField] || '') + varText
  }

  ElMessage.success({ message: `${varText} disisipkan`, duration: 1200 })
}

const handlePreview = async () => {
  if (!editingTemplate.value) return
  previewing.value = true
  try {
    const { data } = await previewTemplate({
      notification_key: editingTemplate.value.notification_key,
      channel: activeChannel.value,
    })
    previewRendered.value = data.data?.rendered || data.data || ''
  } catch {
    ElMessage.error('Gagal generate preview')
  } finally {
    previewing.value = false
  }
}

const handleSave = async () => {
  if (!editingTemplate.value) return
  saving.value = true
  try {
    await updateTemplate(editingTemplate.value.notification_key, {
      email_subject:      form.email_subject,
      email_body:         form.email_body,
      whatsapp_body:      form.whatsapp_body,
      is_email_active:    form.is_email_active,
      is_whatsapp_active: form.is_whatsapp_active,
    })
    ElMessage.success('Template berhasil disimpan')
    editorVisible.value = false
    fetchTemplates()
  } catch (e) {
    ElMessage.error(e?.response?.data?.message || 'Gagal menyimpan template')
  } finally {
    saving.value = false
  }
}

// ── Helpers ───────────────────────────────────────────────────
const ICON_MAP = {
  customer_welcome:     'User',
  voucher_notification: 'Ticket',
  booking_confirmation: 'Calendar',
}
const BG_MAP = {
  customer_welcome:     'rgba(124,58,237,0.1)',
  voucher_notification: 'rgba(245,158,11,0.1)',
  booking_confirmation: 'rgba(16,185,129,0.1)',
}
const COLOR_MAP = {
  customer_welcome:     '#7C3AED',
  voucher_notification: '#D97706',
  booking_confirmation: '#059669',
}
const getIcon      = (key) => ICON_MAP[key]  || 'Bell'
const getIconBg    = (key) => BG_MAP[key]    || 'rgba(124,58,237,0.1)'
const getIconColor = (key) => COLOR_MAP[key] || '#7C3AED'

onMounted(fetchTemplates)
</script>

<style scoped>
/* ── Page ────────────────────────────────────────────── */
.page-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px; }
.breadcrumb  { font-size:11px; color:var(--text-muted); margin-bottom:3px; }
.page-title  { font-size:22px; font-weight:800; color:var(--text-primary); }
.page-desc   { font-size:13px; color:var(--text-secondary); margin-top:4px; }

/* ── Info banner ─────────────────────────────────────── */
.info-banner {
  display:flex; align-items:flex-start; gap:10px;
  background:rgba(2,130,222,0.07); border:1px solid rgba(2,130,222,0.2);
  border-radius:10px; padding:12px 16px;
  font-size:13px; color:var(--text-secondary);
  margin-bottom:20px; line-height:1.6;
}
.var-inline {
  background:rgba(124,58,237,0.1); color:var(--color-primary);
  border:1px solid rgba(124,58,237,0.2); border-radius:4px;
  padding:1px 6px; font-size:12px; font-family:monospace; font-weight:600;
}

/* ── Template grid ───────────────────────────────────── */
.template-grid {
  display:grid;
  grid-template-columns: repeat(2, 1fr);
  gap:12px;
}

.template-card {
  background:var(--bg-card); border:1px solid var(--border-color); border-radius:12px;
  padding:18px 20px; display:flex; align-items:flex-start; gap:14px;
  cursor:pointer; transition:border-color 0.18s, box-shadow 0.18s, transform 0.15s;
  position:relative;
}
.template-card:hover {
  border-color:var(--color-primary);
  box-shadow:0 0 0 3px rgba(2,130,222,0.07), 0 4px 16px rgba(0,0,0,0.06);
  transform:translateY(-2px);
}
.template-card:active { transform:translateY(0); }

.card-icon {
  width:48px; height:48px; border-radius:12px;
  display:flex; align-items:center; justify-content:center;
  flex-shrink:0;
}
.card-body  { flex:1; min-width:0; }
.card-name  { font-size:14px; font-weight:700; color:var(--text-primary); margin-bottom:4px; }
.card-desc  { font-size:12px; color:var(--text-secondary); line-height:1.5; margin-bottom:10px; }
.card-channels { display:flex; gap:6px; flex-wrap:wrap; }

.card-edit-hint {
  position:absolute; top:14px; right:14px;
  display:flex; align-items:center; gap:5px;
  color:var(--text-muted); font-size:11px; font-weight:600;
  padding:4px 8px;
  border:1px solid var(--border-color); border-radius:6px;
  background:var(--bg-main); transition:all 0.18s;
}
.template-card:hover .card-edit-hint {
  border-color:var(--color-primary);
  color:var(--color-primary);
  background:rgba(2,130,222,0.06);
}

.empty-state {
  grid-column: 1 / -1;
  text-align:center; padding:48px 20px;
  background:var(--bg-card); border:1px dashed var(--border-color);
  border-radius:12px; display:flex; flex-direction:column; align-items:center;
}

/* ── Editor Drawer ───────────────────────────────────── */
.editor-wrap { display:flex; flex-direction:column; gap:14px; padding-bottom:80px; }

.editor-desc-pill {
  display:flex; align-items:flex-start; gap:8px;
  background:var(--bg-main); border:1px solid var(--border-color);
  border-radius:8px; padding:10px 14px;
  font-size:12px; color:var(--text-secondary); line-height:1.6;
}

/* Variables block */
.vars-block {
  background:var(--bg-card); border:1px solid var(--border-color);
  border-radius:10px; padding:12px 14px;
}
.vars-heading {
  display:flex; align-items:center; gap:5px;
  font-size:11px; font-weight:700; color:var(--text-secondary);
  text-transform:uppercase; letter-spacing:0.6px; margin-bottom:10px;
}
.vars-wrap { display:flex; flex-wrap:wrap; gap:6px; }

.var-chip {
  display:flex; align-items:center; gap:5px;
  background:rgba(124,58,237,0.08); border:1px solid rgba(124,58,237,0.18);
  border-radius:6px; padding:5px 10px;
  cursor:pointer; transition:all 0.15s; user-select:none;
}
.var-chip:hover { background:rgba(124,58,237,0.18); transform:translateY(-1px); box-shadow:0 2px 6px rgba(124,58,237,0.15); }
.var-chip:active { transform:translateY(0); }
.var-code  { font-size:11px; font-weight:700; font-family:monospace; color:var(--color-primary); }
.var-label { font-size:10px; color:var(--text-secondary); white-space:nowrap; }

/* Channel tabs */
.channel-tabs :deep(.el-tabs__nav-wrap) { margin-bottom:0; }
.tab-label { display:flex; align-items:center; gap:5px; font-size:13px; }
.tab-content { padding-top:12px; }

.channel-toggle {
  display:flex; justify-content:space-between; align-items:center;
  background:var(--bg-main); border:1px solid var(--border-color);
  border-radius:8px; padding:10px 14px; margin-bottom:14px;
}
.toggle-info { display:flex; align-items:center; gap:7px; font-size:13px; font-weight:600; color:var(--text-primary); }

.mono-input :deep(textarea) { font-family:monospace; font-size:13px; line-height:1.6; }

.format-tips {
  background:var(--bg-main); border:1px solid var(--border-color);
  border-radius:8px; padding:10px 14px;
}
.tips-title { font-size:12px; font-weight:700; color:var(--text-primary); margin-bottom:3px; }
.tips-body  { font-size:11px; color:var(--text-secondary); line-height:1.7; }

/* Preview */
.preview-section { display:flex; flex-direction:column; gap:8px; }
.preview-header {
  display:flex; justify-content:space-between; align-items:center;
}
.preview-title { font-size:13px; font-weight:700; color:var(--text-primary); }
.preview-box {
  background:var(--bg-main); border:1px solid var(--border-color);
  border-radius:8px; padding:14px 16px; max-height:200px; overflow-y:auto;
}
.preview-pre { white-space:pre-wrap; font-size:12px; font-family:inherit; margin:0; color:var(--text-primary); line-height:1.6; }
.preview-placeholder {
  text-align:center; font-size:12px; color:var(--text-muted);
  padding:16px; border:1px dashed var(--border-color); border-radius:8px;
}

/* Drawer footer — fixed at bottom */
.drawer-footer {
  position:sticky; bottom:0;
  display:flex; gap:10px;
  padding:14px 0 0;
  border-top:1px solid var(--border-color);
  background:var(--bg-card);
  margin-top:auto;
}

/* ── Responsive ──────────────────────────────────────── */
@media (max-width:1023px) {
  .template-grid { grid-template-columns: 1fr; }
}
@media (max-width:639px) {
  .page-title { font-size:18px; }
  .template-card { padding:12px 14px; gap:10px; }
  .card-icon { width:40px; height:40px; border-radius:10px; }
  .card-name { font-size:13px; }
  .card-desc { font-size:11px; }
  .card-edit-hint { top:10px; right:10px; padding:3px 6px; font-size:10px; }
  .info-banner { font-size:12px; padding:10px 12px; }
  .vars-block { padding:10px 12px; }
  .var-chip { padding:4px 8px; }
  .var-label { display:none; }
}
</style>
