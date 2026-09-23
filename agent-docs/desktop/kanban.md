---
title: UKanban 看板组件
description: '数据驱动的看板组件：columns 一份列数据渲染全部列，卡片可列内拖拽排序与跨列转移，结果经 v-model:columns 写回，支持卡片 / 列头 / 空列插槽、计数徽标与禁用拖拽，空列可作为拖放目标。'
aliases: ['UKanban', 'Kanban', 'KanbanBoard', '看板', '拖拽看板', '任务看板']
keywords:
  [
    columns,
    cardKey,
    titleKey,
    countable,
    placeholder,
    disabled,
    update:columns,
    v-model:columns,
    change,
    看板,
    拖拽排序,
    跨列拖拽,
    卡片拖拽,
    拖拽手柄,
    空列占位,
    列头插槽,
    计数徽标,
    useDnD
  ]
---

# UKanban 看板组件

`@veltra/desktop` 导出看板组件 `UKanban`。传入一份列数据 `columns`（每列含标题与卡片数组），按住卡片左侧 ≡ 手柄拖拽即可列内排序或跨列转移，拖拽结果自动写回数据并经 `update:columns` / `change` 事件对外通知；同页多个 `UKanban` 实例之间也可互拖。

## 快速上手

`v-model:columns` 绑定列数组，卡片数据须含唯一标识字段（默认 `id`）。独立页面需先初始化主题（`import '@veltra/styles/normalize'` + `loadTheme()`）。

```vue
<script setup lang="ts">
import type { KanbanColumnItem } from '@veltra/desktop'
import { ref } from 'vue'

const columns = ref<KanbanColumnItem[]>([
  {
    key: 'todo',
    title: '待办',
    items: [
      { id: 1, title: '任务 1' },
      { id: 2, title: '任务 2' }
    ]
  },
  {
    key: 'done',
    title: '已完成',
    items: [{ id: 3, title: '任务 3' }]
  }
])
</script>

<template>
  <u-kanban v-model:columns="columns" style="height: 400px" />
</template>
```

拖拽结束后 `columns` 已是最新顺序：列内排序更新该列 `items`，跨列转移同时更新源列与目标列的 `items`。

## API 签名

```ts
/** 看板列数据 */
export interface KanbanColumnItem extends Record<string, any> {
  /** 列标识（必填） */
  key: string
  /** 列标题 */
  title?: string
  /** 卡片数据（顺序即展示顺序，拖拽后更新） */
  items: Record<string, any>[]
}

/** 看板组件属性 */
export interface KanbanProps {
  /** 列数据（含每列卡片），拖拽结果经 update:columns 写回 */
  columns?: KanbanColumnItem[]
  /**
   * 卡片唯一标识字段名
   * @default 'id'
   */
  cardKey?: string
  /**
   * 列标题与默认卡片内容的字段名
   * @default 'title'
   */
  titleKey?: string
  /** 是否禁用拖拽 */
  disabled?: boolean
  /**
   * 列头是否显示卡片计数徽标
   * @default true
   */
  countable?: boolean
  /**
   * 空列占位文案（空列仍可作为拖放目标）
   * @default '暂无内容'
   */
  placeholder?: string
}

/** 看板组件事件 */
export interface KanbanEmits {
  /** 列数据更新（v-model:columns） */
  (e: 'update:columns', columns: KanbanColumnItem[]): void
  /** 拖拽结束后触发（含列内排序与跨列转移），返回最新列数据 */
  (e: 'change', columns: KanbanColumnItem[]): void
}

/** 看板插槽 */
export type KanbanSlots = {
  /** 自定义卡片内容 */
  card?: (props: { card: Record<string, any>; column: KanbanColumnItem; index: number }) => any
  /** 自定义列头 */
  header?: (props: { column: KanbanColumnItem; count: number }) => any
  /** 空列占位 */
  empty?: (props: { column: KanbanColumnItem }) => any
}

/** 看板无公开方法；模板 ref 上无可调用成员（源码经 DeconstructValue 解包后为空） */
export type KanbanExposed = {}
```

