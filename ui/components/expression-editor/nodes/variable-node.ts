import {
  DecoratorNode,
  type LexicalNode,
  type SerializedLexicalNode,
  type NodeKey
} from 'lexical'
import { cls } from '../shared'
import { createEl } from '@ui/utils/dom/node'

interface SerializedVariableNode extends SerializedLexicalNode {
  variable: string
}

export class VariableNode extends DecoratorNode<HTMLElement> {
  __variable: string
  __text: string
  __domNode: HTMLElement | null = null

  static override getType(): string {
    return 'variable'
  }

  static override clone(node: VariableNode): VariableNode {
    return new VariableNode(node.__variable, node.__key)
  }

  static override importJSON(
    serializedNode: SerializedVariableNode
  ): VariableNode {
    return new VariableNode(serializedNode.variable)
  }

  constructor(variable: string, key?: NodeKey) {
    super(key)
    this.__variable = variable
    this.__text = `{${variable}}`
  }

  override createDOM(): HTMLElement {
    const dom = createEl('span', {
      class: cls.e('var-node'),
      innerHTML: `<i class="${cls.e('var-node-icon')}">{}</i> ${this.__variable}`
    })

    // 保存DOM引用以便后续使用
    this.__domNode = dom

    return dom
  }

  override getTextContent(): string {
    return this.__text
  }

  override updateDOM(): false {
    return false
  }

  override decorate(): HTMLElement {
    const dom = this.createDOM()

    // 确保变量节点可以被正确选中
    dom.contentEditable = 'false'
    dom.draggable = false
    dom.style.display = 'inline-block'
    dom.style.userSelect = 'none'
    dom.style.cursor = 'pointer'

    return dom
  }
}

/** 判断是否为变量节点 */
export function $isVariableNode(node: LexicalNode | null | undefined): boolean {
  return node instanceof VariableNode
}

/** 创建变量节点 */
export function $createVariableNode(variable: string): VariableNode {
  return new VariableNode(variable)
}
