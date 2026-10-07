<template>
  <div class="ui-page-header">
    <div class="ui-page-header__text">
      <div v-if="breadcrumb" class="ui-page-header__crumb">{{ breadcrumb }}</div>
      <h1 class="ui-page-header__title">{{ title }}</h1>
      <p v-if="description" class="ui-page-header__desc" :title="description">{{ description }}</p>
    </div>
    <div v-if="$slots.actions" class="ui-page-header__actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  breadcrumb: { type: String, default: '' },
})
</script>

<style scoped>
.ui-page-header {
  display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-start;
  gap: var(--space-3); margin-bottom: var(--space-4);
}
.ui-page-header__text { min-width: 0; flex: 1 1 240px; }
.ui-page-header__crumb { font-size: var(--font-size-xs); color: var(--text-muted); margin-bottom: 2px; }
.ui-page-header__title { font-size: 18px; font-weight: 700; line-height: 1.3; color: var(--text-primary); margin: 0; }
.ui-page-header__desc {
  font-size: var(--font-size-xs); color: var(--text-secondary); margin: 2px 0 0;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.ui-page-header__actions { display: flex; flex-wrap: wrap; gap: var(--space-2); align-items: center; }
</style>
