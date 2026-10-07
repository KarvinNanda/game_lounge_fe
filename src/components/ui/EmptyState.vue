<template>
  <div class="ui-empty">
    <div v-if="$slots.icon" class="ui-empty__icon" aria-hidden="true"><slot name="icon" /></div>
    <p class="ui-empty__title">{{ title }}</p>
    <p v-if="description" class="ui-empty__desc">{{ description }}</p>
    <div v-if="$slots.action" class="ui-empty__action"><slot name="action" /></div>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  description: { type: String, default: '' },
})
</script>

<style scoped>
.ui-empty {
  grid-column: 1 / -1;
  display: flex; flex-direction: column; align-items: center; gap: var(--space-2);
  padding: 48px var(--space-4); text-align: center; color: var(--text-muted);
}
.ui-empty__title { margin: 0; font-size: var(--font-size-base); color: var(--text-secondary); }
.ui-empty__desc { margin: 0; font-size: var(--font-size-xs); }
.ui-empty__action { margin-top: var(--space-2); }
</style>
