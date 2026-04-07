import type { InjectionKey, Ref, ShallowRef } from 'vue'
import {
  shallowReactive,
  computed,
  provide,
  inject,
  onBeforeUnmount
} from 'vue'

const TipNestDIKey: InjectionKey<{
  addChild(visible: ShallowRef<boolean>): void
  removeChild(visible: ShallowRef<boolean>): void
}> = Symbol('TipNestDIKey')

/**
 * tip嵌套
 * @param visible 当前tip显示变量
 * @returns
 */
export function useNest(
  visible:
    | Ref<boolean | undefined>
    | {
        __v_isRef: boolean
        value: boolean
      }
): Ref<boolean> {
  /**
   * 子级提示框
   */
  const childrenTips = shallowReactive(new Set<ShallowRef<boolean>>())
  /**
   * 是否有子级提示框正在显示中
   */
  const anyChildrenVisible = computed(() => {
    return Array.from(childrenTips).some(tip => tip.value)
  })

  const tipVisible = computed(() => {
    return visible.value || anyChildrenVisible.value
  })

  provide(TipNestDIKey, {
    addChild(v) {
      childrenTips.add(v)
    },
    removeChild(v) {
      childrenTips.delete(v)
    }
  })

  const { addChild, removeChild } = inject(TipNestDIKey, undefined) || {}
  addChild?.(tipVisible)

  onBeforeUnmount(() => {
    removeChild?.(tipVisible)
  })

  return tipVisible
}
