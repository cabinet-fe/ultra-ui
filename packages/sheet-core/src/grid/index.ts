/**
 * 引擎适配层公开入口（实现迁移官方 `infinitable/sheet` 的 re-export 桥）。
 * 主入口 `@veltra/sheet-core` 不导出这些符号，避免无头 API 把引擎类型图拉进
 * TS 程序。SheetGrid 经 `./sheet-grid` 薄桥接收本仓 core Sheet（官方实现直驱）。
 */
export type {
  CellRenderer,
  CellRenderTarget,
  GridCellEditor,
  GridEditorRect,
  GridEditorSession,
  ResolveCellRenderer,
  ResolveCellStyleHook,
  ResolveDisplayValue,
  SheetGridContextMenuInfo,
  SheetGridContextMenuKind,
  SheetGridEditorsOptions,
  SheetGridHeaderOptions
} from 'infinitable/sheet'
export { SheetGrid } from './sheet-grid'
export type { SheetGridOptions } from './sheet-grid'
