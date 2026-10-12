import type { ContextmenuItem } from '@veltra/desktop'
import { createRange, type CellAddress, type CellRange } from 'infinitable/sheet'
import type { ImageInput, NumFmt } from 'infinitable/sheet'
import { defineComponent, h } from 'vue'

import type { SheetContext } from '../../tools/context'
import { MIN_ROW_COL_SIZE } from '../../tools/context'
import { defaultToolRegistry } from '../../tools/registry'
import InsertCountMenuItem from './insert-count-menu-item.vue'
import { pickAndEmbedCellImage, pickAndInsertImage } from './insert-image'
import type { ImagePreviewSource, OpenHyperlinkPopup } from './popup-helpers'
import { imageLinkInitial, imagePreviewSource } from './popup-helpers'

/** 插入数量钳制范围（对齐 univer） */
export const INSERT_COUNT_MIN = 1
export const INSERT_COUNT_MAX = 1000

/** 小数位数钳制范围 */
export const DECIMAL_PLACES_MIN = 0
export const DECIMAL_PLACES_MAX = 10

/** 行高/列宽数值项输入上限（下限复用门面 MIN_ROW_COL_SIZE，对齐引擎 resize 最小值） */
export const AXIS_SIZE_MAX = 1000

/** 数值项默认值回落：未设置自定义尺寸时展示引擎默认行高/列宽（对齐引擎 grid-theme） */
export const FALLBACK_ROW_HEIGHT = 28
export const FALLBACK_COL_WIDTH = 80

/** 选区覆盖行/列数 → 插入默认 N（min 1 / max 1000） */
export function defaultInsertCount(range: CellRange | null, axis: 'row' | 'col'): number {
  if (!range) return INSERT_COUNT_MIN
  const n =
    axis === 'row' ? range.end.row - range.start.row + 1 : range.end.col - range.start.col + 1
  return Math.min(INSERT_COUNT_MAX, Math.max(INSERT_COUNT_MIN, n))
}

/** 点击行是否落在任一选区内（按行号覆盖） */
export function isRowInSelection(ranges: CellRange[], row: number): boolean {
  return ranges.some((r) => r.start.row <= row && row <= r.end.row)
}

/** 点击列是否落在任一选区内（按列号覆盖） */
export function isColInSelection(ranges: CellRange[], col: number): boolean {
  return ranges.some((r) => r.start.col <= col && col <= r.end.col)
}

/** 整行选区（列跨渲染宽度） */
export function wholeRowRange(row: number, colCount: number): CellRange {
  return createRange({ row, col: 0 }, { row, col: Math.max(colCount - 1, 0) })
}

/** 整列选区（行跨渲染高度） */
export function wholeColRange(col: number, rowCount: number): CellRange {
  return createRange({ row: 0, col }, { row: Math.max(rowCount - 1, 0), col })
}

/**
 * 渲染尺寸：模型已声明时以模型为准（删行可低于 props）；未声明时回落 props。
 * 与 SheetGrid / useSheetGrid 一致——避免 ensureTableSize(props) 把删行结果撑回。
 */
export function resolveRenderSize(
  propsRows: number | undefined,
  propsCols: number | undefined,
  sheetRows: number,
  sheetCols: number
): { rows: number; cols: number } {
  return {
    rows: sheetRows > 0 ? sheetRows : (propsRows ?? 100),
    cols: sheetCols > 0 ? sheetCols : (propsCols ?? 26)
  }
}

/** 菜单内嵌数量输入项（插入行列数 / 小数位数共用） */
function menuNumberRender(options: {
  prefix: string
  suffix: string
  defaultValue: number
  min: number
  max: number
  onConfirm: (n: number) => void
}): ContextmenuItem['render'] {
  return defineComponent({
    name: 'SheetMenuNumberRender',
    setup() {
      return () =>
        h(InsertCountMenuItem, {
          prefix: options.prefix,
          suffix: options.suffix,
          defaultValue: options.defaultValue,
          min: options.min,
          max: options.max,
          onConfirm: options.onConfirm
        })
    }
  })
}

function insertCountRender(options: {
  prefix: string
  suffix: string
  defaultValue: number
  onConfirm: (n: number) => void
}): ContextmenuItem['render'] {
  return menuNumberRender({ ...options, min: INSERT_COUNT_MIN, max: INSERT_COUNT_MAX })
}

/** 行号/列头菜单选项（readonly 时尺寸项禁用） */
export interface HeaderMenuOptions {
  /** 只读模式：行高/列宽项禁用（尺寸写入属编辑操作） */
  readonly?: boolean
  /** 右键命中的行号（行头菜单）：冻结以点击行为准，缺省回落选区末端 */
  row?: number
  /** 右键命中的列号（列头菜单）：冻结以点击列为准，缺省回落选区末端 */
  col?: number
}

