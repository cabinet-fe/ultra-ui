import type { CellAddress, CellRange } from '../address'

/**
 * 公式 AST 节点。
 * 引用节点携带可选 sheet 名（跨表引用）；缺省 = 公式所在 sheet。
 */

export type BinaryOperator =
  | '+'
  | '-'
  | '*'
  | '/'
  | '^'
  | '&'
  | '='
  | '<>'
  | '<'
  | '<='
  | '>'
  | '>='

export type AstNode =
  | { kind: 'number'; value: number }
  | { kind: 'string'; value: string }
  | { kind: 'boolean'; value: boolean }
  /** 未知名称（如裸写的 Sheet2 / 未定义命名）；求值为 #NAME? */
  | { kind: 'name'; name: string }
  | { kind: 'cell'; sheet?: string; addr: CellAddress }
  | { kind: 'range'; sheet?: string; range: CellRange }
  | { kind: 'unary'; op: '-' | '+'; operand: AstNode }
  /** 百分号后缀运算（除以 100） */
  | { kind: 'percent'; operand: AstNode }
  | { kind: 'binary'; op: BinaryOperator; left: AstNode; right: AstNode }
  | { kind: 'call'; name: string; args: AstNode[] }

/** 公式中的引用（依赖图提取用）：sheet 缺省由所属公式节点补齐 */
export interface AstReference {
  sheet?: string
  range: CellRange
}

/** 遍历 AST，收集全部引用（单格视为 1×1 区域） */
export function collectReferences(node: AstNode, out: AstReference[] = []): AstReference[] {
  switch (node.kind) {
    case 'cell':
      out.push({ sheet: node.sheet, range: { start: node.addr, end: node.addr } })
      break
    case 'range':
      out.push({ sheet: node.sheet, range: node.range })
      break
    case 'unary':
    case 'percent':
      collectReferences(node.operand, out)
      break
    case 'binary':
      collectReferences(node.left, out)
      collectReferences(node.right, out)
      break
    case 'call':
      for (const arg of node.args) collectReferences(arg, out)
      break
    default:
      break
  }
  return out
}
