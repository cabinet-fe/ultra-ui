import { $getHtmlContent, $insertDataTransferForPlainText } from '@lexical/clipboard'
import {
  CAN_USE_BEFORE_INPUT,
  IS_APPLE_WEBKIT,
  IS_IOS,
  IS_SAFARI,
  mergeRegister,
  objectKlassEquals
} from '@lexical/utils'
import type { CommandPayloadType, LexicalEditor } from 'lexical'
import {
  $getSelection,
  $isRangeSelection,
  $selectAll,
  COMMAND_PRIORITY_EDITOR,
  CONTROLLED_TEXT_INSERTION_COMMAND,
  COPY_COMMAND,
  CUT_COMMAND,
  DELETE_CHARACTER_COMMAND,
  DELETE_LINE_COMMAND,
  DELETE_WORD_COMMAND,
  DRAGSTART_COMMAND,
  DRAGOVER_COMMAND,
  DROP_COMMAND,
  INSERT_LINE_BREAK_COMMAND,
  INSERT_PARAGRAPH_COMMAND,
  KEY_ARROW_LEFT_COMMAND,
  KEY_ARROW_RIGHT_COMMAND,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
  KEY_ENTER_COMMAND,
  PASTE_COMMAND,
  PASTE_TAG,
  REMOVE_TEXT_COMMAND,
  SELECT_ALL_COMMAND
} from 'lexical'

import { EXPRESSION_VARIABLE_DRAG_TYPE } from '../../../constants'
import {
  autoScrollWhenNearEdge,
  beginDragVisualState,
  clearDropIndicator,
  clearDragVisualState,
  ensureDropScopeId,
  getActiveInternalDragPayload,
  readDragSourceKey,
  readInternalDragPayload,
  resolveDropSlot,
  showDropIndicator,
  writeInternalDragPayload
} from '../../../use-expression-drag-drop'
import { reorderVariable } from '../drag-drop/drag-drop-service'

function onCopyForPlainText(
  event: CommandPayloadType<typeof COPY_COMMAND>,
  editor: LexicalEditor
): void {
  editor.update(() => {
    if (event !== null) {
      const clipboardData = objectKlassEquals(event, KeyboardEvent) ? null : event.clipboardData
      const selection = $getSelection()

      if (selection !== null && clipboardData != null) {
        event.preventDefault()
        const htmlString = $getHtmlContent(editor)

        if (htmlString !== null) {
          clipboardData.setData('text/html', htmlString)
        }

        clipboardData.setData('text/plain', selection.getTextContent())
      }
    }
  })
}

function onPasteForPlainText(
  event: CommandPayloadType<typeof PASTE_COMMAND>,
  editor: LexicalEditor
): void {
  event.preventDefault()
  editor.update(
    () => {
      const selection = $getSelection()
      const clipboardData = objectKlassEquals(event, ClipboardEvent) ? event.clipboardData : null
      if (clipboardData != null && $isRangeSelection(selection)) {
        $insertDataTransferForPlainText(clipboardData, selection)
      }
    },
    { tag: PASTE_TAG }
  )
}

function onCutForPlainText(
  event: CommandPayloadType<typeof CUT_COMMAND>,
  editor: LexicalEditor
): void {
  onCopyForPlainText(event, editor)
  editor.update(() => {
    const selection = $getSelection()

    if ($isRangeSelection(selection)) {
      selection.removeText()
    }
  })
}

