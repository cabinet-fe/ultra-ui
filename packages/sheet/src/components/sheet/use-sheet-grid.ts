import { contextmenu } from '@veltra/desktop'
import type { CellAddress, CellRange } from '@veltra/sheet-core/core/address'
import type { Sheet } from '@veltra/sheet-core/core/sheet'
import { SheetGrid, type SheetGridContextMenuInfo } from '@veltra/sheet-core/grid/sheet-grid'
import { onBeforeUnmount, onMounted, watch } from 'vue'

import type { SheetContext } from '../../tools/context'
import type { SheetProps } from '../../types'
import {
  buildBodyMenus,
  buildColHeaderMenus,
  buildRowHeaderMenus,
  ensureContextMenuSelection,
  resolveRenderSize
} from './sheet-context-menu'

/** 模板 ref（useTemplateRef 的只读形态） */
type ElRef<T> = { readonly value: T | null | undefined }

/** 公式栏暴露接口（镜像 + 引用选择） */
export interface FormulaBarMirror {
  mirrorGridEdit: (addr: CellAddress) => void
  exitMirror: (addr: CellAddress) => void
  /** fx 编辑中且处于可插入引用位置 */
  isRefSelecting: () => boolean
  /** 网格 pointerdown → 挂起 blur 提交 */
  beginBlurSuppress: () => void
  /** 画布选区 → 插入引用文本 */
  handleRefSelect: (range: CellRange) => void
}

interface UseSheetGridOptions {
  props: SheetProps
  gridRef: ElRef<HTMLElement>
  getActiveSheet: () => Sheet
  context: SheetContext
  formulaBarRef: ElRef<FormulaBarMirror>
}

/** 缓存实例（LRU 淘汰）：每个 sheet 一个独立容器 div，非激活容器 visibility:hidden 堆叠 */
interface CachedGrid {
  sheet: Sheet
  grid: SheetGrid
  el: HTMLDivElement
  lastUsed: number
  /** 释放实例：取消 structure-change 订阅 + grid.release + 移除容器 */
  release: () => void
  /** 隐藏期间发生 structure-change（程序化行列变更）→ 切回时需重建 */
  dirty: boolean
}

/**
 * 缓存容量：最近 N 个 sheet 的 SheetGrid 实例常驻（tab 来回切换零重建）。
 * 大文件多 sheet 场景下切换卡顿的主因是每次重建 VTable（实例创建 + scenegraph
 * 首屏构建 ~300ms）；缓存命中时仅切换容器可见性 + 选区回驱（≈0）。
 * 每实例持有一个 canvas + scenegraph，容量即内存上限（含隐藏实例的渲染开销）。
 */
const GRID_CACHE_CAPACITY = 3

/**
 * SheetGrid 生命周期与网格右键菜单（LRU 实例缓存）：
 * - activateGrid：tab 切换入口——命中缓存 → 显示 + 模型同步（零重建）；
 *   未命中 → 新建实例入缓存，超容量淘汰最久未用（release + 移除容器）
 * - rebuildGrid：强制重建激活实例并清空缓存（structure-change / props 尺寸
 *   变化 / 工作簿切换 / 导入替换——这些场景下缓存实例的 columns / 数据源失效）
 * - 右键菜单：body / 行号 / 列头
 * - 公式栏引用选择：interceptSelection 拦截选区回写 + pointerdown 挂起 blur
 */
