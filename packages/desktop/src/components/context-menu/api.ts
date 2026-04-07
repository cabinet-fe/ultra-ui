import type { ContextMenuProps } from '@ultra-ui/desktop/types'
import { createVNode, render, type VNode } from 'vue'
import MContextMenu from './context-menu.vue'

let node: VNode

export const contextmenu = {
  pop(options: ContextMenuProps): void {
    if (node) {
      render(null, document.body)
    }

    node = createVNode(MContextMenu, {
      ...options,
      onDestroy() {
        render(null, document.body)
      }
    })

    render(node, document.body)
  }
}
