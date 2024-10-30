import {
  Text,
  Fragment,
  Comment,
  type VNode,
  isVNode,
  createTextVNode,
  type VNodeArrayChildren,
  shallowRef,
  watch
} from 'vue'

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

/**
 * 提取常规虚拟节点(移除type为fragment、template的节点)
 * @param nodes VNodeArrayChildren
 * @param results 虚拟节点
 * @returns
 */
export function extractNormalVNodes(
  nodes: VNodeArrayChildren,
  results: VNode[] = []
) {
  nodes.forEach(node => {
    if (!isVNode(node)) {
      console.log(node)
      if (typeof node === 'string' || typeof node === 'number') {
        results.push(createTextVNode(String(node)))
      }
      return
    }
    if (
      (isFragment(node) || isTemplate(node)) &&
      Array.isArray(node.children)
    ) {
      extractNormalVNodes(node.children, results)
    } else {
      results.push(node)
    }
  })
  return results
}

export function shallowComputed<T>(getter: () => T) {
  const result = shallowRef<T>(getter())
  watch(getter, value => {
    result.value = value
  })

  return result
}
