---
title: useDnD 拖拽排序组合式函数
description: 基于 @formkit/drag-and-drop 的列表拖拽排序组合式函数：列表项排序与跨容器拖放转移结果自动写回数据源（Ref/数组/getter 五种写回策略），filter 支持只对可见子集排序并自动合并回完整数组，动态容器自动初始化重建销毁，适用于列表排序、看板、字段配置。
aliases: [use-dnd, drag-and-drop, 列表拖拽排序, 拖放排序, sortable]
keywords: [values, filter, parentRef, updateConfig, onReorder, group, dragHandle, draggable, plugins, animations, dropOrSwap, insert, tearDown, VueParentConfig, 列表排序, 跨容器拖放, 拖拽转移, 看板, 拖拽手柄, 多容器互拖]
---

# useDnD 拖拽排序组合式函数

`@veltra/compositions` 导出 `useDnD`：基于 `@formkit/drag-and-drop` Vue 适配层封装的拖拽排序组合式函数。列表项排序与跨容器转移的结果自动写回数据源，无需手动处理 `onSort` 与 `splice`；`filter` 支持只对数据的可见子集排序并自动合并回完整数组；`parent` 支持动态容器，元素替换、重建时自动重新初始化；组件卸载时自动销毁拖拽实例。

## 快速上手

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { animations, useDnD } from '@veltra/compositions'

interface Item {
  id: number
  label: string
}

const list = ref<Item[]>([
  { id: 1, label: 'A' },
  { id: 2, label: 'B' },
  { id: 3, label: 'C' }
])

// 不传 parent 时，用返回的 parentRef 绑定列表容器；
// 拖拽结束后排序结果已自动写回 list
const { parentRef, values } = useDnD<Item>({
  values: list,
  plugins: [animations()]
})
</script>

<template>
  <ul ref="parentRef">
    <li v-for="item in values" :key="item.id">{{ item.label }}</li>
  </ul>
</template>
```

## API 签名

```ts
import type { VueParentConfig } from '@veltra/compositions'

export interface UseDnDOptions<T> extends VueParentConfig<T> {
  /**
   * 列表数据。排序/跨容器转移后自动写回，按传入类型分五种策略（见参数说明）。
   */
  values?: MaybeRefOrGetter<T[]>
  /**
   * 数据过滤：仅命中的项参与拖拽排序，必须与 DOM 中实际渲染的可拖拽项一一对应。
   * 排序/转移结果自动合并回原数组，未命中的项保持相对顺序。
   */
  filter?: (item: T) => boolean
  /**
   * 容器元素。支持 ref / getter；元素出现、替换、移除时自动初始化 / 重建 / 销毁。
   * 不传时用返回的 parentRef 以模板引用绑定。
   */
  parent?: MaybeRefOrGetter<HTMLElement | undefined>
  /**
   * values 为只读数据源（getter / 只读 computed）时，排序/转移结果通过该回调写回，
   * 收到的是合并后的完整数组。
   */
  onReorder?: (values: T[]) => void
}

export interface UseDnDResult<T> {
  /** 拖拽容器元素；未传 parent 选项时用模板引用绑定 */
  parentRef: Ref<HTMLElement | undefined>
  /** 拖拽数据。filter 模式下为参与拖拽的视图；排序/转移后自动更新 */
  values: Ref<T[]>
  /** 运行时整体替换拖拽配置（不含 values / filter / parent / onReorder）。同步 */
  updateConfig: (config?: VueParentConfig<T>) => void
}

