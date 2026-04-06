import type { ExpressionEditorProps, VariableItem } from '@ultra-ui/pc/types'
import type { BEM } from '@ultra-ui/core'
import type { InjectionKey, ComputedRef } from 'vue'
import type { LexicalEditor } from 'lexical'

/**
 * 扁平化变量树，创建 value -> VariableItem 的映射
 * @param variables 变量列表（支持树形结构）
 * @returns value -> VariableItem 的映射表
 */
export function createVariableMap(
  variables?: VariableItem[]
): Map<string, VariableItem> {
  const map = new Map<string, VariableItem>()

  function traverse(
    items: VariableItem[] | undefined,
    parentPath: string[] = []
  ) {
    if (!items) return

    for (const item of items) {
      const currentPath = [...parentPath, item.label]
      map.set(item.value, item)

      if (item.children) {
        traverse(item.children, currentPath)
      }
    }
  }

  traverse(variables)
  return map
}

export const ExpressionEditorDIKey: InjectionKey<{
  /** 组件的 BEM 类名 */
  cls: BEM<'expression-editor'>
  /** 组件的 props */
  editorProps: ExpressionEditorProps
  /** 编辑器实例 */
  editor: LexicalEditor
  /** 更新变量节点 */
  updateVariableNode: (
    oldValue: string,
    newValue: string,
    newLabel?: string
  ) => void
  /** 变量映射表 (value -> VariableItem) */
  variableMap: ComputedRef<Map<string, VariableItem>>
}> = Symbol('ExpressionEditorDIKey')
