<template>
  <div>
    <h3>表达式编辑器示例</h3>
    <p>输入 @ 可以触发变量选择器，或点击右侧变量图标</p>

    <div style="margin-bottom: 20px">
      <u-expression-editor
        v-model="value"
        :variables="variables"
        placeholder="请输入表达式，输入@可插入变量"
      />
    </div>

    <div style="margin-bottom: 20px">
      <h4>当前值：</h4>
      <pre>{{ value }}</pre>
    </div>

    <div style="margin-bottom: 20px">
      <h4>变量列表：</h4>
      <ul>
        <li v-for="item in variables" :key="item.value">
          {{ item.label }}: {{ item.value }}
        </li>
      </ul>
    </div>

    <div style="margin-bottom: 20px">
      <h4>禁用状态：</h4>
      <u-expression-editor v-model="value" :variables="variables" disabled />
    </div>

    <div style="margin-bottom: 20px">
      <h4>只读状态：</h4>
      <u-expression-editor v-model="value" :variables="variables" readonly />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { shallowRef } from 'vue'

const value = shallowRef('Hello {form.name}, welcome to {form.company}!')

const variables = [
  { label: '姓名', value: 'form.name' },
  { label: '公司', value: 'form.company' },
  { label: '日期', value: 'form.date' },
  { label: '部门', value: 'form.department' },
  { label: '职位', value: 'form.position' }
]
</script>
