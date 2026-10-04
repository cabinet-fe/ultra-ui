---
title: UCheckTag 可选中标签（@veltra/mobile 移动端）
description: '@veltra/mobile 导出的移动端可选中标签组件。点击整枚标签在选中/未选中间切换，用 v-model 双向绑定布尔值；触控热区不小于 44×44，按压反馈走 :active，适合筛选项、多选标签组等非表单场景。'
aliases: [UCheckTag, CheckTag, 可选标签, 可选中标签, CheckableTag, 移动端筛选标签]
keywords:
  [
    UCheckTag,
    CheckTagProps,
    CheckTagEmits,
    CheckTagExposed,
    modelValue,
    checked,
    'update:modelValue',
    is-checked,
    切换选中,
    点击切换,
    筛选条件,
    多选标签,
    受控,
    触控热区,
    移动端筛选
  ]
---

# UCheckTag 可选中标签（@veltra/mobile 移动端）

`@veltra/mobile` 导出可选中标签组件 `UCheckTag`（`packages/mobile/src/index.ts` 具名导出），渲染为一个可点击切换选中态的标签。点击整枚标签发出 `update:modelValue`，用 `v-model` 绑定布尔值；适合搜索筛选、兴趣多选等场景。与 `UTag` 的区别：`UTag` 是纯展示标记，`UCheckTag` 是可交互的开关型标签。与桌面端的差异：热区不小于 44×44，按压反馈用 `:active` 而非 `:hover`。

## 快速上手

```vue
<script setup lang="ts">
import { UCheckTag } from '@veltra/mobile'
import { ref } from 'vue'
import '@veltra/mobile/components/check-tag/style'

const checked = ref(false)
</script>

<template>
  <!-- 点击标签切换 checked，显示为选中高亮 -->
  <u-check-tag v-model="checked">包邮</u-check-tag>
</template>
```

视觉初始化前提：应用入口需要 `import '@veltra/styles/normalize'` 并调用 `@veltra/styles/theme` 的 `loadTheme()`，否则 `--u-*` token 为空、标签无颜色。组件样式按需引入 `@veltra/mobile/components/check-tag/style`，仅导入组件不带入样式。

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

/** check-tag 组件暴露的属性和方法（本组件无暴露成员） */
export type CheckTagExposed = {}
```

## 参数说明

| 参数         | 类型      | 默认 | 必填 | 约束                                                      |
| ------------ | --------- | ---- | :--: | --------------------------------------------------------- |
| `modelValue` | `boolean` | —    |  否  | 选中态的绑定值；显示优先级高于 `checked`                  |
| `checked`    | `boolean` | —    |  否  | 仅当 `modelValue` 为 `undefined` 或 `null` 时作为显示回退 |

事件：仅 `update:modelValue(value: boolean)`，点击标签时发出，值为当前态取反（`!(modelValue ?? checked)`）。没有 `change` 事件。

插槽：默认插槽放标签文案。暴露：`CheckTagExposed` 为空对象，无可用方法或属性。

选中态类名为 `is-checked`（完整选择器 `.um-check-tag.is-checked`）。组件没有 `size` 属性：固定 `min-height` / `min-width` 44px、`padding: 0 14px`，字号继承页面默认。

样式形态（取主题 token）：

| 状态     | 文字               | 描边 / 底色                                    |
| -------- | ------------------ | ---------------------------------------------- |
| 未选中   | `--u-text-color-main` | `--u-color-primary` 描边 + `light-9` 浅底   |
| 选中     | 白色               | `--u-color-primary` 的 `dark-3` 描边 + 同色底 |

## 方法与事件

| 事件                | payload          | 触发时机                               |
| ------------------- | ---------------- | -------------------------------------- |
| `update:modelValue` | `value: boolean` | 点击标签主体时发出，值为当前显示态取反 |

## 典型示例

### 筛选条件组（多选）

```vue
<script setup lang="ts">
import { UCheckTag } from '@veltra/mobile'
import { reactive, computed } from 'vue'
import '@veltra/mobile/components/check-tag/style'

const filters = reactive([
  { label: '包邮', checked: false },
  { label: '新品', checked: true },
  { label: '促销', checked: false }
])

const selected = computed(() => filters.filter((f) => f.checked).map((f) => f.label))
</script>

<template>
  <u-check-tag v-for="f in filters" :key="f.label" v-model="f.checked">
    {{ f.label }}
  </u-check-tag>
  <p>已选：{{ selected.join('、') || '无' }}</p>
</template>
```

### 受控联动

```vue
<script setup lang="ts">
import { UCheckTag } from '@veltra/mobile'
import { ref, watch } from 'vue'
import '@veltra/mobile/components/check-tag/style'

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

### checked 回退的静态选中态

```vue
<script setup lang="ts">
import { UCheckTag } from '@veltra/mobile'
import '@veltra/mobile/components/check-tag/style'
</script>

<template>
  <!-- 未绑定 v-model 时用 checked 指定初始显示态；点击后因无人接收 update:modelValue，UI 不变化 -->
  <u-check-tag checked>默认选中</u-check-tag>
  <u-check-tag>默认未选中</u-check-tag>
</template>
```

## 注意事项

> [!WARNING]
>
> - 移动端热区不小于 44×44（`min-height` / `min-width` 均为 44px，`padding: 0 14px`）；桌面端是固定 `height: 24px` 的紧凑形态，没有 44px 下限。
> - 移动端按压反馈是 `:active`（未选中按到 `light-7` 底、选中按到 `dark-5` 底），没有 `:hover` 悬停态；桌面端主反馈是 `:hover`。
> - 组件内部没有选中状态，完全受控：显示值始终读 `modelValue ?? checked`。禁止只传 `checked` 而不监听 `update:modelValue`——点击后 UI 不会变化。
> - 必须用 `v-model`（或 `:model-value` + `@update:model-value`）驱动选中态；本库没有非受控的内部缓存。
> - 事件只有 `update:modelValue`，没有 `change` 事件；`v-model` 即可覆盖全部需求。
> - 非表单控件：没有 `field` 属性，在 `UForm` 内也不会被表单接管，直接用 `v-model`。
> - 组件没有 `size` 属性、没有 `disabled` 属性；需要禁用态时自行在外层拦截点击。
> - 组件样式按需引入 `@veltra/mobile/components/check-tag/style`，仅 `import { UCheckTag } from '@veltra/mobile'` 不带入样式。

## 常见问题

### 点击标签后选中态没有变化

原因：组件完全受控，点击只发出 `update:modelValue`，显示值始终读 `modelValue ?? checked`。只传 `checked` 不绑 `v-model` 时点击不生效。修复：

```vue
<script setup lang="ts">
import { UCheckTag } from '@veltra/mobile'
import { ref } from 'vue'
import '@veltra/mobile/components/check-tag/style'

const checked = ref(false)
</script>

<template>
  <u-check-tag v-model="checked">包邮</u-check-tag>
</template>
```

### 标签比桌面端大一圈

原因：移动端热区下限 44px 是刻意的触控设计，视觉尺寸由 `padding: 0 14px` 加文字高度撑出。修复：不要用 CSS 覆盖 `min-height` / `min-width`（会破坏触控标准）；密度敏感的纯展示标记改用 `UTag`。
