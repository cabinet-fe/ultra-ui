<template>
  <table :class="cls.b">
    <!-- 表头 start -->
    <row-form-header :columns="finalColumns" />
    <!-- 表头 end -->

    <!-- 表体 start -->
    <tbody :class="cls.e('tbody')">
      <tr
        :class="cls.e('tr')"
        v-for="(dataItem, dataIndex) in data"
        :key="dataIndex"
      >
        <!-- 内容 -->
        <td
          v-for="(columnsItem, columnsIndex) in finalColumns"
          :key="columnsIndex"
        >
          <slot
            ref="slotsRef"
            :name="columnsItem.key"
            :row="dataItem"
            @blur="handleIsInputBlur"
          />
        </td>
      </tr>
    </tbody>
    <!-- 表体 end -->

    <!-- 表尾 start -->
    <row-form-footer />
    <!-- 表位 end -->
  </table>
</template>

<script lang="ts" setup>
import { bem } from '@ui/utils'
import type { RowFormProps, RowFormEmits } from './row-form.type'

import RowFormHeader from './row-form-header.vue'
import { computed, provide, shallowRef, useSlots } from 'vue'
import RowFormFooter from './row-form-footer.vue'
import { useModel } from '@ui/compositions'

defineOptions({
  name: 'URowForm'
})

const cls = bem('row-form')

const props = defineProps<RowFormProps<Record<string, any>>>()

const emit = defineEmits<RowFormEmits>()

let store = {}

provide('store', store)

/** 父组件每修改一次值 就同步一次values */
const data = useModel({ props, emit, local: true })

const finalColumns = computed(() => {
  return [...props.columns]
})

const slot = useSlots()

let slotsRef = shallowRef()
setTimeout(() => {
  console.log(slot.dd, 'slotsRef')
})

const handleIsInputBlur = () => {
  console.log('input失去焦点了')
}

// interface Row {
//   edited: boolean
//   index: number
//   data: ShallowReactive<Record<string, any>>
//   children: Row[]
//   depth: number
// }
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
