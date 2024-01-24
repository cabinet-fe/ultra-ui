<template>
  <div>
    删除和插入请右击
    <u-row-form :columns="columns" v-model="modelValue">
      <template #dd="{ row }">
        <u-input v-model="row.dd" />
      </template>

      <template #ff="{ row }">
        <u-input v-model="row.ff" />
      </template>
    </u-row-form>
  </div>
</template>
<script lang="ts" setup>
import { reactive, shallowRef } from 'vue'

const columns = shallowRef([
  { key: 'dd', name: '哈哈哈1' },
  { key: 'ff', name: '共用一个数据' },
  { key: 'gg', name: '依托答辩' }
])

const modelValue = reactive([
  { dd: '第一条', ff: '333' },
  { dd: '第二条', ff: '123213' },
  { dd: '第三条', ff: '123213', ll: 123123 },
  { dd: '', ff: '' }
])
</script>
