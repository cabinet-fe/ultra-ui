# Condition Editor 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 实现条件表达式编辑器组件，支持可视化条件构建、变量注入、嵌套分组、条件求值。

**Architecture:** 三层组件 — `condition-editor.vue`（根组件，管理 form 集成/求值/共享 VariablePicker），`condition-group.vue`（递归分组，AND/OR 标签 + 子条件 + 子组），`condition-row.vue`（单条件行，字段/运算符/值/删除/结果）。求值引擎独立为 `evaluator.ts`，运算符映射独立为 `operators.ts`。

**Tech Stack:** Vue 3 + TypeScript + SCSS (BEM, `--u-*` design tokens), `@veltra/compositions`, `@veltra/utils`

---

## 文件变更概览

| 操作 | 文件                                                                              |
| ---- | --------------------------------------------------------------------------------- |
| 修改 | `packages/desktop/src/types/condition-editor.ts`                                  |
| 创建 | `packages/desktop/src/components/condition-editor/core/operators.ts`              |
| 创建 | `packages/desktop/src/components/condition-editor/core/evaluator.ts`              |
| 创建 | `packages/desktop/src/components/condition-editor/components/condition-row.vue`   |
| 创建 | `packages/desktop/src/components/condition-editor/components/condition-group.vue` |
| 重写 | `packages/desktop/src/components/condition-editor/condition-editor.vue`           |
| 重写 | `packages/desktop/src/components/condition-editor/style.scss`                     |
| 修改 | `packages/desktop/src/components/condition-editor/style.ts`                       |
| 创建 | `playgrounds/desktop/src/condition-editor/index.vue`                              |

---

### Task 1: 更新类型定义

**Files:**

- Modify: `packages/desktop/src/types/condition-editor.ts`

- [ ] **Step 1: 替换类型文件内容**

```typescript
import type { ComponentSize, DeconstructValue } from '@veltra/utils'

import type { VariableItem } from './expression-editor'

export interface ConditionField {
  label: string
  value: string
  type: 'string' | 'number' | 'boolean' | 'date' | 'enum'
  enumOptions?: { label: string; value: string }[]
}

export type ConditionValue =
  | { kind: 'constant'; value: string }
  | { kind: 'variable'; name: string }

export interface ConditionItem {
  field: string
  operator: string
  value: ConditionValue
  _result?: boolean
}

export interface ConditionGroup {
  logic: 'and' | 'or'
  conditions: ConditionItem[]
  groups: ConditionGroup[]
}

export type ConditionExpression = ConditionGroup

export interface ConditionEditorProps {
  modelValue?: ConditionExpression
  fields?: ConditionField[]
  variables?: VariableItem[]
  data?: Record<string, unknown>
  size?: ComponentSize
  disabled?: boolean
  readonly?: boolean
}

export interface ConditionEditorEmits {
  (e: 'update:modelValue', value: ConditionExpression): void
  (e: 'evaluate', results: ConditionExpression): void
}

export interface _ConditionEditorExposed {}

export type ConditionEditorExposed = DeconstructValue<_ConditionEditorExposed>
```

- [ ] **Step 2: 验证类型**

```bash
cd /Users/whj/codes/ultra-ui && npx tsc --noEmit -p packages/desktop/tsconfig.json 2>&1 | head -20
```

应该没有和 condition-editor 类型相关的错误。

---

### Task 2: 运算符定义

**Files:**

- Create: `packages/desktop/src/components/condition-editor/core/operators.ts`

- [ ] **Step 1: 创建 operators.ts**

