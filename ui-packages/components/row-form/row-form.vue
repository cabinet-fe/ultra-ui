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
        v-slot:[columnsItem.key]="data"
      >
        <slot
          v-if="!disabled && useSlots()[columnsItem.key]"
          :name="columnsItem.key"
          v-bind="data"
        />

        <div v-else>
          {{ data['data']?.[columnsItem.key] }}
        </div>
      </template>
    </row-form-body>
    <!-- 表体 end -->

    <!-- 表尾 start -->
    <row-form-footer v-if="showSummary" />
    <!-- 表位 end -->
  </table>
</template>

<script lang="ts" setup generic="Val extends Record<string, any>">
import { bem } from '@ui/utils'
import type { RowFormProps, RowFormEmits } from '@ui/types/components/row-form'
import { computed, provide, useSlots } from 'vue'
import { RowFormStoreType } from './di'
// import type { ValidateRule } from '@ui/types/utils/form/validate'
import RowFormHeader from './row-form-header.vue'
import RowFormFooter from './row-form-footer.vue'
import RowFormBody from './row-form-body.vue'

defineOptions({
  name: 'URowForm'
})

/** 接收的参数 */
const props = defineProps<RowFormProps<Val>>()

const cls = bem('row-form')

/** 事件 */
const emits = defineEmits<RowFormEmits<Val>>()

/** 值 */
const data = defineModel<Val>({ required: true })

/** 表头 */
const finalColumns = computed(() => {
  return [...props.columns]
})

provide(RowFormStoreType, {
  columns: finalColumns,
  modelData: data as Record<string, any>,
  props,
  cls
})

let lastItem = data.value[data.value.length - 1] ?? []

/** 如果一开始最后一条不为空的话,就增加一条 */
const initData = async () => {
  if (Object.keys(lastItem).length !== 0 && !props.disabled) {
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

// /** 校验 */
// const validate = () => {
//   console.log('校验')
// }

defineExpose({
  getValue
})
</script>
