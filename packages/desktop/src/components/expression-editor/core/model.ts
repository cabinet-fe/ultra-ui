import type { VariableItem } from '../../../types'

/** 单个文档段：纯文本或变量 chip */
export type Segment =
  | { kind: 'text'; value: string }
  | { kind: 'var'; value: string; label: string; type?: string }

/** 归一化的文档形态：相邻 text 段会合并、空 text 段不保留 */
export type Doc = Segment[]

const VARIABLE_PATTERN = /\{([^}]+)\}/g

/**
 * 反序列化：将 modelValue 字符串解析为 Segment[]。
 * 沿用旧 parser.ts 的正则切分逻辑，保证 round-trip 与历史一致。
 */
export function parse(content: string, variableMap?: Map<string, VariableItem>): Doc {
  const segments: Segment[] = []
  if (!content) return segments

  let cursor = 0
  for (const match of content.matchAll(VARIABLE_PATTERN)) {
    const value = match[1]!
    const start = match.index!
    if (start > cursor) {
      segments.push({ kind: 'text', value: content.slice(cursor, start) })
    }
    const found = variableMap?.get(value)
    segments.push({
      kind: 'var',
      value,
      label: found?.label ?? value,
      ...(found?.type ? { type: found.type } : {})
    })
    cursor = start + match[0].length
  }
  if (cursor < content.length) {
    segments.push({ kind: 'text', value: content.slice(cursor) })
  }

  return normalize(segments)
}

/** 序列化：var 段输出 `{value}`，text 段直接拼接。 */
export function serialize(doc: Doc): string {
  let out = ''
  for (const seg of doc) {
    out += seg.kind === 'text' ? seg.value : `{${seg.value}}`
  }
  return out
}

/**
 * 归一化：合并相邻 text 段、丢弃空 text 段。
 * 注意：DOM 层另需保证 var 两侧有 text 占位（即便空），由 editor 渲染时补齐。
 */
export function normalize(doc: Doc): Doc {
  const out: Segment[] = []
  for (const seg of doc) {
    if (seg.kind === 'text') {
      if (!seg.value) continue
      const last = out[out.length - 1]
      if (last && last.kind === 'text') {
        out[out.length - 1] = { kind: 'text', value: last.value + seg.value }
        continue
      }
    }
    out.push(seg)
  }
  return out
}

interface SplitResult {
  before: Doc
  after: Doc
}

/**
 * 在序列化后的字符串偏移上切分（不会切开 var）。
 * 若偏移落在 var 中间，向前对齐到 var 起点。
 */
export function splitAt(doc: Doc, globalOffset: number): SplitResult {
  const before: Doc = []
  const after: Doc = []
  let pos = 0
  let consumed = false

  for (const seg of doc) {
    const segLen = seg.kind === 'text' ? seg.value.length : seg.value.length + 2
    if (consumed) {
      after.push(seg)
      continue
    }
    if (globalOffset >= pos + segLen) {
      before.push(seg)
      pos += segLen
      continue
    }
    if (seg.kind === 'text') {
      const offset = globalOffset - pos
      if (offset > 0) before.push({ kind: 'text', value: seg.value.slice(0, offset) })
      if (offset < seg.value.length) after.push({ kind: 'text', value: seg.value.slice(offset) })
    } else {
      after.push(seg)
    }
    consumed = true
  }
  return { before, after }
}
