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
  /* Fields carry fixed widths from the views' scoped classes; on phones every
     field stretches. !important beats those view classes. Date pickers render
     no scoped root, so :slotted never reaches them; :deep does. */
  :slotted(.el-input), :slotted(.el-select), .ui-filter-bar__fields :deep(.el-date-editor) { width: 100% !important; }
}
</style>
