/**
 * 引擎适配层公开入口。主入口 `@veltra/sheet-core` 不导出这些符号，
 * 避免 Workbook/Sheet 等无头 API 把引擎类型图拉进 TS 程序。
 * 底座为 `@infinite-table/core` ListTable；import 面红线见 infinite-table 仓
 * `docs/plugin-interface-map.md`（仅 core / plugins 两个公共入口）。
 */
export type { CellRenderer, CellRenderTarget } from '@infinite-table/core'
export { SheetGrid, type ResolveCellRenderer, type SheetGridOptions } from './sheet-grid'
export type { ResolveCellStyleHook, ResolveDisplayValue } from './grid-model'
export type { SheetGridContextMenuInfo, SheetGridContextMenuKind } from './grid-coords'
