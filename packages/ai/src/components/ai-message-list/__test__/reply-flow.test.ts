import { describe, expect, it } from 'vite-plus/test'

import { replyPieces, shownReplyParts } from '../reply-flow'

const content = ['开头说明', '', '```ts', 'const a = 1', '```', '', '结尾'].join('\n')
const fenceStart = content.indexOf('```')
const fenceEnd = content.indexOf('结尾') - 1
const insideCode = content.indexOf('const a')

describe('replyPieces', () => {
  it('offset 0 排在正文前，缺省 offset 排在正文后，中间 offset 切开正文', () => {
    expect(replyPieces('先说一句再补充', [{ id: 'early', offset: 0 }])).toEqual([
      { kind: 'reply', id: 'early', at: 0 },
      { kind: 'text', start: 0, end: '先说一句再补充'.length }
    ])
    expect(replyPieces('先说一句再补充', [{ id: 'late' }])).toEqual([
      { kind: 'text', start: 0, end: '先说一句再补充'.length },
      { kind: 'reply', id: 'late', at: '先说一句再补充'.length }
    ])
    const mid = '先说一句'.length
    expect(replyPieces('先说一句再补充', [{ id: 'mid', offset: mid }])).toEqual([
      { kind: 'text', start: 0, end: mid },
      { kind: 'reply', id: 'mid', at: mid },
      { kind: 'text', start: mid, end: '先说一句再补充'.length }
    ])
  })

  it('偏移落在围栏代码块内且离块尾更近时，整块留在卡片前面', () => {
    const nearEnd = content.lastIndexOf('1')
    const pieces = replyPieces(content, [{ id: 'q', offset: nearEnd }])
    const reply = pieces.find((piece) => piece.kind === 'reply')
    expect(reply).toMatchObject({ at: fenceEnd })
    expect(content.slice(0, fenceEnd)).toContain('const a = 1')
    expect(content.slice(fenceEnd)).toBe('\n结尾')
    expect(insideCode).toBeGreaterThan(fenceStart)
  })

  it('偏移刚进入围栏时，离块首更近则卡片放在该代码块前面', () => {
    const pieces = replyPieces(content, [{ id: 'q', offset: fenceStart + 1 }])
    expect(pieces.find((piece) => piece.kind === 'reply')).toMatchObject({ at: fenceStart })
  })

  it('偏移落在行内代码内部时不把反引号对切开', () => {
    const text = '用 `npm test` 跑'
    const at = text.indexOf('npm')
    const pieces = replyPieces(text, [{ id: 'q', offset: at }])
    expect(pieces.find((piece) => piece.kind === 'reply')).toMatchObject({
      at: text.indexOf('`npm')
    })
  })
})

describe('shownReplyParts', () => {
  const mid = '先说一句'.length
  const full = '先说一句再补充'
  const pieces = replyPieces(full, [{ id: 'q', offset: mid }])

  it('流式可见长度未到切点时只显示前文，卡片先不出现', () => {
    const shown = shownReplyParts('先说', pieces, true)
    expect(shown).toEqual([{ kind: 'text', key: 't0', text: '先说', final: false }])
  })

  it('可见长度刚好到切点时前文定稿，卡片出现，后文还没有', () => {
    const shown = shownReplyParts('先说一句', pieces, true)
    expect(shown.map((part) => part.kind)).toEqual(['text', 'reply'])
    expect(shown[0]).toMatchObject({ text: '先说一句', final: true })
  })

  it('后文开始出现后，只有后文保持非 final', () => {
    const shown = shownReplyParts(full, pieces, true)
    expect(shown).toEqual([
      { kind: 'text', key: 't0', text: '先说一句', final: true },
      { kind: 'reply', key: 'q', id: 'q' },
      { kind: 'text', key: `t${mid}`, text: '再补充', final: false }
    ])
  })

  it('非流式时前后文都是 final', () => {
    const shown = shownReplyParts(full, pieces, false)
    expect(shown.filter((part) => part.kind === 'text').every((part) => part.final)).toBe(true)
  })
})
