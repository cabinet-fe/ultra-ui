<template>
  <div :class="cls.b">
    <section :class="cls.e('section')">
      <header :class="cls.e('section-header')">
        <h3>基础用法</h3>
        <p>仅作配置使用，输出表达式 JSON。同组内每行之间可独立切换 AND / OR。</p>
      </header>
      <div :class="cls.e('panel')">
        <u-condition-editor v-model="basicExpr" :fields="fields" />
      </div>
      <pre :class="cls.e('output')">{{ stringify(basicExpr) }}</pre>
    </section>

    <section :class="cls.e('section')">
      <header :class="cls.e('section-header')">
        <h3>嵌套与混合逻辑</h3>
        <p>支持任意层级嵌套；同组内 AND/OR 按左到右等优先级求值，需要更高优先级请用子组。</p>
      </header>
      <div :class="cls.e('panel')">
        <u-condition-editor v-model="nestedExpr" :fields="fields" :variables="variables" />
      </div>
      <pre :class="cls.e('output')">{{ stringify(nestedExpr) }}</pre>
    </section>

    <section :class="cls.e('section')">
      <header :class="cls.e('section-header')">
        <h3>运行期求值</h3>
        <p>
          <code>evaluateConditionExpression(expr, &#123; fields, data &#125;)</code>
          为纯函数，按字段类型解析数据，与编辑器解耦。修改下方 data 实时看到结果。
        </p>
      </header>
      <div :class="cls.e('panel')">
        <u-condition-editor v-model="evalExpr" :fields="fields" />
      </div>
      <div :class="cls.e('eval-grid')">
        <div :class="cls.e('eval-col')">
          <h4>测试数据（data）</h4>
          <textarea :class="cls.e('data-input')" v-model="dataText" spellcheck="false" />
          <p v-if="dataError" :class="cls.e('data-error')">JSON 解析错误：{{ dataError }}</p>
        </div>
        <div :class="cls.e('eval-col')">
          <h4>求值结果</h4>
          <div :class="[cls.e('result'), cls.em('result', evalResult ? 'pass' : 'fail')]">
            {{ evalResult ? '✓ 满足条件' : '✗ 不满足条件' }}
          </div>
        </div>
      </div>
    </section>

    <section :class="cls.e('section')">
      <header :class="cls.e('section-header')">
        <h3>禁用 / 只读</h3>
      </header>
      <div :class="cls.e('panel')">
        <u-condition-editor :model-value="basicExpr" :fields="fields" disabled />
      </div>
      <div :class="cls.e('panel')" style="margin-top: 12px">
        <u-condition-editor :model-value="basicExpr" :fields="fields" readonly />
      </div>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { evaluateConditionExpression } from '@veltra/desktop'
import type { ConditionExpression, ConditionField, VariableItem } from '@veltra/desktop'
import { bem } from '@veltra/utils'
import { computed, ref, shallowRef } from 'vue'

const cls = bem('condition-demo')

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
    label: '系统',
    value: 'system',
    children: [
      { label: '当前时间', value: 'system.now' },
      { label: '今天', value: 'system.today' }
    ]
  }
]

// ── 示例 1：基础 ──
const basicExpr = shallowRef<ConditionExpression>({
  type: 'group',
  connectors: [],
  children: [
    {
      type: 'condition',
      field: 'status',
      operator: 'eq',
      value: { kind: 'constant', value: 'open' }
    }
  ]
})

// ── 示例 2：嵌套混合逻辑 ──
// 表达式语义：status == open AND (priority > 3 OR tag contains "紧急")
const nestedExpr = shallowRef<ConditionExpression>({
  type: 'group',
  connectors: ['and'],
  children: [
    {
      type: 'condition',
      field: 'status',
      operator: 'eq',
      value: { kind: 'constant', value: 'open' }
    },
    {
      type: 'group',
      connectors: ['or'],
      children: [
        {
          type: 'condition',
          field: 'priority',
          operator: 'gt',
          value: { kind: 'constant', value: '3' }
        },
        {
          type: 'condition',
          field: 'tag',
          operator: 'contains',
          value: { kind: 'constant', value: '紧急' }
        }
      ]
    }
  ]
})

// ── 示例 3：求值 ──
const evalExpr = shallowRef<ConditionExpression>({
  type: 'group',
  connectors: ['and'],
  children: [
    {
      type: 'condition',
      field: 'priority',
      operator: 'gte',
      value: { kind: 'constant', value: '3' }
    },
    {
      type: 'condition',
      field: 'completed',
      operator: 'is_false',
      value: { kind: 'constant', value: '' }
    }
  ]
})

const dataText = ref(
  JSON.stringify(
    {
      status: 'open',
      priority: 5,
      tag: '紧急修复',
      completed: false,
      assignee: '张三'
    },
    null,
    2
  )
)

const dataError = ref('')

const evalData = computed<Record<string, unknown>>(() => {
  try {
    dataError.value = ''
    return JSON.parse(dataText.value)
  } catch (err) {
    dataError.value = (err as Error).message
    return {}
  }
})

const evalResult = computed(() =>
  evaluateConditionExpression(evalExpr.value, { fields, data: evalData.value })
)

function stringify(v: unknown) {
  return JSON.stringify(v, null, 2)
}
</script>

<style lang="scss" scoped>
.u-condition-demo {
  max-width: 880px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 32px;

  &__section {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  &__section-header {
    h3 {
      margin: 0 0 4px;
      font-size: 16px;
    }

    p {
      margin: 0;
      font-size: 13px;
      color: #6b7280;
      line-height: 1.5;
    }

    code {
      padding: 1px 4px;
      background: #eef2ff;
      border-radius: 3px;
      font-size: 12px;
    }
  }

  &__panel {
    padding: 4px;
  }

  &__output {
    margin: 0;
    padding: 12px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    font-size: 12px;
    line-height: 1.5;
    overflow-x: auto;
  }

  &__eval-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;

    h4 {
      margin: 0 0 8px;
      font-size: 13px;
      color: #374151;
    }
  }

  &__data-input {
    width: 100%;
    min-height: 160px;
    padding: 10px;
    font-family:
      ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New',
      monospace;
    font-size: 12px;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    outline: none;
    resize: vertical;

    &:focus {
      border-color: #2563eb;
    }
  }

  &__data-error {
    margin: 4px 0 0;
    font-size: 12px;
    color: #dc2626;
  }

  &__result {
    height: 44px;
    display: inline-flex;
    align-items: center;
    padding: 0 16px;
    border-radius: 6px;
    font-weight: 600;

    &--pass {
      color: #16a34a;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
    }

    &--fail {
      color: #dc2626;
      background: #fef2f2;
      border: 1px solid #fecaca;
    }
  }
}
</style>
