// 内置工具注册（undo/redo/合并/取消合并）：随包入口完成，
// 与 core/command 的 default-registry 同构；深导入 core 子路径的无头场景不涉及
import './tools/builtin'

// 聚合导出为**公开 API 白名单**：仅测试引用的内部符号（如 rangeContainsRange、
// mergeCellStyle、shiftFormulaRefs、io 转换函数、grid 样式映射、normalizeStyle、
// ToolRegistry 类等，见 #31）不在此导出，测试一律深导入 src 子路径。
// 类成员方法（Sheet.setCell / setCellStyles、CellStore.setCellValue 等）随类整体
// 导出，属内部实现细节，见 packages/sheet/AGENTS.md「核心语义」注。

export {
  cellKey,
  colIndexToName,
  colNameToIndex,
  parseAddress,
  formatAddress,
  createRange,
  parseRange,
  formatRange,
  rangesEqual,
  rangesIntersect,
  rangeContainsAddress,
  boundingBox,
  iterateRange,
  type CellAddress,
  type CellRange
} from './core/address'

export {
  NUMERIC_TEXT_RE,
  normalizeInputValue,
  inferCellType,
  isEmptyCellData,
  cellDataEqual,
  CellStore,
  type CellType,
  type CellValue,
  type CellData,
  type CellSnapshotItem
} from './core/cell-store'

export {
  computeFillTargetRange,
  generateFill,
  type FillDirection,
  type GenerateFillOptions
} from './core/fill'

export {
  findAll,
  findNext,
  findNextFrom,
  findPrev,
  findPrevFrom,
  type FindOptions,
  type FindMatch
} from './core/find'

export {
  MergeManager,
  type MergedCellKind,
  type CellInfo,
  type MergeResult
} from './core/merge-manager'

export { SelectionModel, type SelectionState } from './core/selection'

export { Sheet, type FrozenState, type SheetSnapshot, type SheetEvents } from './core/sheet'

export {
  createImageId,
  cloneImageAnchor,
  cloneSheetImage,
  type SheetImageType,
  type SheetImageAnchor,
  type SheetImage,
  type ImageInput
} from './core/image'

export {
  BORDER_SIDES,
  BORDER_STYLE_WIDTH,
  BORDER_EDGE_DEFAULTS,
  FONT_STYLE_KEYS,
  ALIGN_STYLE_KEYS,
  type BorderLineStyle,
  type BorderSide,
  type BorderEdge,
  type HorizontalAlign,
  type VerticalAlign,
  type CellFont,
  type CellAlign,
  type CellStyle,
  type StyleId,
  type CellStylePatch
} from './core/style/types'

export { StylePool } from './core/style/style-pool'

export {
  buildBorderPresetItems,
  type BorderPreset,
  type BorderPresetItem
} from './core/style/border-presets'

export { Workbook, type WorkbookEvents } from './core/workbook'

export {
  HistoryManager,
  type HistoryState,
  type PatchDirection,
  type CellPatch,
  type MergePatch,
  type StructureChange,
  type StructurePatch,
  type SnapshotPatch,
  type ImagePatch,
  type Patch,
  type Mutation,
  type CommandResult,
  type CommandContext,
  type Command,
  type SetCellValueItem,
  type SetCellValueParams,
  SetCellValueCommand,
  type SetCellFormulaParams,
  SetCellFormulaCommand,
  type SetCellStyleItem,
  type SetCellStyleParams,
  SetCellStyleCommand,
  type InsertCellsParams,
  InsertCellsCommand,
  type MergeCellsParams,
  MergeCellsCommand,
  type UnmergeCellsParams,
  UnmergeCellsCommand,
  type InsertImageParams,
  InsertImageCommand,
  type RemoveImageParams,
  RemoveImageCommand,
  type ImageUpdateFields,
  type UpdateImageParams,
  UpdateImageCommand,
  defaultCommandRegistry
} from './core/command'

export {
  FORMULA_ERROR_CODES,
  formulaError,
  isFormulaError,
  isFormulaErrorCode,
  type FormulaErrorCode,
  type FormulaError,
  type BinaryOperator,
  type AstNode,
  type AstReference,
  collectReferences,
  FormulaParseError,
  tokenizeFormula,
  type FormulaOperator,
  type FormulaToken,
  parseFormula,
  type ScalarValue,
  type EvalValue,
  type FormulaEvalContext,
  coerceToNumber,
  coerceToText,
  coerceToBoolean,
  evaluateAst,
  registerFormulaFunction,
  listFormulaFunctions,
  invokeFormulaFunction,
  type FormulaFunctionMeta,
  type FormulaFunction,
  type FormulaDependency,
  type FormulaNode,
  DependencyGraph
} from './core/formula'

export { exportWorkbookXlsx, exportSheetCsv } from './core/io/export'
export { importXlsx, importCsv, replaceWorkbook } from './core/io/import'

export {
  SheetGrid,
  type SheetGridOptions,
  type SheetGridContextMenuKind,
  type SheetGridContextMenuInfo
} from './grid/sheet-grid'

export { createSheetContext, type SheetContext } from './tools/context'

export {
  defaultToolRegistry,
  registerTool,
  unregisterTool,
  type SheetToolPopupType,
  type SheetTool,
  type SheetToolGroup
} from './tools/registry'

export { type SheetProps, type SheetEmits, type _SheetExposed, type SheetExposed } from './types'

export { default as USheet } from './vue/sheet.vue'
