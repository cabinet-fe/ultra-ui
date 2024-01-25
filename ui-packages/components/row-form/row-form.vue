<template>
  <table :class="cls.b" :border="border ? 1 : 0">
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
        v-slot:[finalColumns.key]="row"
      >
        <slot
          v-if="useSlots()[finalColumns.key]"
          :name="finalColumns.key"
          v-bind="row"
        />
        <div v-else>{{ row.row[finalColumns.key] }}</div>
      </template>
    </row-form-body>
    <!-- 表体 end -->

    <!-- 表尾 start -->
    <row-form-footer v-if="showSummary" />
    <!-- 表位 end -->
  </table>
</template>

<script lang="ts" setup>
import { bem } from '@ui/utils'
import type { RowFormProps, RowFormEmits } from './row-form.type'
import { computed, provide, shallowReactive, useSlots } from 'vue'
import { RowFormStoreType } from './di'
import RowFormHeader from './row-form-header.vue'
import RowFormFooter from './row-form-footer.vue'
import RowFormBody from './row-form-body.vue'

defineOptions({
  name: 'URowForm'
})

const cls = bem('row-form')

/** 接收的参数 */
const props = defineProps<RowFormProps<Record<string, any>>>()

/** 事件 */
const emit = defineEmits<RowFormEmits>()

/** 值 */
const data = defineModel<Record<string, any>[]>({ required: true })

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

/** 表头所有key */
let keyArray = finalColumns.value.map(k => k.key)

/** 如果一开始最后一条不为空的话,就增加一条 */
const initData = () => {
  console.log(111)
  if (!data.value.length) return data.value.push({})

  /** 获取最后一条下标 */
  let dataLength = data.value.length - 1

  /** 最后一条是否为有值 */
  let valuable: Boolean = false

  data.value.forEach((item: Record<string, any>, index: number) => {
    if (index !== dataLength) return

    /** 最后一条任何一个字段有值就把valuable = true */
    keyArray.forEach(k => {
      if (item[k]) {
        valuable = true
      }
    })
  })

  if (!valuable) return
  data.value.push({})
}
initData()

/** 获取数据 */
const getValue = () => {
  console.log(keyArray)
}

defineExpose({
  getValue
})
</script>
