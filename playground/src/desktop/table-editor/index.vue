<template>
  <div>
    <u-card>
      <u-card-header>悬停编辑与校验</u-card-header>
      <u-card-content>
        <p>
          鼠标移入行进入编辑态，移出恢复纯文本；编辑单元格内按 Enter / Tab
          跳到下一个可编辑单元格（Shift+Tab 反向，行末自动换行）；经操作列「新增到下一行 /
          复制到下一行」或空态「添加」后，自动聚焦新行第一个可编辑单元格。
        </p>

        <u-table-editor ref="editor" :columns="columns" v-model="data">
          <template #column:name="{ model }">
            <u-input v-bind="model" placeholder="请输入姓名" />
          </template>
          <template #column:age="{ model }">
            <u-number-input v-bind="model" />
          </template>
          <template #column:email="{ model }">
            <u-input v-bind="model" placeholder="请输入邮箱" />
          </template>

          <!-- 文本态自定义：邮箱为空时显示占位文案 -->
          <template #text:email="{ val }">
            <span v-if="val">{{ val }}</span>
            <span v-else style="opacity: 0.4">未填写</span>
          </template>
        </u-table-editor>

        <div style="margin-top: 12px; display: flex; align-items: center; gap: 12px">
          <u-button type="primary" @click="handleValidate">校验全表</u-button>
          <span v-if="validateResult !== null">
            {{ validateResult ? '校验通过' : '存在未通过项，请检查红框单元格' }}
          </span>
        </div>

        <u-tip>
          <u-button>查看数据</u-button>

          <template #content>
            <div v-for="item of data">
              {{ item }}
            </div>
          </template>
        </u-tip>
      </u-card-content>
    </u-card>
  </div>
</template>

<script lang="ts" setup>
import type { TableEditorColumn, TableEditorExposed } from '@veltra/desktop'
import { shallowRef, useTemplateRef } from 'vue'

const columns: TableEditorColumn[] = [
  { key: 'name', name: '姓名', rules: { required: '请输入姓名' } },
  {
    key: 'age',
    name: '年龄',
    rules: { min: [0, '年龄不能小于 0'], max: [150, '年龄不能大于 150'] }
  },
  { key: 'email', name: '邮箱', rules: { preset: 'email' } }
]

// 第二行邮箱预置非法格式，点击「校验全表」可看到红框与 tip 错误提示
const data = shallowRef([
  { name: '张三', age: 18, email: 'zhangsan@example.com' },
  { name: '李四', age: 25, email: 'invalid-email' }
])

const editor = useTemplateRef<TableEditorExposed>('editor')
const validateResult = shallowRef<boolean | null>(null)

async function handleValidate() {
  validateResult.value = (await editor.value?.validate()) ?? false
}
</script>