/**
 * 行高/列宽菜单项：内嵌数值输入，确认经门面批量应用到选区覆盖行/列。
 * readonly 时降级为禁用文本项——render 内嵌组件自带点击路径，disabled 拦不住。
 */
function axisSizeMenuItem(options: {
  label: string
  disabled: boolean
  defaultValue: number
  onConfirm: (n: number) => void
}): ContextmenuItem {
  if (options.disabled) return { label: options.label, disabled: true }
  return {
    label: options.label,
    keepOpen: true,
    render: menuNumberRender({
      prefix: options.label,
      suffix: '像素',
      defaultValue: options.defaultValue,
      min: MIN_ROW_COL_SIZE,
      max: AXIS_SIZE_MAX,
      onConfirm: options.onConfirm
    })
  }
}

function primaryRange(ctx: SheetContext): CellRange | null {
  return ctx.getSelection().ranges[0] ?? null
}

/** 行号右键菜单：插入×2 / 删除 / 行高 / divider / 冻结 / 取消冻结 */
export function buildRowHeaderMenus(
  ctx: SheetContext,
  options?: HeaderMenuOptions
): ContextmenuItem[] {
  const range = primaryRange(ctx)
  const startRow = range?.start.row ?? 0
  const endRow = range?.end.row ?? startRow
  const rowCount = defaultInsertCount(range, 'row')
  const deleteCount = range ? endRow - startRow + 1 : 1
  const frozen = ctx.frozen
  // 冻结目标 = 右键命中的行；缺省回落选区末端。不能直接用选区末端：先冻结行的
  // 整行选区横跨全部列，随后列头右键判定「在选区内」保留选区，选区末端列会把
  // 冻结列放大到全部列（反之亦然），表现为冻结不生效
  const freezeRow = (options?.row ?? endRow) + 1
  const freezeActive = frozen.rows === freezeRow

  return [
    {
      label: '在上方插入行',
      keepOpen: true,
      render: insertCountRender({
        prefix: '在上方插入',
        suffix: '行',
        defaultValue: rowCount,
        onConfirm: (n) => ctx.insertRows(startRow, n)
      })
    },
    {
      label: '在下方插入行',
      keepOpen: true,
      render: insertCountRender({
        prefix: '在下方插入',
        suffix: '行',
        defaultValue: rowCount,
        onConfirm: (n) => ctx.insertRows(endRow + 1, n)
      })
    },
    { label: '删除行', callback: () => ctx.deleteRows(startRow, deleteCount) },
    axisSizeMenuItem({
      label: '行高',
      disabled: options?.readonly === true,
      defaultValue: ctx.getRowHeight(startRow) ?? FALLBACK_ROW_HEIGHT,
      onConfirm: (n) => ctx.setRowHeightBySelection(n)
    }),
    { divider: true },
    {
      label: freezeActive ? '✓ 冻结到当前行' : '冻结到当前行',
      callback: () => ctx.setFrozen(freezeRow, frozen.cols)
    },
    {
      label: '取消冻结',
      disabled: frozen.rows === 0 && frozen.cols === 0,
      callback: () => ctx.setFrozen(0, 0)
    }
  ]
}

/** 列头右键菜单：插入×2 / 删除 / 列宽 / divider / 冻结 / 取消冻结 */
export function buildColHeaderMenus(
  ctx: SheetContext,
  options?: HeaderMenuOptions
): ContextmenuItem[] {
  const range = primaryRange(ctx)
  const startCol = range?.start.col ?? 0
  const endCol = range?.end.col ?? startCol
  const colCount = defaultInsertCount(range, 'col')
  const deleteCount = range ? endCol - startCol + 1 : 1
  const frozen = ctx.frozen
  // 冻结目标 = 右键命中的列（同 buildRowHeaderMenus：整行/整列选区残留时选区末端会放大冻结范围）
  const freezeCol = (options?.col ?? endCol) + 1
  const freezeActive = frozen.cols === freezeCol

  return [
    {
      label: '在左侧插入列',
      keepOpen: true,
      render: insertCountRender({
        prefix: '在左侧插入',
        suffix: '列',
        defaultValue: colCount,
        onConfirm: (n) => ctx.insertCols(startCol, n)
      })
    },
    {
      label: '在右侧插入列',
      keepOpen: true,
      render: insertCountRender({
        prefix: '在右侧插入',
        suffix: '列',
        defaultValue: colCount,
        onConfirm: (n) => ctx.insertCols(endCol + 1, n)
      })
    },
    { label: '删除列', callback: () => ctx.deleteCols(startCol, deleteCount) },
    axisSizeMenuItem({
      label: '列宽',
      disabled: options?.readonly === true,
      defaultValue: ctx.getColWidth(startCol) ?? FALLBACK_COL_WIDTH,
      onConfirm: (n) => ctx.setColWidthBySelection(n)
    }),
    { divider: true },
    {
      label: freezeActive ? '✓ 冻结到当前列' : '冻结到当前列',
      callback: () => ctx.setFrozen(frozen.rows, freezeCol)
    },
    {
      label: '取消冻结',
      disabled: frozen.rows === 0 && frozen.cols === 0,
      callback: () => ctx.setFrozen(0, 0)
    }
  ]
}

