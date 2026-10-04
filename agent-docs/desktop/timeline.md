---
title: UTimeline 时间线
description: 从 @veltra/desktop 导出的纵向时间线组件：UTimeline 为容器，UTimelineItem 提供节点圆点颜色、#dot 自定义节点、时间戳及其上下位置与内容插槽，用于操作记录、审批流转等按时间排列的展示。
aliases: [Timeline, timeline, 时间线, 时间轴, 垂直时间线, TimelineItem, UTimelineItem]
keywords:
  [
    color,
    timestamp,
    timestampPlacement,
    dot,
    default,
    primary,
    success,
    warning,
    danger,
    TimelineItemColor,
    UTimelineItem,
    时间戳,
    节点颜色,
    自定义节点,
    操作记录,
    审批流转
  ]
---

# UTimeline 时间线

`@veltra/desktop` 导出纵向时间线组件 `UTimeline` 与节点组件 `UTimelineItem`：`UTimeline` 是纵向容器，`UTimelineItem` 每项渲染「圆点 + 尾线 + 时间戳 + 内容」，`color` 切换圆点语义色，`#dot` 插槽用任意节点替换圆点，`timestamp` / `timestampPlacement` 控制时间戳文本及其在内容上方或下方。

## 快速上手

```vue
<script setup lang="ts">
import { UTimeline, UTimelineItem } from '@veltra/desktop'
</script>

<template>
  <!-- 默认中性色圆点、时间戳在内容下方；最后一个节点不渲染尾线 -->
  <u-timeline>
    <u-timeline-item timestamp="2026-10-01 09:30">创建部署任务</u-timeline-item>
    <u-timeline-item timestamp="2026-10-02 14:12">构建产物上传完成</u-timeline-item>
    <u-timeline-item timestamp="2026-10-03 20:05" color="success">验收通过，开始发布</u-timeline-item>
  </u-timeline>
</template>
```

## API 签名

```ts
/** 时间线节点圆点颜色语义 */
export type TimelineItemColor = 'default' | 'primary' | 'success' | 'warning' | 'danger'

/** 时间线容器组件属性（无属性） */
export interface TimelineProps {}

/** 时间线节点属性 */
export interface TimelineItemProps {
  /** 节点圆点颜色语义，默认 'default'（中性色圆点） */
  color?: TimelineItemColor
  /** 节点时间戳文本；不传则不渲染时间戳 */
  timestamp?: string
  /** 时间戳位置：top 内容上方 / bottom 内容下方，默认 'bottom' */
  timestampPlacement?: 'top' | 'bottom'
}
```

两个组件均无自定义事件与暴露成员。

## 参数说明

`UTimeline`：无属性。

`UTimelineItem`：

| 参数                | 类型               | 默认      | 必填 | 约束                                                       |
| ------------------- | ------------------ | --------- | :--: | ---------------------------------------------------------- |
| `color`             | `TimelineItemColor` | `'default'` |  否  | 枚举 `'default' \| 'primary' \| 'success' \| 'warning' \| 'danger'`；提供 `#dot` 插槽时不生效 |
| `timestamp`         | `string`           | —         |  否  | 时间戳文本，渲染为内容旁的次要文字；不传不渲染             |
| `timestampPlacement` | `'top' \| 'bottom'` | `'bottom'` |  否  | 时间戳在内容上方还是下方                                    |

插槽：

| 组件             | 插槽      | 说明                                                             |
| ---------------- | --------- | ---------------------------------------------------------------- |
| `UTimeline`      | `default` | 放一组 `UTimelineItem`                                           |
| `UTimelineItem`  | `default` | 节点内容，可放任意节点                                           |
| `UTimelineItem`  | `dot`     | 自定义节点：替换默认圆点，取消圆形底色，尺寸由插槽内容决定       |

## 方法与事件

- `UTimeline` 与 `UTimelineItem` 均无自定义事件。

## 典型示例

### 节点颜色标记状态

