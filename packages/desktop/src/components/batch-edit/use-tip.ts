import { type ShallowRef, shallowRef, watch } from 'vue'
import type { BatchEditProps, BatchEditFeature } from '@ultra-ui/desktop/types'

export interface TipReturned {
  visible: ShallowRef<boolean>
  triggerDom: ShallowRef<HTMLElement | undefined>
  tipType: ShallowRef<BatchEditFeature | undefined>
  open: (type: BatchEditFeature, triggerDom: HTMLElement) => void

  handleSubmit: () => Promise<void>
}

export function useTip(options: { props: BatchEditProps }): TipReturned {
  const { props } = options

  const visible = shallowRef(false)
  const triggerDom = shallowRef<HTMLElement>()
  const tipType = shallowRef<BatchEditFeature>()

  function open(type: BatchEditFeature, dom: HTMLElement) {
    tipType.value = type
    triggerDom.value = dom
  }

  watch(visible, v => {
    if (!v) {
      const { model } = props
      model?.clearValidate()
      model?.resetData()
    }
  })

  async function handleSubmit() {
    await props.model?.validate()
    visible.value = false
  }

  return {
    visible,
    triggerDom,
    tipType,
    open,

    handleSubmit
  }
}