```typescript
export interface OperatorDef {
  label: string
  value: string
  needValue: boolean
}

const STRING_OPERATORS: OperatorDef[] = [
  { label: '等于', value: 'eq', needValue: true },
  { label: '不等于', value: 'ne', needValue: true },
  { label: '包含', value: 'contains', needValue: true },
  { label: '不包含', value: 'not_contains', needValue: true },
  { label: '为空', value: 'empty', needValue: false },
  { label: '不为空', value: 'not_empty', needValue: false }
]

const NUMBER_OPERATORS: OperatorDef[] = [
  { label: '等于', value: 'eq', needValue: true },
  { label: '不等于', value: 'ne', needValue: true },
  { label: '大于', value: 'gt', needValue: true },
  { label: '小于', value: 'lt', needValue: true },
  { label: '大于等于', value: 'gte', needValue: true },
  { label: '小于等于', value: 'lte', needValue: true }
]

const BOOLEAN_OPERATORS: OperatorDef[] = [
  { label: '是', value: 'is_true', needValue: false },
  { label: '否', value: 'is_false', needValue: false }
]

const DATE_OPERATORS: OperatorDef[] = [
  { label: '等于', value: 'eq', needValue: true },
  { label: '不等于', value: 'ne', needValue: true },
  { label: '早于', value: 'before', needValue: true },
  { label: '晚于', value: 'after', needValue: true }
]

const ENUM_OPERATORS: OperatorDef[] = [
  { label: '等于', value: 'eq', needValue: true },
  { label: '不等于', value: 'ne', needValue: true },
  { label: '包含于', value: 'in', needValue: true }
]

const OPERATOR_MAP: Record<string, OperatorDef[]> = {
  string: STRING_OPERATORS,
  number: NUMBER_OPERATORS,
  boolean: BOOLEAN_OPERATORS,
  date: DATE_OPERATORS,
  enum: ENUM_OPERATORS
}

export function getOperatorsByFieldType(type: string): OperatorDef[] {
  return OPERATOR_MAP[type] ?? STRING_OPERATORS
}

export function getOperatorDef(type: string, operator: string): OperatorDef | undefined {
  return getOperatorsByFieldType(type).find((op) => op.value === operator)
}
```

---

### Task 3: 求值引擎

**Files:**

- Create: `packages/desktop/src/components/condition-editor/core/evaluator.ts`

- [ ] **Step 1: 创建 evaluator.ts**

```typescript
import type { ConditionExpression, ConditionGroup, ConditionItem } from '../../../types'
import { getOperatorDef } from './operators'

function resolveValue(item: ConditionItem, data: Record<string, unknown>): string {
  if (item.value.kind === 'constant') return item.value.value
  return String(getByPath(data, item.value.name) ?? '')
}

function getByPath(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((acc: any, key) => (acc != null ? acc[key] : undefined), obj)
}

function evaluateItem(item: ConditionItem, data: Record<string, unknown>): boolean {
  const resolved = resolveValue(item, data)

  switch (item.operator) {
    case 'empty':
      return resolved === '' || resolved === 'undefined' || resolved === 'null'
    case 'not_empty':
      return resolved !== '' && resolved !== 'undefined' && resolved !== 'null'
    case 'is_true':
      return resolved === 'true' || resolved === '1'
    case 'is_false':
      return resolved === 'false' || resolved === '0' || resolved === ''
    case 'eq':
      return resolved === item.value.value
    case 'ne':
      return resolved !== item.value.value
    case 'contains':
      return resolved.includes(item.value.value)
    case 'not_contains':
      return !resolved.includes(item.value.value)
    case 'gt':
      return Number(resolved) > Number(item.value.value)
    case 'lt':
      return Number(resolved) < Number(item.value.value)
    case 'gte':
      return Number(resolved) >= Number(item.value.value)
    case 'lte':
      return Number(resolved) <= Number(item.value.value)
    case 'before':
      return new Date(resolved).getTime() < new Date(item.value.value).getTime()
    case 'after':
      return new Date(resolved).getTime() > new Date(item.value.value).getTime()
    case 'in': {
      const vals = item.value.value.split(',').map((s) => s.trim())
      return vals.includes(resolved)
    }
    default:
      return false
  }
}

function evaluateGroup(group: ConditionGroup, data: Record<string, unknown>): boolean {
  const conditionsResult = group.conditions.map((item) => {
    const result = evaluateItem(item, data)
    item._result = result
    return result
  })

  const groupsResult = group.groups.map((sub) => {
    const result = evaluateGroup(sub, data)
    sub._result = result
    return result
  })

  const allResults = [...conditionsResult, ...groupsResult]
  if (allResults.length === 0) return false

  return group.logic === 'and' ? allResults.every(Boolean) : allResults.some(Boolean)
}

export function evaluate(
  expression: ConditionExpression,
  data: Record<string, unknown>
): ConditionExpression {
  const cloned = JSON.parse(JSON.stringify(expression)) as ConditionExpression
  evaluateGroup(cloned, data)
  return cloned
}

export function createEmptyGroup(): ConditionGroup {
  return { logic: 'and', conditions: [], groups: [] }
}

export function createEmptyItem(): ConditionItem {
  return { field: '', operator: 'eq', value: { kind: 'constant', value: '' } }
}

export function serializeConditionValue(val: ConditionValue): string {
  return val.kind === 'variable' ? `{${val.name}}` : val.value
}

export function deserializeConditionValue(s: string): ConditionValue {
  const match = s.match(/^\{([^}]+)\}$/)
  if (match) return { kind: 'variable', name: match[1]! }
  return { kind: 'constant', value: s }
}
```

