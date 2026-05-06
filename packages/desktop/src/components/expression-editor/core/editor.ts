import type { BEM } from '@veltra/utils'

import type { VariableItem } from '../../../types'
import { createChip, isChipElement, readChipType, readChipValue } from './chip'
import { normalize, parse, serialize, type Doc, type Segment } from './model'

const TEXT_SEG_ATTR = 'data-seg'
const TEXT_SEG_VALUE = 'text'

export interface EditorVariableInfo {
  value: string
  label: string
  type?: string
}

export interface EditorOptions {
  container: HTMLElement
  cls: BEM<'expression-editor'>
  initialDoc: Doc
  /**
   * 在 DOM → 模型反推、字符串 → 模型反序列化时为 chip 补齐 label / type。
   * 用 getter 形式以便外层 `variables` props 变化时拿到最新映射。
   */
  getVariableMap?: () => Map<string, VariableItem>
  /** 模型每次更新（包括用户键入文本）后回调 */
  onChange?: (doc: Doc) => void
  /** 选中区域 / 光标偏移变化时回调，offset 为序列化字符串中的位置；无选中或不在编辑器内时为 null */
  onSelectionChange?: (info: { offset: number | null }) => void
  /** 用户点击某个 chip 的主体（重选） */
  onChipReselect?: (info: { chipEl: HTMLElement; segIndex: number; chipOffset: number }) => void
  /** 用户点击某个 chip 的 ×（删除） */
  onChipRemove?: (info: { chipEl: HTMLElement; segIndex: number }) => void
}

export interface EditorAPI {
  /** 当前模型 */
  getDoc(): Doc
  /** 完全替换模型（会重渲染 DOM） */
  setDoc(doc: Doc): void
  /** 序列化为字符串（modelValue 形态） */
  getValue(): string
  /** 反序列化字符串为模型并替换（可选传入 variableMap 以补齐 label/type） */
  setValue(value: string): void
  /** 当前光标偏移（无 selection 返回 null） */
  getCaretOffset(): number | null
  /** 把光标设置到指定偏移（不会修改模型） */
  setCaretOffset(offset: number): void
  /**
   * 用一个 var chip 替换 [start, end) 区间。
   * 调用方通常在 mention 选中时用：start = `@` 起点、end = 当前光标。
   */
  replaceRangeWithVar(start: number, end: number, variable: EditorVariableInfo): void
  /** 移除指定段下标对应的 var chip（必须是 var 段）。 */
  removeVarAt(segIndex: number): void
  /** 替换指定段下标对应的 var chip 为新变量（必须是 var 段）。 */
  replaceVarAt(segIndex: number, variable: EditorVariableInfo): void
  /** 卸载所有事件监听（不会销毁 container DOM） */
  dispose(): void
  /** 强制根据当前模型重渲染 DOM（光标位置尽量保留） */
  rerender(): void
  /** 容器引用（只读） */
  readonly container: HTMLElement
}

