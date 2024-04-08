<template>
  <!-- {{finalColumns}} -->
  <u-table :data="rows" :columns="finalColumns">
    <template
      v-for="item of finalColumns.filter(columnsItem => !!columnsItem.key)"
      v-slot:[`column:${item.key}`]="{ val, model, rowData, row }"
    >
      <div
        v-if="useSlots()['column:' + item.key]"
        @click="(e: Event) => handleClick(e, row.index)"
      >
        <node-render
          :content="
            getRowFormSlotsNodes(item.key, { model, val, row, rowData })
          "
        ></node-render>
      </div>

      <!-- 操作栏 -->
      <template v-else-if="item.key === 'operation'">
        <button-common-props tag="span">
          <u-button
            :class="cls.m('interval')"
            :icon="Delete"
            type="primary"
            @click="handleDelRows(row.index)"
          />

          <u-button
            :icon="DocumentAdd"
            type="primary"
            @click="handleInsetToRows(row.index)"
          />
        </button-common-props>
      </template>

      <template v-else>
        {{ model.modelValue }}
      </template>
    </template>
  </u-table>
</template>
<script lang="ts" setup generic="T extends Record<string, any>">
import type { RowFormEmits, RowFormProps } from '@ui/types/components/row-form'
import type { TableRow } from '@ui/types/components/table'
import type { ButtonProps } from '@ui/types/components/button'
import UTable from '../table/table.vue'
import { computed, ref, shallowRef, useSlots, watch } from 'vue'
import nodeRender from '../node-render/node-render'
import { wrapDataRows } from './row-forms'
import { Delete, DocumentAdd } from 'icon-ultra'
import { UButton } from '../button'
import { bem } from '@ui/utils'
import { useComponentProps } from '@ui/compositions'
import { useOperation } from './use-operation'

/** 接收的参数 */
const props = defineProps<RowFormProps<T>>()

/** 事件 */
const emit = defineEmits<RowFormEmits<T>>()

const cls = bem('row-form')

interface Option {
  model: {
    modelValue: any
    'onUpdate:modelValue': (val: any) => void
  }
  row: TableRow<Record<string, any>>
  val: any
  rowData: Record<string, T>
}

defineSlots<
  {
    [key: `column:${string}`]: (props: Option) => any
  } & {
    [key: string]: () => any
  }
>()

const ButtonCommonProps = useComponentProps<ButtonProps>({
  circle: true,
  iconSize: 18,
  loading: false
})

/** 表头 */
const finalColumns = computed(() => {
  return [...props.columns, { name: '操作', key: 'operation' }]
})

const data = defineModel<T[]>({ required: true })

let rows = shallowRef<T[]>([])

watch(
  data,
  val => {
    rows.value = wrapDataRows(val) as T[]
  },
  { immediate: true, once: true }
)

watch(rows, val => {
  data.value = rows.value
})

const { insetTo, delRow } = useOperation()

let obj = {
  clickIndex: ref(0)
}

const handleClick = (e: Event, index: number) => {
  obj.clickIndex.value = index

  e.target?.addEventListener('blur', handleBlurEvent)
  e.target?.addEventListener('input', handleInputEvent)
}

/** 失去焦点 */
const handleBlurEvent = (e: Event) => {
  /** 最后一条失去焦点就新增一条 */
  if (rows.value.length - 1 === obj.clickIndex.value) {
    rows.value = insetTo(rows.value, obj.clickIndex.value) as T[]
  }

  /** 结束时候清除事件 */
  e.target?.removeEventListener('blur', handleBlurEvent)
  e.target?.removeEventListener('input', handleInputEvent)
}

/** input事件 */
const handleInputEvent = (e: Event) => {
  data.value = rows.value
}

/** 插入rows */
const handleInsetToRows = (index: number) => {
  rows.value = insetTo(rows.value, index) as T[]
}

/** 删除 */
const handleDelRows = (index: number) => {
  rows.value = delRow(rows.value, [index]) as T[]

}

const getRowFormSlotsNodes = (key: string, options: Option) => {
  return useSlots()!['column:' + key]?.({ ...options })
}
</script>
