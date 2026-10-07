<template>
  <el-pagination
    class="ui-pagination"
    :current-page="page"
    :page-size="pageSize"
    :total="total"
    :page-sizes="PAGE_SIZES"
    :layout="sizes ? 'sizes, prev, pager, next' : 'prev, pager, next'"
    @update:current-page="onPage"
    @update:page-size="onSize"
  />
</template>

<script setup>
import { nextTick } from 'vue'

// Backend caps per_page at 100.
const PAGE_SIZES = [10, 20, 50, 100]

defineProps({
  page: { type: Number, required: true },
  pageSize: { type: Number, default: 10 },
  total: { type: Number, default: 0 },
  sizes: { type: Boolean, default: true },
})
const emit = defineEmits(['update:page', 'update:pageSize', 'change'])

// One change per user action: a size pick can also clamp the page in the same
// tick. Emitted after the parent has applied the v-model updates. Element
// Plus' own `change` is not forwarded: it also fires when the view sets the
// page in code, and the view already fetches then.
let queued = false
const queueChange = () => {
  if (queued) return
  queued = true
  nextTick(() => {
    queued = false
    emit('change')
  })
}

const onPage = (v) => { emit('update:page', v); queueChange() }
const onSize = (v) => { emit('update:pageSize', v); queueChange() }
</script>
