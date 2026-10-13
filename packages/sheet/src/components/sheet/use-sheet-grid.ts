import { contextmenu } from '@veltra/desktop'
import { currentTheme } from '@veltra/styles/theme'
import type {
  CellLinkClickEvent,
  CellLinkHoverEvent,
  CellLinkLeaveEvent,
  ImageLinkClickEvent,
  ThemeOverride
} from 'infinitable'
import type { CellAddress, CellRange } from 'infinitable/sheet'
import type { Sheet } from 'infinitable/sheet'
import { SheetGrid, type SheetGridContextMenuInfo } from 'infinitable/sheet'
import type { SheetGridHighlight } from 'infinitable/sheet'
import { onBeforeUnmount, onMounted, watch } from 'vue'

import type { SheetContext } from '../../tools/context'
import type { FloatContextMenuPayload, SheetProps } from '../../types'
import { popFloatImageMenu } from './float-image-menu'
import type { ImagePreviewSource, OpenHyperlinkPopup } from './popup-helpers'
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
  /** 引用拾取延续中（上次插入的引用可被点选替换/扩展） */
  hasRefInsert: () => boolean
  /** 函数弹框打开中（fx 入口）——画布点击不清除目标格高亮 */
  isFunctionPopupOpen: () => boolean
  /** 网格 pointerdown → 挂起 blur 提交（引用选择或拾取会话延续中） */
  beginBlurSuppress: () => void
  /** 画布选区 → 插入/替换引用文本（拾取会话延续中替换上次插入的引用） */
  handleRefSelect: (range: CellRange) => void
}