---

### Task 4: ConditionRow 组件

**Files:**

- Create: `packages/desktop/src/components/condition-editor/components/condition-row.vue`

- [ ] **Step 1: 创建 condition-row.vue**

```vue
<template>
  <div :class="[cls.e('row'), bem.is('focused', focused)]">
    <!-- 字段选择 -->
    <u-select
      :class="cls.e('field')"
      :model-value="item.field"
      :options="fieldOptions"
      value-key="value"
      label-key="label"
      placeholder="字段"
      :size="size"
      :disabled="disabled || readonly"
      @update:model-value="onFieldChange"
    />

    <!-- 运算符选择 -->
    <u-select
      :class="cls.e('operator')"
      :model-value="item.operator"
      :options="operatorOptions"
      value-key="value"
      label-key="label"
      placeholder="运算符"
      :size="size"
      :disabled="disabled || readonly"
      @update:model-value="onOperatorChange"
    />

    <!-- 值输入 -->
    <div :class="cls.e('value')">
      <template v-if="needValue">
        <input
          v-if="item.value.kind === 'constant'"
          ref="valueInputRef"
          :class="cls.e('value-input')"
          :value="item.value.value"
          :placeholder="placeholder"
          :disabled="disabled"
          :readonly="readonly"
          @input="onValueInput"
          @keydown="onValueKeydown"
          @focus="focused = true"
          @blur="focused = false"
        />
        <span
          v-else
          :class="cls.e('value-chip')"
          tabindex="0"
          @click="onChipClick"
          @keydown.delete="onChipDelete"
        >
          <span :class="cls.e('value-chip-label')">{{ variableLabel }}</span>
          <span :class="cls.e('value-chip-close')" @click.stop="onChipDelete">×</span>
        </span>
      </template>
      <span v-else :class="cls.e('value-empty')">—</span>
    </div>

    <!-- 删除 -->
    <span v-if="!readonly" :class="cls.e('row-delete')" @click="emit('delete')">×</span>

    <!-- 结果指示 -->
    <span
      v-if="hasResult"
      :class="[cls.e('result'), cls.em('result', item._result ? 'pass' : 'fail')]"
    >
      {{ item._result ? '✓' : '✗' }}
    </span>
    <span v-else :class="[cls.e('result'), cls.em('result', 'none')]">—</span>
  </div>
</template>

<script lang="ts" setup>
import { bem } from '@veltra/utils'
import { computed, ref, useTemplateRef } from 'vue'

import type { ConditionField, ConditionItem, ConditionValue } from '../../../types'
import { getOperatorsByFieldType, type OperatorDef } from '../core/operators'
import { USelect } from '../../select'

defineOptions({ name: 'ConditionRow' })

const props = withDefaults(
  defineProps<{
    item: ConditionItem
    fields?: ConditionField[]
    size?: 'small' | 'default' | 'large'
    disabled?: boolean
    readonly?: boolean
  }>(),
  { size: 'default' }
)

export interface MentionPayload {
  triggerDom: HTMLElement
  setValue: (val: ConditionValue) => void
}

const emit = defineEmits<{
  (e: 'update:item', item: ConditionItem): void
  (e: 'delete'): void
  (e: 'mention', payload: MentionPayload): void
}>()

const cls = bem('condition-editor')

const valueInputRef = useTemplateRef<HTMLInputElement>('valueInputRef')
const focused = ref(false)

const fieldOptions = computed(() =>
  (props.fields ?? []).map((f) => ({ label: f.label, value: f.value }))
)

const currentField = computed(() => props.fields?.find((f) => f.value === props.item.field))

const operatorOptions = computed(() => {
  if (!currentField.value) return []
  return getOperatorsByFieldType(currentField.value.type)
})

const needValue = computed(() => {
  const ops = operatorOptions.value as OperatorDef[]
  const op = ops.find((o) => o.value === props.item.operator)
  return op?.needValue ?? true
})

const hasResult = computed(() => props.item._result !== undefined)

const placeholder = computed(() => (props.fields?.length ? '输入值或 @ 引用变量' : ''))

const variableLabel = computed(() => {
  if (props.item.value.kind !== 'variable') return ''
  return props.item.value.name
})

function onFieldChange(val: string) {
  const field = props.fields?.find((f) => f.value === val)
  const newItem: ConditionItem = {
    ...props.item,
    field: val,
    operator: field ? getOperatorsByFieldType(field.type)[0]!.value : 'eq',
    value: { kind: 'constant', value: '' }
  }
  emit('update:item', newItem)
}

function onOperatorChange(val: string) {
  const newItem: ConditionItem = {
    ...props.item,
    operator: val,
    value: { kind: 'constant', value: '' }
  }
  emit('update:item', newItem)
}

function onValueInput(e: Event) {
  const val = (e.target as HTMLInputElement).value
  emit('update:item', { ...props.item, value: { kind: 'constant', value: val } })
}

function onValueKeydown(e: KeyboardEvent) {
  if (disabled.value || readonly.value) return
  if (e.key === '@' && valueInputRef.value) {
    e.preventDefault()
    emit('mention', {
      triggerDom: valueInputRef.value,
      setValue: (val: ConditionValue) => {
        emit('update:item', { ...props.item, value: val })
      }
    })
  }
}

function onChipClick() {
  if (disabled.value || readonly.value) return
  if (valueInputRef.value) {
    emit('mention', {
      triggerDom: valueInputRef.value,
      setValue: (val: ConditionValue) => {
        emit('update:item', { ...props.item, value: val })
      }
    })
  }
}

function onChipDelete() {
  emit('update:item', { ...props.item, value: { kind: 'constant', value: '' } })
}
</script>
```

