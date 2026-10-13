import { o } from '@cat-kit/core'
import {
  Text,
  Fragment,
  Comment,
  type VNode,
  isVNode,
  createTextVNode,
  type VNodeArrayChildren,
  shallowRef,
  watch,
  type ShallowRef
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
export function extractNormalVNodes(nodes: VNodeArrayChildren, results: VNode[] = []): VNode[] {
  nodes.forEach((node) => {
    if (!isVNode(node)) {
      if (typeof node === 'string' || typeof node === 'number') {
        results.push(createTextVNode(String(node)))
      }
      return
    }
    if ((isFragment(node) || isTemplate(node)) && Array.isArray(node.children)) {
      extractNormalVNodes(node.children, results)
    } else {
      results.push(node)
    }
  })
  return results
}

/** 字段名：空串 / null / undefined 时回退默认值 */
export function fieldKey(key: string | null | undefined, fallback: string): string {
  return key ? key : fallback
}

/** labelTemplate 占位符：{fieldKey}，支持嵌套路径 */
const LABEL_TEMPLATE_RE = /\{([^{}]+)\}/g

/**
 * 按 labelTemplate 渲染选项展示文案
 * @description `{fieldKey}` 占位符按行字段取值（链式取值，支持嵌套路径），
 * 取不到值（字段缺失 / null / 空串）的占位符按空串处理；
 * 只要有字段未命中即返回 undefined，由调用方回退 `row[labelKey]`，
 * 避免「文本（）」这类残缺展示。渲染期格式化，不改写行数据。
 * @param template 模板串，如 `{label}（{code}）`；空值直接返回 undefined
 * @param row 选项行数据
 */
export function renderLabelTemplate(
  template: string | undefined,
  row: Record<string, any> | undefined | null
): string | undefined {
  if (!template || !row) return undefined

  let missing = false
  const text = template.replace(LABEL_TEMPLATE_RE, (_, key: string) => {
    const value = o(row).get(key)
    if (value === undefined || value === null || value === '') {
      missing = true
      return ''
    }
    return String(value)
  })

  return missing ? undefined : text
}

export function shallowComputed<T>(getter: () => T): ShallowRef<T> {
  const result = shallowRef<T>(getter())
  watch(getter, (value) => {
    result.value = value
  })

  return result
}
