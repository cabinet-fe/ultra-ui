import { Text, Fragment, Comment,  type VNode, isVNode } from 'vue'

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

/**
 * 是否为片段
 * @param node
 * @returns
 */
export function isFragment(node: any): node is VNode {
  return node && node.type === Fragment
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

/**
 * 是否为模板
 * @param node
 * @returns
 */
export function isTemplate(node: unknown): node is VNode {
  return isVNode(node) && node.type === 'template'
}