注意：此组件使用 `u-select` 作为字段/运算符下拉。需要确认 `u-select` 已作为依赖在 `style.ts` 中引入。

---

### Task 5: ConditionGroup 递归组件

**Files:**

- Create: `packages/desktop/src/components/condition-editor/components/condition-group.vue`

- [ ] **Step 1: 创建 condition-group.vue**

```vue
<template>
  <div :class="cls.e('group')">
    <!-- AND/OR 标签 + 汇总结果 -->
    <div :class="cls.e('group-header')">
      <span :class="[cls.e('logic-tag'), cls.em('logic-tag', group.logic)]" @click="toggleLogic">
        {{ group.logic.toUpperCase() }} ▾
      </span>
      <span
        v-if="hasResult"
        :class="[cls.e('group-result'), cls.em('group-result', group._result ? 'pass' : 'fail')]"
      >
        {{ group._result ? '✓ 通过' : '✗ 不通过' }}
      </span>
    </div>

    <!-- 嵌套组容器 -->
    <div :class="cls.e('group-body')">
      <!-- 子条件 -->
      <ConditionRow
        v-for="(cond, idx) in group.conditions"
        :key="idx"
        :item="cond"
        :fields="fields"
        :size="size"
        :disabled="disabled"
        :readonly="readonly"
        @update:item="(item) => updateCondition(idx, item)"
        @delete="removeCondition(idx)"
        @mention="(p) => emit('mention', p)"
      />

      <!-- 子分组（递归） -->
      <ConditionGroup
        v-for="(sub, idx) in group.groups"
        :key="idx"
        :group="sub"
        :fields="fields"
        :size="size"
        :disabled="disabled"
        :readonly="readonly"
        :index-path="[...props.indexPath, idx]"
        @update:group="(g) => updateSubGroup(idx, g)"
        @remove="() => removeSubGroup(idx)"
        @mention="(p) => emit('mention', p)"
      />

      <!-- 空状态 + 添加按钮 -->
      <div :class="cls.e('group-actions')">
        <span v-if="!readonly" :class="cls.e('add-btn')" @click="addCondition">＋ 添加条件</span>
        <span v-if="!readonly" :class="cls.e('add-btn')" @click="addGroup">＋ 添加条件组</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { bem } from '@veltra/utils'
import { computed } from 'vue'

import type { ConditionField, ConditionGroup, ConditionItem } from '../../../types'
import { createEmptyGroup, createEmptyItem } from '../core/evaluator'
import ConditionRow, { type MentionPayload } from './condition-row.vue'

defineOptions({ name: 'ConditionGroup' })

const props = withDefaults(
  defineProps<{
    group: ConditionGroup
    fields?: ConditionField[]
    size?: 'small' | 'default' | 'large'
    disabled?: boolean
    readonly?: boolean
    indexPath?: number[]
  }>(),
  { size: 'default', indexPath: () => [] }
)

const emit = defineEmits<{
  (e: 'update:group', group: ConditionGroup): void
  (e: 'remove'): void
  (e: 'mention', payload: MentionPayload): void
}>()

const cls = bem('condition-editor')

const hasResult = computed(() => props.group._result !== undefined)

function toggleLogic() {
  if (props.disabled || props.readonly) return
  emit('update:group', { ...props.group, logic: props.group.logic === 'and' ? 'or' : 'and' })
}

function addCondition() {
  emit('update:group', {
    ...props.group,
    conditions: [...props.group.conditions, createEmptyItem()]
  })
}

function removeCondition(idx: number) {
  const conditions = [...props.group.conditions]
  conditions.splice(idx, 1)
  emit('update:group', { ...props.group, conditions })
}

function updateCondition(idx: number, item: ConditionItem) {
  const conditions = [...props.group.conditions]
  conditions[idx] = item
  emit('update:group', { ...props.group, conditions })
}

function addGroup() {
  emit('update:group', { ...props.group, groups: [...props.group.groups, createEmptyGroup()] })
}

function removeSubGroup(idx: number) {
  const groups = [...props.group.groups]
  groups.splice(idx, 1)
  emit('update:group', { ...props.group, groups })
}

function updateSubGroup(idx: number, g: ConditionGroup) {
  const groups = [...props.group.groups]
  groups[idx] = g
  emit('update:group', { ...props.group, groups })
}
</script>
```

