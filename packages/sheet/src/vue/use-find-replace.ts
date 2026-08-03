import { computed, ref, shallowRef, watch } from 'vue'

import { inferCellType, type CellData } from '../core/cell-store'
import { findAll, findNext, findPrev, type FindMatch, type FindOptions } from '../core/find'
import type { Sheet } from '../core/sheet'
import type { SheetContext } from '../tools/context'

interface UseFindReplaceOptions {
  /** 目标 sheet（弹层存活期间固定；tab 切换会关闭并销毁弹层） */
  getSheet: () => Sheet
  context: SheetContext
}

/**
 * 查找条逻辑（关键词 / 上一个 / 下一个 / 命中计数 / 替换）：
 * - 关键词 / 选项变化 → 重新查找并定位第一个命中
 * - Enter = 下一个、Shift+Enter = 上一个（行主序、到边界循环）
 * - 替换当前 = 一次 setCells（一个 undo 单元）；全部替换 = 一次批量 = 单 undo 单元
 * - 公式格不参与替换（写入 {v,t} 会覆盖公式原文 f，导致公式丢失）
 */
export function useFindReplace(options: UseFindReplaceOptions) {
  const { getSheet, context } = options

  const findQuery = ref('')
  const findReplace = ref('')
  const caseSensitive = ref(false)
  const wholeCell = ref(false)
  const searchIn = ref<'value' | 'formula'>('value')
  /** 全部命中（行主序；core/find 纯逻辑，无头可测） */
  const findMatches = shallowRef<FindMatch[]>([])
  /** 当前命中在 findMatches 中的下标；-1 = 无命中 */
  const findCursor = ref(-1)

  const canFind = computed(() => findMatches.value.length > 0)
  const canReplace = computed(() => canFind.value && findCursor.value >= 0)

  const findCountText = computed(() => {
    const total = findMatches.value.length
    if (total === 0) return '0 / 0'
    return `${Math.min(findCursor.value + 1, total)} / ${total}`
  })

  function findOptions(): FindOptions {
    return {
      caseSensitive: caseSensitive.value,
      wholeCell: wholeCell.value,
      searchIn: searchIn.value
    }
  }

  /** 关键词或选项变化：重新查找并定位第一个命中（否则保持当前位置附近） */
  function refreshFind(initial: boolean): void {
    const matches = findAll(getSheet(), findQuery.value, findOptions())
    findMatches.value = matches
    if (matches.length === 0) {
      findCursor.value = -1
      return
    }
    if (initial) {
      findCursor.value = 0
      context.selectCell(matches[0]!.addr)
    } else {
      findCursor.value = Math.min(findCursor.value, matches.length - 1)
    }
  }

  /** 定位到 findMatches 中与目标地址相同的命中（找不到则保持） */
  function locateMatch(match: FindMatch): void {
    const index = findMatches.value.findIndex(
      (item) => item.addr.row === match.addr.row && item.addr.col === match.addr.col
    )
    if (index >= 0) findCursor.value = index
    context.selectCell(match.addr)
  }

  function findForward(): void {
    const matches = findMatches.value
    if (matches.length === 0) return
    const active = context.getSelection().activeCell
    const next = active ? findNext(getSheet(), findQuery.value, active, findOptions()) : matches[0]
    if (!next) return
    locateMatch(next)
  }

  function findPrevious(): void {
    const matches = findMatches.value
    if (matches.length === 0) return
    const active = context.getSelection().activeCell
    const prev = active
      ? findPrev(getSheet(), findQuery.value, active, findOptions())
      : matches[matches.length - 1]
    if (!prev) return
    locateMatch(prev)
  }

  /** Enter = 下一个；Shift+Enter = 上一个（UInput 的 keydown 透传到外层容器，冒泡可达） */
  function handleFindKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter') return
    event.preventDefault()
    if (event.shiftKey) {
      findPrevious()
    } else {
      findForward()
    }
  }

  /** 替换文本 → CellData（空字符串 = 清除单元格；类型自动推断） */
  function replaceData(): CellData | undefined {
    if (findReplace.value === '') return undefined
    const t = inferCellType(findReplace.value)
    return t ? { v: findReplace.value, t } : { v: findReplace.value }
  }

  /** 公式格不参与替换（写入 {v,t} 会覆盖公式原文 f，导致公式丢失） */
  function isReplaceable(match: FindMatch): boolean {
    return !context.getCellData(match.addr)?.f
  }

  /** 替换当前命中格（一次 setCells = 一个 undo 单元）；替换后重新查找 */
  function replaceCurrent(): void {
    const match = findMatches.value[findCursor.value]
    if (!match || !isReplaceable(match)) return
    context.setCells([{ addr: match.addr, data: replaceData() }])
    refreshFind(false)
  }

  /** 全部替换（一次 setCells 批量 = 单 undo 单元，undo 一次全部还原）；公式格自动跳过 */
  function replaceAll(): void {
    const matches = findMatches.value.filter(isReplaceable)
    if (matches.length === 0) return
    context.setCells(matches.map((match) => ({ addr: match.addr, data: replaceData() })))
    refreshFind(false)
  }

  // 关键词 / 选项变化 → 重新查找（定位第一个命中）
  watch([findQuery, caseSensitive, wholeCell, searchIn], () => refreshFind(true))

  return {
    findQuery,
    findReplace,
    caseSensitive,
    wholeCell,
    searchIn,
    canFind,
    canReplace,
    findCountText,
    findForward,
    findPrevious,
    handleFindKeydown,
    replaceCurrent,
    replaceAll
  }
}
