import type { InjectionKey, Ref, ShallowRef } from 'vue'
import { shallowReactive, computed, provide, inject, onBeforeUnmount } from 'vue'

const TipNestDIKey: InjectionKey<{
  addChild(visible: ShallowRef<boolean>): void
  removeChild(visible: ShallowRef<boolean>): void
}> = Symbol('TipNestDIKey')

export function useNest(
  visible: Ref<boolean | undefined> | { __v_isRef: boolean; value: boolean }
): Ref<boolean> {
  const childrenTips = shallowReactive(new Set<ShallowRef<boolean>>())
  const anyChildrenVisible = computed(() => {
    return Array.from(childrenTips).some((tip) => tip.value)
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
