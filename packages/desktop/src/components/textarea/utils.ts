import { setStyles } from '@veltra/utils'
import { nextTick } from 'vue'

export function calcTextareaHeight(el: HTMLTextAreaElement): void {
  setStyles(el, { height: 'auto' })
  nextTick(() => {
    const { scrollHeight } = el

    setStyles(el, { overflow: 'hidden', height: scrollHeight + 'px' })
  })
}