注意：`ConditionGroup` 递归引用自身（`defineOptions({ name: 'ConditionGroup' })`），Vue 3.3+ `<script setup>` 通过组件名支持递归。

---

### Task 6: 主组件 condition-editor.vue

**Files:**

- Modify: `packages/desktop/src/components/condition-editor/condition-editor.vue`

- [ ] **Step 1: 重写 condition-editor.vue**

```vue
<template>
  <div :class="className" @keydown="onKeydown">
    <ConditionGroup
      :group="rootGroup"
      :fields="props.fields"
      :size="size"
      :disabled="disabled"
      :readonly="readonly"
      @update:group="onGroupUpdate"
      @mention="onMention"
    />

    <VariablePicker
      ref="pickerRef"
      :visible="pickerVisible"
      :trigger-dom="pickerTriggerDom"
      :variables="props.variables"
      :filter="pickerFilter"
      :selectable-levels="'leaf'"
      @select="onPickerSelect"
      @dismiss="onPickerDismiss"
      @update:visible="onPickerVisibleChange"
    />
  </div>
</template>

<script lang="ts" setup>
import { useFormFallbackProps } from '@veltra/compositions'
import { bem, injectFormContext } from '@veltra/utils'
import { computed, nextTick, shallowRef, useTemplateRef, watch } from 'vue'

import type { ConditionEditorProps, ConditionExpression } from '../../types'
import VariablePicker from '../expression-editor/components/variable-picker.vue'
import ConditionGroup from './components/condition-group.vue'
import { createEmptyGroup, evaluate } from './core/evaluator'
import type { MentionPayload } from './components/condition-row.vue'

defineOptions({ name: 'ConditionEditor' })

const props = withDefaults(defineProps<ConditionEditorProps>(), { fields: () => [] })

const emit = defineEmits<{
  (e: 'update:modelValue', value: ConditionExpression): void
  (e: 'evaluate', results: ConditionExpression): void
}>()

const cls = bem('condition-editor')
const { formProps } = injectFormContext()
const { size, disabled, readonly } = useFormFallbackProps([formProps ?? {}, props])

const className = computed(() => [
  cls.b,
  cls.m(size.value),
  bem.is('disabled', disabled.value),
  bem.is('readonly', readonly.value)
])

const rootGroup = shallowRef<ConditionExpression>(
  props.modelValue ? JSON.parse(JSON.stringify(props.modelValue)) : createEmptyGroup()
)

function serialize(): ConditionExpression {
  function clean(group: ConditionExpression): ConditionExpression {
    return {
      logic: group.logic,
      conditions: group.conditions.map((c) => {
        const { _result, ...rest } = c
        return rest
      }),
      groups: group.groups.map(clean).filter((g) => g.conditions.length > 0 || g.groups.length > 0)
    }
  }
  return clean(JSON.parse(JSON.stringify(rootGroup.value)))
}

function emitUpdate() {
  emit('update:modelValue', serialize())
}

function runEvaluate() {
  if (!props.data) return
  const cloned = JSON.parse(JSON.stringify(rootGroup.value)) as ConditionExpression
  const result = evaluate(cloned, props.data)
  rootGroup.value = result
  emit('evaluate', serialize())
}

// ── VariablePicker ──

const pickerRef = useTemplateRef<{ handleKeydown: (e: KeyboardEvent) => boolean }>('pickerRef')
const pickerVisible = shallowRef(false)
const pickerTriggerDom = shallowRef<HTMLElement | undefined>(undefined)
const pickerFilter = shallowRef('')
const mentionTarget = shallowRef<MentionPayload | null>(null)

function onMention(payload: MentionPayload) {
  if (disabled.value || readonly.value) return
  mentionTarget.value = payload
  pickerTriggerDom.value = payload.triggerDom
  pickerFilter.value = ''
  pickerVisible.value = true
}

function onPickerSelect(item: { label: string; value: string }) {
  mentionTarget.value?.setValue({ kind: 'variable', name: item.value })
  pickerVisible.value = false
  mentionTarget.value = null
}

function onPickerDismiss() {
  pickerVisible.value = false
  mentionTarget.value = null
}

function onPickerVisibleChange(v: boolean) {
  if (!v) {
    pickerVisible.value = false
    mentionTarget.value = null
  }
}

function onGroupUpdate(group: ConditionExpression) {
  rootGroup.value = group
  emitUpdate()
  void nextTick(() => runEvaluate())
}

watch(
  () => props.modelValue,
  (v) => {
    if (!v) return
    const current = serialize()
    if (JSON.stringify(v) === JSON.stringify(current)) return
    rootGroup.value = JSON.parse(JSON.stringify(v))
  }
)

watch(
  () => props.data,
  () => runEvaluate(),
  { deep: true }
)

function onKeydown(e: KeyboardEvent) {
  if (disabled.value || readonly.value) return
  if (pickerVisible.value) {
    const handled = pickerRef.value?.handleKeydown(e)
    if (handled) {
      e.preventDefault()
      return
    }
  }
}
</script>
```