## 参数说明

| 参数           | 类型                | 默认       | 必填 | 约束                                                                                                              |
| -------------- | ------------------- | ---------- | :--: | ----------------------------------------------------------------------------------------------------------------- |
| `columns`      | `KanbanColumnItem[]` | —          |  否  | 每列必须含 `key: string` 与 `items`；绑定后拖拽结果经 `update:columns` 写回，不绑定时组件内部自治维护数据          |
| `cardKey`      | `string`            | `'id'`     |  否  | 卡片唯一标识字段名，卡片数据必须含该字段（作为渲染 key）                                                          |
| `titleKey`     | `string`            | `'title'`  |  否  | 列标题字段名，同时作为默认卡片内容的取值字段；默认卡片内容缺失时回退显示 `card[cardKey]`                           |
| `disabled`     | `boolean`           | `false`    |  否  | `true` 时全部列禁用拖拽，根节点带 `is-disabled` 类名                                                             |
| `countable`    | `boolean`           | `true`     |  否  | `false` 时列头不渲染计数徽标                                                                                     |
| `placeholder`  | `string`            | `'暂无内容'` |  否  | 空列占位文案；空列的卡片容器始终渲染，可作为拖放目标                                                              |

## 方法与事件

组件无公开暴露方法，交互全部通过 props、事件与插槽完成。

事件：

- `update:columns(columns)` — 每次拖拽写回时触发，参数为最新列数据快照（列对象与 `items` 均为新引用，不含组件内部对象）；用 `v-model:columns` 接收。跨列转移会连续触发两次（源列写回、目标列写回），最终一次的快照是完整结果。
- `change(columns)` — 一次拖拽操作结束后触发且只触发一次（列内排序与跨列转移的多个内部回调已合并），参数为最新列数据快照。需要「拖完落库 / 提交」时监听本事件，不要用 `update:columns`。

拖拽行为：

- 拖拽手柄是卡片左上的 `≡` 符号（类名 `u-kanban__card-handle`），必须按住手柄发起拖拽，点击卡片本体不触发。
- 跨列转移与列内排序对所有列生效，包括空列（空列卡片容器保留最小高度作为拖放目标）。
- 拖拽中的卡片带 `is-dragging` 类，当前拖放目标的卡片容器带 `is-dropzone` 类。
- 所有实例共用拖拽分组 `u-kanban`：同页多个 `UKanban` 的卡片可互相拖入。
- 动画由内置 `animations` 插件提供，无配置项。

## 典型示例

### 自定义列头 / 卡片 / 空列插槽

```vue
<script setup lang="ts">
import type { KanbanColumnItem } from '@veltra/desktop'
import { UTag, UKanban } from '@veltra/desktop'
import { ref } from 'vue'

const columns = ref<KanbanColumnItem[]>([
  {
    key: 'todo',
    title: '待办',
    items: [{ id: 1, title: '联调接口', desc: '与后端核对字段' }]
  },
  { key: 'archive', title: '归档', items: [] }
])

function onChange(next: KanbanColumnItem[]) {
  // 拖拽结束，next 为最新列数据快照
  console.log(next.map((column) => [column.title, column.items.length]))
}
</script>

<template>
  <u-kanban v-model:columns="columns" style="height: 400px" @change="onChange">
    <template #header="{ column, count }">
      <span style="font-weight: 600">{{ column.title }}</span>
      <u-tag size="small" type="primary">{{ count }}</u-tag>
    </template>
    <template #card="{ card }">
      <div>
        <div style="font-weight: 500">{{ card.title }}</div>
        <div style="font-size: 12px; opacity: 0.7">{{ card.desc }}</div>
      </div>
    </template>
    <template #empty="{ column }">
      <span>{{ column.title }}列暂无卡片</span>
    </template>
  </u-kanban>
</template>
```

### 字段名定制

数据字段不是 `id` / `title` 时，用 `card-key` 与 `title-key` 改字段名，不必转换数据。