/**
 * 对当前选区应用 numFmt（经 applyStyle → 命令系统，天然可 undo/redo）。
 * 仅影响显示，单元格恒存原始值（引擎 numFmt 显示约定）。
 */
export function applyNumFmtToSelection(ctx: SheetContext, numFmt: NumFmt): void {
  for (const range of ctx.getSelection().ranges) ctx.applyStyle(range, { numFmt })
}

/** body 格右键菜单选项（超链接 / 图片预览项行为注入） */
export interface BodyMenuOptions {
  /** 只读模式：超链接与嵌入图写入项禁用（对齐行高/列宽 readonly 禁用约定） */
  readonly?: boolean
  /** 拉起超链接配置弹窗的句柄（缺省时插入/编辑项禁用，保持 build 纯函数可测） */
  openHyperlinkPopup?: OpenHyperlinkPopup
  /** 打开 lightbox 预览的句柄（缺省时嵌入图「预览」项禁用） */
  openImagePreview?: (source: ImagePreviewSource) => void
}

/**
 * body 菜单超链接项：按目标格链接状态出项——
 * 无链接「插入超链接」；有链接「编辑超链接」（回填原 url/text）+「取消超链接」。
 * 取消直走 clearCellLink（可 undo）；插入/编辑经注入句柄拉起弹窗。
 */
function cellLinkMenuItems(
  ctx: SheetContext,
  active: CellAddress | null | undefined,
  options?: BodyMenuOptions
): ContextmenuItem[] {
  if (!active) return [{ label: '插入超链接', disabled: true }]
  const handle = options?.openHyperlinkPopup
  const disabled = options?.readonly === true || !handle
  const link = ctx.getCellLink(active)
  if (!link) {
    return [{ label: '插入超链接', disabled, callback: () => handle?.('cell') }]
  }
  return [
    { label: '编辑超链接', disabled, callback: () => handle?.('cell', link) },
    {
      label: '取消超链接',
      disabled: options?.readonly === true,
      callback: () => ctx.clearCellLink(active)
    }
  ]
}

/**
 * 按格嵌入图转为浮动图片（对齐 Excel「放置到单元格上」/ WPS 反向切换）：浮动图
 * 落在嵌入图锚点格、尺寸取该格宽高（视觉等价还原），fit 缺省 contain（对齐嵌入图
 * 渲染约定，避免浮动图缺省 fill 拉伸变形），src/data/type/link 随载荷迁移。事务内
 * insertImage + removeCellImage——一次转换 = 一个 undo 单元。
 */
export function cellImageToFloat(ctx: SheetContext, addr: CellAddress): void {
  const payload = ctx.getCellImage(addr)
  if (!payload) return
  const anchor = ctx.getCellInfo(addr).anchor
  const input: ImageInput = {
    data: payload.data ?? new Uint8Array(),
    type: payload.type ?? 'png',
    anchor: { from: { row: anchor.row, col: anchor.col } },
    width: ctx.getColWidth(anchor.col) ?? FALLBACK_COL_WIDTH,
    height: ctx.getRowHeight(anchor.row) ?? FALLBACK_ROW_HEIGHT,
    fit: payload.fit ?? 'contain'
  }
  if (payload.src) input.src = payload.src
  if (payload.link) input.link = payload.link
  ctx.beginTransaction()
  ctx.insertImage(input)
  ctx.removeCellImage(addr)
  ctx.commit()
}

/**
 * body 菜单嵌入图项：预览 / 图片超链接 / 取消超链接（按载荷 link 状态出项）/
 * 转为浮动图片 / 替换图片 / 移除图片。设置走 hyperlink 弹窗 image 模式（确认后由宿主覆盖写
 * `insertCellImage(addr, { ...payload, link })`）；取消直写覆盖 `link: undefined`
 * （引擎 CellImagePayload 清除约定，其余字段保留）；转换/替换/移除分别走
 * `cellImageToFloat`、`insertCellImage` 覆盖与 `removeCellImage`（命令系统，可 undo）。
 */
