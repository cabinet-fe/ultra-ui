import { createVNode, render, type VNode } from 'vue'

import type { ContextmenuProps } from '../../types'
import UContextmenu from './contextmenu.vue'

let node: VNode

export const contextmenu = {
  pop(options: ContextmenuProps): void {
    if (node) {
      render(null, document.body)
    }

    node = createVNode(UContextmenu, {
      ...options,
      onDestroy() {
        render(null, document.body)
      }
    })

    render(node, document.body)
  }
}