export function useDnD<T>(options?: UseDnDOptions<T>): UseDnDResult<T>
```

`VueParentConfig<T>` 即 `Partial<ParentConfig<T>>`，从 `@veltra/compositions` 重导出；其余 `@formkit/drag-and-drop` 常用导出（`animations`、`dropOrSwap`、`insert`、`performSort`、`performTransfer`、`tearDown`、`setParentValues` 等）同样统一从 `@veltra/compositions` 导入。

## 参数说明

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `values` | `MaybeRefOrGetter<T[]>` | 不传时内部自建数据源 | 否 | 写回策略见下表 |
| `filter` | `(item: T) => boolean` | — | 否 | 命中项必须与 DOM 可拖拽节点一一对应，否则合并结果错位 |
| `parent` | `MaybeRefOrGetter<HTMLElement \| undefined>` | — | 否 | 与 `parentRef` 二选一；传 `parent` 时 `parentRef` 不再需要绑定 |
| `onReorder` | `(values: T[]) => void` | — | 否 | 仅 getter / 只读 computed 数据源需要；收到完整数组，需自行替换数据 |
| `plugins` | `DNDPlugin[]` | — | 否 | 如 `[animations()]`；列表项 DOM 结构变化后不自动重挂插件时用 `updateConfig` |

`values` 写回策略（排序 / 转移结束时自动执行）：

| 传入类型 | 写回方式 |
| --- | --- |
| 可写 `Ref` | 替换 `.value` |
| 响应式数组（如 `props` 上的数组） | 原地 `splice` |
| 非响应式纯数组 | 内部响应式副本驱动视图，写回时顺带同步原数组 |
| getter / 只读 computed | 通过 `onReorder` 回调给出合并后的完整数组 |
| 不传 | 内部创建数据源，通过返回的 `values` 读写 |

`VueParentConfig` 常用字段（均可选，全部为 `@formkit/drag-and-drop` 原生配置）：

| 字段 | 类型 | 语义 |
| --- | --- | --- |
| `dragHandle` | `string` | 拖拽手柄选择器，在可拖拽元素内任意深度搜索 |
| `draggable` | `(el: HTMLElement) => boolean` | 过滤可拖拽节点（如排除容器里的“新增”按钮） |
| `group` | `string` | 相同 group 的容器之间可跨容器转移 |
| `disabled` | `boolean` | 禁用整个容器的拖拽 |
| `sortable` | `boolean` | 是否允许容器内部排序 |
| `multiDrag` | `boolean` | 多选拖拽 |
| `draggingClass` / `dropZoneClass` / `dragPlaceholderClass` | `string` | 拖拽中 / 拖放目标 / 占位的 class，占位 class 设为透明可去掉残影 |
| `accepts` | `(targetParentData, initialParentData, currentParentData, state) => boolean` | 精细控制容器是否接受外来节点 |

## 方法与事件

- `values: Ref<T[]>`：可写 computed 视图。无 `filter` 时读写直接作用于完整数据；有 `filter` 时它是参与拖拽的可见子集，写入会被 `mergeView` 稳定合并回完整数组（未参与项按相对顺序锚定、移出项删除、移入项按位置插入）。
- `updateConfig(config?)`：整体替换拖拽配置（不与旧配置合并），`values` / `filter` / `parent` / `onReorder` 不在此列；当前容器存在时立即重新初始化拖拽实例。
- 自动行为：
  - 容器元素出现 / 替换 / 移除（`parent` 或 `parentRef` 变化，`flush: 'post'`）：自动初始化 / 销毁重建拖拽实例
  - 组件 `onBeforeUnmount`：自动 `tearDown` 当前容器，无需手动清理
- 重导出符号：`dragAndDrop`、`useDragAndDrop`、`animations`、`dropOrSwap`、`insert`、`performSort`、`performTransfer`、`remapNodes`、`updateConfig`、`parentValues`、`setParentValues`、`dragValues`、`tearDown`、`isBrowser` 及全部类型从 `@veltra/compositions` 导出。注意重导出的 `updateConfig` 是 FormKit 的独立 API，与返回值里的 `updateConfig` 方法是两个东西。

## 典型示例

### 拖拽手柄 + 多容器互拖（看板）

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { animations, useDnD } from '@veltra/compositions'

interface Card {
  id: number
  label: string
}

const todo = ref<Card[]>([
  { id: 1, label: '任务 1' },
  { id: 2, label: '任务 2' }
])
const done = ref<Card[]>([{ id: 3, label: '任务 3' }])

// group 相同即可在两个容器之间拖拽转移，转移结果自动写回各自的 ref
const { parentRef: todoParent, values: todoValues } = useDnD<Card>({
  values: todo,
  dragHandle: '.card-handle',
  group: 'board',
  plugins: [animations()]
})

const { parentRef: doneParent, values: doneValues } = useDnD<Card>({
  values: done,
  dragHandle: '.card-handle',
  group: 'board',
  plugins: [animations()]
})
</script>

<template>
  <div style="display: flex; gap: 16px">
    <ul ref="todoParent">
      <li v-for="item in todoValues" :key="item.id">
        <span class="card-handle">≡</span>{{ item.label }}
      </li>
    </ul>
    <ul ref="doneParent">
      <li v-for="item in doneValues" :key="item.id">
        <span class="card-handle">≡</span>{{ item.label }}
      </li>
    </ul>
  </div>
</template>
```

