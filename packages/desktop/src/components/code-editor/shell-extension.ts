import {
  EditorSelection,
  EditorState,
  RangeSetBuilder,
  StateField,
  type Extension,
  type Text
} from '@codemirror/state'
import { Decoration, type DecorationSet, EditorView } from '@codemirror/view'

/** 前后缀外壳配置 */
export interface ShellConfig {
  prefix: string
  suffix: string
}

/**
 * 判断 Text 文档是否与外壳对齐。
 * 仅 slice 前后缀边界，避免整篇 toString。
 */
function textMatchesShell(doc: Text, config: ShellConfig): boolean {
  const { prefix, suffix } = config
  const len = doc.length
  if (prefix.length + suffix.length > len) return false
  if (prefix && doc.sliceString(0, prefix.length) !== prefix) return false
  if (suffix && doc.sliceString(len - suffix.length) !== suffix) return false
  return true
}

/** 计算正文区间在完整文档中的起止位置（始终落在 [0, docLength]） */
export function getShellRanges(docLength: number, config: ShellConfig) {
  const prefixLen = config.prefix.length
  const suffixLen = config.suffix.length
  // 外壳与文档可能短暂不一致，区间必须可安全用于选区
  const bodyStart = Math.min(prefixLen, docLength)
  const bodyEnd = Math.max(bodyStart, docLength - Math.min(suffixLen, docLength - bodyStart))
  return { prefixLen, suffixLen, bodyStart, bodyEnd }
}

/** 从 CodeMirror Text 提取正文（热路径，避免整篇 toString） */
export function extractBodyFromText(doc: Text, config: ShellConfig): string {
  // 无外壳时直接 toString，跳过边界校验与二次 slice
  if (!config.prefix && !config.suffix) return doc.toString()
  if (!textMatchesShell(doc, config)) return doc.toString()
  const { bodyStart, bodyEnd } = getShellRanges(doc.length, config)
  return doc.sliceString(bodyStart, bodyEnd)
}

/**
 * 判断 Text 是否已等于 prefix + body + suffix（用于 model → doc 同步短路）。
 * 长度不等时 O(1)；相等时只比较正文与边界，不分配完整文档字符串。
 */
export function textEqualsShellDoc(doc: Text, body: string, config: ShellConfig): boolean {
  const { prefix, suffix } = config
  if (doc.length !== prefix.length + body.length + suffix.length) return false
  if (!prefix && !suffix) return doc.toString() === body
  if (!textMatchesShell(doc, config)) return false
  return doc.sliceString(prefix.length, doc.length - suffix.length) === body
}

/** 将正文与前后缀拼成完整 CodeMirror 文档 */
export function buildFullDoc(body: string, config: ShellConfig): string {
  return config.prefix + body + config.suffix
}

/** 选区是否已完全落在 [lo, hi] 内 */
function selectionWithin(selection: EditorSelection, lo: number, hi: number): boolean {
  for (const range of selection.ranges) {
    if (range.from < lo || range.to > hi) return false
  }
  return true
}

/** 将选区限制在正文区间内，并保证不超出文档长度 */
function clampSelection(
  selection: EditorSelection,
  bodyStart: number,
  bodyEnd: number,
  docLength = bodyEnd
): EditorSelection {
  const lo = Math.max(0, Math.min(bodyStart, docLength))
  const hi = Math.max(lo, Math.min(bodyEnd, docLength))
  const clamp = (pos: number) => Math.max(lo, Math.min(hi, pos))
  let changed = false
  const ranges = selection.ranges.map((range) => {
    const anchor = clamp(range.anchor)
    const head = clamp(range.head)
    if (anchor !== range.anchor || head !== range.head) changed = true
    return EditorSelection.range(anchor, head)
  })
  if (!changed) return selection
  return EditorSelection.create(ranges, selection.mainIndex)
}

/**
 * 将旧文档选区映射到新文档的正文区间（按正文内相对偏移）。
 * 用于 prefix/suffix 切换时保持光标大致位置且始终合法。
 */
