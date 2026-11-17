<template>
  <div class="audit-trail" v-if="hasAudit">
    <div class="at-title">
      <el-icon size="11"><Clock /></el-icon>
      <span>Audit Trail</span>
    </div>
    <div class="at-rows">
      <div v-if="createdUser || createdAt" class="at-row">
        <span class="at-label">Dibuat</span>
        <span class="at-value">
          <span v-if="createdUser" class="at-user">{{ createdUser }}</span>
          <span v-if="createdAt" class="at-date">{{ formatDate(createdAt) }}</span>
        </span>
      </div>
      <div v-if="updatedUser || updatedAt" class="at-row">
        <span class="at-label">Diubah</span>
        <span class="at-value">
          <span v-if="updatedUser" class="at-user">{{ updatedUser }}</span>
          <span v-if="updatedAt" class="at-date">{{ formatDate(updatedAt) }}</span>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { auditUser } from '@/utils/audit'

const props = defineProps({
  createdBy:  { type: [String, Object], default: null },
  updatedBy:  { type: [String, Object], default: null },
  createdByName: { type: String, default: null },
  updatedByName: { type: String, default: null },
  createdAt:  { type: String, default: null },
  updatedAt:  { type: String, default: null },
})

const createdUser = computed(() => auditUser(props.createdBy, props.createdByName))
const updatedUser = computed(() => auditUser(props.updatedBy, props.updatedByName))

const hasAudit = computed(() =>
  createdUser.value || updatedUser.value || props.createdAt || props.updatedAt
)

const formatDate = (val) => {
  if (!val) return ''
  try {
    return new Date(val).toLocaleString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch {
    return val
  }
}
</script>

<style scoped>
.audit-trail {
  margin-top: 16px;
  padding: 10px 12px;
  background: var(--bg-main);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 11px;
}
.at-title {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: 8px;
}
.at-rows { display: flex; flex-direction: column; gap: 5px; }
.at-row  { display: flex; align-items: center; gap: 8px; }
.at-label {
  font-size: 10px;
  font-weight: 700;
  color: var(--text-muted);
  width: 44px;
  flex-shrink: 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.at-value { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.at-user {
  font-weight: 700;
  color: var(--color-primary-light);
  font-size: 11px;
}
.at-date { color: var(--text-secondary); font-size: 11px; }
</style>
