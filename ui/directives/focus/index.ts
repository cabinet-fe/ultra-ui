import type { ObjectDirective } from 'vue'

export const vFocus: ObjectDirective<HTMLElement> = {
  mounted: el => {
    if (el.tagName === 'INPUT') {
      el.focus()
    } else {
      const input = el.querySelector('input')
      if (input) {
        input.focus()
      } else {
        console.warn('v-focus 指令需要一个 input 元素')
      }
    }
  }
}
