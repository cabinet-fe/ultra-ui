---
title: 'UDescriptions 描述列表（@veltra/mobile 移动端）'
description: '@veltra/mobile 导出的键值对详情列表组件：UDescriptions 配 title / border / layout / size，UDescriptionsItem 提供 label 与内容插槽；移动端恒为单列纵向堆叠的键值行（键左值右或上下排布），column 属性语义保留但不参与布局，用于订单详情等信息展示。'
aliases:
  [UDescriptions, UDescriptionsItem, Descriptions, 描述列表, 详情列表, 键值对, 移动端详情]
keywords:
  [
    title,
    column,
    border,
    layout,
    horizontal,
    vertical,
    size,
    label,
    DescriptionsLayout,
    UDescriptionsItem,
    键值对,
    详情展示,
    单列布局,
    边框模式,
    垂直布局,
    订单详情
  ]
---

# UDescriptions 描述列表（@veltra/mobile 移动端）

`@veltra/mobile` 导出描述列表组件 `UDescriptions` 与列表项组件 `UDescriptionsItem`：`UDescriptions` 把一组键值对渲染成单列纵向堆叠的详情列表（每项一行，键名在左、内容右对齐），`UDescriptionsItem` 以 `label` 属性声明键名、默认插槽承载值内容；`border` 开启列表描边 + 行分隔线 + 键名底色的边框模式，`layout` 切换键值同行 / 上下排布。

## 快速上手

```vue
<script setup lang="ts">
import { UDescriptions, UDescriptionsItem } from '@veltra/mobile'
import '@veltra/mobile/components/descriptions/style'
</script>

<template>
  <!-- 默认无边框、键名在左内容右对齐；UDescriptionsItem 必须是 UDescriptions 默认插槽的直接子节点 -->
  <u-descriptions title="订单信息">
    <u-descriptions-item label="订单编号">VLT20261004001</u-descriptions-item>
    <u-descriptions-item label="下单时间">2026-10-04 10:23:45</u-descriptions-item>
    <u-descriptions-item label="支付方式">企业账户</u-descriptions-item>
  </u-descriptions>
</template>
```

视觉初始化前提：应用入口需要 `import '@veltra/styles/normalize'` 并调用 `@veltra/styles/theme` 的 `loadTheme()`，否则 `--u-*` token 为空、列表无颜色。组件样式按需引入：`import '@veltra/mobile/components/descriptions/style'`。

## API 签名

```ts
/** 描述列表布局：horizontal 键值同行 / vertical 键值上下分行 */
export type DescriptionsLayout = 'horizontal' | 'vertical'

/** 描述列表组件属性 */
export interface DescriptionsProps extends ComponentProps {
  /** 列表标题，渲染在列表顶部；不传则不渲染标题 */
  title?: string
  /** 每行展示的键值对列数。默认 3；移动端单列布局，此属性不参与布局 */
  column?: number
  /** 边框模式：列表整体描边 + 行间分隔线 + 键名底色，默认 false（无边框） */
  border?: boolean
  /** 布局方向，默认 'horizontal' */
  layout?: DescriptionsLayout
}

/** 描述列表项组件属性 */
export interface DescriptionsItemProps {
  /** 键名文本 */
  label?: string
}
```

`ComponentProps` 的 `size` 是 `'small' | 'default' | 'large'`（来自 `@veltra/utils`），影响字号与行内边距；移动端未传时固定 `'default'`。两个组件均无自定义事件与暴露成员。

## 参数说明

`UDescriptions`：

| 参数     | 类型                 | 默认          | 必填 | 约束                                                                     |
| -------- | -------------------- | ------------- | :--: | ------------------------------------------------------------------------ |
| `title`  | `string`             | —             |  否  | 渲染在列表顶部的标题文本；不传不渲染标题行                               |
| `column` | `number`             | `3`           |  否  | 移动端恒为单列堆叠，此属性不参与布局（语义保留，跨端代码可直接传）       |
| `border` | `boolean`            | `false`       |  否  | `true` 时列表整体描边 + 圆角、行间分隔线、键名区底色块                  |
| `layout` | `DescriptionsLayout` | `'horizontal'`|  否  | 枚举 `'horizontal' \| 'vertical'`；horizontal 键左值右同行，vertical 键上值下 |
| `size`   | `'small' \| 'default' \| 'large'` | `'default'` | 否 | 影响字号与行内边距；不接受数字像素                                      |

`UDescriptionsItem`：

| 参数    | 类型     | 默认 | 必填 | 约束                             |
| ------- | -------- | ---- | :--: | -------------------------------- |
| `label` | `string` | —    |  否  | 键名文本，渲染在键名区           |

插槽：

| 组件                | 插槽      | 说明                                                |
| ------------------- | --------- | --------------------------------------------------- |
| `UDescriptions`     | `default` | 只收集 `UDescriptionsItem` 子节点，其余子节点被忽略 |
| `UDescriptionsItem` | `default` | 值内容，可放任意节点；长值自动换行（`word-break`）  |

## 典型示例

### 边框模式

