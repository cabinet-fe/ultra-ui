---
title: UDescriptions 描述列表
description: 从 @veltra/desktop 导出的键值对详情列表组件：UDescriptions 配 title / column / border / layout / size，UDescriptionsItem 提供 label 与内容插槽，用于订单详情、服务器信息等结构化只读展示。
aliases: [Descriptions, descriptions, 描述列表, 详情列表, 键值对, DescriptionItem, DescriptionsItem]
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
    多列,
    边框模式,
    垂直布局
  ]
---

# UDescriptions 描述列表

`@veltra/desktop` 导出描述列表组件 `UDescriptions` 与列表项组件 `UDescriptionsItem`：`UDescriptions` 按 `column` 列数把一组键值对渲染成多列详情表格，`UDescriptionsItem` 以 `label` 属性声明键名、默认插槽承载值内容；`border` 开启带描边与键名底色的边框模式，`layout` 切换键值同行 / 分行布局。

## 快速上手

```vue
<script setup lang="ts">
import { UDescriptions, UDescriptionsItem } from '@veltra/desktop'
</script>

<template>
  <!-- 默认 3 列、无边框；UDescriptionsItem 必须是 UDescriptions 默认插槽的直接子节点 -->
  <u-descriptions title="订单信息">
    <u-descriptions-item label="订单编号">VLT20261004001</u-descriptions-item>
    <u-descriptions-item label="下单时间">2026-10-04 10:23:45</u-descriptions-item>
    <u-descriptions-item label="支付方式">企业账户</u-descriptions-item>
  </u-descriptions>
</template>
```

## API 签名

```ts
import type { ComponentProps } from '@veltra/utils'

/** 描述列表布局：horizontal 键值同行 / vertical 键值分行 */
export type DescriptionsLayout = 'horizontal' | 'vertical'

/** 描述列表组件属性 */
export interface DescriptionsProps extends ComponentProps {
  /** 列表标题，渲染在列表顶部；不传则不渲染标题 */
  title?: string
  /** 每行展示的键值对列数，默认 3 */
  column?: number
  /** 边框模式：键值单元格带描边与键名底色，默认 false（无边框） */
  border?: boolean
  /** 布局方向，默认 'horizontal' */
  layout?: DescriptionsLayout
  /** 组件尺寸，默认 'default'（未传时回退全局配置） */
  size?: ComponentSize
}

/** 描述列表项组件属性 */
export interface DescriptionsItemProps {
  /** 键名文本 */
  label?: string
}
```

`ComponentSize` 为 `'small' | 'default' | 'large'`。两个组件均无自定义事件与暴露成员。

## 参数说明

`UDescriptions`：

| 参数     | 类型                | 默认          | 必填 | 约束                                                                    |
| -------- | ------------------- | ------------- | :--: | ----------------------------------------------------------------------- |
| `title`  | `string`            | —             |  否  | 渲染在列表顶部的标题文本；不传不渲染标题行                              |
| `column` | `number`            | `3`           |  否  | 正整数；小于 1 或非整数按 1 处理，超出列数的项自动换行                  |
| `border` | `boolean`           | `false`       |  否  | `true` 时单元格带描边、键名单元格带底色，外层表格合成完整网格          |
| `layout` | `DescriptionsLayout` | `'horizontal'` |  否  | 枚举 `'horizontal' \| 'vertical'`；vertical 时每个列组的键名行与内容行上下成组 |
| `size`   | `ComponentSize`     | `'default'`   |  否  | 枚举 `'small' \| 'default' \| 'large'`，影响字号与单元格内边距；未传时回退全局配置 |

`UDescriptionsItem`：

| 参数    | 类型     | 默认 | 必填 | 约束                             |
| ------- | -------- | ---- | :--: | -------------------------------- |
| `label` | `string` | —    |  否  | 键名文本，渲染在键名单元格       |

插槽：

| 组件                | 插槽      | 说明                                                            |
| ------------------- | --------- | --------------------------------------------------------------- |
| `UDescriptions`     | `default` | 只收集 `UDescriptionsItem` 子节点，其余子节点被忽略             |
| `UDescriptionsItem` | `default` | 值内容，可放任意节点；不传则键名对齐渲染为空单元格              |

