import { describe, expect, it } from 'vitest'

import { createMention } from '../core/mention'
import { parse, type Doc } from '../core/model'

function docFromText(text: string): Doc {
  return parse(text)
}

describe('mention state machine', () => {
  it('idle: empty doc and caret=null → no mention', () => {
    const m = createMention()
    expect(m.update([], null)).toBeNull()
    expect(m.getState()).toBeNull()
  })

  it('typing @ activates mention with empty filter', () => {
    const m = createMention()
    const doc = docFromText('hello@')
    const s = m.update(doc, 6)
    expect(s).toEqual({ anchorOffset: 5, filter: '' })
  })

  it('typing characters after @ extends filter', () => {
    const m = createMention()
    const doc = docFromText('hello@form')
    const s = m.update(doc, 10)
    expect(s).toEqual({ anchorOffset: 5, filter: 'form' })
  })

  it('typing whitespace exits mention (no activation)', () => {
    const m = createMention()
    const doc = docFromText('hello@form ')
    const s = m.update(doc, 11)
    expect(s).toBeNull()
  })

  it('moving caret to before @ returns null', () => {
    const m = createMention()
    const doc = docFromText('hello@form')
    expect(m.update(doc, 4)).toBeNull()
  })

  it('typing a second @ resets anchor to the new @', () => {
    const m = createMention()
    let doc = docFromText('hello@form')
    expect(m.update(doc, 10)).toEqual({ anchorOffset: 5, filter: 'form' })
    doc = docFromText('hello@form@user')
    const s = m.update(doc, 15)
    expect(s).toEqual({ anchorOffset: 10, filter: 'user' })
  })

  it('Backspace shrinking filter still keeps mention active', () => {
    const m = createMention()
    let doc = docFromText('hello@form')
    expect(m.update(doc, 10)).toEqual({ anchorOffset: 5, filter: 'form' })
    doc = docFromText('hello@for')
    expect(m.update(doc, 9)).toEqual({ anchorOffset: 5, filter: 'for' })
  })

  it('Backspace through the @ exits mention', () => {
    const m = createMention()
    let doc = docFromText('hello@')
    expect(m.update(doc, 6)).toEqual({ anchorOffset: 5, filter: '' })
    doc = docFromText('hello')
    expect(m.update(doc, 5)).toBeNull()
  })

  it('Esc / space / arrow → dismiss(): same anchor cannot reactivate by sync', () => {
    const m = createMention()
    let doc = docFromText('hello@form')
    expect(m.update(doc, 10)).toEqual({ anchorOffset: 5, filter: 'form' })
    m.dismiss()
    expect(m.getState()).toBeNull()

    // 用户继续在同一处键入字符
    doc = docFromText('hello@formx')
    expect(m.update(doc, 11)).toBeNull()
    // 移动光标也不会重新激活
    expect(m.update(doc, 9)).toBeNull()
  })

  it('after dismiss(), inserting a new @ creates a new mention with new anchor', () => {
    const m = createMention()
    let doc = docFromText('hello@form')
    m.update(doc, 10)
    m.dismiss()
    doc = docFromText('hello@form @x')
    const s = m.update(doc, 13)
    expect(s).toEqual({ anchorOffset: 11, filter: 'x' })
  })

  it('mention does not span across a chip boundary', () => {
    const m = createMention()
    // 文本 "@a" + chip "{x}" + 文本 "@b" → 新 anchor 应是第二个 @
    const doc: Doc = [
      { kind: 'text', value: '@a' },
      { kind: 'var', value: 'x', label: 'x' },
      { kind: 'text', value: '@b' }
    ]
    // 序列化后："@a{x}@b"，caret 在 '@b' 后即 offset=2+3+2=7
    const s = m.update(doc, 7)
    expect(s).toEqual({ anchorOffset: 5, filter: 'b' })
  })

  it('caret at very end (text segment) activates mention', () => {
    const m = createMention()
    const doc = docFromText('@')
    expect(m.update(doc, 1)).toEqual({ anchorOffset: 0, filter: '' })
  })

  it('commit() clears dismissedAnchor so next sync can produce fresh state', () => {
    const m = createMention()
    let doc = docFromText('hello@form')
    m.update(doc, 10)
    m.commit()

    doc = docFromText('hello@form@')
    const s = m.update(doc, 11)
    expect(s).toEqual({ anchorOffset: 10, filter: '' })
  })
})
