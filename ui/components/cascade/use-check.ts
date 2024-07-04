import { nextTick, shallowReactive, watch, type ComputedRef } from "vue"
import type { CascadeNode } from "./cascade-node"
import type { CascadeEmits, CascadeProps } from "@ui/types/components/cascade"
import { Tree } from "cat-kit/fe"

interface Options<DataItem extends Record<string, any>> {
  emit: CascadeEmits
  props: CascadeProps
  nodeDict: ComputedRef<Map<any, CascadeNode<DataItem>>>
  forest: Record<string, any>
}

/**
 * 多选
 */
export function useCheck<DataItem extends Record<string, any>>(
  options: Options<DataItem>
) {
  const { emit, props, nodeDict, forest } = options

  const checked = shallowReactive(new Set<DataItem>())
  let isEcho = false

  watch(
    [() => props.checked, nodeDict],
    ([c, nodeDict], [oc]) => {
      if (isEcho && checked.size !== 0) return
      if (forest.value.size === 0) return

      oc?.forEach((key: any) => {
        const node = nodeDict.get(key)!
        node.checked = false
        checked.delete(node.data!)
      })
      c?.forEach((key: any) => {
        const node = nodeDict.get(key)!
        if (node) {
          checked.add(node.data!)
          node.checked = true
        }
      })
      nextTick(() => {
        isEcho = true
      })
    },
    {
      immediate: true,
    }
  )

  watch(
    checked,
    (c) => {
      if (!isEcho) return
      isEcho = true
      const checkedArr = Array.from(c)

      emit(
        "update:checked",
        checkedArr.map((item) => item[props.valueKey!])
      )
      emit(
        "change",
        checkedArr.map((item) => item[props.valueKey!]),
        checkedArr.map((item) => item[props.labelKey!]),
        checkedArr
      )

      nextTick(() => {
        isEcho = false
      })
    },
    {
      immediate: true,
    }
  )

  const handleCheck = (node: CascadeNode<DataItem>, check: boolean) => {
    isEcho = true
    if (node.disabled) return

    Tree.dft(node, (node) => {
      if (!node.disabled) {
        node.checked = check
        if (check) {
          checked.add(node.data!)
        } else {
          checked.delete(node.data!)
        }
      }
    })

    let parent = node.parent
    while (parent) {
      parent.indeterminate =
        parent.children!.some((child) => child.checked) &&
        parent.children!.some((child) => !child.checked)

      parent.checked = parent.children!.every((child) => child.checked)

      if (parent.checked) {
        checked.add(parent.data!)
      } else {
        checked.delete(parent.data!)
      }

      parent = parent.parent
    }
    nextTick(() => {
      isEcho = false
    })
  }

  return {
    checked,
    handleCheck,
  }
}
