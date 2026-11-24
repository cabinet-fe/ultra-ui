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
  /** 是否渲染复选框，由 `showCheckbox` 在整棵树构建完成后判定，默认 true */
  showCheckbox: boolean
  label: string
  key: string | number
  childrenCheckCount: number

  bubbleSet: (setter: (node: TreeNode<Data>) => void) => void
}

export interface TreeProps {
  expandAll?: boolean
  expandOnClickNode?: boolean
  labelKey?: string
  /**
   * 标签展示模板
   * @description `{fieldKey}` 占位符按节点数据字段插值（支持嵌套路径取值），
   * 模板引用的字段在节点数据中取不到时整体回退 `node[labelKey]`；
   * 配置后节点文本与字符串过滤统一按模板结果渲染 / 匹配
   * @example '{label}（{code}）'
   */
  labelTemplate?: string
  valueKey?: string
  childrenKey?: string
  data?: Record<string, any>[]
  /**
   * 禁止单选或多选的节点。
   * 在整棵树构建完成后调用，可安全访问 `node.children` / `node.isLeaf`。
   */
  disabledNode?: (item: Record<string, any>, node: TreeNode) => boolean
  /**
   * 是否渲染某个节点的复选框。返回 `false` 的节点不渲染 checkbox，也不作为勾选值参与
   * 级联勾选、向上冒泡、全选与 `update:checked`；其后代各自判定，不受影响。
   * 在整棵树构建完成后调用，可安全访问 `node.children` / `node.isLeaf`。
   * @default 不传时每个节点都渲染复选框
   */
  showCheckbox?: (item: Record<string, any>, node: TreeNode) => boolean
  checkable?: boolean
  /**
   * 点击节点时是否触发勾选。仅当 `checkable` 时生效；
   * 设为 `false` 后只有点击 checkbox 才会勾选。
   * @default true
   */
  checkOnClickNode?: boolean
  selectable?: boolean
  /**
   * 严格选择，选择的内容和父级不会产生关联
   * @default false
   */
  checkStrictly?: boolean
  selected?: any
  checked?: any[]
  slots?: Record<string, any>
  scrollToView?: boolean
}

export interface TreeEmit {
  (e: 'expand', node: TreeNode): void
  (e: 'node-click', node: TreeNode): void
  (e: 'update:selected', selected?: any, selectedData?: Record<string, any>, node?: TreeNode): void
  (e: 'update:checked', checked: any[], checkedData: Record<string, any>[]): void
  (e: 'node-contextmenu', event: MouseEvent, node: TreeNode): void
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

export interface _TreeExposed {
  scrollTo: (index: number) => void
  /**
   * 过滤树节点。注意：不要再watchEffect中调用！
   */
  filter(filter: string | ((node: TreeNode) => boolean)): void
  forest: ComputedRef<Forest<Record<string, unknown>, any>>
  nodes: ShallowRef<TreeNode[]>
  checkNode: (node: TreeNode, check: boolean) => void
  selectNode: (node: TreeNode) => void
  checkAll: (check: boolean) => void
  getSelected(): Record<string, any> | undefined
  getChecked(): Record<string, any>[]
  expandAll(): void
  collapseAll(): void
}

/** 树组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type TreeExposed = DeconstructValue<_TreeExposed>
