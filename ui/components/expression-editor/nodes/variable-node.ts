import {
  DecoratorNode,
  type LexicalNode,
  type SerializedLexicalNode
} from 'lexical'
import { cls } from '../shared'
import { createEl } from '@ui/utils/dom/node'

export class VariableNode extends DecoratorNode<null> {
  __variable: string
  __text: string

  static override getType(): string {
    return 'variable'
  }

  static override clone(node: VariableNode): VariableNode {
    return new VariableNode(node.__variable, node.__key)
  }

  static override importJSON(serializedNode: SerializedLexicalNode) {
    return super.importJSON(serializedNode)
  }

  constructor(variable: string, key?: string) {
    super(key)
    this.__variable = variable
    this.__text = `{${variable}}`
  }

  override createDOM(): HTMLElement {
    const dom = createEl('span', {
      class: cls.e('var-node'),
      innerHTML: `<i class="${cls.e('var-node-icon')}">{x}</i> : ${this.__variable}`
    })

    return dom
  }

  override remove(preserveEmptyParent?: boolean): void {
    console.log(111)
    super.remove(preserveEmptyParent)
  }

  override getTextContent(): string {
    return this.__text
  }

  override updateDOM(): false {
    return false
  }

  override decorate() {
    return null
  }
}

/** 判断是否为变量节点 */
export function $isVariableNode(
  node: LexicalNode | null | undefined
): node is VariableNode {
  return node instanceof VariableNode
}

/** 创建变量节点 */
export function $createVariableNode(variable: string): VariableNode {
  return new VariableNode(variable)
}
