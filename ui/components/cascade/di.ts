import type { BEM } from "@ui/utils"
import type { ComponentSize } from "@ui/types"
import type { CascadeEmits, CascadeProps } from "@ui/types/components/cascade"
import type { ComputedRef, InjectionKey, ShallowRef } from "vue"
import type { CascadeNode } from "./cascade-node"

export const CascadeDIKey: InjectionKey<{
  cls: BEM<"cascade">
  cascadeProps: CascadeProps
  size: ComputedRef<ComponentSize>
  disabled: ComputedRef<boolean>
  readonly: ComputedRef<boolean>
  close: () => void
  open: () => void
  forest: Record<string, any>
  nodeDict: ComputedRef<Map<string | number, CascadeNode<Record<string, any>>>>
  /** 单选事件 */
  handleSelect: (data: CascadeNode<Record<string, any>>) => void
  /** 多选事件 */
  handleCheck: (data: CascadeNode<Record<string, any>>, check: boolean) => void
  cascade: Record<string, any>
  cascadeMulti: ShallowRef<string[]>
  emit: CascadeEmits
  hovered: ShallowRef<boolean>
  clear: () => void
  remove: (tag: string) => void
}> = Symbol("CascadeDIKey")
