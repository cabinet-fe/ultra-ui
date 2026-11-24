import type { VNode } from 'vue'

export interface NodeRenderProps {
  content: null | undefined | Array<VNode> | VNode
}

export interface NodeRenderExposed {}
