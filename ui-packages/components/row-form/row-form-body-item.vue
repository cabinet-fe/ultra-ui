<template>
  <tr
    v-for="(dataItem, dataIndex) of store.modelData.value"
    :key="dataIndex"
    :class="store.cls.em('tbody', 'hover')"
    v-contextmenu-operation
    @contextmenu.prevent="e => handleContextmenuClick(e, dataIndex, dataItem)"
  >
    <!-- 内容 -->
    <td
      v-for="(columnsItem, columnsIndex) of store.columns.value"
      :key="columnsIndex"
    >
      <div :class="store.cls.e('tbody-item')">
        <div @click="e => handleClick(e, dataIndex, dataItem, columnsItem)">
          <u-icon
            :size="16"
            v-if="columnsIndex === 0 && dataItem.children"
            :class="[...classList, bem.is('launch', dataItem.row?.isLunch)]"
            @click="handleLunchClick(dataItem)"
          >
            <CaretRight />
          </u-icon>
          <slot
            ref="slotsRef"
            :name="columnsItem.key"
            :data="dataItem"
            :index="columnsIndex"
          />
        </div>
      </div>
    </td>

    <!-- 操作栏 -->
    <td v-if="!store.props?.disabled">
      <button-common-props tag="span">
        <u-button
          :class="store.cls.m('interval')"
          :icon="Delete"
          type="primary"
          @click="handleDelete(dataItem, dataIndex)"
        />

        <u-button
          :icon="DocumentAdd"
          type="primary"
          @click="handleInsertTo(dataItem, dataIndex)"
        />
      </button-common-props>
    </td>
  </tr>

  <!-- <tr>123123</tr> -->
</template>
<script lang="ts" setup>
import { inject, computed, type PropType } from 'vue'
import type {
  RowFormColumn,
  RowFormItemEmits
} from '@ui/types/components/row-form'
import { bem } from '@ui/utils'
import { RowFormStoreType } from './di'
import vContextmenuOperation from '@ui/directives/contextmenu-operation'
import { Delete, DocumentAdd, CaretRight } from 'icon-ultra'
import { UButton } from '../button'
import { UIcon } from '../icon'
import { useComponentProps } from '@ui/compositions'
import type { ButtonProps } from '@ui/types/components/button'

defineProps({
  modelData: { type: Array as PropType<Record<string, any>[]> }
})

/** 事件 */
const emits = defineEmits<RowFormItemEmits>()

let store = inject(RowFormStoreType)!

const ButtonCommonProps = useComponentProps<ButtonProps>({
  circle: true,
  iconSize: 18,
  loading: false
})

/** 点击内容 */
const handleClick = (
  event: Event,
  dataIndex: number,
  dataItem: Record<string, any>,
  columnsItem: RowFormColumn
) => {
  emits('item-click', event, dataIndex, dataItem, columnsItem)
}

const classList = computed(() => {
  return [store.cls.em('tbody-item', 'tree')]
})

const handleLunchClick = (item) => {
  item.row.isLunch.value = !item.row.isLunch.value
}

/** 删除 */
const handleDelete = (data: Record<string, any>[], index: number) => {
  emits('delete', data, index)
}

/** 插入 */
const handleInsertTo = (data: Record<string, any>[], index: number) => {
  emits('insert', data, index)
}

/** 右击 */
const handleContextmenuClick = (
  event: MouseEvent,
  index: number,
  dataItem: Record<string, any>
) => {
  emits('contextmenu', event, index, dataItem)
}
</script>
