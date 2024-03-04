<template>
  <table :class="cls.b" :border="border ? 1 : 0">
    <!-- 表头 start -->
    <row-form-header />
    <!-- 表头 end -->

    <!-- 表体 start -->
    <row-form-body>
      <template
        v-for="columnsItem of props.columns.filter(
          columnsItem => !!columnsItem.key
        )"
        :key="columnsItem.key"
        v-slot:[columnsItem.key]="row"
      >
        <slot
          v-if="useSlots()[columnsItem.key]"
          :name="columnsItem.key"
          v-bind="row"
        />
        <div v-else>{{ row['row']?.[columnsItem.key] }}</div>
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
import { computed, nextTick, provide, shallowReactive, useSlots } from 'vue'
import { RowFormStoreType } from './di'
import RowFormHeader from './row-form-header.vue'
import RowFormFooter from './row-form-footer.vue'
import RowFormBody from './row-form-body.vue'

defineOptions({
  name: 'URowForm'
})

/** 接收的参数 */
const props = defineProps<RowFormProps<Record<string, any>>>()

/** 事件 */
const emits = defineEmits<RowFormEmits>()

/** 值 */
const data = defineModel<Record<string, any>[]>({ required: true })

/** 表头 */
const finalColumns = computed(() => {
  return [...props.columns]
})

const cls = bem('row-form')

/** 需要传入子组件的对象 */
let store = shallowReactive({
  columns: finalColumns.value,
  modelData: data.value,
  cls
}) ?? {}

provide(RowFormStoreType, store)!

/** 表头所有key */
// let keyColumns = finalColumns.value.map(k => k.key)

let lastItem = data.value[data.value.length - 1] ?? []

/** 如果一开始最后一条不为空的话,就增加一条 */
const initData = async () => {
  await nextTick()

  if (Object.keys(lastItem).length !== 0) {
    data.value.push({})
  }
}
initData()

/** 获取数据 */
const getValue = () => {
  if (Object.keys(lastItem).length !== 0) {
    return data.value?.slice(0, data.value.length - 1)
  }
}

defineExpose({
  getValue
})
</script>
