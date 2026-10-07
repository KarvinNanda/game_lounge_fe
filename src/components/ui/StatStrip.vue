<template>
  <div class="ui-stat-strip">
    <div v-for="item in items" :key="item.label" class="ui-stat">
      <div class="ui-stat__value" :class="`ui-stat__value--${toneOf(item)}`">{{ display(item.value) }}</div>
      <div class="ui-stat__label">{{ item.label }}</div>
      <div v-if="item.hint" class="ui-stat__hint">{{ item.hint }}</div>
    </div>
  </div>
</template>

<script setup>
const TONES = ['default', 'success', 'warning', 'danger', 'info']

defineProps({
  // [{ label: string, value: string|number, tone?: TONES[number], hint?: string }]
  items: { type: Array, required: true },
})

const toneOf = (item) => (TONES.includes(item.tone) ? item.tone : 'default')
const display = (v) => (v === null || v === undefined || v === '' ? '—' : v)
</script>

<style scoped>
.ui-stat-strip {
  display: flex; flex-wrap: wrap; align-items: center;
  min-height: 56px; padding: var(--space-2) var(--space-4); margin-bottom: var(--space-3);
  background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg);
}
.ui-stat { flex: 1 1 120px; min-width: 0; text-align: center; padding: 0 var(--space-2); }
.ui-stat + .ui-stat { border-left: 1px solid var(--border); }
.ui-stat__value {
  font-size: 18px; font-weight: 700; line-height: 1.3; font-variant-numeric: tabular-nums;
  /* Wrap, never cut: a truncated money value reads as a different number. */
  overflow-wrap: anywhere;
}
.ui-stat__value--default { color: var(--text-primary); }
.ui-stat__value--success { color: var(--success); }
.ui-stat__value--warning { color: var(--warning); }
.ui-stat__value--danger  { color: var(--danger); }
.ui-stat__value--info    { color: var(--action); }
.ui-stat__label, .ui-stat__hint { font-size: var(--font-size-xs); color: var(--text-muted); }
@media (max-width: 639px) {
  .ui-stat { flex-basis: 50%; padding: var(--space-1) 0; }
  .ui-stat + .ui-stat { border-left: none; }
}
</style>
