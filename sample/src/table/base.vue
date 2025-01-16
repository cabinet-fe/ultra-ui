<template>
  <CustomCard title="基础用法">
    <u-table :data="students" :columns="columns" show-index checkable>
      <template #column:action>
        <u-action-group :max="4">
          <u-action need-confirm type="danger">删除</u-action>
        </u-action-group>
      </template>
    </u-table>
  </CustomCard>
</template>

<script lang="ts" setup>
import { defineTableColumns } from 'ultra-ui'
import CustomCard from '../card/custom-card.vue'

const students = [
  { id: 1, name: '张三', age: 15, grade: '高一', class: '1班', score: 95 },
  { id: 2, name: '李四', age: 16, grade: '高二', class: '2班', score: 88 },
  { id: 3, name: '王五', age: 17, grade: '高三', class: '3班', score: 92 }
]

const columns = defineTableColumns([
  { key: 'name', name: '姓名' },
  { key: 'age', name: '年龄', align: 'center' },
  { key: 'grade', name: '年级', align: 'center' },
  { key: 'class', name: '班级', align: 'center' },
  { key: 'score', name: '分数', align: 'center' },
  { key: 'action', name: '操作', align: 'center' }
])
</script>
