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
import { shallowRef, type ShallowRef } from 'vue'
import { CONTEXT_TRIGGER_CHAR } from './constants'

export function useContext(editor: LexicalEditor): {
  contextVisible: ShallowRef<boolean>
  contextTriggerDom: ShallowRef<HTMLElement | undefined>
  textNode: ShallowRef<TextNode | undefined>
  charPosition: ShallowRef<number>
  registerPickerKeyHandler: (
    handler: ((e: KeyboardEvent) => void) | null
  ) => void
  /** Returns cleanup for context-key commands. Injected into registerCommandPacks. */
  registerContextCommands: () => () => void
} {
  const contextVisible = shallowRef(false)
  const contextTriggerDom = shallowRef<HTMLElement>()
  const textNode = shallowRef<TextNode>()
  const charPosition = shallowRef(0)
  const pickerKeyHandlerRef = shallowRef<
    ((e: KeyboardEvent) => void) | null
  >(null)

  function registerPickerKeyHandler(
    handler: ((e: KeyboardEvent) => void) | null
  ) {
    pickerKeyHandlerRef.value = handler
  }

  function openContextMenu(triggerElement: HTMLElement) {
    contextVisible.value = true

    contextTriggerDom.value = triggerElement
  }

  function closeContextMenu() {
    contextVisible.value = false
    contextTriggerDom.value = undefined
  }

  function PreventDefaultListener(event: KeyboardEvent) {
    if (event.isComposing) return false
    if (contextVisible.value) {
      event.preventDefault()
      pickerKeyHandlerRef.value?.(event)
      return true
    }
    return false
  }

  function registerContextCommands(): () => void {
    return mergeRegister(
      // 选取变更命令，实现呼出上下文菜单的核心
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
      () => {
        const selection = $getSelection()

        // 如果菜单已经打开，不要因为失焦而关闭（用户可能在输入搜索框）
        if (contextVisible.value) {
          return true
        }

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

        // 检测光标是否在 '@' 左右
        const isAtTriggerLeft =
          textContent[cursorPosition - 1] === CONTEXT_TRIGGER_CHAR
        const isAtTriggerRight =
          textContent[cursorPosition] === CONTEXT_TRIGGER_CHAR

        // 光标左右的字符都不是'@'时，关闭上下文菜单
        if (!isAtTriggerLeft && !isAtTriggerRight) {
          closeContextMenu()
          return false
        }

        // 更新文本节点和光标位置
        // charPosition: index of first char after '@' (for slice in handleVariableSelect)
        // isAtTriggerLeft: '@' is left of cursor (cursor already after '@') → charPosition = cursorPosition
        // isAtTriggerRight: '@' is right of cursor (cursor before '@') → charPosition = cursorPosition + 1
        textNode.value = node as TextNode
        charPosition.value = isAtTriggerLeft ? cursorPosition : cursorPosition + 1

        const triggerDom = editor.getElementByKey(node.getKey())

        // 如果弹框已经打开，更新位置；否则打开弹框
        if (contextVisible.value) {
          // 更新触发元素位置（如果变化了）
          if (triggerDom && triggerDom !== contextTriggerDom.value) {
            contextTriggerDom.value = triggerDom
          }
        } else {
          triggerDom && openContextMenu(triggerDom)
        }

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
  }

  return {
    contextVisible,
    contextTriggerDom,
    textNode,
    charPosition,
    registerPickerKeyHandler,
    registerContextCommands
  }
}
