# UCollapse — 折叠面板

> `import type { CollapseProps, CollapseItemProps, CollapseExposed } from '@veltra/desktop'`

折叠面板。基于 CSS Grid `0fr → 1fr` 行高度过渡实现高度动画，零 JS 测量。

## Import

```ts
import { UCollapse, UCollapseItem } from '@veltra/desktop'
import type {
  CollapseProps,
  CollapseItemProps,
  CollapseValue,
  CollapseModelValue,
  CollapseIconPosition,
  CollapseExposed
} from '@veltra/desktop'
```

## 类型

```ts
type CollapseValue = string | number
type CollapseModelValue = CollapseValue | CollapseValue[]
type CollapseIconPosition = 'left' | 'right'
```

`accordion=true` 时 `modelValue` 应为单值，关闭时回写空数组 `[]`；
`accordion=false` 时为数组（也兼容传入单值，组件会自动包装）。

## UCollapse Props

| prop | type | default | 说明 |
|------|------|---------|------|
| `modelValue` | `CollapseModelValue` | — | 当前展开项（v-model） |
| `accordion` | `boolean` | `false` | 手风琴模式（一次只展开一项） |
| `bordered` | `boolean` | `true` | 显示外层与项分隔线；`false` 切换为 ghost 风格（hover 出现 `bg-color-hover` 背景） |
| `iconPosition` | `'left' \| 'right'` | `'right'` | 展开图标位置 |
| `expandIcon` | `Component` | `ArrowRight` | 自定义展开图标组件，活动态自动旋转 90° |
| `size` | `ComponentSize` | 跟随全局配置 | `'small' \| 'default' \| 'large'`，与全局尺寸 token 联动 |

## UCollapse Emits

| event | 参数 | 说明 |
|-------|------|------|
| `update:modelValue` | `(value: CollapseModelValue)` | v-model 更新 |
| `change` | `(value: CollapseModelValue)` | 展开项变更（在 `update:modelValue` 之后同步触发） |

## UCollapse Exposed

```ts
interface CollapseExposed {
  toggle: (value: CollapseValue) => void
  expand: (value: CollapseValue) => void
  collapse: (value: CollapseValue) => void
  expandAll: (values: CollapseValue[]) => void  // accordion 模式只取首项
  collapseAll: () => void
}
```

## UCollapseItem Props

| prop | type | default | 说明 |
|------|------|---------|------|
| `value` | `string \| number` | — | **必填**，唯一标识 |
| `title` | `string` | — | 标题文本，可被 `#title` 插槽替代 |
| `disabled` | `boolean` | `false` | 禁用切换（点击与键盘均不响应） |
| `hideIcon` | `boolean` | `false` | 隐藏展开图标 |

## UCollapseItem Slots

| slot | 参数 | 说明 |
|------|------|------|
| 默认 | — | 折叠的内容 |
| `title` | — | 自定义标题区域 |
| `icon` | `{ isActive: boolean }` | 自定义图标，可按 `isActive` 渲染不同图形 |

## CSS 选择器（BEM）

| 选择器 | 说明 |
|--------|------|
| `.u-collapse` | 容器 |
| `.u-collapse--<size>` | 尺寸（`small/default/large`） |
| `.u-collapse--icon-<pos>` | 图标位置（`left/right`） |
| `.u-collapse.is-bordered` | 边框风格（默认） |
| `.u-collapse__item` | 项 |
| `.u-collapse__item.is-active` | 已展开 |
| `.u-collapse__item.is-disabled` | 禁用 |
| `.u-collapse__header` | 头部（点击区，`role=button`） |
| `.u-collapse__header.is-active` | 头部展开态（控制图标旋转 + 内容展开） |
| `.u-collapse__title` | 标题区 |
| `.u-collapse__icon` | 展开图标容器（活动态 `transform: rotate(90deg)`） |
| `.u-collapse__content-wrapper` | 高度动画包裹层（grid `0fr ↔ 1fr`） |
| `.u-collapse__content` | 实际内容容器 |

## Examples

### 基础用法

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { CollapseModelValue } from '@veltra/desktop'

const active = ref<CollapseModelValue>(['1'])
</script>

<template>
  <u-collapse v-model="active">
    <u-collapse-item value="1" title="标题 1">内容 1</u-collapse-item>
    <u-collapse-item value="2" title="标题 2">内容 2</u-collapse-item>
  </u-collapse>
</template>
```

### 手风琴

```vue
<u-collapse v-model="active" accordion>
  <u-collapse-item value="a" title="A">A 内容</u-collapse-item>
  <u-collapse-item value="b" title="B">B 内容</u-collapse-item>
</u-collapse>
```

### Ghost / 无边框

```vue
<!-- 适合卡片 / 对话框内嵌使用，hover 浮起 bg-color-hover 背景 -->
<u-collapse v-model="active" :bordered="false">
  <u-collapse-item value="1" title="设置">…</u-collapse-item>
  <u-collapse-item value="2" title="高级">…</u-collapse-item>
