---
title: UTag 标签（@veltra/mobile 移动端）
description: '@veltra/mobile 导出的移动端标签组件，用于展示分类、状态等短文本标记。支持五种语义色、三档尺寸、圆角与深色变体；closable 时渲染常显关闭图标并发出 close 事件，关闭图标触控热区扩至 44×44，移除数据需自行处理。'
aliases: [UTag, Tag, 标签, ElTag, 移动端标签]
keywords:
  [
    UTag,
    TagProps,
    TagEmits,
    TagExposed,
    closable,
    round,
    dark,
    ColorType,
    ComponentSize,
    可移除,
    圆角,
    深色,
    关闭事件,
    触控热区,
    状态标记,
    移动端标签
  ]
---

# UTag 标签（@veltra/mobile 移动端）

`@veltra/mobile` 导出标签组件 `UTag`（`packages/mobile/src/index.ts` 具名导出），渲染为一个 `<span>` 行内标签，用于展示分类、状态等短文本标记。支持 `type` 五种语义色、`size` 三档尺寸、`round` 圆角、`dark` 深色底，`closable` 时右侧渲染关闭图标并发出 `close` 事件。与桌面端的差异：关闭图标的触控热区经 `::after` 扩到 44×44，按压反馈用 `:active` 而非 `:hover`。

## 快速上手

```vue
<script setup lang="ts">
import { UTag } from '@veltra/mobile'
import { ref } from 'vue'
import '@veltra/mobile/components/tag/style'

const tags = ref(['待办', '进行中', '已完成'])

// 组件不会自行移除自己，必须在此更新数据源
function remove(index: number) {
  tags.value = tags.value.filter((_, i) => i !== index)
}
</script>

<template>
  <u-tag type="primary">主要</u-tag>
  <u-tag v-for="(name, index) in tags" :key="name" closable type="info" @close="remove(index)">
    {{ name }}
  </u-tag>
</template>
```

视觉初始化前提：应用入口需要 `import '@veltra/styles/normalize'` 并调用 `@veltra/styles/theme` 的 `loadTheme()`，否则 `--u-*` token 为空、标签无颜色。组件样式按需引入 `@veltra/mobile/components/tag/style`，仅导入组件不带入样式。

## API 签名

```ts
/** 五种语义色 */
export type ColorType = 'primary' | 'info' | 'success' | 'warning' | 'danger'

/** 组件尺寸 */
export type ComponentSize = 'small' | 'default' | 'large'

/** 标签组件属性 */
export interface TagProps {
  /** 语义色；不传时为无语义的默认灰样式 */
  type?: ColorType
  /** 是否可移除；为 true 时右侧渲染关闭图标 */
  closable?: boolean
  /** 尺寸大小，默认 'default' */
  size?: ComponentSize
  /** 是否为圆角（胶囊形） */
  round?: boolean
  /** 深色（实底反白） */
  dark?: boolean
}

export interface TagEmits {
  (e: 'close'): void
}

export interface TagExposed {}
```

## 参数说明

| 参数       | 类型                                                        | 默认        | 必填 | 约束                                                              |
| ---------- | ----------------------------------------------------------- | ----------- | :--: | ----------------------------------------------------------------- |
| `type`     | `'primary' \| 'info' \| 'success' \| 'warning' \| 'danger'` | —           |  否  | 不传或传 `undefined` 时渲染默认灰样式                             |
| `closable` | `boolean`                                                   | `false`     |  否  | 为 `true` 时右侧渲染关闭图标；点击仅发出 `close` 事件，不移除自身 |
| `size`     | `'small' \| 'default' \| 'large'`                           | `'default'` |  否  | 回退链：自身 `size` > 所在 `UForm` 的 `size` > `'default'`        |
| `round`    | `boolean`                                                   | `false`     |  否  | 圆角胶囊形，圆角半径为标签高度的一半                              |
| `dark`     | `boolean`                                                   | `false`     |  否  | 深色实底变体，文字反白                                            |

三档高度取 `--u-tag-small` / `--u-tag-default` / `--u-tag-large`（light 主题 20px / 24px / 28px）。

插槽：默认插槽放标签文案。暴露：`TagExposed` 为空对象，无可用方法或属性。

## 方法与事件

| 事件    | payload | 触发时机                                                      |
| ------- | ------- | ------------------------------------------------------------- |
| `close` | 无      | `closable` 为 `true` 时点击右侧关闭图标；点击已 `stopPropagation`，不冒泡到标签主体 |

