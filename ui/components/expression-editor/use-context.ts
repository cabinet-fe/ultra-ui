import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  COMMAND_PRIORITY_EDITOR,
  KEY_ARROW_DOWN_COMMAND,
  KEY_ARROW_UP_COMMAND,
  type LexicalEditor,
  SELECTION_CHANGE_COMMAND,
  KEY_ENTER_COMMAND,
  KEY_ESCAPE_COMMAND,
  TextNode
} from 'lexical'
import { mergeRegister } from '@lexical/utils'
import { onBeforeUnmount, shallowRef, type ShallowRef } from 'vue'
import { CONTEXT_TRIGGER_CHAR } from './constants'

export function useContext(editor: LexicalEditor): {
  contextVisible: ShallowRef<boolean>
  contextTriggerDom: ShallowRef<HTMLElement | undefined>
  textNode: ShallowRef<TextNode | undefined>
  charPosition: ShallowRef<number>
} {
  const contextVisible = shallowRef(false)
  const contextTriggerDom = shallowRef<HTMLElement>()
  const textNode = shallowRef<TextNode>()
  const charPosition = shallowRef(0)

  function openContextMenu(triggerElement: HTMLElement) {
    contextVisible.value = true
    contextTriggerDom.value = triggerElement
  }

  function closeContextMenu() {
    contextVisible.value = false
    contextTriggerDom.value = undefined
  }

  function PreventDefaultListener(event: KeyboardEvent) {
    if (contextVisible.value) {
      event.preventDefault()
      return true
    }
    return false
  }

  const removeListener = mergeRegister(
    // 选取变更命令，实现呼出上下文菜单的核心
    editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        const selection = $getSelection()

        // 选区类型必须为rangeSelection且选取的anchor和focus的offset值必须一致
        // 否则关闭上下文菜单
        if (
          !$isRangeSelection(selection) ||
          selection.anchor.offset !== selection.focus.offset
        ) {
          closeContextMenu()

          return false
        }

        const cursorPosition = selection.focus.offset
        const node = selection.focus.getNode()
        const textContent = node.getTextContent()

        // 光标左右的字符都不是'@'时，关闭上下文菜单
        if (
          textContent[cursorPosition - 1] !== CONTEXT_TRIGGER_CHAR &&
          textContent[cursorPosition] !== CONTEXT_TRIGGER_CHAR
        ) {
          closeContextMenu()
          return false
        }

        // 如果弹框已经打开
        if (contextVisible.value) {
          return false
        }

        textNode.value = node as TextNode
        charPosition.value = cursorPosition

        const triggerDom = editor.getElementByKey(node.getKey())

        triggerDom && openContextMenu(triggerDom)
        return true
      },
      COMMAND_PRIORITY_EDITOR
    ),

    // 当上下文菜单显示时，阻止下面的命令的默认行为
    editor.registerCommand(
      KEY_ENTER_COMMAND,
      PreventDefaultListener,
      COMMAND_PRIORITY_LOW
    ),
    editor.registerCommand(
      KEY_ESCAPE_COMMAND,
      PreventDefaultListener,
      COMMAND_PRIORITY_LOW
    ),
    editor.registerCommand(
      KEY_ARROW_UP_COMMAND,
      PreventDefaultListener,
      COMMAND_PRIORITY_LOW
    ),
    editor.registerCommand(
      KEY_ARROW_DOWN_COMMAND,
      PreventDefaultListener,
      COMMAND_PRIORITY_LOW
    )
  )

  onBeforeUnmount(() => {
    removeListener()
  })

  return {
    contextVisible,
    contextTriggerDom,
    textNode,
    charPosition
  }
}
