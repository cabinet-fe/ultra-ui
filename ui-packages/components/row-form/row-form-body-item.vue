<template>
  <tr
    v-for="(dataItem, dataIndex) of modelData"
    :key="dataIndex"
    :class="store.cls.em('tbody', 'hover')"
    @contextmenu.prevent="e => handleContextmenuClick(e, dataIndex, dataItem)"
  >
    <!-- 内容 -->
    <td
      v-for="(columnsItem, columnsIndex) of store.columns"
      :key="columnsIndex"
    >
      <!-- 内容 -->
      <div :class="store.cls.e('tbody-item')">
        <div @click="e => handleClick(e, dataIndex, dataItem, columnsItem)">
          <span
            :class="[store.cls.em('tbody-item', 'tree'), isClass]"
            v-if="columnsIndex === 0 && dataItem?.children"
            @click="handleChildClass"
          >
            >
          </span>

          <slot ref="slotsRef" :name="columnsItem.key" :row="dataItem" />
        </div>
      </div>
    </td>
  </tr>
</template>
<script lang="ts" setup>
import { inject, ref, computed, type PropType } from 'vue'
import type { RowFormColumn, RowFormItemEmits } from './row-form.type'
import { RowFormStoreType } from './di'
import { bem } from '@ui/utils'

defineProps({
  modelData: { type: Array as PropType<Record<string, any>[]> }
})

/** 事件 */
const emit = defineEmits<RowFormItemEmits>()

let store = inject(RowFormStoreType)!

/** 点击内容 */
const handleClick = (
  e: Event,
  dataIndex: number,
  dataItem: Record<string, any>,
  columnsItem: RowFormColumn
) => {
  emit('item-click', e, dataIndex, dataItem, columnsItem)
}
/** 是否是展开的 */
const launch = ref(false)

const isClass = computed(() => {
  return launch.value
    ? bem.is('launch', launch.value)
    : bem.is('put-it-away', launch.value)
})

const handleChildClass = () => {
  launch.value = !launch.value
}

/** 右击 */
const handleContextmenuClick = (
  e: MouseEvent,
  index: number,
  dataItem: Record<string, any>
) => {
  emit('contextmenu', e, index, dataItem)
}
</script>
<style lang="scss" scoped></style>
