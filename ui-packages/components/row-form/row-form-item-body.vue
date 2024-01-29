<template>
  <!-- 内容 -->
  <div @click="handleClick">
    <slot ref="slotsRef" :name="columnsItem.key" :row="dataItem" />
  </div>
</template>
<script lang="ts" setup>
import { type PropType } from 'vue'
import type { RowFormColumn, RowFormItemEmits } from './row-form.type'
// import { RowFormStoreType } from './di'

defineProps({
  columnsItem: {
    type: Object as PropType<RowFormColumn>,
    required: true
  },
  dataItem: { type: Object }
})

// let store = inject(RowFormStoreType)!

/** 事件 */
const emit = defineEmits<RowFormItemEmits>()

/** 点击内容 */
const handleClick = (value: Event) => {
  emit('item-click', value)
}
</script>
<style lang="scss" scoped></style>
