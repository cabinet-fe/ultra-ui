import { $createTextNode, type LexicalNode } from 'lexical'
import { $createVariableNode } from './nodes/variable-node'
import type { VariableItem } from '@ultra-ui/pc/types'

/**
 * 解析表达式内容
 * @param content 表达式内容
 * @param variableMap 变量映射表（可选，用于查找 label）
 * @returns 节点列表
 */
export function parseContent(
  content: string,
  variableMap?: Map<string, VariableItem>
): LexicalNode[] {
  const nodes: LexicalNode[] = []

  let prevItem: null | RegExpExecArray = null
  for (const item of content.matchAll(/\{([^}]+)\}/g)) {
    const variable = item[1]!

    const startIndex = prevItem ? prevItem.index! + prevItem[0].length : 0
    const endIndex = item.index

    const text = content.slice(startIndex, endIndex)

    if (text) {
      nodes.push($createTextNode(text))
    }

    prevItem = item

    // 从映射表中查找对应的 label
    const label = variableMap?.get(variable)?.label
    nodes.push($createVariableNode(variable, label))
  }

  if (prevItem) {
    const tail = content.slice(prevItem.index! + prevItem[0].length)
    if (tail) nodes.push($createTextNode(tail))
  } else if (content) {
    nodes.push($createTextNode(content))
  }

  return nodes
}
