/**
 * 引擎适配层公开入口。主入口 `@veltra/sheet-core` 不导出这些符号，
 * 避免 Workbook/Sheet 等无头 API 把引擎类型图拉进 TS 程序。
 * 底座为 npm 包 `infinitable`（统一 re-export 引擎四层 API）的 ListTable，
 * import 面单入口；引擎侧红线见 infinite-table 仓 `docs/plugin-interface-map.md`。
 */
export type { CellRenderer, CellRenderTarget } from 'infinitable'
export { SheetGrid, type ResolveCellRenderer, type SheetGridOptions } from './sheet-grid'
export type { ResolveCellStyleHook, ResolveDisplayValue } from './grid-model'
export type { SheetGridContextMenuInfo, SheetGridContextMenuKind } from './grid-coords'
export type { SheetGridHeaderOptions } from './grid-header'
export type {
  GridCellEditor,
  GridEditorRect,
  GridEditorSession,
  SheetGridEditorsOptions
} from './grid-editors'
