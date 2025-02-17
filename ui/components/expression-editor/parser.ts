import { $createTextNode, type LexicalNode } from 'lexical'
import { $createVariableNode } from './nodes/variable-node'

/**
 * 解析表达式内容
 * @param content 表达式内容
 * @returns 节点列表
 */
export function parseContent(content: string): LexicalNode[] {
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

    nodes.push($createVariableNode(variable))
  }

  return nodes
}
