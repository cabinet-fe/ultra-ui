import { useSort } from '@ui/compositions'
import type { ShallowRef } from 'vue'
import type { TabsEmits, TabsItems, TabsProps } from '@ui/types/components/tabs'

interface Options {
  target: ShallowRef<HTMLElement | undefined>
  props: TabsProps
  emit: TabsEmits
}

export function useTabsSort(options: Options) {
  const { target, props, emit } = options
  /** 使用拖拽排序 */
  useSort({
    target,
    onChange: ({ newIndex, oldIndex }) => {
      exchange(newIndex, oldIndex)
    }
  })
  /** 根据排序结果重排数据 */
  const exchange = (newIndex: number, oldIndex: number) => {
    const { items } = props

    let newItems: TabsItems
    // 从前往后
    if (newIndex > oldIndex) {
      newItems = [
        ...items.slice(0, oldIndex),
        ...items.slice(oldIndex + 1, newIndex + 1),
        items[oldIndex]!,
        ...items.slice(newIndex + 1)
      ]
    }
    // 从后往前排
    else {
      newItems = [
        ...items.slice(0, newIndex),
        items[oldIndex]!,
        ...items.slice(newIndex, oldIndex),
        ...items.slice(oldIndex + 1)
      ]
    }

    emit('update:items', newItems)
  }
}
