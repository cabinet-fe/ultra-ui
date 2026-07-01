import type { Extension } from '@codemirror/state'

import type { CodeEditorLang } from '../../types'

/** 语言包动态加载器，新增语言只需在此注册一条 */
const LANG_LOADERS: Record<CodeEditorLang, () => Promise<Extension>> = {
  js: () => import('@codemirror/lang-javascript').then((m) => m.javascript({ typescript: true })),
  sql: () => import('@codemirror/lang-sql').then((m) => m.sql()),
  java: () => import('@codemirror/lang-java').then((m) => m.java()),
  json: () => import('@codemirror/lang-json').then((m) => m.json())
}

/** 按需加载语言扩展；模块缓存由运行时保证，重复切换同一语言不会重复下载 */
export function loadLanguage(lang: CodeEditorLang): Promise<Extension> {
  return LANG_LOADERS[lang]()
}
