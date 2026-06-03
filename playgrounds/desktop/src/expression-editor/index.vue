<template>
  <div>
    <h3>表达式编辑器示例</h3>
    <p>新版交互（Lexical 已移除）：</p>
    <ul>
      <li>键入 <code>@</code> 唤起变量选择面板。<code>@filter</code> 后键入字符即时过滤。</li>
      <li>
        面板键盘：<strong>↑↓</strong> 移动焦点；<strong>←</strong> 返回上一级；<strong
          >→ / Enter</strong
        >
        进入下一级或选中（行为依 <code>selectableLevels</code>）。
      </li>
      <li>
        <strong>Esc / 空格 / ←→</strong> 退出 mention，<code>@filter</code> 文本保留为普通字符。
      </li>
      <li>
        变量 chip：<strong>hover</strong> 出现 ×；<strong>点击 chip 主体</strong>原地重选；<strong
          >点击 ×</strong
        >
        直接删除。
      </li>
      <li>原生方向键即可跨 chip 移动光标，Backspace 在 chip 边界一次删除整个 chip。</li>
    </ul>

    <div style="margin-bottom: 20px">
      <h4>默认（仅叶子可选）</h4>
      <u-expression-editor
        v-model="expression"
        :variables="variables"
        placeholder="请输入表达式，输入 @ 可插入变量"
      />
    </div>

    <div style="margin-bottom: 20px">
      <h4>selectableLevels="any"（分支节点也可选中）</h4>
      <u-expression-editor
        v-model="anyLevelsExpr"
        :variables="variables"
        selectable-levels="any"
        placeholder="@ 触发，分支项 Enter 选中分支本身、→ 进入下级"
      />
    </div>

    <div style="margin-bottom: 20px">
      <h4>表达式（v-model）：</h4>
      <pre>{{ expression }}</pre>
    </div>

    <div style="margin-bottom: 20px">
      <h4>值替换：</h4>
      <pre>{{ value }}</pre>
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
import { o } from '@cat-kit/core'
import { computed, shallowRef } from 'vue'

const expression = shallowRef(
  '你好{form.user.name}, 欢迎来到{form.company.name}，入职{form.department.name}为{form.position}职位'
)
const anyLevelsExpr = shallowRef('选中整个分支：{form.user}')

const variables = [
  {
    label: '表单数据',
    value: 'form',
    children: [
      {
        label: '用户信息',
        value: 'form.user',
        children: [
          { label: '姓名', value: 'form.user.name' },
          { label: '年龄', value: 'form.user.age' },
          { label: '邮箱', value: 'form.user.email' }
        ]
      },
      {
        label: '公司信息',
        value: 'form.company',
        children: [
          { label: '公司名称', value: 'form.company.name' },
          { label: '公司地址', value: 'form.company.address' },
          { label: '公司电话', value: 'form.company.phone' }
        ]
      },
      {
        label: '部门信息',
        value: 'form.department',
        children: [
          { label: '部门名称', value: 'form.department.name' },
          { label: '部门编号', value: 'form.department.code' }
        ]
      },
      { label: '职位', value: 'form.position' },
      { label: '入职日期', value: 'form.date' }
    ]
  },
  {
    label: '系统变量',
    value: 'system',
    children: [
      { label: '当前时间', value: 'system.currentTime' },
      { label: '当前用户', value: 'system.currentUser' },
      { label: '系统版本', value: 'system.version' }
    ]
  }
]

const data = {
  form: {
    user: { name: '张三', age: 28, email: 'zhangsan@example.com' },
    company: { name: 'bilibili', address: '上海市杨浦区', phone: '021-12345678' },
    department: { name: '研发部', code: 'DEV001' },
    position: '前端工程师',
    date: '2025-01-01'
  },
  system: { currentTime: '2025-11-22 10:30:00', currentUser: 'admin', version: 'v2.0.0' }
}

function getValue(expr: string, source: any) {
  return expr.replace(/\{([^}]+)\}/g, (_, key) => o(source).get(key))
}

const value = computed(() => getValue(expression.value, data))
</script>