export function mapSelectionToBody(
  selection: EditorSelection,
  from: { bodyStart: number; bodyEnd: number },
  to: { bodyStart: number; bodyEnd: number },
  docLength: number
): EditorSelection {
  const fromLen = Math.max(0, from.bodyEnd - from.bodyStart)
  const toLen = Math.max(0, to.bodyEnd - to.bodyStart)
  const mapPos = (pos: number) => {
    const offset = Math.max(0, Math.min(fromLen, pos - from.bodyStart))
    return to.bodyStart + Math.min(offset, toLen)
  }
  const ranges = selection.ranges.map((range) =>
    EditorSelection.range(mapPos(range.anchor), mapPos(range.head))
  )
  return clampSelection(
    EditorSelection.create(ranges, selection.mainIndex),
    to.bodyStart,
    to.bodyEnd,
    docLength
  )
}

const shellMark = Decoration.mark({ class: 'cm-shell' })

function buildShellDecorations(doc: Text, config: ShellConfig): DecorationSet {
  if (!textMatchesShell(doc, config)) return Decoration.none

  const { prefixLen, suffixLen, bodyEnd } = getShellRanges(doc.length, config)
  const builder = new RangeSetBuilder<Decoration>()

  if (prefixLen > 0) {
    builder.add(0, prefixLen, shellMark)
  }
  if (suffixLen > 0 && bodyEnd < doc.length) {
    builder.add(bodyEnd, doc.length, shellMark)
  }

  return builder.finish()
}

/** 变更是否触及外壳区间（相对 startState 文档坐标） */
function changesTouchShell(
  changes: { iterChangedRanges: (f: (fromA: number, toA: number) => void) => void },
  bodyStart: number,
  bodyEnd: number
): boolean {
  let touches = false
  changes.iterChangedRanges((fromA, toA) => {
    if (fromA < bodyStart || toA > bodyEnd) touches = true
  })
  return touches
}

/**
 * CodeMirror 扩展：将 prefix/suffix 作为文档内的只读区域，
 * 通过 changeFilter 阻止编辑、transactionFilter 限制选区，并用装饰着色。
 */
export function shellExtension(config: ShellConfig): Extension {
  const hasShell = config.prefix.length > 0 || config.suffix.length > 0
  if (!hasShell) return []

  const shellField = StateField.define<DecorationSet>({
    create(state) {
      return buildShellDecorations(state.doc, config)
    },
    update(decorations, tr) {
      if (!tr.docChanged) return decorations

      const { bodyStart, bodyEnd } = getShellRanges(tr.startState.doc.length, config)
      // 正文内编辑：外壳 mark 只需随 ChangeSet 映射，避免边界 slice / 重建
      if (!changesTouchShell(tr.changes, bodyStart, bodyEnd) && decorations.size > 0) {
        return decorations.map(tr.changes)
      }
      return buildShellDecorations(tr.newDoc, config)
    },
    provide: (f) => EditorView.decorations.from(f)
  })

  return [
    shellField,
    EditorState.changeFilter.of((tr) => {
      if (!tr.docChanged) return true
      const { bodyStart, bodyEnd } = getShellRanges(tr.startState.doc.length, config)
      // 未触及外壳区间时直接放行，避免 sliceString
      if (!changesTouchShell(tr.changes, bodyStart, bodyEnd)) return true
      // 触及外壳：文档尚未对齐时放行（由组件侧全量替换同步）
      return !textMatchesShell(tr.startState.doc, config)
    }),
    EditorState.transactionFilter.of((tr) => {
      const { bodyStart, bodyEnd } = getShellRanges(tr.newDoc.length, config)
      // 选区已在正文内：无需钳制，也无需校验外壳
      if (selectionWithin(tr.newSelection, bodyStart, bodyEnd)) return tr
      // 外壳与文档不一致时不钳选区，避免 Selection points outside of document
      if (!textMatchesShell(tr.newDoc, config)) return tr
      const selection = clampSelection(tr.newSelection, bodyStart, bodyEnd, tr.newDoc.length)
      if (selection.eq(tr.newSelection)) return tr
      return [tr, { selection }]
    })
  ]
}
