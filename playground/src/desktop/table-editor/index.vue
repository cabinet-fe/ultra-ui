<template>
  <div style="max-width: 1000px">
    <u-card>
      <u-card-header>悬停编辑与校验</u-card-header>
      <u-card-content>
        <ul class="demo-desc">
          <li>鼠标移入行进入编辑态，移出恢复纯文本；操作按钮同样在移入行时出现</li>
          <li>编辑单元格内按 Enter / Tab 跳到下一个可编辑单元格（Shift+Tab 反向，行末自动换行）</li>
          <li>经「新增到下一行 / 复制到下一行」或空态「添加」后，自动聚焦新行第一个可编辑单元格</li>
        </ul>

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
            <span v-else class="demo-empty">未填写</span>
          </template>
        </u-table-editor>

        <div class="demo-toolbar">
          <u-button type="primary" @click="handleValidate">校验全表</u-button>
          <span v-if="validateResult !== null" :class="validateResult ? 'demo-ok' : 'demo-fail'">
            {{ validateResult ? '校验通过' : '存在未通过项，请检查红框单元格' }}
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
import { shallowRef, useTemplateRef } from 'vue'

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

<style scoped>
.demo-desc {
  margin: 0 0 12px;
  padding-left: 18px;
  color: var(--u-text-color-second, #888);
  font-size: 13px;
  line-height: 2;
}

.demo-empty {
  opacity: 0.4;
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
