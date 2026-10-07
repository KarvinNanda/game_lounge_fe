<template>
  <div class="ui-filter-bar">
    <div class="ui-filter-bar__fields"><slot /></div>
    <div v-if="$slots.actions" class="ui-filter-bar__actions"><slot name="actions" /></div>
  </div>
</template>

<style scoped>
.ui-filter-bar {
  display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center;
  gap: var(--space-2); margin-bottom: var(--space-3);
}
.ui-filter-bar:last-child { margin-bottom: 0; }
.ui-filter-bar__fields, .ui-filter-bar__actions { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-2); }
.ui-filter-bar__fields { flex: 1 1 auto; min-width: 0; }
@media (max-width: 639px) {
  .ui-filter-bar, .ui-filter-bar__fields { flex-direction: column; align-items: stretch; }
  /* Views still set inline widths (style="width:260px"); only !important beats
     an inline style. Removing those inline widths is sub-project C. */
  :slotted(.el-input), :slotted(.el-select), :slotted(.el-date-editor) { width: 100% !important; }
}
</style>
