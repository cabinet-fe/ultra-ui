import {
  DecoratorNode,
  type LexicalNode,
  type SerializedLexicalNode,
  type NodeKey
} from 'lexical'
// import VariableBlock from "../components/variable-block.vue";
import { UTag } from '../../tag'
import type { VNode } from 'vue'

interface SerializedVariableNode extends SerializedLexicalNode {
  variable: string
}

export class VariableNode extends DecoratorNode<VNode> {
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
    return (
      <UTag size='small' style='margin: 0 2px' type='primary' dark round>
        {this.__variable}
      </UTag>
    )
  }

  updateVariable(newVariable: string): void {
    const writable = this.getWritable()
    writable.__variable = newVariable
    writable.__text = `{${newVariable}}`
  }

  getVariable(): string {
    return this.__variable
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
