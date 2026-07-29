import { tearDown } from '@formkit/drag-and-drop'
import { dragAndDrop, type VueParentConfig } from '@formkit/drag-and-drop/vue'
import {
  computed,
  isReactive,
  isReadonly,
  isRef,
  onBeforeUnmount,
  ref,
  toValue,
  watch,
  type MaybeRefOrGetter,
  type Ref
} from 'vue'

import { mergeView } from './merge-view'

export interface UseDnDOptions<T> extends VueParentConfig<T> {
  /**
   * 列表数据。排序/跨容器转移后自动写回：
   * - `Ref`：直接替换 `.value`
   * - 响应式数组（如 props 上的数组）：原地 splice 写回
   * - 非响应式纯数组：作为初始值由内部响应式副本持有，写回时顺带同步原数组
   * - getter / 只读 computed：只读数据源，通过 `onReorder` 接收写回结果
   * - 不传：内部创建数据源，通过返回的 `values` 读写
   */
  values?: MaybeRefOrGetter<T[]>
  /**
   * 数据过滤：仅命中的项参与拖拽排序（须与 DOM 中实际渲染的可拖拽项一一对应）。
   * 排序/转移结果自动合并回原数组，未命中的项保持相对顺序。
   */
  filter?: (item: T) => boolean
  /**
   * 容器元素。支持 ref / getter（如 `() => btnRef.value?.parentElement`），
   * 元素出现、替换、移除时自动初始化 / 重建 / 销毁拖拽实例。
   * 不传时通过返回的 `parentRef` 以模板引用绑定。
   */
  parent?: MaybeRefOrGetter<HTMLElement | undefined>
  /**
   * `values` 为只读数据源（getter / 只读 computed）时，
   * 排序/转移结果通过该回调写回，收到的是合并后的完整数组
   */
  onReorder?: (values: T[]) => void
}

export interface UseDnDResult<T> {
  /** 拖拽容器元素；未传 `parent` 选项时通过模板引用绑定到列表容器上 */
  parentRef: Ref<HTMLElement | undefined>
  /** 拖拽数据。`filter` 模式下为参与拖拽的视图；排序/转移后自动更新 */
  values: Ref<T[]>
  /**
   * 运行时更新拖拽配置（整体替换，不含 `values` / `filter` / `parent` / `onReorder`）
   * @param config 新配置
   */
  updateConfig: (config?: VueParentConfig<T>) => void
}

/**
 * 拖拽排序组合式方法，基于 `@formkit/drag-and-drop` 的 Vue 适配层封装。
 *
 * 排序/跨容器转移结果自动写回数据，无需手动处理 `onSort`；
 * `filter` 支持只对数据的可见子集排序并自动合并回原数组；
 * `parent` 支持动态容器（元素替换/重建时自动重新初始化）。
 * 组件卸载时自动销毁拖拽实例。
 *
 * @example 基础用法：列表即数据，排序自动写回
 * ```ts
 * const { parentRef, values } = useDnD({ values: list, plugins: [animations()] })
 * ```
 *
 * ```vue
 * <ul ref="parentRef">
 *   <li v-for="item in values" :key="item.id">{{ item.label }}</li>
 * </ul>
 * ```
 *
 * @example 可见子集排序 + 动态容器
 * ```ts
 * useDnD({
 *   values: props.items, // 完整数据（含隐藏项），原地写回
 *   filter: (item) => item.visible, // 仅可见项参与拖拽，排序自动合并回原数组
 *   parent: () => addBtnRef.value?.parentElement ?? undefined, // 容器动态获取
 *   dragHandle: '.u-form-item__label',
 *   draggable: (el) => el.classList.contains('setting-trigger'), // 排除“新增”按钮
 *   plugins: [animations()]
 * })
 * ```
 */
export function useDnD<T>(options: UseDnDOptions<T> = {}): UseDnDResult<T> {
  const {
    values: valuesOption,
    filter,
    parent: parentOption,
    onReorder,
    ...initialConfig
  } = options

  const parentRef = ref<HTMLElement>()
  const internalValues = ref<T[]>([]) as Ref<T[]>
  let currentConfig = initialConfig

  // 非响应式纯数组无法被追踪：由内部 ref 持有数据驱动视图，写回时顺带同步原数组
  const useInternal =
    valuesOption === undefined ||
    (Array.isArray(valuesOption) && !isReactive(valuesOption) && !isReadonly(valuesOption))
  if (useInternal && valuesOption) internalValues.value = valuesOption

  function readSource(): T[] {
    if (useInternal) return internalValues.value
    return toValue(valuesOption as MaybeRefOrGetter<T[]>) ?? []
  }

  function writeSource(next: T[]) {
    if (useInternal) {
      internalValues.value = next
      if (valuesOption) (valuesOption as T[]).splice(0, (valuesOption as T[]).length, ...next)
      return
    }
    if (isRef(valuesOption)) {
      // 可写 ref / 可写 computed 直接写回；只读 computed 走 onReorder
      if (isReadonly(valuesOption)) onReorder?.(next)
      else (valuesOption as Ref<T[]>).value = next
      return
    }
    if (Array.isArray(valuesOption)) {
      if (isReadonly(valuesOption)) onReorder?.(next)
      else valuesOption.splice(0, valuesOption.length, ...next)
      return
    }
    onReorder?.(next)
  }

  /**
   * 交给拖拽库的数据（视图）。库排序/转移后通过 setter 写回，
   * setter 将视图结果合并回完整数据源。
   */
  const dndValues = computed<T[]>({
    get: () => {
      const source = readSource()
      return filter ? source.filter(filter) : source
    },
    set: (nextView) => {
      if (!filter) {
        writeSource(nextView)
        return
      }
      const source = readSource()
      writeSource(mergeView(source, source.filter(filter), nextView))
    }
  })

  /** 当前生效的容器元素：`parent` 选项优先，否则用模板引用 */
  const resolvedParent = computed<HTMLElement | undefined>(() =>
    parentOption === undefined ? parentRef.value : toValue(parentOption)
  )

  function init(parent: HTMLElement) {
    dragAndDrop({ parent, values: dndValues, ...currentConfig })
  }

  function updateConfig(newConfig: VueParentConfig<T> = {}) {
    currentConfig = newConfig
    if (resolvedParent.value) init(resolvedParent.value)
  }

  // 容器出现 / 替换 / 移除时自动初始化 / 重建 / 销毁；
  // flush: 'post' 保证模板引用与 DOM 已更新
  watch(
    resolvedParent,
    (parent, prev) => {
      if (prev && prev !== parent) tearDown(prev)
      if (parent) init(parent)
    },
    { flush: 'post', immediate: true }
  )

  onBeforeUnmount(() => {
    if (resolvedParent.value) tearDown(resolvedParent.value)
  })

  return { parentRef, values: dndValues, updateConfig }
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
