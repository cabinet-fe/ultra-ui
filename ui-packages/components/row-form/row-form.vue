<template>
  <table :class="cls.b">
    <!-- 表头 start -->
    <row-form-header />
    <!-- 表头 end -->

    <!-- 表体 start -->
    <row-form-body>

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
import { RowFormStoreType } from './row-form.type'
import { RowFormHeader, RowFormFooter, RowFormBody } from './index'
import { computed, provide, shallowReactive } from 'vue'
import { useModel } from '@ui/compositions'

defineOptions({
  name: 'URowForm'
})

const cls = bem('row-form')

const props = defineProps<RowFormProps<Record<string, any>>>()

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
  data: data.value,
  cls
})

provide(RowFormStoreType, store)
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