export function createEditor(opts: EditorOptions): EditorAPI {
  let doc: Doc = normalize(opts.initialDoc)
  let composing = false

  function emitChange(next: Doc) {
    doc = next
    opts.onChange?.(doc)
  }

  function makeTextSpan(value: string): HTMLSpanElement {
    const span = document.createElement('span')
    span.setAttribute(TEXT_SEG_ATTR, TEXT_SEG_VALUE)
    span.textContent = value
    return span
  }

  function makeChipSpan(seg: Extract<Segment, { kind: 'var' }>): HTMLElement {
    return createChip(seg, {
      cls: opts.cls,
      onReselect: (chipEl) => {
        const { segIndex, chipOffset } = locateChip(chipEl)
        if (segIndex < 0) return
        opts.onChipReselect?.({ chipEl, segIndex, chipOffset })
      },
      onRemove: (chipEl) => {
        const { segIndex } = locateChip(chipEl)
        if (segIndex < 0) return
        opts.onChipRemove?.({ chipEl, segIndex })
      }
    })
  }

  function locateChip(chipEl: HTMLElement): { segIndex: number; chipOffset: number } {
    let chipOffset = 0
    let segIdx = -1
    let i = 0
    for (const child of Array.from(opts.container.childNodes)) {
      if (child === chipEl) {
        segIdx = i
        return { segIndex: segIdx, chipOffset }
      }
      chipOffset += childSerialLength(child)
      i++
    }
    return { segIndex: -1, chipOffset: -1 }
  }

  function childSerialLength(node: Node): number {
    if (isChipElement(node)) return readChipValue(node).length + 2
    return (node.textContent ?? '').length
  }

  /** 渲染 doc 到 container：每个 var 两侧都补一个 text span（即便空），保证光标可停靠。 */
  function render(targetCaret?: number) {
    const container = opts.container
    container.innerHTML = ''

    // 在边界与每两个 var 之间确保有 text span 占位
    const expanded: Segment[] = []
    let lastWasVar = false
    let first = true
    for (const seg of doc) {
      if (first) {
        if (seg.kind === 'var') expanded.push({ kind: 'text', value: '' })
        first = false
      } else if (lastWasVar && seg.kind === 'var') {
        expanded.push({ kind: 'text', value: '' })
      }
      expanded.push(seg)
      lastWasVar = seg.kind === 'var'
    }
    if (lastWasVar || expanded.length === 0) expanded.push({ kind: 'text', value: '' })

    for (const seg of expanded) {
      if (seg.kind === 'text') container.appendChild(makeTextSpan(seg.value))
      else container.appendChild(makeChipSpan(seg))
    }

    if (typeof targetCaret === 'number') setCaret(targetCaret)
  }

  /** 从 DOM 反推模型：宽容裸 text node、空 text span。 */
  function readDocFromDOM(): Doc {
    const segs: Segment[] = []
    for (const child of Array.from(opts.container.childNodes)) {
      if (isChipElement(child)) {
        const value = readChipValue(child)
        const domType = readChipType(child)
        const fallbackLabel =
          child.querySelector(`.${opts.cls.e('chip-label')}`)?.textContent ?? value
        // 优先从 variableMap 取最新 label / type，保持与外部数据源一致
        const fromMap = opts.getVariableMap?.().get(value)
        const finalType = fromMap?.type ?? domType
        const seg: Segment = finalType
          ? { kind: 'var', value, label: fromMap?.label ?? fallbackLabel, type: finalType }
          : { kind: 'var', value, label: fromMap?.label ?? fallbackLabel }
        segs.push(seg)
      } else {
        segs.push({ kind: 'text', value: child.textContent ?? '' })
      }
    }
    return normalize(segs)
  }

  /**
   * 计算光标在序列化字符串中的全局偏移。
   * 规则：
   *  - 在 text span / 裸 text node 中：父级 / 节点之前的 segments 长度累加 + selection 内偏移
   *  - 在 chip 边界：根据 selection 在 chip 节点之前 / 之后判断
   */
  function getCaretOffset(): number | null {
    const sel = document.getSelection()
    if (!sel || sel.rangeCount === 0) return null
    const range = sel.getRangeAt(0)
    if (!opts.container.contains(range.startContainer)) return null

    let offset = 0
    let found = false
    for (const child of Array.from(opts.container.childNodes)) {
      if (found) break
      if (isChipElement(child)) {
        if (range.startContainer === child) {
          // selection.startOffset 表示子节点索引：0 表示 chip 起始，>=1 表示 chip 之后
          if (range.startOffset === 0) return offset
          return offset + childSerialLength(child)
        }
        if (range.startContainer === opts.container && getChildIndex(child) === range.startOffset) {
          // 容器层 selection：偏移即子节点索引
          return offset
        }
        offset += childSerialLength(child)
      } else {
        // text span 或裸 text 节点
        if (
          range.startContainer === child ||
          (child.contains(range.startContainer) && child !== opts.container)
        ) {
          // 计算 selection 在该 child textContent 中的偏移
          const localOffset = computeTextOffsetWithin(
            child,
            range.startContainer,
            range.startOffset
          )
          return offset + localOffset
        }
        if (range.startContainer === opts.container && getChildIndex(child) === range.startOffset) {
          return offset
        }
        offset += childSerialLength(child)
      }
    }
    if (
      range.startContainer === opts.container &&
      range.startOffset === opts.container.childNodes.length
    ) {
      return offset
    }
    return null
  }

  function getChildIndex(node: Node): number {
    let i = 0
    let cur: Node | null = node.previousSibling
    while (cur) {
      i++
      cur = cur.previousSibling
    }
    return i
  }

  function computeTextOffsetWithin(root: Node, target: Node, targetOffset: number): number {
    if (root === target) return targetOffset
    let total = 0
    function walk(n: Node): boolean {
      if (n === target) {
        total += targetOffset
        return true
      }
      if (n.nodeType === 3) {
        total += (n as Text).data.length
        return false
      }
      for (const c of Array.from(n.childNodes)) {
        if (walk(c)) return true
      }
      return false
    }
    walk(root)
    return total
  }

  /** 把光标放到 offset 处，offset 大于文档长度时落到末尾。 */
  function setCaret(offset: number): void {
    const sel = document.getSelection()
    if (!sel) return

    let remain = offset
    const children = Array.from(opts.container.childNodes)
    for (let i = 0; i < children.length; i++) {
      const child = children[i]!
      const len = childSerialLength(child)
      if (isChipElement(child)) {
        if (remain <= 0) {
          // 光标定到 chip 之前 → 落到容器层 child 索引
          placeAt(opts.container, i)
          return
        }
        if (remain < len) {
          // 落在 chip 内部 → 视作 chip 之后
          placeAt(opts.container, i + 1)
          return
        }
        remain -= len
      } else {
        if (remain <= len) {
          // 落在该 text span 内
          placeWithinText(child, remain)
          return
        }
        remain -= len
      }
    }
    // 落到末尾
    if (children.length === 0) {
      placeAt(opts.container, 0)
      return
    }
    const last = children[children.length - 1]!
    if (isChipElement(last)) placeAt(opts.container, children.length)
    else placeWithinText(last, (last.textContent ?? '').length)
  }

  function placeAt(parent: Node, index: number) {
    const sel = document.getSelection()
    if (!sel) return
    const range = document.createRange()
    range.setStart(parent, index)
    range.collapse(true)
    sel.removeAllRanges()
    sel.addRange(range)
  }

  function placeWithinText(span: Node, offset: number): void {
    const sel = document.getSelection()
    if (!sel) return
    const target = firstTextDescendant(span)
    const range = document.createRange()
    if (target) {
      const max = target.data.length
      range.setStart(target, Math.min(offset, max))
    } else {
      // 空 span：让光标落到 span 内（child index 0）
      range.setStart(span, 0)
    }
    range.collapse(true)
    sel.removeAllRanges()
    sel.addRange(range)
  }

  function firstTextDescendant(root: Node): Text | null {
    if (root.nodeType === 3) return root as Text
    for (const c of Array.from(root.childNodes)) {
      const t = firstTextDescendant(c)
      if (t) return t
    }
    return null
  }

  /** input 后：从 DOM 反推 doc，并触发 onChange（如有变化）。 */
  function syncFromDOM(): void {
    if (composing) return
    const next = readDocFromDOM()
    if (!docEqual(next, doc)) emitChange(next)
  }

  function docEqual(a: Doc, b: Doc): boolean {
    if (a.length !== b.length) return false
    for (let i = 0; i < a.length; i++) {
      const x = a[i]!
      const y = b[i]!
      if (x.kind !== y.kind) return false
      if (x.kind === 'text' && y.kind === 'text' && x.value !== y.value) return false
      if (x.kind === 'var' && y.kind === 'var') {
        if (x.value !== y.value || x.label !== y.label || x.type !== y.type) return false
      }
    }
    return true
  }

  function onInput() {
    syncFromDOM()
  }
  function onCompositionStart() {
    composing = true
  }
  function onCompositionEnd() {
    composing = false
    syncFromDOM()
  }
  function onPaste(e: ClipboardEvent) {
    e.preventDefault()
    const text = e.clipboardData?.getData('text/plain') ?? ''
    if (!text) return
    insertPlainTextAtCaret(text)
  }
  function onSelectionChange() {
    if (composing) return
    if (!opts.onSelectionChange) return
    const sel = document.getSelection()
    if (!sel || sel.rangeCount === 0) {
      opts.onSelectionChange({ offset: null })
      return
    }
    const range = sel.getRangeAt(0)
    if (!opts.container.contains(range.startContainer)) {
      opts.onSelectionChange({ offset: null })
      return
    }
    opts.onSelectionChange({ offset: getCaretOffset() })
  }

  function insertPlainTextAtCaret(text: string) {
    const sel = document.getSelection()
    if (!sel || sel.rangeCount === 0) return
    const range = sel.getRangeAt(0)
    if (!opts.container.contains(range.startContainer)) return
    range.deleteContents()
    const node = document.createTextNode(text)
    range.insertNode(node)
    range.setStartAfter(node)
    range.collapse(true)
    sel.removeAllRanges()
    sel.addRange(range)
    syncFromDOM()
  }

  // 命令：替换区间为 var chip
  function replaceRangeWithVar(start: number, end: number, variable: EditorVariableInfo) {
    const a = Math.min(start, end)
    const b = Math.max(start, end)
    const left = sliceDoc(doc, 0, a)
    const right = sliceDoc(doc, b, totalLength(doc))
    const inserted: Segment = variable.type
      ? { kind: 'var', value: variable.value, label: variable.label, type: variable.type }
      : { kind: 'var', value: variable.value, label: variable.label }
    const next = normalize([...left, inserted, ...right])
    emitChange(next)
    render(a + variable.value.length + 2) // 光标定到 chip 之后
  }

  function removeVarAt(segIndex: number) {
    const target = doc[segIndex]
    if (!target || target.kind !== 'var') return
    const before = doc.slice(0, segIndex)
    const after = doc.slice(segIndex + 1)
    const caretOffset = sliceLength(before)
    const next = normalize([...before, ...after])
    emitChange(next)
    render(caretOffset)
  }

  function replaceVarAt(segIndex: number, variable: EditorVariableInfo) {
    const target = doc[segIndex]
    if (!target || target.kind !== 'var') return
    const next = doc.slice()
    const replaced: Segment = variable.type
      ? { kind: 'var', value: variable.value, label: variable.label, type: variable.type }
      : { kind: 'var', value: variable.value, label: variable.label }
    next[segIndex] = replaced
    const caretOffset = sliceLength(doc.slice(0, segIndex)) + variable.value.length + 2
    emitChange(normalize(next))
    render(caretOffset)
  }

  // 工具：基于序列化偏移的切片（不会切开 var）
  function sliceDoc(d: Doc, start: number, end: number): Doc {
    const out: Segment[] = []
    let pos = 0
    for (const seg of d) {
      const len = seg.kind === 'text' ? seg.value.length : seg.value.length + 2
      const segStart = pos
      const segEnd = pos + len
      if (segEnd <= start || segStart >= end) {
        pos += len
        continue
      }
      if (seg.kind === 'text') {
        const a = Math.max(0, start - segStart)
        const b = Math.min(len, end - segStart)
        const slice = seg.value.slice(a, b)
        if (slice) out.push({ kind: 'text', value: slice })
      } else {
        // var 是原子：只有当 [start, end) 完整覆盖该 var 时保留；否则抛弃
        if (start <= segStart && end >= segEnd) out.push(seg)
      }
      pos += len
    }
    return out
  }

  function sliceLength(d: Doc): number {
    let n = 0
    for (const s of d) n += s.kind === 'text' ? s.value.length : s.value.length + 2
    return n
  }

  function totalLength(d: Doc): number {
    return sliceLength(d)
  }

  // 绑定监听
  const container = opts.container
  container.addEventListener('input', onInput)
  container.addEventListener('compositionstart', onCompositionStart)
  container.addEventListener('compositionend', onCompositionEnd)
  container.addEventListener('paste', onPaste)
  document.addEventListener('selectionchange', onSelectionChange)

  // 初次渲染
  render()

  return {
    getDoc: () => doc,
    setDoc: (next) => {
      doc = normalize(next)
      render()
      opts.onChange?.(doc)
    },
    getValue: () => serialize(doc),
    setValue: (value) => {
      doc = parse(value, opts.getVariableMap?.())
      render()
      opts.onChange?.(doc)
    },
    getCaretOffset,
    setCaretOffset: setCaret,
    replaceRangeWithVar,
    removeVarAt,
    replaceVarAt,
    rerender: () => render(),
    dispose: () => {
      container.removeEventListener('input', onInput)
      container.removeEventListener('compositionstart', onCompositionStart)
      container.removeEventListener('compositionend', onCompositionEnd)
      container.removeEventListener('paste', onPaste)
      document.removeEventListener('selectionchange', onSelectionChange)
    },
    container
  }
}
