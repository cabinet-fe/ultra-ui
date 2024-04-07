<template>
  <table :class="cls.b" :border="border ? 1 : 0">
    <!-- 表头 start -->
    <row-form-header />
    <!-- 表头 end -->

    <!-- 表体 start -->
    <row-form-body />
    <!-- 表体 end -->

    <!-- 表尾 start -->
    <row-form-footer />
    <!-- 表位 end -->
  </table>
</template>

<script lang="ts" setup generic="T extends Record<string, any>">
import { Validator, bem } from '@ui/utils'
import type { RowFormProps, RowFormEmits } from '@ui/types/components/row-form'
import { computed, provide, shallowRef, useSlots, watch } from 'vue'
import { RowFormInjectType } from './di'
import RowFormHeader from './row-form-header.vue'
import RowFormFooter from './row-form-footer.vue'
import RowFormBody from './row-form-body.vue'
import { wrapDataRows } from './row-forms'

defineOptions({
  name: 'URowForm'
})

/** 接收的参数 */
const props = defineProps<RowFormProps<T>>()

const cls = bem('row-form')

/** 事件 */
const emits = defineEmits<RowFormEmits<T>>()

/** 值 */
const data = defineModel<T[]>({ required: true })

/** 表头 */
const finalColumns = computed(() => {
  return [...props.columns]
})

/** 数据 */
const rows = shallowRef<any[]>([])

defineSlots<{
  header(): any
}>()

provide(RowFormInjectType, {
  cls,
  columns: finalColumns,
  rows: rows,
  rowFormSlots: useSlots(),
  props,
  emits: emits as RowFormEmits<Record<string, any>>
})

watch(
  data,
  () => {
    if (props.disabled) {
      rows.value = wrapDataRows(data.value)
    } else {
      rows.value = wrapDataRows([...data.value, {}])
    }

    data.value = rows.value.map(row => row.data)
  },
  { immediate: true, once: true }
)



// watch(
//   () => data.value,
//   value => {
//     rows.value = wrapDataRows(data.value)
//     console.log(value,'value')
//   }
// )

// const
// let lastItem = data.value[data.value.length - 1] ?? []

// /** 如果一开始最后一条不为空的话,就增加一条 */
// const initData = async () => {
//   if (Object.keys(lastItem).length !== 0 && !props.disabled) {
//     data.value.push({} as T)
//   }
// }
// initData()

/** 获取数据 */
// const getValue = () => {
//   if (Object.keys(lastItem).length !== 0) {
//     return data.value?.slice(0, data.value.length - 1)
//   } else {
//     return data.value
//   }
// }

/** 获取数据 */
const getValue = () => {}

/** 校验 */
const validate = () => {
  finalColumns.value.map(async (item: any) => {
    // { name: { required } }
    // console.log(data.value, item.key, 'key')
    return await new Validator(item.rules).validate(data.value)
  })
}

defineExpose({
  getValue,
  validate
})
</script>
