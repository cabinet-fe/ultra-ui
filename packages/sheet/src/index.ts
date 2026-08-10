// 内置工具注册（undo/redo/合并/取消合并）：随包入口完成，
// 与 sheet-core command 的 default-registry 同构；深导入 sheet-core 子路径的
// 无头场景不涉及
import './tools/builtin'

// 数据模型 / 渲染内核（原 src/core、src/grid）已迁至 @veltra/sheet-core，
// 下方 core/grid 来源的导出全部为其主入口白名单的 re-export（公开 API 不变）。
// 聚合导出为**公开 API 白名单**：仅测试引用的内部符号（如 rangeContainsRange、
// mergeCellStyle、shiftFormulaRefs、io 转换函数、grid 样式映射、normalizeStyle、
// ToolRegistry 类等，见 #31）不在此导出，测试一律深导入 @veltra/sheet-core 子路径。
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
} from '@veltra/sheet-core'

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
} from '@veltra/sheet-core'

export {
  computeFillTargetRange,
  generateFill,
  type FillDirection,
  type GenerateFillOptions
} from '@veltra/sheet-core'

export {
  findAll,
  findNext,
  findNextFrom,
  findPrev,
  findPrevFrom,
  type FindOptions,
  type FindMatch
} from '@veltra/sheet-core'

export {
  MergeManager,
  type MergedCellKind,
  type CellInfo,
  type MergeResult
} from '@veltra/sheet-core'

export { SelectionModel, type SelectionState } from '@veltra/sheet-core'

export { Sheet, type FrozenState, type SheetSnapshot, type SheetEvents } from '@veltra/sheet-core'

export {
  createImageId,
  cloneImageAnchor,
  cloneSheetImage,
  type SheetImageType,
  type SheetImageAnchor,
  type SheetImage,
  type ImageInput
} from '@veltra/sheet-core'

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
} from '@veltra/sheet-core'

export { StylePool } from '@veltra/sheet-core'

export {
  buildBorderPresetItems,
  type BorderPreset,
  type BorderPresetItem
} from '@veltra/sheet-core'

export { Workbook, type WorkbookEvents } from '@veltra/sheet-core'

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
} from '@veltra/sheet-core'

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
} from '@veltra/sheet-core'

export { exportWorkbookXlsx, exportSheetCsv } from '@veltra/sheet-core'
export { importXlsx, importCsv, replaceWorkbook } from '@veltra/sheet-core'

export {
  SheetGrid,
  type SheetGridOptions,
  type SheetGridContextMenuKind,
  type SheetGridContextMenuInfo
} from '@veltra/sheet-core'

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

export { USheet } from './components/sheet'