```vue
<script setup lang="ts">
import { UDescriptions, UDescriptionsItem } from '@veltra/mobile'
import '@veltra/mobile/components/descriptions/style'
</script>

<template>
  <!-- border：列表整体描边 + 行分隔线 + 键名底色块 -->
  <u-descriptions title="服务器详情" border>
    <u-descriptions-item label="主机名">hz-prod-web-01</u-descriptions-item>
    <u-descriptions-item label="内网 IP">10.0.12.34</u-descriptions-item>
    <u-descriptions-item label="规格">8 核 16GB</u-descriptions-item>
    <u-descriptions-item label="镜像">Ubuntu 24.04 LTS</u-descriptions-item>
    <u-descriptions-item label="到期时间">2027-06-30</u-descriptions-item>
  </u-descriptions>
</template>
```

### 垂直布局与尺寸

```vue
<script setup lang="ts">
import { UDescriptions, UDescriptionsItem } from '@veltra/mobile'
import '@veltra/mobile/components/descriptions/style'
</script>

<template>
  <!-- vertical：键名在上、内容在下且左对齐；size 影响字号与行内边距 -->
  <u-descriptions title="任务详情" border layout="vertical" size="large">
    <u-descriptions-item label="任务名">季度数据归档</u-descriptions-item>
    <u-descriptions-item label="负责人">李工</u-descriptions-item>
    <u-descriptions-item label="状态">执行中（预计 10-05 08:00 完成）</u-descriptions-item>
    <u-descriptions-item label="备注">数据源为上月增量日志</u-descriptions-item>
  </u-descriptions>
</template>
```

### 内容插槽放富内容

```vue
<script setup lang="ts">
import { UDescriptions, UDescriptionsItem } from '@veltra/mobile'
import '@veltra/mobile/components/descriptions/style'
</script>

<template>
  <u-descriptions title="收货信息">
    <u-descriptions-item label="收货地址">
      浙江省杭州市西湖区文三路 90 号东部软件园 5 号楼 3 层
    </u-descriptions-item>
    <u-descriptions-item label="备注">
      <span>工作日 10:00-18:00 可收货，超长备注文本自动换行</span>
    </u-descriptions-item>
  </u-descriptions>
</template>
```

## 注意事项

> [!WARNING]
>
> - 移动端是单列纵向堆叠的 `ul/li` 键值行（键名在左、内容右对齐），桌面端是按 `column` 分组的多列 `table` 网格（`th`/`td`、`table-layout: fixed`）；移动端 `column` 不参与布局，传任何值都渲染单列。
> - 移动端无边框模式下键名区 `max-width: 40%`，边框模式下键名区占 38% 宽；内容区自动换行，不产生横向溢出。
> - 本库列表项是组件 `UDescriptionsItem`（`<u-descriptions-item>`），不是 AntD 5.x 的 `items` 数据属性写法。
> - `UDescriptionsItem` 必须是 `UDescriptions` 默认插槽的**直接子节点**：包一层 `div`、或用 `v-for` 在插槽内循环（编译为 Fragment）都会导致项收集不到而不渲染。
> - 本库无 `span`（跨列）属性：每项恒占一行，需要跨行布局时自行拆分多个 `UDescriptions`。
> - `label` 只接受 `string`；键名仅纯文本，没有 label 插槽。
> - `size` 只支持 `'small' | 'default' | 'large'` 三档，随主题 token；不接受数字像素。
> - 移动端按需样式路径是 `@veltra/mobile/components/descriptions/style`，不是 `@veltra/desktop/components/descriptions/style`。

## 常见问题

### 列表项一个都没渲染出来

原因：`UDescriptionsItem` 不是默认插槽的直接子节点。常见写法是外层包了 `div`，或在插槽内直接 `v-for` 循环（编译为 Fragment，收集时被过滤）。修复：去掉包裹层，逐个写子节点：

```vue
<script setup lang="ts">
import { UDescriptions, UDescriptionsItem } from '@veltra/mobile'
import '@veltra/mobile/components/descriptions/style'
</script>

<template>
  <u-descriptions>
    <u-descriptions-item label="键 1">值 1</u-descriptions-item>
    <u-descriptions-item label="键 2">值 2</u-descriptions-item>
  </u-descriptions>
</template>
```

### 传了 column=2 却还是一列

行为如此：移动端恒为单列堆叠，`column` 不参与布局（语义保留是为了跨端代码兼容）。需要两列并排时用两个 `UDescriptions` 配合 flex 布局自行排列。

### 键名列显示为空

原因：`label` 写在了默认插槽里而不是 `label` 属性上。修复：键名走 `label` 属性，插槽只放值内容。

```vue
<script setup lang="ts">
import { UDescriptions, UDescriptionsItem } from '@veltra/mobile'
import '@veltra/mobile/components/descriptions/style'
</script>

<template>
  <u-descriptions>
    <!-- 正确：label 属性是键名，插槽是值 -->
    <u-descriptions-item label="订单编号">VLT20261004001</u-descriptions-item>
  </u-descriptions>
</template>
```