---

### Task 7: 样式

**Files:**

- Modify: `packages/desktop/src/components/condition-editor/style.scss`

- [ ] **Step 1: 重写 style.scss**

```scss
@use 'pkg:@veltra/styles/mixins' as m;
@use 'pkg:@veltra/styles/functions' as fn;
@use 'pkg:@veltra/styles/vars';

$root-name: condition-editor;

@include m.b($root-name) {
  // ─── 条件分组 ────────────────────────────────────
  @include m.e(group) {
    // 外层不需额外边框
  }

  @include m.e(group-header) {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 4px;
  }

  @include m.e(group-body) {
    border-left: 2px solid fn.use-var(border, muted-color);
    margin-left: 8px;
    padding-left: 10px;
  }

  @include m.e(group-actions) {
    display: flex;
    gap: 10px;
    padding: 2px 0;
  }

  @include m.e(group-result) {
    font-size: 11px;
    font-weight: 600;

    &--pass {
      color: fn.use-var(color, success);
    }

    &--fail {
      color: fn.use-var(color, danger);
    }
  }

  // ─── AND/OR 标签 ──────────────────────────────────
  @include m.e(logic-tag) {
    display: inline-block;
    padding: 1px 8px;
    border-radius: fn.use-var(radius, small);
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    user-select: none;
    transition: background-color 0.12s ease;

    &--and {
      background-color: fn.use-var(color, primary, light-9);
      color: fn.use-var(color, primary);

      &:hover {
        background-color: fn.use-var(color, primary, light-8);
      }
    }

    &--or {
      background-color: fn.use-var(color, warning, light-9);
      color: fn.use-var(color, warning);

      &:hover {
        background-color: fn.use-var(color, warning, light-8);
      }
    }
  }

  // ─── 条件行 ──────────────────────────────────────
  @include m.e(row) {
    display: flex;
    gap: 4px;
    align-items: center;
    margin-bottom: 3px;
    transition: border-color 0.12s ease;

    &.is-focused {
      // 聚焦指示由内部 input 处理
    }
  }

  @include m.e(field) {
    width: 90px;
    flex-shrink: 0;
  }

  @include m.e(operator) {
    width: 80px;
    flex-shrink: 0;
  }

  @include m.e(value) {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
  }

  @include m.e(value-input) {
    width: 100%;
    height: 28px;
    padding: 0 8px;
    border: 1px solid fn.use-var(border, muted-color);
    border-radius: fn.use-var(radius, small);
    font-size: 12px;
    color: fn.use-var(text-color, main);
    background-color: fn.use-var(bg-color, top);
    outline: none;
    transition: border-color 0.12s ease;

    &::placeholder {
      color: fn.use-var(text-color, placeholder);
    }

    &:focus {
      border-color: fn.use-var(color, primary);
    }

    &:disabled {
      background-color: fn.use-var(color, disabled);
      cursor: not-allowed;
    }
  }

  @include m.e(value-empty) {
    font-size: 12px;
    color: fn.use-var(text-color, assist);
  }

  // ─── 变量 chip ──────────────────────────────────
  @include m.e(value-chip) {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 0 8px;
    height: 22px;
    font-size: 12px;
    color: fn.use-var(color, primary);
    background-color: fn.use-var(color, primary, light-9);
    border-radius: 999px;
    cursor: pointer;
    user-select: none;
    transition:
      background-color 0.12s ease,
      box-shadow 0.12s ease;

    &:hover {
      background-color: fn.use-var(color, primary, light-8);

      .#{vars.$namespace}#{$root-name}__value-chip-close {
        opacity: 1;
        max-width: 14px;
        margin-left: 2px;
      }
    }
  }

  @include m.e(value-chip-label) {
    pointer-events: none;
  }

  @include m.e(value-chip-close) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 14px;
    max-width: 0;
    margin-left: 0;
    overflow: hidden;
    font-size: 14px;
    line-height: 1;
    color: fn.use-var(color, primary);
    opacity: 0;
    transition:
      opacity 0.12s ease,
      max-width 0.12s ease,
      margin-left 0.12s ease;

    &:hover {
      transform: scale(1.1);
    }
  }

  // ─── 删除按钮 ────────────────────────────────────
  @include m.e(row-delete) {
    flex-shrink: 0;
    width: 16px;
    text-align: center;
    font-size: 15px;
    color: fn.use-var(text-color, assist);
    cursor: pointer;
    transition: color 0.12s ease;

    &:hover {
      color: fn.use-var(color, danger);
    }
  }

  // ─── 结果指示 ────────────────────────────────────
  @include m.e(result) {
    flex-shrink: 0;
    width: 16px;
    text-align: center;
    font-size: 11px;
    font-weight: 600;

    &--pass {
      color: fn.use-var(color, success);
    }

    &--fail {
      color: fn.use-var(color, danger);
    }

    &--none {
      color: fn.use-var(text-color, assist);
    }
  }

  // ─── 添加按钮 ────────────────────────────────────
  @include m.e(add-btn) {
    font-size: 11px;
    color: fn.use-var(color, primary);
    cursor: pointer;
    transition: color 0.12s ease;

    &:hover {
      color: fn.use-var(color, primary, dark-2);
    }
  }

  // ─── 状态态 ──────────────────────────────────────
  @include m.is(disabled) {
    cursor: not-allowed;

    @include m.bem($root-name, logic-tag) {
      cursor: not-allowed;
      opacity: 0.6;
    }

    @include m.bem($root-name, add-btn) {
      cursor: not-allowed;
      opacity: 0.6;
    }
  }
}
```