export function useSheetGrid(options: UseSheetGridOptions) {
  const { props, gridRef, getActiveSheet, context, formulaBarRef } = options
  const cache = new Map<Sheet, CachedGrid>()
  let active: CachedGrid | undefined
  let seq = 0
  let detachPointerDown: (() => void) | undefined

  function handleContextMenu(info: SheetGridContextMenuInfo): void {
    const sheet = getActiveSheet()
    const renderSize = resolveRenderSize(props.rows, props.cols, sheet.rows, sheet.cols)
    ensureContextMenuSelection(context, info, renderSize)

    const menus =
      info.kind === 'row-header'
        ? buildRowHeaderMenus(context)
        : info.kind === 'col-header'
          ? buildColHeaderMenus(context)
          : buildBodyMenus(context)

    // 最小宽度兜底；实际宽度由最长菜单项撑开（勿固定 240 导致空白过大）
    contextmenu.pop({ mousePosition: { x: info.x, y: info.y }, width: 'max-content', menus })
  }

  function bindGridPointerDown(container: HTMLElement): void {
    detachPointerDown?.()
    const onPointerDown = () => {
      formulaBarRef.value?.beginBlurSuppress()
    }
    // capture：赶在 textarea blur 之前挂起提交
    container.addEventListener('pointerdown', onPointerDown, true)
    detachPointerDown = () => {
      container.removeEventListener('pointerdown', onPointerDown, true)
      detachPointerDown = undefined
    }
  }

  /** 新建实例：创建独立容器 div（absolute 堆叠于 grid 区内）并构造 SheetGrid */
  function createGrid(sheet: Sheet): CachedGrid {
    const host = gridRef.value
    if (!host) throw new Error('useSheetGrid: grid 容器未挂载')
    const el = document.createElement('div')
    el.className = 'u-sheet__grid-instance'
    host.appendChild(el)
    // 模型已声明尺寸时传入模型值，避免删行后被 props 经 ensureTableSize 撑回
    const { rows, cols } = resolveRenderSize(props.rows, props.cols, sheet.rows, sheet.cols)
    const grid = new SheetGrid({
      container: el,
      sheet,
      rows,
      cols,
      readonly: props.readonly,
      resolveDisplayValue: props.resolveDisplayValue,
      resolveCellStyle: props.resolveCellStyle,
      resolveCellRenderer: props.resolveCellRenderer,
      onContextMenu: handleContextMenu,
      onEditStart: (addr) => formulaBarRef.value?.mirrorGridEdit(addr),
      onEditEnd: (addr) => formulaBarRef.value?.exitMirror(addr),
      // 引用选择：不回写模型选区，序列化为 A1 / A1:B2 交给公式栏
      interceptSelection: () => formulaBarRef.value?.isRefSelecting() ?? false,
      onSelectionIntercept: (range) => formulaBarRef.value?.handleRefSelect(range)
    })
    // 结构变更订阅（vue 层只绑定激活 sheet；隐藏实例必须自持标记，切回时判定过期）
    let dirty = false
    const offStructureChange = sheet.on('structure-change', () => {
      dirty = true
    })
    const release = (): void => {
      offStructureChange()
      grid.release()
      el.remove()
    }
    return {
      sheet,
      grid,
      el,
      lastUsed: ++seq,
      release,
      get dirty() {
        return dirty
      }
    }
  }

  /** 切换激活实例：显示目标、隐藏其余（visibility:hidden 保持尺寸，canvas 不重建） */
  function showOnly(target: CachedGrid): void {
    for (const item of cache.values()) {
      const on = item === target
      item.el.style.visibility = on ? 'visible' : 'hidden'
      // 隐藏实例停用视图同步（只置脏），激活实例立即同步挂起变更（#12）
      item.grid.setVisible(on)
    }
  }

  /** 淘汰最久未用的缓存实例（保留激活实例） */
  function evict(): void {
    while (cache.size > GRID_CACHE_CAPACITY) {
      let oldest: CachedGrid | undefined
      for (const item of cache.values()) {
        if (item === active) continue
        if (!oldest || item.lastUsed < oldest.lastUsed) oldest = item
      }
      if (!oldest) break
      cache.delete(oldest.sheet)
      oldest.release()
    }
  }

  /** 清空全部缓存实例（workbook 切换 / 导入替换 / 渲染尺寸变化 / 结构变更） */
  function invalidateAll(): void {
    for (const item of cache.values()) {
      item.release()
    }
    cache.clear()
    active = undefined
    detachPointerDown?.()
  }

  /**
   * tab 切换：优先复用缓存实例（零重建）。
   * 命中时校验实例是否过期（隐藏期间程序化 structure-change——插入/删除/undo
   * 行列——vue 层只绑定激活 sheet 的 structure-change，隐藏实例靠自持订阅标记
   * dirty）；过期则释放重建，否则同步模型状态（选区回驱 + 冻结校正；数据/样式/
   * 行高由实例常驻的 sheet 事件订阅持续同步，隐藏期间跨表重算等模型变更不丢）。
   */
  function activateGrid(): void {
    const sheet = getActiveSheet()
    const host = gridRef.value
    if (!host) return
    const cached = cache.get(sheet)
    if (cached && !cached.dirty) {
      cached.lastUsed = ++seq
      cached.grid.syncFromModel()
      showOnly(cached)
      active = cached
      bindGridPointerDown(cached.el)
      return
    }
    if (cached) {
      // 隐藏期间结构变更：实例过期，释放后重建（走下方新建路径）
      cache.delete(sheet)
      cached.release()
    }
    const created = createGrid(sheet)
    cache.set(sheet, created)
    created.lastUsed = ++seq
    showOnly(created)
    active = created
    bindGridPointerDown(created.el)
    evict()
  }

  /**
   * 清理已不存在的 sheet 的缓存实例（workbook 删除 sheet 后及时释放，
   * 避免条目与事件订阅残留到容量淘汰）。
   */
  function pruneCache(sheets: ReadonlyArray<Sheet>): void {
    const alive = new Set(sheets)
    for (const [sheet, item] of cache) {
      // 存活或激活的实例保留；已删除的 sheet 释放（含事件订阅）
      if (alive.has(sheet) || item === active) continue
      cache.delete(sheet)
      item.release()
    }
  }

  /** 强制重建激活实例并清空缓存（structure-change / props / 工作簿替换） */
  function rebuildGrid(): void {
    invalidateAll()
    activateGrid()
  }

  onMounted(activateGrid)

  // props 尺寸显式增大时先扩张模型，再重建（删行缩小不走这条路径）
  watch(
    () => [props.rows, props.cols, props.readonly] as const,
    ([nextRows, nextCols]) => {
      const sheet = getActiveSheet()
      if (nextRows != null) sheet.ensureTableSize(nextRows, 0)
      if (nextCols != null) sheet.ensureTableSize(0, nextCols)
      rebuildGrid()
    }
  )

  onBeforeUnmount(() => {
    invalidateAll()
  })

  return { rebuildGrid, activateGrid, pruneCache, getGrid: () => active?.grid }
}
