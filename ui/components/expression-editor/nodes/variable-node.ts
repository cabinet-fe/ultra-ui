import {
  DecoratorNode,
  type EditorConfig,
  type NodeKey,
  $getSelection,
  $isRangeSelection,
  type LexicalNode,
  type LexicalEditor
} from 'lexical'

export class VariableNode extends DecoratorNode<HTMLElement> {
  __variable: string

  static override getType(): string {
    return 'variable'
  }

  static override clone(node: VariableNode): VariableNode {
    return new VariableNode(node.__variable, node.__key)
  }

  constructor(variable: string, key?: NodeKey) {
    super(key)
    this.__variable = variable
  }

  override createDOM(config: EditorConfig): HTMLElement {
    const dom = document.createElement('span')
    dom.classList.add('u-expression-editor__variable-node')

    dom.textContent = `变量:${this.__variable}`
    return dom
  }

  override updateDOM(): false {
    return false
  }

  // 重写删除行为，使其整体删除
  override remove(): void {
    const selection = $getSelection()
    if ($isRangeSelection(selection)) {
      selection.removeText()
    }
    super.remove()
  }

  // DecoratorNode 需要实现这个方法
  override decorate(editor: LexicalEditor, config: EditorConfig): HTMLElement {
    return this.createDOM(config)
  }

  // 获取变量值
  getVariable(): string {
    return this.__variable
  }

  // 实现必要的序列化方法
  override exportJSON(): SerializedVariableNode {
    return {
      type: 'variable',
      version: 1,
      variable: this.__variable
    }
  }

  importJSON(serializedNode: SerializedVariableNode): void {
    this.__variable = serializedNode.variable
  }

  // 变量节点不应该被合并
  canInsertTextBefore(): boolean {
    return false
  }

  canInsertTextAfter(): boolean {
    return false
  }
}

// 序列化接口
interface SerializedVariableNode {
  type: 'variable'
  version: 1
  variable: string
}