---

### Task 8: 更新 style.ts 依赖

**Files:**

- Modify: `packages/desktop/src/components/condition-editor/style.ts`

- [ ] **Step 1: 更新 style.ts**

```typescript
import '../select/style'
import '../input/style'
import '../icon/style'
import '../scroll/style'
import '../empty/style'
import '../tip/style'
import '../expression-editor/style'
import './style.scss'
```

Expression-editor style 的引入确保了 VariablePicker 的 CSS（`u-expression-editor__picker` 等）可用。

---

### Task 9: Playground 页面

**Files:**

- Create: `playgrounds/desktop/src/condition-editor/index.vue`

- [ ] **Step 1: 创建 playground 页面**

```vue
<template>
  <div style="max-width: 640px; padding: 20px;">
    <h3>条件编辑器</h3>

    <div style="margin-bottom: 24px;">
      <h4>基础示例</h4>
      <u-condition-editor
        v-model="expression"
        :fields="fields"
        :variables="variables"
        :data="evalData"
        @evaluate="onEvaluate"
      />
    </div>

    <div style="margin-bottom: 16px;">
      <h4>表达式输出（v-model）：</h4>
      <pre
        style="background:#f5f5f5;padding:12px;border-radius:6px;font-size:12px;overflow-x:auto;"
        >{{ JSON.stringify(expression, null, 2) }}</pre
      >
    </div>

    <div style="margin-bottom: 16px;">
      <h4>求值结果（evaluate）：</h4>
      <pre
        style="background:#f5f5f5;padding:12px;border-radius:6px;font-size:12px;overflow-x:auto;"
        >{{ JSON.stringify(evalResult, null, 2) }}</pre
      >
    </div>

    <div style="margin-bottom: 24px;">
      <h4>禁用状态：</h4>
      <u-condition-editor
        :model-value="expression"
        :fields="fields"
        :variables="variables"
        disabled
      />
    </div>

    <div style="margin-bottom: 24px;">
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
import { shallowRef } from 'vue'
import type { ConditionExpression, ConditionField } from '@veltra/desktop'
import type { VariableItem } from '@veltra/desktop'

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
```

