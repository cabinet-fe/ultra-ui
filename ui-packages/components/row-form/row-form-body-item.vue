<template>
  <tr
    :class="cls.em('tbody', 'hover')"
    @contextmenu.prevent="e => handleContextmenuClick(e, row.index, row.data)"
  >
    <ItemRender
      :custom-row="row"
      @click="(e, key) => handleClick(e, row.index, row.data, key)"
    />

    <!-- 操作栏 -->
    <td v-if="!injected.props?.disabled">
      <button-common-props tag="span">
        <u-button
          :class="cls.m('interval')"
          :icon="Delete"
          type="primary"
          @click="handleDelete(row.data, row.index)"
        />

        <u-button
          :icon="DocumentAdd"
          type="primary"
          @click="handleInsertTo(row.data, row.index)"
        />
      </button-common-props>
    </td>

    <!-- <u-icon
            :size="16"
            v-if="index === 0 && dataItem.children"
            :class="[...classList, bem.is('launch', dataItem.extends)]"
            @click="handleLunchClick(dataItem)"
          >
            <CaretRight />
          </u-icon> -->
  </tr>
</template>
<script lang="ts" setup>
import { inject } from 'vue'
import type { PropType } from 'vue'
import type {
  Row,
  RowFormColumn,
  RowFormItemEmits
} from '@ui/types/components/row-form'
import { RowFormInjectType } from './di'
// import vContextmenuOperation from '@ui/directives/contextmenu-operation'
import { Delete, DocumentAdd } from 'icon-ultra'
import { UButton } from '../button'
// import { UIcon } from '../icon'
import { useComponentProps } from '@ui/compositions'
import type { ButtonProps } from '@ui/types/components/button'
import ItemRender from './item-render'

defineProps({
  row: {
    type: Object as PropType<Row<Record<string, any>>>,
    required: true
  }
})

/** 事件 */
const emits = defineEmits<RowFormItemEmits>()

let injected = inject(RowFormInjectType)!

const { cls } = injected

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
  emits('click', event, dataIndex, dataItem, columnsItem)
  console.log('click')
}

// const classList = computed(() => {
//   return [cls.em('tbody-item', 'tree')]
// })

// const handleLunchClick = item => {
//   // item.row.isLunch.value = !item.row.isLunch.value
// }

/** 获取插槽 */
// const getRowFormSlotsNodes = (key: string, data: Record<string, any>) => {
//   return rowFormSlots!['column:' + key]?.({ data, row: props.row })
// }

/** 删除 */
const handleDelete = (data: Record<string, any>, index: number) => {
  // emits('delete', data, index)
}

/** 插入 */
const handleInsertTo = (data: Record<string, any>, index: number) => {
  // emits('insert', data, index)
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
./item-render./item-render