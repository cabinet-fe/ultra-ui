/**
 * VTable 渲染层公开入口。主入口 `@veltra/sheet-core` 不导出这些符号，
 * 避免 Workbook/Sheet 等无头 API 把 @visactor/vtable 类型图拉进 TS 程序。
 */
export {
  CustomLayout,
  SheetGrid,
  type SheetGridOptions,
  type SheetGridContextMenuKind,
  type SheetGridContextMenuInfo,
  type ICustomLayoutObj,
  type ResolveCellRenderer,
  type ResolveDisplayValue,
  type ResolveCellStyleHook
} from './sheet-grid'