```vue
<script setup lang="ts">
import type { KanbanColumnItem } from '@veltra/desktop'
import { ref } from 'vue'

const columns = ref<KanbanColumnItem[]>([
  {
    key: 'bugs',
    name: '缺陷', // title-key="name" 后列标题取该字段
    items: [
      { no: 'b-1', name: '样式错位' }, // no 作为卡片唯一标识，name 作为卡片内容
      { no: 'b-2', name: '滚动卡顿' }
    ]
  }
])
</script>

<template>
  <u-kanban v-model:columns="columns" card-key="no" title-key="name" placeholder="拖卡片到这里" style="height: 360px" />
</template>
```

### 禁用拖拽与外部数据更新

`disabled` 禁止全部拖拽；外部增删列 / 卡片须整体替换 `columns` 数组（原地 `push` / `splice` 不会被组件感知）。

```vue
<script setup lang="ts">
import type { KanbanColumnItem } from '@veltra/desktop'
import { UButton, UKanban, USwitch } from '@veltra/desktop'
import { ref } from 'vue'

const columns = ref<KanbanColumnItem[]>([
  { key: 'todo', title: '待办', items: [{ id: 1, title: '任务 1' }] }
])
const disabled = ref(true)

function addCard() {
  // 整体替换而非 columns.value[0].items.push(...)
  columns.value = columns.value.map((column) =>
    column.key === 'todo'
      ? { ...column, items: [...column.items, { id: Date.now(), title: '新任务' }] }
      : column
  )
}
</script>

<template>
  <u-switch v-model="disabled" />
  <u-kanban v-model:columns="columns" :disabled="disabled" style="height: 360px" />
  <u-button @click="addCard">新增卡片</u-button>
</template>
```

## 注意事项

> [!WARNING]
>
> - 拖拽只能从卡片左上的 `≡` 手柄发起，不是整卡可拖；用 `#card` 插槽自定义内容时手柄仍由组件渲染，插槽内容不会覆盖它。
> - 卡片数据必须含 `cardKey` 指定的唯一标识字段（默认 `id`），否则渲染 key 失效。
> - 组件不原地修改传入的 `columns`：写回的是浅拷贝快照（列对象与 `items` 数组均为新引用）。外部更新数据须整体替换 `columns` 数组，原地改 `items` 不生效。
> - `update:columns` 在跨列转移时会连续触发两次（源列与目标列各一次）；只想要「一次拖拽一个结果」时监听 `change`。
> - 同页多个 `UKanban` 实例之间可互相拖入（共用拖拽分组 `u-kanban`），且各自维护独立的 `columns`；需要隔离时不要同时渲染多个实例。
> - 列不可拖拽，仅卡片可拖；组件也没有分页、虚拟滚动，海量卡片（千级以上）场景请自行控制单列数据量。
> - 自定义样式可用的类名：`.u-kanban`、`__column`、`__column-header`、`__column-title`、`__column-count`、`__cards`、`__card`、`__card-handle`、`__card-body`、`__empty`，状态类 `is-dragging` / `is-dropzone` / `is-disabled`。

## 常见问题

### 拖拽结束后 columns 没有更新

原因：`columns` 未用 `v-model:columns` 绑定且父级未监听 `update:columns`，或父级用 `const columns = [...]`（非 `ref`）导致赋值不生效。修复：模板写 `v-model:columns="columns"`，脚本用 `ref` / `shallowRef` 持有列数组。

### 卡片按住整卡拖不动

原因：拖拽手柄固定为卡片左上的 `≡` 符号（`u-kanban__card-handle`），点击卡片其它区域不发起拖拽。修复：按住 `≡` 手柄拖拽。

### 外部 push 了新卡片但看板没显示

原因：组件对 `columns` 是浅监听，原地修改数组（`push` / `splice` / 改 `items`）不触发同步。修复：整体替换 `columns` 数组（`columns.value = [...]`），见上文「禁用拖拽与外部数据更新」示例。
