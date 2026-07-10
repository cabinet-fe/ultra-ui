import { LanguageSupport } from '@codemirror/language'

import { spelCompletion } from './completion'
import { spelLanguage } from './language'

/** SpEL（Spring Expression Language）语言支持：语法高亮 + 基础补全 */
export function spel(): LanguageSupport {
  return new LanguageSupport(spelLanguage, [spelLanguage.data.of({ autocomplete: spelCompletion })])
}

export { spelLanguage } from './language'
export { spelCompletion } from './completion'
