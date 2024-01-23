<template>
  <table :class="cls.b">
    <!-- 表头 start -->
    <row-form-header />
    <!-- 表头 end -->

    <!-- 表体 start -->
    <row-form-body>
      <template
        v-for="finalColumns of props.columns.filter(
          finalColumns => !!finalColumns.key
        )"
        :key="finalColumns.key"
        v-slot:[finalColumns.key!]="row"
      >
        <slot :name="finalColumns.key" v-bind="row" />
      </template>
    </row-form-body>
    <!-- 表体 end -->

    <!-- 表尾 start -->
    <row-form-footer />
    <!-- 表位 end -->
  </table>
</template>

<script lang="ts" setup>
import { bem } from '@ui/utils'
import type { RowFormProps, RowFormEmits } from './row-form.type'
import { RowFormHeader, RowFormFooter, RowFormBody } from './index'
import { computed, provide, shallowReactive } from 'vue'
import { useModel } from '@ui/compositions'
import { RowFormStoreType } from './di'

defineOptions({
  name: 'URowForm'
})

const cls = bem('row-form')

/** 接收的参数 */
const props = defineProps<RowFormProps<Record<string, any>>>()

/** 事件 */
const emit = defineEmits<RowFormEmits>()

/** 值 */
const data = useModel({ props, emit, local: true })

/** 表头 */
const finalColumns = computed(() => {
  return [...props.columns]
})

/** 需要传入子组件的对象 */
let store = shallowReactive({
  columns: finalColumns.value,
  modelData: data.value,
  cls
})

provide(RowFormStoreType, store)

/** 如果一开始最后一条不为空的话,就增加一条 */
const initData = () => {
  if (!data.value.length) return data.value.push({})

  /** 获取最后一条下标 */
  let dataLength = data.value.length - 1

  let call = false

  data.value.forEach((item: Record<string, any>, index: number) => {
    if (index !== dataLength) return

    let keyArray = finalColumns.value.map(k => k.key)

    keyArray.forEach((k) => {
      if (item[k]) {
        call = true
      }
    })
  })

  if (!call) return
  data.value.push({})
}
initData()
</script>
<style lang="scss" scoped>
td {
  text-align: center;
  padding: 10px 0;
  min-width: 150px;
}

table thead tr {
  background-color: #008c8c;
  color: #fff;
}

table tfoot tr td {
  text-align: right;
  padding-right: 20px;
}
</style>
