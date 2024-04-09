<template>
  <u-table :data="rows" :columns="finalColumns" :class="cls.b">
    <template
      v-for="item of finalColumns.filter(columnsItem => !!columnsItem.key)"
      v-slot:[`column:${item.key}`]="{ val, model, rowData, row }"
    >
      <div
        v-if="useSlots()['column:' + item.key] && !disabled"
        @click="(e: Event) => handleClick(e, row.index)"
      >
        <node-render
          :content="
            getRowFormSlotsNodes(item.key, { model, val, row, rowData })
          "
        ></node-render>
      </div>

      <!-- 操作栏 -->
      <template v-else-if="item.key === 'operation' && !disabled">
        <button-common-props tag="span">
          <u-button
            :class="cls.e('interval')"
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

    <template
      v-for="item of finalColumns.filter(columnsItem => !!columnsItem.key)"
      v-slot:[`header:${item.key}`]="{ column }"
    >
      <div>
        <span>{{ getTipErrors(column.key) }}</span>

        <span :class="bem.is('error', !!getTipErrors(column.key))">{{
          column.name
        }}</span>
        <span style="color: red" v-if="column.value.rules?.required"> *</span>
      </div>
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
import { useRowForm } from './use-row-form'
import { Delete, DocumentAdd } from 'icon-ultra'
import { UButton } from '../button'
import { bem } from '@ui/utils'
import { useComponentProps } from '@ui/compositions'
import { useOperation } from './use-operation'
import { Validator } from '@ui/utils'

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
  return props.disabled
    ? [...props.columns]
    : [...props.columns, { name: '操作', key: 'operation' }]
})

const getRowFormSlotsNodes = (key: string, options: Option) => {
  return useSlots()!['column:' + key]?.({ ...options })
}

const data = defineModel<T[]>({ required: true })

const { wrapDataRows } = useRowForm()

const { insetTo, delRows } = useOperation()

let rows = shallowRef<T[]>([])

watch(
  data,
  val => {
    if (val.length === 0) {
      rows.value = wrapDataRows([{}]) as T[]
    } else {
      rows.value = wrapDataRows(val) as T[]
    }
  },
  { immediate: true }
)

let obj = {
  /** 当前操作的索引 */
  clickIndex: ref(0)
}

const handleClick = (e: Event, index: number) => {
  obj.clickIndex.value = index

  e.target?.addEventListener('blur', handleBlurEvent)
  e.target?.addEventListener('input', handleInputEvent)
}

/** 失去焦点 */
const handleBlurEvent = (e: Event) => {
  /** 数组最后一条如果为空那就添加一条数据 */
  if (
    rows.value.length - 1 === obj.clickIndex.value &&
    Object.keys(rows.value[rows.value.length - 1] as T).length !== 0
  ) {
    rows.value = insetTo(rows.value, obj.clickIndex.value) as T[]
    data.value = rows.value
  }
  validate()
  /** 结束时候清除事件 */
  e.target?.removeEventListener('blur', handleBlurEvent)
  e.target?.removeEventListener('input', handleInputEvent)
}

/** input事件 */
const handleInputEvent = (e: Event) => {}

/** 插入rows */
const handleInsetToRows = (index: number) => {
  rows.value = insetTo(rows.value, index) as T[]
}

/** 删除 */
const handleDelRows = (index: number) => {
  rows.value = delRows(rows.value, [index]) as T[]
}

/** 获取数据 */
const getValue = () => {
  const newArray: any[] = [...rows.value]

  // 最后一项是否为空对象,如果空就移除
  if (
    newArray.length > 0 &&
    Object.keys(newArray[newArray.length - 1]).length === 0
  ) {
    newArray.splice(-1, 1)
  }

  return newArray
}

/** 错误信息 */
let errors = ref(new Map())

let tipErrors = ref()

/** 校验 */
const validate = async () => {
  errors.value.clear()

  const rules = {}

  finalColumns.value.forEach(item => {
    if (item.rules && Object.keys(item.rules).length > 0) {
      rules[item.key] = { ...item.rules }
    }
  })

  const validator = new Validator(rules)

  const data = getValue()

  for (const item of data) {
    const validateResult = await validator.validate(item)
    for (const field in validateResult) {
      errors.value.set(field, validateResult[field])
    }
  }

  if (errors.value.size > 0) return false

  return true
}

const getTipErrors = (key: string) => {
  return (tipErrors.value = errors.value.get(key)?.[0])
}

defineExpose({
  getValue,
  validate
})
</script>
