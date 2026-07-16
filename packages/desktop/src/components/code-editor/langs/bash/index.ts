import { LanguageSupport, StreamLanguage } from '@codemirror/language'
import { shell } from '@codemirror/legacy-modes/mode/shell'

/** Bash / shell 脚本语言支持（基于 CodeMirror legacy shell mode） */
export function bash(): LanguageSupport {
  return new LanguageSupport(StreamLanguage.define(shell))
}
