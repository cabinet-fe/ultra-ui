<template>
  <u-table
    style="height: 500px"
    :data="students"
    :columns="columns"
    v-model:checked="checked"
    show-index
    checkable
  >
    <template #column:action>
      <u-action-group :max="4">
        <u-action need-confirm type="danger">删除</u-action>
      </u-action-group>
    </template>
  </u-table>
</template>

<script lang="ts" setup>
import { defineTableColumns } from '@veltra/desktop'
import { shallowRef } from 'vue'

const seeds = [
  { name: '张三', age: 15, grade: '高一', class: '1班', score: 95 },
  { name: '李四', age: 16, grade: '高二', class: '2班', score: 88 },
  { name: '王五', age: 17, grade: '高三', class: '3班', score: 92 }
]

// 扩展至 200 行以覆盖 u-table 默认 virtualThreshold=80 的虚拟分支，
// 同时保持原有列的展示含义，便于手动回归。
const students = Array.from({ length: 200 }).map((_, i) => {
  const seed = seeds[i % seeds.length]!
  return { id: i + 1, ...seed, name: `${seed.name}-${i}` }
})

const checked = shallowRef([])

const columns = defineTableColumns([
  { key: 'name', name: '姓名' },
  { key: 'age', name: '年龄', align: 'center' },
  { key: 'grade', name: '年级', align: 'center' },
  { key: 'class', name: '班级', align: 'center' },
  { key: 'score', name: '分数', align: 'center' },
  { key: 'action', name: '操作', align: 'center' }
])
</script>