`close` 触发后组件不会卸载自己，必须由调用方在事件回调里更新数据源（如从数组中删除该项）。

## 典型示例

### 语义色、深色与圆角总览

```vue
<script setup lang="ts">
import { UTag } from '@veltra/mobile'
import type { ColorType } from '@veltra/mobile'
import '@veltra/mobile/components/tag/style'

const types: ColorType[] = ['primary', 'info', 'success', 'warning', 'danger']
</script>

<template>
  <u-tag v-for="item of types" :key="item" :type="item">{{ item }}</u-tag>

  <!-- dark 深色实底，可与任意 type 组合 -->
  <u-tag v-for="item of types" :key="item" :type="item" dark>{{ item }}</u-tag>

  <!-- round 胶囊圆角 -->
  <u-tag round type="success">进行中</u-tag>
</template>
```

### 可移除标签的动态编辑

```vue
<script setup lang="ts">
import { UTag } from '@veltra/mobile'
import type { ColorType } from '@veltra/mobile'
import { shallowRef } from 'vue'
import '@veltra/mobile/components/tag/style'

const tags = shallowRef<Array<{ name: string; type: ColorType }>>([
  { name: 'Vue', type: 'primary' },
  { name: 'React', type: 'info' },
  { name: 'Angular', type: 'warning' }
])

function handleClose(index: number) {
  tags.value = tags.value.filter((_, i) => i !== index)
}
</script>

<template>
  <u-tag
    v-for="(item, index) in tags"
    :key="item.name"
    :type="item.type"
    closable
    @close="handleClose(index)"
  >
    {{ item.name }}
  </u-tag>
</template>
```

### 三档尺寸

```vue
<script setup lang="ts">
import { UTag } from '@veltra/mobile'
import '@veltra/mobile/components/tag/style'
</script>

<template>
  <u-tag size="small" type="info">小尺寸 20px</u-tag>
  <u-tag size="default" type="info">默认尺寸 24px</u-tag>
  <u-tag size="large" round type="success">大尺寸 28px</u-tag>
</template>
```

## 注意事项

> [!WARNING]
>
> - 移动端关闭图标的触控热区经 `::after` 扩到 44×44（视觉尺寸仍跟随字号，不撑破标签布局）；桌面端关闭图标是 `1em` 视觉与热区同尺寸、无热区扩展。
> - 移动端关闭图标的按压反馈是 `:active`（图标变对应类型色）；桌面端是 `:hover`（图标描边）。关闭图标常显，不依赖 hover 展示。
> - 移动端 `size` 回退链是「自身 `size` > 所在 `UForm` 的 `size` > `'default'`」，没有全局配置层。
> - 本库 `type` 取值是 `primary` / `info` / `success` / `warning` / `danger`，没有 Element Plus 的 `el-tag` 的 `effect` 属性；深色变体用 `dark` 布尔值表达。
> - `close` 事件不会移除标签；禁止只写 `closable` 不监听 `close` 并更新数据，否则标签不会消失。
> - 本库是 `UTag`（内容放默认插槽），不是 `<u-tag name="xx">` 之类的属性式文案传法。
> - 标签是非交互标记组件：标签主体没有点击选中语义。需要点击切换选中的标签用 `UCheckTag`。
> - 组件样式按需引入 `@veltra/mobile/components/tag/style`，仅 `import { UTag } from '@veltra/mobile'` 不带入样式。

## 常见问题

### 点击关闭图标后标签还在

原因：`close` 只通知，不卸载组件。修复：在回调里更新数据源：

```vue
<script setup lang="ts">
import { UTag } from '@veltra/mobile'
import { shallowRef } from 'vue'
import '@veltra/mobile/components/tag/style'

const tags = shallowRef(['待办', '进行中'])

function handleClose(index: number) {
  tags.value = tags.value.filter((_, i) => i !== index) // 从数据源移除
}
</script>

<template>
  <u-tag v-for="(name, index) in tags" :key="name" closable @close="handleClose(index)">
    {{ name }}
  </u-tag>
</template>
```

### 关闭图标点击不灵敏

原因：把覆盖热区的 `::after` 或关闭图标样式覆盖掉了（如全局对 `.um-tag *::after` 做了 `display: none`）。修复：保留 `.um-tag__icon-close::after` 的 44×44 覆盖层；该伪元素不携带视觉样式，删除后热区退回图标本身的 `1em` 区域。
