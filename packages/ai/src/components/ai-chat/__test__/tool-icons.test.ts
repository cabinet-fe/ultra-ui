import { EditPen, Folder, Internet, QuestionFilled, Terminal, Tools } from '@veltra/icons/normal'
import { describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'

import { FALLBACK_TOOL_ICON, resolveToolIcon } from '../tool-icons'

describe('resolveToolIcon', () => {
  it('按名称子串匹配内置规则', () => {
    expect(resolveToolIcon('run_bash')).toBe(Terminal)
    expect(resolveToolIcon('Terminal')).toBe(Terminal)
    expect(resolveToolIcon('fs_read')).toBe(Folder)
    expect(resolveToolIcon('read_file')).toBe(Folder)
    expect(resolveToolIcon('web_search')).toBe(Internet)
    expect(resolveToolIcon('globe-fetch')).toBe(Internet)
    expect(resolveToolIcon('str_replace_editor')).toBe(EditPen)
    expect(resolveToolIcon('pencil')).toBe(EditPen)
    expect(resolveToolIcon('askQuestion')).toBe(QuestionFilled)
    expect(resolveToolIcon('clarifying_question')).toBe(QuestionFilled)
  })

  it('未知名与空名走兜底，不得 throw', () => {
    expect(resolveToolIcon('totally-unknown-tool-xyz')).toBe(Tools)
    expect(resolveToolIcon('totally-unknown-tool-xyz')).toBe(FALLBACK_TOOL_ICON)
    expect(resolveToolIcon('')).toBe(FALLBACK_TOOL_ICON)
    expect(() => resolveToolIcon('totally-unknown-tool-xyz')).not.toThrow()
  })

  it('宿主覆盖表精确名优先于内置规则', () => {
    const Override = defineComponent({ setup: () => () => h('span') })
    expect(resolveToolIcon('run_bash', { run_bash: Override })).toBe(Override)
    expect(resolveToolIcon('run_bash', { other: Override })).toBe(Terminal)
  })
})