interface UseSheetGridOptions {
  props: SheetProps
  gridRef: ElRef<HTMLElement>
  getActiveSheet: () => Sheet
  context: SheetContext
  formulaBarRef: ElRef<FormulaBarMirror>
  /** 函数弹框打开中（宿主侧入口，如工具栏「函数」按钮） */
  isFunctionPopupOpen?: () => boolean
  /** 列宽拖拽落定（SheetGrid 透传 → 宿主 emit col-resize-end） */
  onColResizeEnd?: (event: { col: number; width: number }) => void
  /** 单元格超链接悬停（引擎透传 → 宿主 emit cell-link-hover） */
  onCellLinkHover?: (event: CellLinkHoverEvent) => void
  /** 单元格超链接离开（引擎透传 → 宿主 emit cell-link-leave） */
  onCellLinkLeave?: (event: CellLinkLeaveEvent) => void
  /** 单元格超链接单击（引擎透传 → 宿主 emit cell-link-click；打开由 sheet.vue 直开接管） */
  onCellLinkClick?: (event: CellLinkClickEvent) => void
  /** 图片链接单击（引擎透传 → 宿主 emit image-link-click；打开由 sheet.vue 确认后接管） */
  onImageLinkClick?: (event: ImageLinkClickEvent) => void
  /** 浮动图右键（引擎透传 → 宿主 emit float-context-menu；右键不穿透到 body 菜单） */
  onFloatContextMenu?: (event: FloatContextMenuPayload) => void
  /** body 菜单超链接项拉起配置弹窗的句柄（sheet.vue 挂载的弹层状态） */
  openHyperlinkPopup?: OpenHyperlinkPopup
  /** 右键「预览」打开 lightbox 的句柄（sheet.vue 挂载的 UImagePreviewer 状态） */
  openImagePreview?: (source: ImagePreviewSource) => void
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
 * 大文件多 sheet 场景下切换卡顿的主因是每次重建引擎表格（实例创建 + 画布分层
 * 首屏构建 ~300ms）；缓存命中时仅切换容器可见性 + 选区回驱（≈0）。
 * 每实例持有一组 [data-layer-kind] 分层画布，容量即内存上限（含隐藏实例的渲染开销）。
 */
const GRID_CACHE_CAPACITY = 3

/**
 * 画布主题映射：读 grid 宿主元素上生效的 `--u-*` CSS 变量（loadTheme 注入 html、
 * 继承到宿主），换算为引擎 `ThemeOverride`——画布底色 / 表头 / 文字 / 网格线 /
 * 冻结分隔线跟随 UI 主题。rowHeader / corner 由引擎随生效 header 派生，无需单写。
 *
 * 任一变量为空（未 loadTheme）返回 `undefined`：SheetGrid 不传 theme、保持引擎
 * 缺省白底，不破坏无主题环境。
 */
export function resolveCanvasThemeOverride(el: HTMLElement): ThemeOverride | undefined {
  const style = getComputedStyle(el)
  const bgColorTop = style.getPropertyValue('--u-bg-color-top').trim()
  const bgColorBottom = style.getPropertyValue('--u-bg-color-bottom').trim()
  const textColorMain = style.getPropertyValue('--u-text-color-main').trim()
  const borderColor = style.getPropertyValue('--u-border-color').trim()
  const borderMutedColor = style.getPropertyValue('--u-border-muted-color').trim()
  if (!bgColorTop || !bgColorBottom || !textColorMain || !borderColor || !borderMutedColor) {
    return undefined
  }
  return {
    // 底色与 .u-sheet 外层同底；underlay 是数据区外空白处直接可见的底
    body: { background: bgColorTop, color: textColorMain, borderColor },
    header: { background: bgColorBottom, color: textColorMain, borderColor },
    underlayBackgroundColor: bgColorTop,
    interaction: { freezeDividerColor: borderMutedColor },
    frameStyle: { color: borderColor }
  }
}

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
        ? buildRowHeaderMenus(context, { readonly: props.readonly, row: info.row })
        : info.kind === 'col-header'
          ? buildColHeaderMenus(context, { readonly: props.readonly, col: info.col })
          : buildBodyMenus(context, {
              readonly: props.readonly,
              openHyperlinkPopup: options.openHyperlinkPopup,
              openImagePreview: options.openImagePreview
            })

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
      showRowHeader: props.showRowHeader,
      showColHeader: props.showColHeader,
      resolveDisplayValue: props.resolveDisplayValue,
      resolveCellStyle: props.resolveCellStyle,
      resolveCellRenderer: props.resolveCellRenderer,
      header: props.header,
      editors: props.editors,
      colResize: props.colResize,
      scrollbar: props.scrollbar,
      growOnScroll: props.growOnScroll,
      // 画布跟随 UI 主题：loadTheme 注入的 CSS 变量换算为引擎 override
      //（未 loadTheme 时为 undefined，引擎保持缺省白底）
      theme: resolveCanvasThemeOverride(host),
      // 关闭引擎默认打开：链接格单击直开、图片链接单击确认后开（sheet.vue 接管）
      openCellLinkOnClick: false,
      onContextMenu: handleContextMenu,
      onEditStart: (addr) => formulaBarRef.value?.mirrorGridEdit(addr),
      onEditEnd: (addr) => formulaBarRef.value?.exitMirror(addr),
      onColResizeEnd: options.onColResizeEnd,
      // 引用选择：不回写模型选区，序列化为 A1 / A1:B2 交给公式栏；函数弹框打开期间
      // （fx / 工具栏两入口）同样拦截，画布点击不离开目标格；拾取会话延续中（上次插入
      // 的引用未被打断）任何点击都拦截——Excel Point mode：普通点选替换上次引用、
      // shift 点选以上次锚点扩展，编辑不中断
      interceptSelection: () =>
        (formulaBarRef.value?.isRefSelecting() ?? false) ||
        (formulaBarRef.value?.hasRefInsert() ?? false) ||
        (formulaBarRef.value?.isFunctionPopupOpen() ?? false) ||
        (options.isFunctionPopupOpen?.() ?? false),
      onSelectionIntercept: (range) => formulaBarRef.value?.handleRefSelect(range)
    })
    // 结构变更订阅（vue 层只绑定激活 sheet；隐藏实例必须自持标记，切回时判定过期）
    let dirty = false
    const offStructureChange = sheet.on('structure-change', () => {
      dirty = true
    })
    // 引擎链接 / 浮动图事件透传：与 structure-change 订阅同生命周期，release 时解绑
    //（LRU 多实例各持各的订阅，淘汰 / 重建不残留）
    const table = grid.getTable()
    const offEngineEvents = [
      table.onCellLinkHover((event) => options.onCellLinkHover?.(event)),
      table.onCellLinkLeave((event) => options.onCellLinkLeave?.(event)),
      table.onCellLinkClick((event) => options.onCellLinkClick?.(event)),
      table.onImageLinkClick((event) => options.onImageLinkClick?.(event)),
      table.floatObjects.onContextMenu((event) => {
        // 层坐标 → 页面视口坐标（层坐标 + grid 容器偏移，与 body 右键菜单同口径）
        const rect = el.getBoundingClientRect()
        const payload: FloatContextMenuPayload = {
          ...event,
          clientX: rect.left + event.x,
          clientY: rect.top + event.y
        }
        options.onFloatContextMenu?.(payload)
        // 产品侧浮动图独立菜单（预览 / 超链接 / 删除）；与宿主 emit 并存，
        // 不穿透到格菜单由引擎保证（floatObjects 命中即不派发单元格右键）
        popFloatImageMenu({
          ctx: context,
          event: payload,
          handles: {
            openImagePreview: options.openImagePreview,
            openHyperlinkPopup: options.openHyperlinkPopup
          },
          readonly: props.readonly
        })
      })
    ]
    const release = (): void => {
      offStructureChange()
      for (const off of offEngineEvents) off()
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
   * dirty）；过期则释放重建。命中且未过期只翻可见性：隐藏实例的 cell/merge/
   * content-reset 已在 SheetGrid 内部置脏，setVisible(true) 时一次性全量同步，
   * 无需宿主补推送。
   */
  function activateGrid(): void {
    const sheet = getActiveSheet()
    const host = gridRef.value
    if (!host) return
    // 换实例前清旧实例的编辑会话视图态（选区锚点 + 引用染色框）：fx 编辑会话随切
    // sheet 结束（公式栏同步复位编辑态），缓存实例复用时不得残留上次会话的高亮
    if (active && active.sheet !== sheet) {
      active.grid.setSelectionAnchor(null)
      active.grid.setHighlightRanges([])
    }
    const cached = cache.get(sheet)
    if (cached && !cached.dirty) {
      cached.lastUsed = ++seq
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

  // props 尺寸显式增大时先扩张模型，再重建（删行缩小不走这条路径）；
  // header / editors 按引用更替判定（机制对象构造期装配，变化即重建——宿主用
  // computed 持稳定引用，勿在模板内联对象字面量）
  watch(
    () =>
      [
        props.rows,
        props.cols,
        props.readonly,
        props.showRowHeader,
        props.showColHeader,
        props.header,
        props.editors,
        props.colResize,
        props.scrollbar,
        props.growOnScroll
      ] as const,
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

  // 主题切换换肤：loadTheme 换实例（ref 替换）或主题 token 原地改（deep）后，
  // 等 UITheme 把 CSS 变量渲染进 html（flush: 'post' 晚于其渲染）再重读映射，
  // 对缓存中所有实例原地 updateTheme——零重建，滚动 / 选区 / 冻结等运行时状态
  // 不受影响；未 loadTheme（解析为 undefined）时不动，保持引擎缺省白底
  watch(
    [() => currentTheme.value?.theme, currentTheme],
    () => {
      const host = gridRef.value
      const override = host ? resolveCanvasThemeOverride(host) : undefined
      if (!override) return
      for (const item of cache.values()) {
        item.grid.updateTheme(override)
      }
    },
    { deep: true, flush: 'post' }
  )

  /** fx 引用拾取会话置/清选区锚点（公式栏 → 活动实例透传；无活动实例时静默） */
  function setSelectionAnchor(addr: CellAddress | null): void {
    active?.grid.setSelectionAnchor(addr)
  }

  /** 公式引用染色框同步（公式栏 → 活动实例透传；空数组清除；无活动实例时静默） */
  function setRefHighlights(items: readonly SheetGridHighlight[]): void {
    active?.grid.setHighlightRanges(items)
  }

  return {
    rebuildGrid,
    activateGrid,
    pruneCache,
    getGrid: () => active?.grid,
    setSelectionAnchor,
    setRefHighlights
  }
}
