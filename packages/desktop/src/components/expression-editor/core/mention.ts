import type { Doc } from './model'

export interface MentionState {
  /** `@` 字符在序列化字符串中的偏移 */
  anchorOffset: number
  /** `@` 之后到当前光标之间的字符 */
  filter: string
}

export interface MentionAPI {
  /**
   * 根据当前 doc + 光标 offset 推导 mention 状态。
   * 返回最新状态（可能为 null = 未激活）。
   */
  update(doc: Doc, caret: number | null): MentionState | null
  /**
   * 主动退出当前 mention（用户按 Esc / 空格 / ←→ / 失焦）。
   * 退出后即便光标仍在合法范围内，也不会自动重新激活，
   * 直到光标离开当前 anchor 区域（如：@ 被删除或光标跨段）后再次出现新的 `@`。
   */
  dismiss(): void
  /** 选中后由调用方调用，清理状态（含 dismissedAnchor），下一个 `@` 可重新激活。 */
  commit(): void
  /** 当前状态（只读） */
  getState(): MentionState | null
}

export function createMention(): MentionAPI {
  let state: MentionState | null = null
  let dismissedAnchor: number | null = null

  function derive(doc: Doc, caret: number | null): MentionState | null {
    if (caret === null) return null

    // 找到 caret 落在哪个 text segment 以及段内偏移
    let pos = 0
    let textValue: string | null = null
    let textStart = 0
    let inTextOffset = 0
    for (const seg of doc) {
      const len = seg.kind === 'text' ? seg.value.length : seg.value.length + 2
      if (caret <= pos + len) {
        if (seg.kind === 'text') {
          textValue = seg.value
          textStart = pos
          inTextOffset = caret - pos
        }
        break
      }
      pos += len
    }
    // 边界：caret 位于结尾且没有命中段，allow caret == 文档末尾且最后段是 text
    if (textValue === null) {
      const lastSeg = doc[doc.length - 1]
      if (lastSeg && lastSeg.kind === 'text') {
        const lastStart = totalLengthBefore(doc, doc.length - 1)
        if (caret === lastStart + lastSeg.value.length) {
          textValue = lastSeg.value
          textStart = lastStart
          inTextOffset = lastSeg.value.length
        }
      }
    }
    if (textValue === null) return null

    // 从 inTextOffset 向前扫描，遇到空白前的最后一个 @ 即为 anchor
    let i = inTextOffset - 1
    while (i >= 0) {
      const ch = textValue[i]
      if (ch === '@') {
        const filter = textValue.slice(i + 1, inTextOffset)
        if (/\s/.test(filter)) return null
        return { anchorOffset: textStart + i, filter }
      }
      if (ch && /\s/.test(ch)) return null
      i--
    }
    return null
  }

  function totalLengthBefore(doc: Doc, segIndex: number): number {
    let n = 0
    for (let i = 0; i < segIndex; i++) {
      const s = doc[i]!
      n += s.kind === 'text' ? s.value.length : s.value.length + 2
    }
    return n
  }

  return {
    update(doc, caret) {
      const candidate = derive(doc, caret)
      if (!candidate) {
        // 派生不到合法 mention，dismissedAnchor 失去意义
        dismissedAnchor = null
        state = null
        return state
      }
      if (dismissedAnchor !== null && candidate.anchorOffset === dismissedAnchor) {
        // 仍处于上次主动退出的同一个 anchor 范围内，不重新激活
        state = null
        return state
      }
      // 走到这里说明：（1）首次激活；或（2）anchor 与 dismissed 不同（例如又输入了一个 @）
      dismissedAnchor = null
      state = candidate
      return state
    },
    dismiss() {
      if (state) dismissedAnchor = state.anchorOffset
      state = null
    },
    commit() {
      state = null
      dismissedAnchor = null
    },
    getState() {
      return state
    }
  }
}
