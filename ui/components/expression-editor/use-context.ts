import {
  $getPreviousSelection,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_EDITOR,
  COMMAND_PRIORITY_LOW,
  KEY_ARROW_LEFT_COMMAND,
  KEY_ARROW_RIGHT_COMMAND,
  KEY_DOWN_COMMAND,
  SELECTION_CHANGE_COMMAND,
  type LexicalEditor
} from 'lexical'
import { mergeRegister } from '@lexical/utils'
import { nextTick, onBeforeUnmount } from 'vue'

export function useContext(editor: LexicalEditor) {
  const removeListener = mergeRegister(
    editor.registerCommand(
      KEY_DOWN_COMMAND,
      e => {
        if (e.key === '@') {
          const selection = $getSelection()

          if ($isRangeSelection(selection)) {
            const anchorNodeKey = selection.anchor.key
            const domElement = editor.getElementByKey(anchorNodeKey)
          }

          return true
        } else {
        }
        return false
      },
      COMMAND_PRIORITY_EDITOR
    ),

    // editor.registerCommand(
    //   KEY_ARROW_LEFT_COMMAND,
    //   () => {
    //     const selection = $getSelection()
    //     if ($isRangeSelection(selection)) {
    //       const { anchor } = selection
    //       const offset = anchor.offset

    //       const node = anchor.getNode()
    //       if (node.getType() === 'text') {
    //         const char = node.getTextContent()[offset]
    //         console.log(char)
    //       }
    //     }
    //     return true
    //   },
    //   COMMAND_PRIORITY_LOW
    // ),
    // editor.registerCommand(
    //   KEY_ARROW_RIGHT_COMMAND,
    //   () => {
    //     const selection = $getSelection()
    //     if ($isRangeSelection(selection)) {
    //       const { focus } = selection
    //       const offset = focus.offset
    //       console.log(offset)

    //       const node = focus.getNode()
    //       if (node.getType() === 'text') {
    //         const char = node.getTextContent()[offset]
    //       }
    //     }
    //     return true
    //   },
    //   COMMAND_PRIORITY_LOW
    // ),
    editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        const previousSelection = $getPreviousSelection()
        const selection = $getSelection()
        if ($isRangeSelection(previousSelection)) {
          const { focus } = previousSelection
          const offset = focus.offset
          console.log(offset)
        }
        if ($isRangeSelection(selection)) {
          const { focus } = selection
          const offset = focus.offset
          console.log(offset)
        }

        return true
      },
      COMMAND_PRIORITY_EDITOR
    )
  )

  onBeforeUnmount(() => {
    removeListener()
  })
}