## 方法与事件

- `UDescriptions` 与 `UDescriptionsItem` 均无自定义事件。

## 典型示例

### 边框模式与列数

```vue
<script setup lang="ts">
import { UDescriptions, UDescriptionsItem } from '@veltra/desktop'
</script>

<template>
  <!-- border 开启边框模式；column=2 每行 2 组键值对 -->
  <u-descriptions title="服务器详情" border :column="2">
    <u-descriptions-item label="主机名">hz-prod-web-01</u-descriptions-item>
    <u-descriptions-item label="内网 IP">10.0.12.34</u-descriptions-item>
    <u-descriptions-item label="规格">8 核 16GB</u-descriptions-item>
    <u-descriptions-item label="镜像">Ubuntu 24.04 LTS</u-descriptions-item>
  </u-descriptions>
</template>
```

### 垂直布局与尺寸

```vue
<script setup lang="ts">
import { UDescriptions, UDescriptionsItem } from '@veltra/desktop'
</script>

<template>
  <!-- vertical：键名行在上、内容行在下；size 影响字号与内边距 -->
  <u-descriptions title="任务详情" border layout="vertical" size="small" :column="2">
    <u-descriptions-item label="任务名">季度数据归档</u-descriptions-item>
    <u-descriptions-item label="负责人">李工</u-descriptions-item>
    <u-descriptions-item label="状态">执行中</u-descriptions-item>
    <u-descriptions-item label="备注">数据源为上月增量日志</u-descriptions-item>
  </u-descriptions>
</template>
```

### 内容插槽放富内容

```vue
<script setup lang="ts">
import { UDescriptions, UDescriptionsItem } from '@veltra/desktop'
</script>

<template>
  <u-descriptions :column="1">
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
> - 本库列表项是组件 `UDescriptionsItem`（`<u-descriptions-item>`），不是 AntD 5.x 的 `items` 数据属性写法。
> - `UDescriptionsItem` 必须是 `UDescriptions` 默认插槽的**直接子节点**：包一层 `div`、或用 `v-for` 在插槽内循环（编译为 Fragment）都会导致项收集不到而不渲染。
> - 本库无 `span`（跨列）属性：每项恒占 1 列，需要跨列布局时自行调 `column`。
> - `label` 只接受 `string`；需要富键名（图标等）时 AntD/EP 的 label 插槽在本库不可用，键名仅纯文本。
> - `size` 只支持 `'small' | 'default' | 'large'` 三档，随主题 token；不接受数字像素。
> - 键名单元格用 `th`、值单元格用 `td` 渲染，对齐与字重已由组件样式接管，不需要外部重置表格样式。

## 常见问题

### 列表项一个都没渲染出来

原因：`UDescriptionsItem` 不是默认插槽的直接子节点。常见写法是外层包了 `div`，或在插槽内直接 `v-for` 循环（编译为 Fragment，收集时被过滤）。修复：去掉包裹层，逐个写子节点。

```vue
<script setup lang="ts">
import { UDescriptions, UDescriptionsItem } from '@veltra/desktop'
</script>

<template>
  <u-descriptions>
    <u-descriptions-item label="键 1">值 1</u-descriptions-item>
    <u-descriptions-item label="键 2">值 2</u-descriptions-item>
  </u-descriptions>
</template>
```

### 键名列显示为空

原因：`label` 写在了默认插槽里而不是 `label` 属性上。修复：键名走 `label` 属性，插槽只放值内容。

```vue
<script setup lang="ts">
import { UDescriptions, UDescriptionsItem } from '@veltra/desktop'
</script>

<template>
  <u-descriptions>
    <!-- 正确：label 属性是键名，插槽是值 -->
    <u-descriptions-item label="订单编号">VLT20261004001</u-descriptions-item>
  </u-descriptions>
</template>
```

### column 传 0 或负数后所有项挤在一列

原因：`column` 会经 `Math.max(1, Math.trunc(column))` 收敛，非法值按 1 处理。修复：传 1~正整数。
