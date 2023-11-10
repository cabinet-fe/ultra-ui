import { Text, Fragment, Comment, type VNode } from 'vue'

interface TextVNode extends VNode {
  children: string
}

/**
 * 是否为文本
 * @param node
 * @returns
 */
export function isTextNode(node: VNode): node is TextVNode {
  return node.type === Text
}

interface FragmentVNode extends VNode {
  children: string
}

/**
 * 是否为片段
 * @param node
 * @returns
 */
export function isFragment(node: VNode): node is FragmentVNode {
  return node.type === Fragment
}

interface CommentVNode extends VNode {
  children: string
}

/**
 * 是否为注释
 * @param node
 * @returns
 */
export function isComment(node: VNode): node is CommentVNode {
  return node.type === Comment
}
