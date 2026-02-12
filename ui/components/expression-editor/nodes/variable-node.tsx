import {
  DecoratorNode,
  type LexicalNode,
  type SerializedLexicalNode,
  type NodeKey
} from 'lexical'
import { UTag } from '../../tag'
import type { VNode } from 'vue'

interface SerializedVariableNode extends SerializedLexicalNode {
  variable: string
  label?: string
  type?: string
}

export class VariableNode extends DecoratorNode<VNode> {
  __variable: string
  __label: string
  __type: string
  __text: string
  __domNode: HTMLElement | null = null

  static override getType(): string {
    return 'variable'
  }

  static override clone(node: VariableNode): VariableNode {
    return new VariableNode(
      node.__variable,
      node.__label,
      node.__type,
      node.__key
    )
  }

  static override importJSON(
    serializedNode: SerializedVariableNode
  ): VariableNode {
    return new VariableNode(
      serializedNode.variable,
      serializedNode.label || serializedNode.variable,
      serializedNode.type
    )
  }

  constructor(variable: string, label?: string, type?: string, key?: NodeKey) {
    super(key)

    this.__variable = variable
    this.__label = label || variable
    this.__type = type || ''
    this.__text = `{${variable}}`
  }

  override createDOM(): HTMLElement {
    const span = document.createElement('span')
    span.style.display = 'inline-block'
    return span
  }

  override getTextContent(): string {
    return this.__text
  }

  override updateDOM(): false {
    return false
  }

  override decorate(): VNode {
    const displayText = this.__type
      ? `${this.__label} (${this.__type})`
      : this.__label
    return (
      <UTag
        size='small'
        style='margin: 0 2px'
        type='primary'
        round
        title={this.__label}
      >
        {displayText}
      </UTag>
    )
  }

  updateVariable(newVariable: string, newLabel?: string, newType?: string): void {
    const writable = this.getWritable()
    writable.__variable = newVariable
    writable.__label = newLabel || newVariable
    writable.__type = newType ?? writable.__type
    writable.__text = `{${newVariable}}`
  }

  getVariable(): string {
    return this.__variable
  }

  getLabel(): string {
    return this.__label
  }

  getType(): string {
    return this.__type
  }
}

/** 判断是否为变量节点 */
export function $isVariableNode(node: LexicalNode | null | undefined): boolean {
  return node instanceof VariableNode
}

/** 创建变量节点 */
export function $createVariableNode(
  variable: string,
  label?: string,
  type?: string
): VariableNode {
  return new VariableNode(variable, label, type)
}
