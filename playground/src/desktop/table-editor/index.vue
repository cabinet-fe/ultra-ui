<template>
  <div style="max-width: 1000px">
    <u-card>
      <u-card-header>行内编辑与校验</u-card-header>
      <u-card-content>
        <u-table-editor ref="editor" :columns="columns" v-model="data" :readonly="readonly">
          <template #column:name="{ model }">
            <u-input v-bind="model" placeholder="请输入姓名" />
          </template>
          <template #column:age="{ model }">
            <u-number-input v-bind="model" />
          </template>
          <template #column:email="{ model }">
            <u-input v-bind="model" placeholder="请输入邮箱" />
          </template>
        </u-table-editor>

        <div class="demo-toolbar">
          <u-switch v-model="readonly" active-text="只读" inactive-text="编辑" />
          <u-button type="primary" @click="handleValidate">校验全表</u-button>
        </div>
      </u-card-content>
    </u-card>
  </div>
</template>

<script lang="ts" setup>
import type { TableEditorColumn, TableEditorExposed } from '@veltra/desktop'
import { ref, shallowRef, useTemplateRef } from 'vue'

const columns: TableEditorColumn[] = [
  { key: 'name', name: '姓名', width: 220, rules: { required: '请输入姓名' } },
  {
    key: 'age',
    name: '年龄',
    width: 140,
    rules: { min: [0, '年龄不能小于 0'], max: [150, '年龄不能大于 150'] }
  },
  { key: 'email', name: '邮箱', width: 280, rules: { preset: 'email' } }
]

// 第二、三行邮箱预置非法格式：点击「校验全表」后第二行未通过，邮箱列表头标红，
// 懒校验遇到错误行即停，第三行不校验、气泡不含其明细
const data = shallowRef([
  { name: '张三', age: 18, email: 'zhangsan@example.com' },
  { name: '李四', age: 25, email: 'invalid-email' },
  { name: '王五', age: 30, email: 'bad-email' }
])

const editor = useTemplateRef<TableEditorExposed>('editor')
const validateResult = shallowRef<boolean | null>(null)
// 只读开关：切换对比编辑与只读形态（控件只读、操作列与空态「添加」按钮隐藏）
const readonly = ref(false)

async function handleValidate() {
  validateResult.value = (await editor.value?.validate()) ?? false
}
</script>

<style scoped>
.demo-desc {
  margin: 0 0 12px;
  padding-left: 18px;
  color: var(--u-text-color-second, #888);
  font-size: 13px;
  line-height: 2;
}

.demo-toolbar {
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.demo-ok {
  color: var(--u-color-success, #52c41a);
}

.demo-fail {
  color: var(--u-color-danger, #f5222d);
}

.demo-data {
  margin: 0;
  max-height: 320px;
  overflow: auto;
  font-size: 12px;
  font-family: monospace;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
