# useDnD - 列表拖拽排序

## 示例

见 `./examples.md`

## 类型

```ts
import type { Ref } from 'vue'
import type { VueParentConfig } from '@veltra/compositions'

interface UseDnDOptions<T> extends VueParentConfig<T> {
  /** 传 ref 则与外部共享引用，拖拽直接写回 */
  values?: T[] | Ref<T[]>
}

interface UseDnDResult<T> {
  parentRef: Ref<HTMLElement | undefined>
  values: Ref<T[]>
  /** 整体替换配置，不与初始配置合并 */
  updateConfig: (config?: VueParentConfig<T>) => void
}

function useDnD<T>(options?: UseDnDOptions<T>): UseDnDResult<T>
```

## 说明

- 基于 `@formkit/drag-and-drop` Vue 适配层；options 对象传参、命名返回；卸载时自动 `tearDown`。
- 该库核心 API / 插件 / 类型已从本包重导出，**下游不要再安装 `@formkit/drag-and-drop`**，统一从 `@veltra/compositions` 导入。
- 常用重导出：`useDragAndDrop`、`dragAndDrop`、`animations` / `dropOrSwap` / `insert`、`performSort` / `performTransfer` / `remapNodes` / `updateConfig` / `setParentValues` / `dragValues` / `isDragState` / `isSynthDragState` / `tearDown`，以及 `ParentConfig`、`VueParentConfig`、`DragState`、`SortEvent`、`TransferEvent` 等。
- 多容器互拖：各容器配置相同 `group`。