function registerTextEditingCommands(editor: LexicalEditor): () => void {
  return mergeRegister(
    editor.registerCommand<boolean>(
      DELETE_CHARACTER_COMMAND,
      (isBackward) => {
        const selection = $getSelection()

        if (!$isRangeSelection(selection)) {
          return false
        }

        selection.deleteCharacter(isBackward)
        return true
      },
      COMMAND_PRIORITY_EDITOR
    ),
    editor.registerCommand<boolean>(
      DELETE_WORD_COMMAND,
      (isBackward) => {
        const selection = $getSelection()

        if (!$isRangeSelection(selection)) {
          return false
        }

        selection.deleteWord(isBackward)
        return true
      },
      COMMAND_PRIORITY_EDITOR
    ),
    editor.registerCommand<boolean>(
      DELETE_LINE_COMMAND,
      (isBackward) => {
        const selection = $getSelection()

        if (!$isRangeSelection(selection)) {
          return false
        }

        selection.deleteLine(isBackward)
        return true
      },
      COMMAND_PRIORITY_EDITOR
    ),

    editor.registerCommand<InputEvent | string>(
      CONTROLLED_TEXT_INSERTION_COMMAND,
      (eventOrText) => {
        const selection = $getSelection()

        if (!$isRangeSelection(selection)) {
          return false
        }

        if (typeof eventOrText === 'string') {
          selection.insertText(eventOrText)
        } else {
          const dataTransfer = eventOrText.dataTransfer

          if (dataTransfer != null) {
            $insertDataTransferForPlainText(dataTransfer, selection)
          } else {
            const data = eventOrText.data

            if (data) {
              selection.insertText(data)
            }
          }
        }

        return true
      },
      COMMAND_PRIORITY_EDITOR
    ),
    editor.registerCommand(
      REMOVE_TEXT_COMMAND,
      () => {
        const selection = $getSelection()

        if (!$isRangeSelection(selection)) {
          return false
        }

        selection.removeText()
        return true
      },
      COMMAND_PRIORITY_EDITOR
    ),
    editor.registerCommand<boolean>(
      INSERT_LINE_BREAK_COMMAND,
      (selectStart) => {
        const selection = $getSelection()

        if (!$isRangeSelection(selection)) {
          return false
        }

        selection.insertLineBreak(selectStart)
        return true
      },
      COMMAND_PRIORITY_EDITOR
    ),
    editor.registerCommand(
      INSERT_PARAGRAPH_COMMAND,
      () => {
        const selection = $getSelection()

        if (!$isRangeSelection(selection)) {
          return false
        }

        selection.insertLineBreak()
        return true
      },
      COMMAND_PRIORITY_EDITOR
    ),
    editor.registerCommand<KeyboardEvent>(
      KEY_ARROW_LEFT_COMMAND,
      () => {
        const selection = $getSelection()

        if (!$isRangeSelection(selection)) {
          return false
        }

        return false
      },
      COMMAND_PRIORITY_EDITOR
    ),
    editor.registerCommand<KeyboardEvent>(
      KEY_ARROW_RIGHT_COMMAND,
      () => {
        const selection = $getSelection()

        if (!$isRangeSelection(selection)) {
          return false
        }

        return false
      },
      COMMAND_PRIORITY_EDITOR
    ),
    editor.registerCommand<KeyboardEvent>(
      KEY_BACKSPACE_COMMAND,
      (event) => {
        const selection = $getSelection()

        if (!$isRangeSelection(selection)) {
          return false
        }

        if (IS_IOS && navigator.language === 'ko-KR') {
          return false
        }

        event.preventDefault()
        return editor.dispatchCommand(DELETE_CHARACTER_COMMAND, true)
      },
      COMMAND_PRIORITY_EDITOR
    ),
    editor.registerCommand<KeyboardEvent>(
      KEY_DELETE_COMMAND,
      (event) => {
        const selection = $getSelection()

        if (!$isRangeSelection(selection)) {
          return false
        }

        event.preventDefault()
        return editor.dispatchCommand(DELETE_CHARACTER_COMMAND, false)
      },
      COMMAND_PRIORITY_EDITOR
    ),
    editor.registerCommand<KeyboardEvent | null>(
      KEY_ENTER_COMMAND,
      (event) => {
        const selection = $getSelection()

        if (!$isRangeSelection(selection)) {
          return false
        }

        if (event !== null) {
          if ((IS_IOS || IS_SAFARI || IS_APPLE_WEBKIT) && CAN_USE_BEFORE_INPUT) {
            return false
          }

          event.preventDefault()
        }

        return editor.dispatchCommand(INSERT_LINE_BREAK_COMMAND, false)
      },
      COMMAND_PRIORITY_EDITOR
    ),
    editor.registerCommand(
      SELECT_ALL_COMMAND,
      () => {
        $selectAll()

        return true
      },
      COMMAND_PRIORITY_EDITOR
    )
  )
}

function registerClipboardCommands(editor: LexicalEditor): () => void {
  return mergeRegister(
    editor.registerCommand(
      COPY_COMMAND,
      (event) => {
        const selection = $getSelection()

        if (!$isRangeSelection(selection)) {
          return false
        }

        onCopyForPlainText(event, editor)
        return true
      },
      COMMAND_PRIORITY_EDITOR
    ),
    editor.registerCommand(
      CUT_COMMAND,
      (event) => {
        const selection = $getSelection()

        if (!$isRangeSelection(selection)) {
          return false
        }

        onCutForPlainText(event, editor)
        return true
      },
      COMMAND_PRIORITY_EDITOR
    ),
    editor.registerCommand(
      PASTE_COMMAND,
      (event) => {
        const selection = $getSelection()

        if (!$isRangeSelection(selection)) {
          return false
        }

        onPasteForPlainText(event, editor)
        return true
      },
      COMMAND_PRIORITY_EDITOR
    )
  )
}

