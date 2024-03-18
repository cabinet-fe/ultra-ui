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
      <!-- 内容 -->
      <div :class="store.cls.e('tbody-item')">
        <div @click="e => handleClick(e, dataIndex, dataItem, columnsItem)">
          <!-- <span
            :class="classList"
            @click="handleChildClass"
            v-if="columnsIndex === 0 && dataItem?.children?.length > 0"
          >
            >
          </span> -->

          <slot
            ref="slotsRef"
            :name="columnsItem.key"
            :data="dataItem"
            :index="columnsIndex"
          />

          <!-- </slot> -->

          <!-- <row-form-body-item
            v-if="dataItem?.children"
            :modelData="dataItem?.children"
          /> -->
        </div>
      </div>
    </td>
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
</template>
<script lang="ts" setup>
import { inject, ref, computed, type PropType } from 'vue'
import type {
  RowFormColumn,
  RowFormItemEmits
} from '@ui/types/components/row-form'
import { RowFormStoreType } from './di'
import { bem } from '@ui/utils'
import vContextmenuOperation from '@ui/directives/contextmenu-operation'
import { Delete, DocumentAdd } from 'icon-ultra'
import { UButton } from '../button'
import { useComponentProps } from '@ui/compositions'
import type { ButtonProps } from '@ui/types/components/button'
// import { wrapDataRows } from './row-forms'

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
/** 是否是展开的 */
const launch = ref(false)

const classList = computed(() => {
  return [store.cls.em('tbody-item', 'tree'), bem.is('launch', launch.value)]
})

const handleChildClass = () => {
  launch.value = !launch.value
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
  // console.log(index, 'index')
  emits('contextmenu', event, index, dataItem)
}
</script>
