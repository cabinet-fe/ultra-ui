import {
  closeBrackets,
  autocompletion,
  closeBracketsKeymap,
  completionKeymap
} from '@codemirror/autocomplete'
import { history, defaultKeymap, historyKeymap, indentWithTab } from '@codemirror/commands'
import {
  foldGutter,
  indentOnInput,
  syntaxHighlighting,
  defaultHighlightStyle,
  bracketMatching,
  foldKeymap
} from '@codemirror/language'
import { lintKeymap } from '@codemirror/lint'
import { highlightSelectionMatches, searchKeymap } from '@codemirror/search'
import { EditorState, type Extension } from '@codemirror/state'
import {
  lineNumbers,
  highlightActiveLineGutter,
  highlightSpecialChars,
  drawSelection,
  dropCursor,
  rectangularSelection,
  crosshairCursor,
  highlightActiveLine,
  keymap,
  type KeyBinding
} from '@codemirror/view'

/**
 * 等价于 codemirror 包的 basicSetup，按官方建议内联以便统一依赖来源。
 * @see https://codemirror.net/docs/ref/#codemirror.basicSetup
 */
export const basicSetup: Extension = (() => [
  lineNumbers(),
  highlightActiveLineGutter(),
  highlightSpecialChars(),
  history(),
  foldGutter(),
  drawSelection(),
  dropCursor(),
  EditorState.allowMultipleSelections.of(true),
  indentOnInput(),
  syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
  bracketMatching(),
  closeBrackets(),
  autocompletion(),
  rectangularSelection(),
  crosshairCursor(),
  highlightActiveLine(),
  highlightSelectionMatches(),
  keymap.of([
    // Tab 默认留给浏览器焦点导航；代码编辑器需显式绑定缩进，否则焦点会跳到语言选择等控件
    indentWithTab,
    ...closeBracketsKeymap,
    ...defaultKeymap,
    ...searchKeymap,
    ...historyKeymap,
    ...foldKeymap,
    ...completionKeymap,
    ...lintKeymap
  ] as readonly KeyBinding[])
])()