function registerDragDropCommands(editor: LexicalEditor): () => void {
  return mergeRegister(
    editor.registerCommand<DragEvent>(
      DRAGSTART_COMMAND,
      (event) => {
        if (!editor.isEditable()) {
          return false
        }

        const sourceKey = readDragSourceKey(event.target)
        if (!sourceKey) {
          return false
        }

        const rootElement = editor.getRootElement()
        if (!rootElement || !(event.target instanceof Node)) {
          return false
        }
        if (!rootElement.contains(event.target)) {
          return false
        }

        const scopeId = ensureDropScopeId(editor)
        if (!scopeId || !event.dataTransfer) {
          return false
        }

        event.dataTransfer.effectAllowed = 'move'
        writeInternalDragPayload(event.dataTransfer, {
          action: 'move-variable',
          sourceKey,
          scopeId
        })
        event.dataTransfer.setData('text/plain', '{move-variable}')

        const sourceElement = rootElement.querySelector<HTMLElement>(
          `[data-ultra-expression-variable-key="${sourceKey}"]`
        )
        beginDragVisualState(editor, sourceElement, { action: 'move-variable', sourceKey, scopeId })

        return true
      },
      COMMAND_PRIORITY_EDITOR
    ),
    editor.registerCommand<DragEvent>(
      DRAGOVER_COMMAND,
      (event) => {
        const rootElement = editor.getRootElement()
        if (!rootElement || !(event.target instanceof Node)) {
          return false
        }
        if (!rootElement.contains(event.target)) {
          return false
        }

        const payload =
          readInternalDragPayload(event.dataTransfer) ?? getActiveInternalDragPayload(editor)
        if (!payload) {
          clearDropIndicator(editor)
          return false
        }

        const scopeId = ensureDropScopeId(editor)
        if (payload.scopeId !== scopeId) {
          clearDropIndicator(editor)
          return false
        }

        const dropSlot = resolveDropSlot(editor, event)
        if (dropSlot === null) {
          clearDropIndicator(editor)
          return false
        }

        event.preventDefault()
        if (event.dataTransfer) {
          event.dataTransfer.dropEffect = 'move'
        }

        showDropIndicator(editor, dropSlot)
        autoScrollWhenNearEdge(rootElement, event.clientY)
        return true
      },
      COMMAND_PRIORITY_EDITOR
    ),
    editor.registerCommand<DragEvent>(
      DROP_COMMAND,
      (event) => {
        const payload =
          readInternalDragPayload(event.dataTransfer) ?? getActiveInternalDragPayload(editor)
        if (!payload) {
          return false
        }

        event.preventDefault()

        const rootElement = editor.getRootElement()
        const scopeId = ensureDropScopeId(editor)
        if (!rootElement || !scopeId || !(event.target instanceof Node)) {
          clearDragVisualState(editor)
          return true
        }
        if (!rootElement.contains(event.target)) {
          clearDragVisualState(editor)
          return true
        }

        const dropSlot = resolveDropSlot(editor, event)
        if (dropSlot === null) {
          clearDragVisualState(editor)
          return true
        }

        const payloadText =
          event.dataTransfer?.getData(EXPRESSION_VARIABLE_DRAG_TYPE) ?? JSON.stringify(payload)

        reorderVariable(editor, {
          payloadText,
          scopeId,
          targetSlot: dropSlot,
          focusMovedNode: true
        })

        clearDragVisualState(editor)
        return true
      },
      COMMAND_PRIORITY_EDITOR
    )
  )
}

export interface RegisterCommandPacksOptions {
  /** Optional context-key commands registration (e.g. from use-context). Merged when provided. */
  getContextCommands?: () => () => void
}

/**
 * Registers all capability command packs for the expression editor.
 * Packs: text-editing, clipboard, drag-drop, and optionally context-keys.
 */
export function registerCommandPacks(
  editor: LexicalEditor,
  options?: RegisterCommandPacksOptions
): () => void {
  const packs: Array<() => void> = [
    registerTextEditingCommands(editor),
    registerClipboardCommands(editor),
    registerDragDropCommands(editor)
  ]

  if (options?.getContextCommands) {
    packs.push(options.getContextCommands())
  }

  return mergeRegister(...packs)
}
