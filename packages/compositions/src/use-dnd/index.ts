import { tearDown } from '@formkit/drag-and-drop'
import { dragAndDrop, type VueParentConfig } from '@formkit/drag-and-drop/vue'
import { isRef, onBeforeUnmount, ref, type Ref } from 'vue'

export interface UseDnDOptions<T> extends VueParentConfig<T> {
  /**
   * 列表数据。传入 ref 时与外部共享同一个引用，拖拽排序/转移后直接写回；
   * 传入普通数组或不传时内部创建 ref。
   */
  values?: T[] | Ref<T[]>
}

export interface UseDnDResult<T> {
  /** 拖拽容器元素，通过 `ref` 绑定到列表容器元素上 */
  parentRef: Ref<HTMLElement | undefined>
  /** 列表数据，排序/跨容器转移后自动更新 */
  values: Ref<T[]>
  /**
   * 运行时更新拖拽配置（整体替换，不与初始配置合并）
   * @param config 新配置
   */
  updateConfig: (config?: VueParentConfig<T>) => void
}

/**
 * 拖拽排序组合式方法，基于 `@formkit/drag-and-drop` 的 Vue 适配层封装。
 *
 * 相比官方 `useDragAndDrop` 的元组返回，这里使用 options 对象传参并返回命名结果。
 * 组件卸载时自动销毁拖拽实例。
 *
 * @example
 * ```ts
 * const { parentRef, values } = useDnD({
 *   values: list,
 *   plugins: [animations()],
 *   onSort: ({ previousValues, values }) => {}
 * })
 * ```
 *
 * ```vue
 * <ul ref="parentRef">
 *   <li v-for="item in values" :key="item.id">{{ item.label }}</li>
 * </ul>
 * ```
 */
export function useDnD<T>(options: UseDnDOptions<T> = {}): UseDnDResult<T> {
  const { values: initialValues, ...config } = options

  const parentRef = ref<HTMLElement>()
  const values = isRef(initialValues) ? initialValues : (ref(initialValues ?? []) as Ref<T[]>)

  function updateConfig(newConfig: VueParentConfig<T> = {}) {
    dragAndDrop({ parent: parentRef, values, ...newConfig })
  }

  updateConfig(config)

  onBeforeUnmount(() => {
    parentRef.value && tearDown(parentRef.value)
  })

  return { parentRef, values, updateConfig }
}

// 重导出 `@formkit/drag-and-drop`，下游项目统一从 `@veltra/compositions` 获取，
// 避免本库与下游各自安装导致版本不一致（体积膨胀 / 兼容问题）。
export {
  // Vue 适配层原始 API
  dragAndDrop,
  useDragAndDrop,
  type VueDragAndDropData,
  type VueElement,
  type VueParentConfig
} from '@formkit/drag-and-drop/vue'

export {
  // 插件
  animations,
  dropOrSwap,
  insert,
  // 操作与状态工具
  performSort,
  performTransfer,
  remapNodes,
  updateConfig,
  parentValues,
  setParentValues,
  dragValues,
  isDragState,
  isSynthDragState,
  isBrowser,
  tearDown,
  // 类型
  type ParentConfig,
  type ParentData,
  type ParentRecord,
  type Node,
  type NodeData,
  type NodeRecord,
  type NodeTargetData,
  type ParentTargetData,
  type BaseDragState,
  type DragState,
  type SynthDragState,
  type NativeDragEffects,
  type DNDPlugin,
  type DNDPluginData,
  type NodeEventData,
  type NodeDragEventData,
  type NodePointerEventData,
  type ParentEventData,
  type ParentDragEventData,
  type SortEvent,
  type SortEventData,
  type TransferEvent,
  type TransferEventData,
  type DragstartEvent,
  type DragstartEventData,
  type DragendEvent,
  type DragendEventData,
  type ShouldSwapData,
  type DropSwapConfig,
  type InsertConfig,
  type InsertEvent,
  type SetupNode,
  type SetupNodeData,
  type TearDownNode,
  type TearDownNodeData,
  type PointeroverNodeEvent,
  type PointeroverParentEvent
} from '@formkit/drag-and-drop'
