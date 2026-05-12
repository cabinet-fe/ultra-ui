<template>
  <div style="max-width: 640px; padding: 20px">
    <h3>条件编辑器</h3>

    <div style="margin-bottom: 24px">
      <h4>基础示例</h4>
      <u-condition-editor
        v-model="expression"
        :fields="fields"
        :variables="variables"
        :data="evalData"
        @evaluate="onEvaluate"
      />
    </div>

    <div style="margin-bottom: 16px">
      <h4>表达式输出（v-model）：</h4>
      <pre
        style="
          background: #f5f5f5;
          padding: 12px;
          border-radius: 6px;
          font-size: 12px;
          overflow-x: auto;
        "
        >{{ JSON.stringify(expression, null, 2) }}</pre
      >
    </div>

    <div style="margin-bottom: 16px">
      <h4>求值结果（evaluate）：</h4>
      <pre
        style="
          background: #f5f5f5;
          padding: 12px;
          border-radius: 6px;
          font-size: 12px;
          overflow-x: auto;
        "
        >{{ JSON.stringify(evalResult, null, 2) }}</pre
      >
    </div>

    <div style="margin-bottom: 24px">
      <h4>禁用状态：</h4>
      <u-condition-editor
        :model-value="expression"
        :fields="fields"
        :variables="variables"
        disabled
      />
    </div>

    <div style="margin-bottom: 24px">
      <h4>只读状态：</h4>
      <u-condition-editor
        :model-value="expression"
        :fields="fields"
        :variables="variables"
        readonly
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { ConditionExpression, ConditionField } from '@veltra/desktop'
import type { VariableItem } from '@veltra/desktop'
import { shallowRef } from 'vue'

const expression = shallowRef<ConditionExpression>({
  logic: 'and',
  conditions: [
    { field: 'status', operator: 'eq', value: { kind: 'variable', name: 'currentUser.status' } },
    { field: 'priority', operator: 'gt', value: { kind: 'constant', value: '3' } }
  ],
  groups: [
    {
      logic: 'or',
      conditions: [
        { field: 'tag', operator: 'contains', value: { kind: 'constant', value: '紧急' } },
        { field: 'assignee', operator: 'eq', value: { kind: 'constant', value: '张三' } }
      ],
      groups: []
    }
  ]
})

const fields: ConditionField[] = [
  { label: '状态', value: 'status', type: 'string' },
  { label: '优先级', value: 'priority', type: 'number' },
  { label: '标签', value: 'tag', type: 'string' },
  { label: '负责人', value: 'assignee', type: 'string' },
  { label: '已完成', value: 'completed', type: 'boolean' },
  { label: '截止日期', value: 'deadline', type: 'date' },
  {
    label: '类型',
    value: 'type',
    type: 'enum',
    enumOptions: [
      { label: '需求', value: 'requirement' },
      { label: '缺陷', value: 'bug' },
      { label: '任务', value: 'task' }
    ]
  }
]

const variables: VariableItem[] = [
  {
    label: '当前用户',
    value: 'currentUser',
    children: [
      { label: '姓名', value: 'currentUser.name' },
      { label: '角色', value: 'currentUser.role' },
      { label: '状态', value: 'currentUser.status' }
    ]
  },
  {
    label: '系统变量',
    value: 'system',
    children: [
      { label: '当前时间', value: 'system.currentTime' },
      { label: '当前日期', value: 'system.currentDate' }
    ]
  }
]

const evalData = {
  currentUser: { name: '李四', role: 'admin', status: 'active' },
  system: { currentTime: '2026-05-12', currentDate: '2026-05-12' }
}

const evalResult = shallowRef<ConditionExpression | null>(null)

function onEvaluate(result: ConditionExpression) {
  evalResult.value = result
}
</script>
