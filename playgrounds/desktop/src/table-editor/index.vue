<template>
  <div>
    <u-table-editor :columns="columns" v-model="data">
      <template #column:name="{ model }">
        <u-textarea v-bind="model" />
      </template>
      <template #column:age="{ model }">
        <u-number-input v-bind="model" />
      </template>
    </u-table-editor>

    <u-tip>
      <u-button>查看数据</u-button>

      <template #content>
        <div v-for="item of data">
          {{ item }}
        </div>
      </template>
    </u-tip>
  </div>
</template>

<script lang="ts" setup>
import { defineTableColumns } from '@veltra/desktop'
import { shallowRef } from 'vue'

const columns = defineTableColumns([
  { key: 'name', name: '姓名' },
  { key: 'age', name: '年龄' }
])

const data = shallowRef([])
</script>
