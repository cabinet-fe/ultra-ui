import { Text, Comment, Fragment, Teleport, Suspense,  type VNode } from 'vue'

interface TextVNode extends VNode {
  children: string
}
export function isTextNode(node: VNode): node is TextVNode {
  return node.type === Text
}


interface TemplateVNode extends VNode {
  children: string
}
export function isTemplateNode(node: VNode): node is TemplateVNode {
  return node.type === Fragment
}