### 可见子集排序 + 动态容器（字段配置场景）

```vue
<script setup lang="ts">
import { computed, ref } from 'vue'
import { animations, useDnD } from '@veltra/compositions'

interface Field {
  id: number
  label: string
  hidden?: boolean
}

const fields = ref<Field[]>([
  { id: 1, label: '字段 1' },
  { id: 2, label: '字段 2', hidden: true },
  { id: 3, label: '字段 3' }
])
const addBtn = ref<HTMLElement>()

// 只渲染可见字段
const visibleFields = computed(() => fields.value.filter((f) => !f.hidden))

useDnD<Field>({
  values: fields,
  filter: (item) => !item.hidden, // 仅可见项参与拖拽
  parent: () => addBtn.value?.parentElement ?? undefined, // 动态取容器
  dragHandle: '.field-handle',
  draggable: (el) => el.classList.contains('field-item'), // 排除按钮
  plugins: [animations()]
})
</script>

<template>
  <!-- 拖拽可见项，顺序自动合并回 fields；隐藏的“字段 2”保持相对位置 -->
  <div>
    <div v-for="item in visibleFields" :key="item.id" class="field-item">
      <span class="field-handle">≡</span>{{ item.label }}
    </div>
    <button ref="addBtn">+ 添加字段</button>
  </div>
</template>
```

### 只读数据源 + onReorder 写回

```ts
// 子组件：数据来自 props 的 getter，不可直接改
import { animations, useDnD } from '@veltra/compositions'

const props = defineProps<{ items: { id: number; label: string }[] }>()
const emit = defineEmits<{ reorder: [values: { id: number; label: string }[]] }>()

// parentRef 必须绑定到渲染 props.items 的列表容器元素
const { parentRef } = useDnD({
  values: () => props.items, // getter 数据源，只读
  onReorder(next) {
    // next 是合并后的完整数组，交给父组件落库
    emit('reorder', next)
  },
  plugins: [animations()]
})
```

## 注意事项

> [!WARNING]
> - `@formkit/drag-and-drop` 及其 Vue 适配层已由本包重导出，禁止在业务里单独安装 `@formkit/drag-and-drop`，否则两份实例并存会导致版本漂移；统一从 `@veltra/compositions` 导入。
> - 本库是 `useDnD`（列表排序 / 跨容器转移、数据自动写回），不是 `useDrag`（单元素自由拖动）；需要拖动弹窗、滑块、缩放条这类位移交互时用 `useDrag`。
> - `filter` 命中项必须与 DOM 中渲染的可拖拽项一一对应（配合 `draggable` 排除非列表节点），否则合并回原数组时会错位。
> - `values` 用纯数组传入时，写回会同步原数组，但视图由内部副本驱动；外部直接改原数组不会自动刷新视图，数据源请优先用 `ref`。
> - `updateConfig` 是整体替换，不与旧配置合并；只传一个字段会丢掉其它配置。
> - 重导出的 `updateConfig`（FormKit API）与 `useDnD` 返回的 `updateConfig` 方法同名不同物。

## 常见问题

### 拖完顺序没有写回数据

按序检查：`values` 是否传了只读 computed 而没给 `onReorder`（只读源只能经回调写回）；`filter` 是否与 DOM 可拖拽项一致；容器是否真的带上了 `parentRef`（没传 `parent` 选项时必须把 `parentRef` 绑到列表容器上）。
