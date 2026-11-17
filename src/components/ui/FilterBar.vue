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
  .ui-filter-bar { flex-direction: column; align-items: stretch; }
  /* Fields carry fixed widths from the views' scoped classes; on phones they
     follow the bar instead. !important beats those view classes. Date pickers
     render no scoped root, so :slotted never reaches them; :deep does.
     Search inputs and date pickers take a full row. */
  :slotted(.el-input), .ui-filter-bar__fields :deep(.el-date-editor) { width: 100% !important; flex: 1 1 100%; }
  /* Selects share a row two by two (their values are short); a select left
     alone on its row fills it. */
  :slotted(.el-select) { width: auto !important; flex: 1 1 calc(50% - var(--space-2)); min-width: calc(50% - var(--space-2)); }
  /* Reset keeps its own size at the end of the row instead of a full-width bar. */
  .ui-filter-bar__actions { justify-content: flex-end; }
}
</style>