页面路由自动生成，路径为 `/condition-editor`。

---

### Task 10: 构建验证

**Files:**

- None

- [ ] **Step 1: TypeScript 类型检查**

```bash
cd /Users/whj/codes/ultra-ui && npx tsc --noEmit -p packages/desktop/tsconfig.json 2>&1 | head -30
```

预期：无新增类型错误。

- [ ] **Step 2: 构建 desktop 包**

```bash
cd /Users/whj/codes/ultra-ui/packages/desktop && bun run build 2>&1 | tail -20
```

预期：构建成功。

- [ ] **Step 3: 启动 playground 验证**

```bash
cd /Users/whj/codes/ultra-ui/playgrounds/desktop && bun run dev
```

在浏览器中打开 playground，导航到 condition-editor 页面，验证：

- 可视化编辑（添加/删除条件、添加/删除条件组）
- AND/OR 切换
- 字段选择联动运算符
- @ 变量注入
- 求值结果展示
- 禁用/只读状态

- [ ] **Step 4: 修复问题**

根据验证结果修复所有发现的问题。

---

## 设计决策记录

1. **VariablePicker 复用**：共享 expression-editor 的 VariablePicker，通过 import expression-editor/style 使其 CSS 可用。
2. **变量注入闭环**：通过 `mention` 事件携带 `setValue` 回调，避免了复杂的 ref 传递和 ID 管理。
3. **递归分组**：`ConditionGroup` 通过 `defineOptions({ name })` 实现递归自引用。
4. **求值时机**：`data` prop 变化时自动求值；条件树变更后下一帧求值。
5. **序列化过滤**：输出时过滤空子组和 `_result` 字段。
6. **运算符自动重置值**：切换运算符时清空值（因为 `empty`/`not_empty` 不需要值）。