</u-collapse>
```

### 图标位置 + 自定义展开图标

```vue
<script setup lang="ts">
import { ArrowDown, Plus } from '@veltra/icons/normal'
</script>

<!-- 左侧图标，类似 IDE 文件树 -->
<u-collapse icon-position="left" :expand-icon="ArrowDown">
  <u-collapse-item value="1" title="目录 A">…</u-collapse-item>
</u-collapse>

<!-- 用 #icon 插槽完全接管 -->
<u-collapse>
  <u-collapse-item value="1" title="标题">
    <template #icon="{ isActive }">
      <UIcon :style="{ color: isActive ? 'var(--u-color-primary)' : 'var(--u-text-color-placeholder)' }">
        <ArrowDown v-if="isActive" />
        <Plus v-else />
      </UIcon>
    </template>
    内容
  </u-collapse-item>
</u-collapse>
```

### 自定义标题

```vue
<u-collapse v-model="active">
  <u-collapse-item value="1">
    <template #title>
      <span style="display:inline-flex;align-items:center;gap:6px">
        <UIcon><Star /></UIcon>
        高亮标题
      </span>
    </template>
    内容
  </u-collapse-item>
</u-collapse>
```

### 禁用与隐藏图标

```vue
<u-collapse v-model="active">
  <u-collapse-item value="1" title="可操作">…</u-collapse-item>
  <u-collapse-item value="2" title="禁用项" disabled>…</u-collapse-item>
  <u-collapse-item value="3" title="隐藏图标" hide-icon>…</u-collapse-item>
</u-collapse>
```

### 程序化控制（exposed methods）

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { CollapseExposed, CollapseModelValue } from '@veltra/desktop'

const collapseRef = ref<CollapseExposed>()
const active = ref<CollapseModelValue>([])
</script>

<template>
  <u-button @click="collapseRef?.expand('p1')">展开 P1</u-button>
  <u-button @click="collapseRef?.collapseAll()">全部收起</u-button>
  <u-button type="primary" @click="collapseRef?.expandAll(['p1', 'p2', 'p3'])">展开全部</u-button>

  <u-collapse ref="collapseRef" v-model="active">
    <u-collapse-item value="p1" title="第一项">…</u-collapse-item>
    <u-collapse-item value="p2" title="第二项">…</u-collapse-item>
    <u-collapse-item value="p3" title="第三项">…</u-collapse-item>
  </u-collapse>
</template>
```

### 嵌套使用

```vue
<u-collapse v-model="outer">
  <u-collapse-item value="1" title="外层 A">
    <u-collapse v-model="inner" :bordered="false" icon-position="left">
      <u-collapse-item value="1-1" title="内层 1">…</u-collapse-item>
      <u-collapse-item value="1-2" title="内层 2">…</u-collapse-item>
    </u-collapse>
  </u-collapse-item>
</u-collapse>
```

### 配合表单使用

```vue
<u-form :model="formModel">
  <u-collapse v-model="sections" :bordered="false">
    <u-collapse-item value="basic" title="基础信息">
      <u-form-item label="姓名" field="name"><u-input v-model="formModel.name" /></u-form-item>
    </u-collapse-item>
    <u-collapse-item value="advanced" title="高级配置">
      <u-form-item label="密钥" field="key"><u-password-input v-model="formModel.key" /></u-form-item>
    </u-collapse-item>
  </u-collapse>
</u-form>
```

## 实现要点

1. **高度动画**：`.u-collapse__content-wrapper { display: grid; grid-template-rows: 0fr; }`，
   active 时切换为 `1fr`。内层 grid item 必须 `min-height: 0`。
2. **`padding-bottom` 仅活动态生效**：写在 `.is-active + .u-collapse__content-wrapper .u-collapse__content`
   上，否则 `0fr` 行会被 padding 撑开导致折叠状态泄漏内容。
3. **依赖注入**：`CollapseDIKey` 提供 `cls / size / iconPosition / expandIcon / activeValues / toggle`，
   子组件 fallback 为 `bem('collapse')`，保证独立使用仍可工作。
4. **键盘可达**：header 上 `Enter` / `Space` 切换；`tabindex` 在 `disabled` 时置 `-1`。
5. **属性回退**：`size` 通过 `useFormFallbackProps([props], { size: 'default' })` 与全局
   `useConfig().size` 联动。

## 已知陷阱

`Vue 3.5 SFC 编译器`对跨文件的 **`vue` 包 `Component` 类型**等复杂联合类型
解析失败时，会**静默丢弃后续 props**。本组件因此把 `defineProps` 显式列举为
内联类型（保留 `CollapseProps` 用于类型导出）。新增组件如遇同类问题，
参见 `references/source-discovery.md` 下的排查记录。
