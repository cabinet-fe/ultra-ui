import { createIncrease } from '@veltra/utils'
import { isReactive, nextTick, shallowReactive, shallowRef, watch, type ShallowRef } from 'vue'

import type { GroupInputEmits, GroupInputProps } from '../../types'

interface Options {
  props: GroupInputProps
  emit: GroupInputEmits
}

interface UseGroupItemsReturned {
  items: ShallowRef<{ id: number; data: Record<string, any> }[]>
  createItem: (data: Record<string, any>) => { id: number; data: Record<string, any> }
  runByEvent: (cb: () => void) => void
}

export function useGroupItems(options: Options): UseGroupItemsReturned {
  const { props, emit } = options

  const id = createIncrease(1)

  const items = shallowRef<{ id: number; data: Record<string, any> }[]>([])

  function createItem(data: Record<string, any>) {
    return { data: isReactive(data) ? data : shallowReactive(data), id: id() }
  }

  let changedByEvent = false
  let changedByModelValue = false
  function runByEvent(cb: () => void) {
    changedByEvent = true
    cb()
    nextTick(() => {
      changedByEvent = false
    })
  }

  watch(
    () => props.modelValue,
    (modelValue) => {
      if (changedByEvent) return
      changedByModelValue = true
      items.value = modelValue?.map(createItem) ?? []
      nextTick(() => {
        changedByModelValue = false
      })
    },
    { immediate: true }
  )

  watch(items, (items) => {
    if (changedByModelValue) return
    emit(
      'update:modelValue',
      items.map((item) => item.data)
    )
  })

  return { items, createItem, runByEvent }
}
