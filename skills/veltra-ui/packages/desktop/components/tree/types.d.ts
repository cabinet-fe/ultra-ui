import type { Forest, ITreeNode } from '@cat-kit/core'
import type { DeconstructValue } from '@veltra/utils'
import type { ComputedRef, ShallowRef } from 'vue'

export interface TreeNode<Data extends Record<string, any> = Record<string, any>> extends ITreeNode<
  Data,
  TreeNode<Data>
> {
  parent?: TreeNode<Data>
  children?: TreeNode<Data>[]
  valueKey: string
  labelKey: string
  visible: boolean
  expanded: boolean
  loading: boolean
  loaded: boolean
  checked: boolean
  indeterminate: boolean
  disabled: boolean
  label: string
  key: string | number
  childrenCheckCount: number

  bubbleSet: (setter: (node: TreeNode<Data>) => void) => void
}

/** 树组件属性 */
export interface TreeProps {
  /** 是否展开所有节点 */
  expandAll?: boolean
  /** 是否在点击节点的时候展开或者收缩节点 */
  expandOnClickNode?: boolean
  /** label键 */
  labelKey?: string
  /** value键 */
  valueKey?: string
  /** 子节点键 */
  childrenKey?: string
  /** 数据 */
  data?: Record<string, any>[]
  /** 禁止单选或多选的节点 */
  disabledNode?: (item: Record<string, any>, node: TreeNode) => boolean
  /** 可多选 */
  checkable?: boolean
  /** 可单选 */
  selectable?: boolean
  /**
   * 严格选择，选择的内容和父级不会产生关联
   * @default false
   */
  checkStrictly?: boolean
  /** 单选选中项 */
  selected?: any
  /** 多选选中项 */
  checked?: any[]
  /** 插槽穿透 */
  slots?: Record<string, any>
  /** 使选中项或多选项出现在滚动视图中 */
  scrollToView?: boolean
}

export interface TreeEmit {
  /** 节点展开/折叠事件 */
  (e: 'expand', node: TreeNode): void
  /** 节点点击事件 */
  (e: 'node-click', node: TreeNode): void
  /** 单选选中项 */
  (e: 'update:selected', selected?: any, selectedData?: Record<string, any>, node?: TreeNode): void
  /** 多选选中项 */
  (e: 'update:checked', checked: any[], checkedData: Record<string, any>[]): void
  /** 节点右键菜单事件 */
  (e: 'node-contextmenu', event: MouseEvent, node: TreeNode): void
  /** 选中项同步完成事件 */
  (e: 'selected-synced', selected?: Record<string, any>): void
}

export interface TreeNodeProps {
  node: TreeNode
  /**
   * 虚拟项索引：对应 `nodes` 数组中的绝对位置。
   * 需要传入以便在节点卸载时正确通知 `Virtualizer` 解绑，避免 size=0 的脏测量。
   */
  index?: number
  measureElement?: (index: number, el: Element | null) => void
}

/** 树组件暴露的属性和方法(组件内部使用) */
export interface _TreeExposed {
  /** 滚动到目标元素 */
  scrollTo: (index: number) => void
  /**
   * 过滤树节点。注意：不要再watchEffect中调用！
   * @param filter 过滤器或一个字符串
   */
  filter(filter: string | ((node: TreeNode) => boolean)): void
  forest: ComputedRef<Forest<Record<string, unknown>, any>>
  nodes: ShallowRef<TreeNode[]>
  /** 多选选择节点 */
  checkNode: (node: TreeNode, check: boolean) => void
  /** 单选选择节点 */
  selectNode: (node: TreeNode) => void
  /** 对全部节点进行勾选/取消勾选 */
  checkAll: (check: boolean) => void
  /** 获取选择的节点值 */
  getSelected(): Record<string, any> | undefined
  /** 获取选中的节点值 */
  getChecked(): Record<string, any>[]
  /** 展开全部节点 */
  expandAll(): void
  /** 折叠全部节点 */
  collapseAll(): void
}

/** 树组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type TreeExposed = DeconstructValue<_TreeExposed>
