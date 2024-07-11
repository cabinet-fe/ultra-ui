import type { BEM } from "@ui/utils"
import type { ComponentSize } from "@ui/types"
import type { CascadeEmits, CascadeProps } from "@ui/types/components/cascade"
import type { ComputedRef, InjectionKey, ShallowRef } from "vue"
import type { CascadeNode } from "./cascade-node"

export const CascadeDIKey: InjectionKey<{
  /** 样式*/
  cls: BEM<"cascade">
  /** 属性 */
  cascadeProps: CascadeProps
  emit: CascadeEmits

  size: ComputedRef<ComponentSize>
  disabled: ComputedRef<boolean>
  readonly: ComputedRef<boolean>
  /** 关闭 */
  close: () => void
  /** 打开 */
  open: () => void
  /** CascadeNode生成数据*/
  forest: Record<string, any>
  /** 字典 */
  nodeDict: ComputedRef<Map<string | number, CascadeNode<Record<string, any>>>>
  /** 单选事件 */
  handleSelect: (data: CascadeNode<Record<string, any>>) => void
  /** 多选事件 */
  handleCheck: (data: CascadeNode<Record<string, any>>, check: boolean) => void
  /** 选中数据 */
  cascade: ShallowRef<string | undefined>
  /** 多选选中数据 */
  cascadeMulti: ShallowRef<string[]>
  /** 鼠标移入移除 */
  hovered: ShallowRef<boolean>
  /** 清空 */
  clear: () => void
  /** 删除单个项 */
  remove: (tag: string) => void
  /** 筛选组装后数据 */
  filterData: Record<string, any>
  /** 清空搜索内容*/
  qsClear:() => void
  /** 筛选选中事件 */
  handleFilter: (data: string) => void
  /**  获取节点路径*/
  getNodePath: (data: any) => string
}> = Symbol("CascadeDIKey")
