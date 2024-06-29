import type { BEM } from "@ui/utils"
import type { ComponentSize } from "@ui/types"
import type { CascadeProps } from "@ui/types/components/cascade"
import type { ComputedRef, InjectionKey } from "vue"
import type { CascadeNode } from "./cascade-node"

export const CascadeDIKey: InjectionKey<{
  cls: BEM<"cascade">
  cascadeProps: CascadeProps
  size: ComputedRef<ComponentSize>
  disabled: ComputedRef<boolean>
  close: () => void
  open: () => void
  forest: Record<string, any>
  nodeDict: ComputedRef<Map<string | number, CascadeNode<Record<string, any>>>>
  /** 选择事件 */
  handleSelect: (data: CascadeNode<Record<string, any>>) => void
  cascade:Record<string, any>
}> = Symbol("CascadeDIKey")
