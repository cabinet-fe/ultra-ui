# UMultiSelect — 多选选择器

> `import type { MultiSelectProps, MultiSelectEmits, MultiSelectExposed } from '@veltra/desktop'`

## Import

```ts
import { UMultiSelect } from '@veltra/desktop'
```

## Props

继承 `FormComponentProps`（`size`、`disabled`、`readonly`、`label`、`field`、`tips`、`span`）。

| prop | type | default | 说明 |
|------|------|---------|------|
| `modelValue` | `any[]` | — | 绑定值，选中项的 `valueKey` 值数组 |
| `options` | `Record<string, any>[] \| ((qs: string) => Promise<Record<string, any>[]> \| Record<string, any>[])` | — | 选项列表，也支持传入异步函数做远程搜索 |
| `valueKey` | `string` | `'value'` | 选项值字段名 |
| `labelKey` | `string` | `'label'` | 选项标签字段名 |
| `placeholder` | `string` | `'请选择'` | 未选择时的占位文本 |
| `clearable` | `boolean` | `true` | 是否显示清除按钮（hover 时出现） |
| `filterable` | `boolean` | — | 是否显示搜索过滤输入框。若 `options` 为函数或 `creatable` 为 `true`，自动启用 |
| `visibilityLimit` | `number` | `3` | 触发器中最多显示的标签数量，超出部分以 `+N` 形式展示。`disabled` 或 `readonly` 时显示全部 |
| `max` | `number` | — | 最大可选数量。达到上限后未选中项禁用，「全选」也一并禁用 |
| `creatable` | `boolean` | — | 是否允许通过搜索输入框按回车创建新选项（label 和 value 均为输入内容） |
| `minWidth` | `string` | `'220px'` | 弹框最小宽度 |
| `width` | `string` | `'220px'` | 弹框宽度 |
| `contentStyle` | `CSSProperties \| string` | — | 弹框内容容器样式 |
| `contentClass` | `unknown` | — | 弹框内容容器附加类名 |

## Emits

| event | 签名 | 说明 |
|-------|------|------|
| `update:modelValue` | `(value: any[]) => void` | 绑定值变化时触发，支持 `v-model` |
| `change` | `(options: Record<string, any>[]) => void` | 选中项集合变化时触发，返回当前所有选中项的原始对象数组 |

## Slots

| slot | scope | 说明 |
|------|-------|------|
| `default` | `{ option: Record<string, any>, index: number }` | 自定义选项内容的渲染，默认显示 `option[labelKey]` |

## Exposed

无对外暴露的方法或属性。

## Examples

### 基础多选

```vue
<template>
  <u-multi-select
    v-model="selected"
    :options="cities"
    placeholder="请选择城市"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'

const selected = ref([])
const cities = [
  { label: '北京', value: 'beijing' },
  { label: '上海', value: 'shanghai' },
  { label: '广州', value: 'guangzhou' },
  { label: '深圳', value: 'shenzhen' },
  { label: '杭州', value: 'hangzhou' }
]
</script>
```

### 带搜索、限制数量、自定义选项内容

```vue
<template>
  <u-multi-select
    v-model="users"
    :options="userList"
    filterable
    :max="3"
    :visibility-limit="2"
  >
    <template #default="{ option }">
      <div class="user-option">
        <img :src="option.avatar" class="user-avatar" />
        <span>{{ option.label }}</span>
      </div>
    </template>
  </u-multi-select>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const users = ref([])
const userList = [
  { label: '张三', value: '1', avatar: '/avatars/1.png' },
  { label: '李四', value: '2', avatar: '/avatars/2.png' },
  { label: '王五', value: '3', avatar: '/avatars/3.png' },
  { label: '赵六', value: '4', avatar: '/avatars/4.png' },
  { label: '孙七', value: '5', avatar: '/avatars/5.png' }
]
</script>
```

### 远程搜索 + 可创建

```vue
<template>
  <u-multi-select
    v-model="tags"
    :options="remoteSearch"
    creatable
    label-key="name"
    value-key="id"
    placeholder="搜索或创建标签"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'

const tags = ref([])

async function remoteSearch(qs: string) {
  if (!qs) return []
  const res = await fetch(`/api/tags?q=${qs}`)
  return res.json()
}
</script>
```

### 禁用 / 只读状态

```vue
<template>
  <u-multi-select
    v-model="selected"
    :options="items"
    disabled
  />

  <u-multi-select
    v-model="selected"
    :options="items"
    readonly
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'

const selected = ref([{ label: '选项一', value: 1 }, { label: '选项二', value: 2 }])
const items = [
  { label: '选项一', value: 1 },
  { label: '选项二', value: 2 },
  { label: '选项三', value: 3 }
]
</script>
```
