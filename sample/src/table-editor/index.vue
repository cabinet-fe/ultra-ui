<template>
  <u-table-editor :columns="columns" v-model="modelValue" @save="onSave">
    <template #dd="{ row }">
      {{ row }}
      <input v-model="row.dd" />
    </template>

    <template #ff="{ row }">
      <input v-model="row.ff" />
      <!-- {{ modelValue }} -->
    </template>
  </u-table-editor>

  {{ modelValue }}
</template>
<script lang="ts" setup>
import { reactive, shallowRef } from 'vue'

const columns = shallowRef([
  { key: 'dd', name: '哈哈哈1', rule: { require: true } },
  { key: 'ff', name: '共用一个数据' },
  { key: 'gg', name: '依托答辩' },
])

const modelValue = reactive([{dd: '123'}])

/** 点击保存 */
const onSave = (item: any) => {
  console.log(item,'onSave')
}
</script>
