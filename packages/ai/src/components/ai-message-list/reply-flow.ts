/**
 * 把 renderTo: 'reply' 的调用插回正文。
 * markstream 的 MarkdownRender 只接收一整段 content，自定义组件按节点类型或自定义标签替换，
 * 没有按字符偏移挂 Vue 节点的接口。这里只算出切点，由同一个气泡的插槽渲染「前文 + 卡片 + 后文」。
 */

export interface ReplyAnchor {
  id: string
  /** 缺省视为正文末尾 */
  offset?: number
}

export type ReplyPiece =
  | { kind: 'text'; start: number; end: number }
  | { kind: 'reply'; id: string; at: number }

export type ShownReplyPart =
  | { kind: 'text'; key: string; text: string; final: boolean }
  | { kind: 'reply'; key: string; id: string }

interface Range {
  start: number
  end: number
}

function isLineStart(content: string, index: number) {
  return index === 0 || content[index - 1] === '\n'
}

/** 行首围栏（``` / ~~~）。不成立时返回 null */
function openFence(
  content: string,
  index: number
): { marker: string; len: number; contentStart: number } | null {
  let j = index
  let spaces = 0
  while (spaces < 4 && content[j] === ' ') {
    j += 1
    spaces += 1
  }
  const marker = content[j]
  if (marker !== '`' && marker !== '~') return null
  let len = 0
  while (content[j + len] === marker) len += 1
  if (len < 3) return null
  let k = j + len
  while (k < content.length && content[k] !== '\n') {
    if (marker === '`' && content[k] === '`') return null
    k += 1
  }
  return { marker, len, contentStart: content[k] === '\n' ? k + 1 : k }
}

/** 闭合围栏行结束位置（含换行）；没有闭合行时返回 null */
function closeFence(content: string, from: number, marker: string, len: number): number | null {
  let i = from
  while (i < content.length) {
    if (isLineStart(content, i)) {
      let j = i
      let spaces = 0
      while (spaces < 4 && content[j] === ' ') {
        j += 1
        spaces += 1
      }
      let n = 0
      while (content[j + n] === marker) n += 1
      if (n >= len) {
        let k = j + n
        while (content[k] === ' ' || content[k] === '\t') k += 1
        if (k === content.length || content[k] === '\n') return content[k] === '\n' ? k + 1 : k
      }
    }
    const nl = content.indexOf('\n', i)
    if (nl < 0) return null
    i = nl + 1
  }
  return null
}

/** 成对反引号行内代码。没有闭合符时不当成代码，避免把后面的正文整段保护起来 */
function inlineCode(content: string, index: number): Range | null {
  if (content[index] !== '`') return null
  let n = 0
  while (content[index + n] === '`') n += 1
  let j = index + n
  while (j < content.length) {
    if (content[j] === '`') {
      let m = 0
      while (content[j + m] === '`') m += 1
      if (m === n) return { start: index, end: j + m }
      j += m
      continue
    }
    j += 1
  }
  return null
}

/** 围栏代码块（未闭合则直到文末）与成对行内代码，切点不能落在这些区间内部 */
export function codeRanges(content: string): Range[] {
  const ranges: Range[] = []
  let i = 0
  while (i < content.length) {
    if (isLineStart(content, i)) {
      const fence = openFence(content, i)
      if (fence) {
        const end =
          closeFence(content, fence.contentStart, fence.marker, fence.len) ?? content.length
        ranges.push({ start: i, end })
        i = end
        continue
      }
    }
    const inline = inlineCode(content, i)
    if (inline) {
      ranges.push(inline)
      i = inline.end
      continue
    }
    i += 1
  }
  return ranges
}

/** 落在代码区间内时，离块首更近则挪到块前，否则挪到块后（距离相同取块后） */
export function snapOffset(content: string, offset: number, ranges: Range[]): number {
  const at = Math.max(0, Math.min(offset, content.length))
  for (const range of ranges) {
    if (at > range.start && at < range.end) {
      return at - range.start < range.end - at ? range.start : range.end
    }
  }
  return at
}

/** 按切点把正文和 reply 锚点排成一段序列。锚点 offset 缺省时排在正文末尾 */
export function replyPieces(content: string, anchors: ReplyAnchor[]): ReplyPiece[] {
  const ranges = codeRanges(content)
  const placed = anchors.map((anchor, index) => ({
    id: anchor.id,
    index,
    at: snapOffset(content, anchor.offset ?? content.length, ranges)
  }))
  placed.sort((a, b) => a.at - b.at || a.index - b.index)

  const pieces: ReplyPiece[] = []
  let cursor = 0
  for (const item of placed) {
    if (item.at > cursor) {
      pieces.push({ kind: 'text', start: cursor, end: item.at })
      cursor = item.at
    }
    pieces.push({ kind: 'reply', id: item.id, at: item.at })
  }
  if (cursor < content.length) pieces.push({ kind: 'text', start: cursor, end: content.length })
  return pieces
}

/**
 * 用节流后的可见正文切出要渲染的片段。
 * 流式且可见长度还没到某个切点时，先不画出该切点之后的卡片。
 * 只有贴着可见末尾、后面还有未显示字符的文字片段不是 final。
 */
export function shownReplyParts(
  shown: string,
  pieces: ReplyPiece[],
  streaming: boolean
): ShownReplyPart[] {
  let tailStart = -1
  for (const piece of pieces) {
    if (piece.kind === 'text') tailStart = piece.start
  }
  const out: ShownReplyPart[] = []
  for (const piece of pieces) {
    if (piece.kind === 'reply') {
      if (streaming && shown.length < piece.at) break
      out.push({ kind: 'reply', key: piece.id, id: piece.id })
      continue
    }
    if (streaming && shown.length <= piece.start) break
    const end = Math.min(piece.end, shown.length)
    if (end <= piece.start) continue
    // 这段还没显示完，或它是全文最后一段且仍贴着可见末尾：保持流式
    const live =
      streaming && end === shown.length && (shown.length < piece.end || piece.start === tailStart)
    out.push({
      kind: 'text',
      key: `t${piece.start}`,
      text: shown.slice(piece.start, end),
      final: !live
    })
    if (shown.length < piece.end) break
  }
  return out
}