```vue
<script setup lang="ts">
import { UTimeline, UTimelineItem } from '@veltra/desktop'
</script>

<template>
  <u-timeline>
    <u-timeline-item timestamp="2026-10-01 09:30" color="primary">流水线启动</u-timeline-item>
    <u-timeline-item timestamp="2026-10-02 14:12" color="warning">等待审批</u-timeline-item>
    <u-timeline-item timestamp="2026-10-03 20:05" color="success">发布完成</u-timeline-item>
    <u-timeline-item timestamp="2026-10-04 08:00" color="danger">健康检查超时，已回滚</u-timeline-item>
  </u-timeline>
</template>
```

### #dot 插槽自定义节点

```vue
<script setup lang="ts">
import { UTimeline, UTimelineItem } from '@veltra/desktop'
</script>

<template>
  <!-- #dot 的内容替换圆点：图标、emoji 或任意节点 -->
  <u-timeline>
    <u-timeline-item timestamp="2026-10-01 09:30" color="primary">
      <template #dot>🚀</template>
      <b>流水线启动</b>：由定时任务触发
    </u-timeline-item>
    <u-timeline-item timestamp="2026-10-02 14:12" color="success">
      <template #dot>✅</template>
      <b>审批通过</b>：进入发布队列
    </u-timeline-item>
  </u-timeline>
</template>
```

### 时间戳放内容上方

```vue
<script setup lang="ts">
import { UTimeline, UTimelineItem } from '@veltra/desktop'
</script>

<template>
  <u-timeline>
    <u-timeline-item timestamp="2026-09-28 10:00" timestamp-placement="top" color="primary">
      需求评审通过，进入排期
    </u-timeline-item>
    <u-timeline-item timestamp="2026-09-30 18:30" timestamp-placement="top">
      开发完成，提交冒烟测试
    </u-timeline-item>
    <u-timeline-item timestamp="2026-10-03 09:00" timestamp-placement="top" color="success">
      测试通过，合入 dev 分支
    </u-timeline-item>
  </u-timeline>
</template>
```

## 注意事项

> [!WARNING]
>
> - 本库 `UTimeline` 容器**无属性**：AntD 的 `pending` / `pendingDot` / `reverse` / `mode`、Element Plus 的 `hide-timestamp`（在 el-timeline-item 上）均不存在；需要待完成节点时直接多写一个 `UTimelineItem`。
> - `color` 是语义枚举 `'default' | 'primary' | 'success' | 'warning' | 'danger'`，不是 AntD 的 `'blue' | 'red' | 'green' | 'gray'`，也不接受 EP 的 hsl / 十六进制自定义色。
> - 自定义节点只有 `#dot` 插槽一种方式（AntD 的 `dot` 属性传组件、EP 的 `type` 属性均不存在）；提供 `#dot` 后 `color` 不再生效。
> - `timestamp` 只接受 `string` 纯文本；时间格式由调用方自行格式化。
> - 最后一个节点不渲染尾线（纵向连接线），这是组件行为，不需要外部处理。
> - 节点圆点颜色、尾线颜色均走主题 token；暗色主题自动切换，组件内无 `[data-theme]` 分支。

## 常见问题

### 圆点没有按 color 变色

原因：节点同时提供了 `#dot` 插槽，自定义节点会取消圆点底色，`color` 被忽略。修复：要么只用 `color`（删掉 `#dot`），要么在 `#dot` 里放自带颜色的节点。

```vue
<script setup lang="ts">
import { UTimeline, UTimelineItem } from '@veltra/desktop'
</script>

<template>
  <!-- 只用语义色 -->
  <u-timeline-item timestamp="2026-10-01 09:30" color="danger">发布失败</u-timeline-item>
</template>
```

### 时间戳不显示

原因：`timestamp` 未传或为空字符串，节点按无时间戳渲染。修复：传入非空字符串；需要富内容时间戳时在默认插槽内自行排版。

### 想要横向步骤条 / 可点击节点选择器

时间线是纵向只读展示；横向节点选择器用 `UProgressNodes`，分步流程用 `USteps`，不要用 `UTimeline` 承担交互。
