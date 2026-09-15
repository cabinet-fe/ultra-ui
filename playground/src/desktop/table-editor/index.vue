<template>
  <div style="max-width: 1000px">
    <u-card>
      <u-card-header>行内编辑与校验</u-card-header>
      <u-card-content>
        <ul class="demo-desc">
          <li>输入控件常驻渲染，无文本态 / 编辑态切换；操作列按钮常显</li>
          <li>编辑单元格内按 Enter / Tab 跳到下一个可编辑单元格（Shift+Tab 反向，行末自动换行）</li>
          <li>经「新增到下一行 / 复制到下一行」或空态「添加」后，自动聚焦新行第一个可编辑单元格</li>
          <li>某列存在未通过项时，表头文字标红并出现感叹号，悬停图标可查看各行错误明细</li>
          <li>开启只读后输入控件只读（值不可修改），操作列与空态「添加」按钮不渲染</li>
        </ul>

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
          <span v-if="validateResult !== null" :class="validateResult ? 'demo-ok' : 'demo-fail'">
            {{ validateResult ? '校验通过' : '存在未通过项，请见表头标红列（悬停感叹号查看明细）' }}
          </span>

          <u-tip style="margin-left: auto">
            <u-button text>查看数据</u-button>

            <template #content>
              <pre class="demo-data">{{ JSON.stringify(data, null, 2) }}</pre>
            </template>
          </u-tip>
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
