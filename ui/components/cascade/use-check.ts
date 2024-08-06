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
    [() => props.modelValue, nodeDict],
    ([c, nodeDict], [oc]) => {
      if (!props.multiple) return
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
      if (!props.multiple) return
      if (!isEcho) return
      isEcho = false
      const checkedArr = Array.from(c)
      emit(
        "update:modelValue",
        c.size === 0
          ? undefined
          : checkedArr.map((item) => item[props.valueKey!])
      )
      emit(
        "change",
        checkedArr.map((item) => item[props.valueKey!]),
        checkedArr.map((item) => item[props.labelKey!]),
        checkedArr
      )

      nextTick(() => {
        isEcho = true
      })
    },
    {
      immediate: true,
    }
  )

  function handleCheck(node: CascadeNode<DataItem>, check: boolean) {
    isEcho = true
    const { checkStrictly } = props
    if (check) {
      Tree.dft(node, (node) => {
        if (node.disabled) return
        node.checked = true
        checked.add(node.data)
      })

      if (!checkStrictly) {
        let parent = node.parent
        while (parent && parent.depth > 0) {
          parent.checked = parent.children!.every((child) => child.checked)
          if (!parent.checked) {
            parent.indeterminate = true
          } else {
            parent.indeterminate = false
            checked.add(parent.data)
          }

          parent = parent.parent
        }
      }
    } else {
      Tree.dft(node, (node) => {
        node.checked = false
        node.indeterminate = false
        checked.delete(node.data)
      })

      if (!checkStrictly) {
        let parent = node.parent
        while (parent && parent.depth > 0) {
          parent.checked = false
          checked.delete(parent.data)

          parent.indeterminate =
            parent.children!.some((child) => child.indeterminate) ||
            parent.children!.some((child) => child.checked)

          parent = parent.parent
        }
      }
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
