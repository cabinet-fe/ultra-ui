import { shallowRef, type Ref, type ShallowRef } from 'vue'

interface Content {
  newIndex: number
  oldIndex: number
}

interface Options {
  target:
    | HTMLElement
    | ShallowRef<HTMLElement | undefined>
    | Ref<HTMLElement | undefined>

  onChange(c: Content): void
}

export function useSort(options: Options) {
  // 实现
}
