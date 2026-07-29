# useDnD - 列表拖拽排序

## 示例

见 `./examples.md`

## 类型

```ts
import type { MaybeRefOrGetter, Ref } from 'vue'
import type { VueParentConfig } from '@veltra/compositions'

interface UseDnDOptions<T> extends VueParentConfig<T> {
  /**
   * 列表数据。排序/跨容器转移后自动写回：
   * - Ref：直接替换 .value
   * - 响应式数组（如 props 上的数组）：原地 splice 写回
   * - 非响应式纯数组：作为初始值由内部副本持有，写回时顺带同步原数组
   * - getter / 只读 computed：只读数据源，经 onReorder 接收合并后的完整数组
   */
  values?: MaybeRefOrGetter<T[]>
  /** 仅命中的项参与拖拽（须与 DOM 中可拖拽项一一对应），未命中项保持相对顺序 */
  filter?: (item: T) => boolean
  /** 动态容器，元素出现/替换/移除时自动初始化/重建/销毁；不传则绑定 parentRef */
  parent?: MaybeRefOrGetter<HTMLElement | undefined>
  /** 只读数据源的写回回调，收到合并后的完整数组 */
  onReorder?: (values: T[]) => void
}

interface UseDnDResult<T> {
  parentRef: Ref<HTMLElement | undefined>
  /** 拖拽数据；filter 模式下为参与拖拽的视图 */
  values: Ref<T[]>
  /** 整体替换配置，不含 values / filter / parent / onReorder */
  updateConfig: (config?: VueParentConfig<T>) => void
}

function useDnD<T>(options?: UseDnDOptions<T>): UseDnDResult<T>
```

## 说明

- 基于 `@formkit/drag-and-drop` Vue 适配层；options 对象传参、命名返回；卸载时自动 `tearDown`。
- **排序/跨容器转移结果自动写回数据**，无需手动 `onSort` 做 splice；`filter` 子集排序的稳定合并（隐藏项保持相对顺序）由内部处理。
- 该库核心 API / 插件 / 类型已从本包重导出，**下游不要再安装 `@formkit/drag-and-drop`**，统一从 `@veltra/compositions` 导入。
- 常用重导出：`useDragAndDrop`、`dragAndDrop`、`animations` / `dropOrSwap` / `insert`、`performSort` / `performTransfer` / `remapNodes` / `updateConfig` / `setParentValues` / `dragValues` / `isDragState` / `isSynthDragState` / `tearDown`，以及 `ParentConfig`、`VueParentConfig`、`DragState`、`SortEvent`、`TransferEvent` 等。
- 多容器互拖：各容器配置相同 `group`。
