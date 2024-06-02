import { setStyles } from '@ui/utils'
import { nextTick } from 'vue'

export function calcTextareaHeight(el: HTMLTextAreaElement) {
  setStyles(el, {
    height: 'auto'
  })
  nextTick(() => {
    const { scrollHeight } = el

    setStyles(el, {
      overflow: 'hidden',
      height: scrollHeight + 'px'
    })
  })
}
