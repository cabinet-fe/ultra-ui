import { LanguageSupport, StreamLanguage } from '@codemirror/language'
import { powerShell } from '@codemirror/legacy-modes/mode/powershell'

/** PowerShell 语言支持（基于 CodeMirror legacy powershell mode） */
export function powershell(): LanguageSupport {
  return new LanguageSupport(StreamLanguage.define(powerShell))
}
