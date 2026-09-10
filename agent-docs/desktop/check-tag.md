---
title: UCheckTag 可选中标签
description: "@veltra/desktop 导出的可切换选中态的标签组件。点击整枚标签在选中/未选中间切换，用 v-model 双向绑定布尔值，适合筛选项、多选标签组等非表单场景。"
aliases: [UCheckTag, CheckTag, 可选标签, 可选中标签, CheckableTag]
keywords: [CheckTagProps, modelValue, checked, "update:modelValue", is-checked, 切换选中, 点击切换, 筛选条件, 多选标签, 受控, 标签组]
---

# UCheckTag 可选中标签

`@veltra/desktop` 导出可选中标签组件 `UCheckTag`，渲染为一个可点击切换选中态的标签。点击整枚标签发出 `update:modelValue`，用 `v-model` 绑定布尔值；适合搜索筛选、兴趣多选等场景。与 `UTag` 的区别：`UTag` 是纯展示标记，`UCheckTag` 是可交互的开关型标签。

## 快速上手

```vue
<script setup lang="ts">
import { UCheckTag } from '@veltra/desktop'
import { ref } from 'vue'

const checked = ref(false)
</script>

<template>
  <!-- 点击标签切换 checked，显示为选中高亮 -->
  <u-check-tag v-model="checked">包邮</u-check-tag>
</template>
```

视觉初始化前提：应用入口需要 `import '@veltra/styles/normalize'` 并调用 `@veltra/styles/theme` 的 `loadTheme()`，否则 `--u-*` token 为空、标签无颜色。

## API 签名

```ts
/** check-tag 组件属性 */
export interface CheckTagProps {
  /** 选中状态（v-model 绑定值） */
  modelValue?: boolean
  /** modelValue 为 undefined / null 时的回退显示状态 */
  checked?: boolean
}

/** check-tag 组件定义的事件 */
export interface CheckTagEmits {
  (e: 'update:modelValue', value: boolean): void
}

export type CheckTagExposed = {}
```

## 参数说明

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `modelValue` | `boolean` | — | 否 | 选中态的绑定值；显示优先级高于 `checked` |
| `checked` | `boolean` | — | 否 | 仅当 `modelValue` 为 `undefined` 或 `null` 时作为显示回退 |

事件：仅 `update:modelValue(value: boolean)`，点击标签时发出，值为当前态取反（`!(modelValue ?? checked)`）。没有 `change` 事件。

插槽：默认插槽放标签文案。暴露：`CheckTagExposed` 为空对象，无可用方法或属性。

选中态类名为 `is-checked`（完整选择器 `.u-check-tag.is-checked`）。

## 方法与事件

| 事件 | payload | 触发时机 |
| --- | --- | --- |
| `update:modelValue` | `value: boolean` | 点击标签主体时发出，值为当前显示态取反 |

## 典型示例

### 筛选条件组（多选）

```vue
<script setup lang="ts">
import { UCheckTag } from '@veltra/desktop'
import { reactive } from 'vue'

const filters = reactive([
  { label: '包邮', checked: false },
  { label: '新品', checked: true },
  { label: '促销', checked: false }
])

function selectedLabels() {
  return filters.filter((f) => f.checked).map((f) => f.label)
}
</script>

<template>
  <u-check-tag v-for="f in filters" :key="f.label" v-model="f.checked">
    {{ f.label }}
  </u-check-tag>
</template>
```

### 受控联动

```vue
<script setup lang="ts">
import { UCheckTag } from '@veltra/desktop'
import { ref, watch } from 'vue'

const onlyMine = ref(false)
const onlyStar = ref(false)

// 至少保留一个选中条件
watch([onlyMine, onlyStar], ([a, b]) => {
  if (!a && !b) onlyStar.value = true
})
</script>

<template>
  <u-check-tag v-model="onlyMine">只看我的</u-check-tag>
  <u-check-tag v-model="onlyStar">只看收藏</u-check-tag>
</template>
```

## 注意事项

> [!WARNING]
> - 组件内部没有选中状态，完全受控：显示值始终读 `modelValue ?? checked`。禁止只传 `checked` 而不监听 `update:modelValue`——点击后 UI 不会变化。
> - 必须用 `v-model`（或 `:model-value` + `@update:model-value`）驱动选中态；本库没有非受控的内部缓存。
> - 本库是 `UCheckTag`（点击整枚标签切换），不是 Ant Design 的 `Tag.CheckableTag` 写法。
> - 事件只有 `update:modelValue`，没有 `change` 事件；`v-model` 即可覆盖全部需求。
> - 非表单控件：没有 `field` 属性，在 UForm 内也不会被表单接管，直接用 `v-model`。