function cellImageMenuItems(
  ctx: SheetContext,
  active: CellAddress | null | undefined,
  options?: BodyMenuOptions
): ContextmenuItem[] {
  if (!active || !ctx.hasCellImage(active)) return []
  const payload = ctx.getCellImage(active)
  if (!payload) return []
  const handle = options?.openHyperlinkPopup
  const readonly = options?.readonly === true
  const items: ContextmenuItem[] = [
    {
      label: '预览',
      disabled: !options?.openImagePreview,
      callback: () => options?.openImagePreview?.(imagePreviewSource(payload))
    },
    {
      label: '图片超链接',
      disabled: readonly || !handle,
      callback: () =>
        handle?.('image', imageLinkInitial(payload.link), { kind: 'cell', addr: active })
    }
  ]
  if (payload.link) {
    items.push({
      label: '取消超链接',
      disabled: readonly,
      callback: () => ctx.insertCellImage(active, { ...payload, link: undefined })
    })
  }
  items.push(
    { label: '转为浮动图片', disabled: readonly, callback: () => cellImageToFloat(ctx, active) },
    { label: '替换图片', disabled: readonly, callback: () => pickAndEmbedCellImage(ctx) },
    { label: '移除图片', disabled: readonly, callback: () => ctx.removeCellImage(active) }
  )
  return items
}

/**
 * body 格右键菜单。目标格含嵌入图时出**纯图片菜单**（预览 / 超链接 / 转浮动 /
 * 替换 / 移除）——图片盖住整格，右键语义是「图片」而非「单元格」，不出合并 /
 * 数据格式 / 超链接等普通格项（对齐 Excel 图片右键约定）。普通格：合并 / 取消合并 +
 * 设置数据格式 + 超链接 + 插入图片（浮动）+ 嵌入图片（入格）；行列插入/删除仅行号/列头菜单。
 */
export function buildBodyMenus(ctx: SheetContext, options?: BodyMenuOptions): ContextmenuItem[] {
  const active = ctx.getSelection().activeCell
  if (active && ctx.hasCellImage(active)) return cellImageMenuItems(ctx, active, options)

  const mergeTool = defaultToolRegistry.get('merge')
  const unmergeTool = defaultToolRegistry.get('unmerge')

  return [
    {
      label: '合并单元格',
      disabled: mergeTool?.disabled?.(ctx) ?? true,
      callback: () => mergeTool?.onClick(ctx)
    },
    {
      label: '取消合并单元格',
      disabled: unmergeTool?.disabled?.(ctx) ?? true,
      callback: () => unmergeTool?.onClick(ctx)
    },
    { divider: true },
    {
      label: '设置数据格式',
      disabled: !active,
      children: [
        { label: '日期', callback: () => applyNumFmtToSelection(ctx, { type: 'date' }) },
        { label: '千分位金额', callback: () => applyNumFmtToSelection(ctx, { type: 'thousands' }) },
        { label: '大写金额', callback: () => applyNumFmtToSelection(ctx, { type: 'cnUpper' }) },
        {
          label: '小数位数',
          keepOpen: true,
          render: menuNumberRender({
            prefix: '保留',
            suffix: '位小数',
            defaultValue: 2,
            min: DECIMAL_PLACES_MIN,
            max: DECIMAL_PLACES_MAX,
            onConfirm: (n) => applyNumFmtToSelection(ctx, { type: 'fixed', digits: n })
          })
        }
      ]
    },
    ...cellLinkMenuItems(ctx, active, options),
    { label: '插入图片', disabled: !active, callback: () => pickAndInsertImage(ctx) },
    { label: '嵌入图片', disabled: !active, callback: () => pickAndEmbedCellImage(ctx) }
  ]
}

/**
 * 右键落点预处理：body 格落在选区外 → 选中该格；
 * 行号/列头落在选区外 → 选中整行/整列（渲染尺寸）。
 */
export function ensureContextMenuSelection(
  ctx: SheetContext,
  info: {
    kind: 'body' | 'row-header' | 'col-header'
    addr: CellAddress | null
    row?: number
    col?: number
  },
  renderSize: { rows: number; cols: number }
): void {
  const ranges = ctx.getSelection().ranges

  if (info.kind === 'body' && info.addr) {
    const inSelection = ranges.some(
      (range) =>
        range.start.row <= info.addr!.row &&
        info.addr!.row <= range.end.row &&
        range.start.col <= info.addr!.col &&
        info.addr!.col <= range.end.col
    )
    if (!inSelection) ctx.selectCell(info.addr)
    return
  }

  if (info.kind === 'row-header' && info.row != null) {
    if (!isRowInSelection(ranges, info.row)) {
      ctx.selectRange(wholeRowRange(info.row, renderSize.cols))
    }
    return
  }

  if (info.kind === 'col-header' && info.col != null) {
    if (!isColInSelection(ranges, info.col)) {
      ctx.selectRange(wholeColRange(info.col, renderSize.rows))
    }
  }
}
