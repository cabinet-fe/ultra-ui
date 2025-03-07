import {
  DecoratorNode,
  type LexicalNode,
  type SerializedLexicalNode,
  $createTextNode,
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

  override decorate(): HTMLElement {
    const dom = this.createDOM()

    // 确保变量节点可以被正确选中
    dom.contentEditable = 'false'
    dom.draggable = false
    dom.style.display = 'inline-block'
    dom.style.userSelect = 'none'

    return dom
  }

  override exportJSON(): SerializedVariableNode {
    return {
      ...super.exportJSON(),
      type: 'variable',
      variable: this.__variable,
      version: 1
    }
  }

  // 处理键盘导航，确保在变量节点后可以正确插入内容
  insertNewAfter(): LexicalNode {
    const textNode = $createTextNode('')
    this.insertAfter(textNode)
    return textNode
  }

  // 确保节点可以被选中
  override isInline(): boolean {
    return true
  }

  // 确保节点可以被选中
  isSegmented(): boolean {
    return false
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
