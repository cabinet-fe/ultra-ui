// 内置工具注册（undo/redo/合并/取消合并）：随包入口完成，
// 与 sheet-core command 的 default-registry 同构；深导入 sheet-core 子路径的
// 无头场景不涉及
import './tools/builtin'

// 数据模型 / 渲染内核在 @veltra/sheet-core（独立发包）。本包**不做** re-export：
// core API（Workbook / Sheet / SheetGrid / 公式 / IO 等）一律
// `from '@veltra/sheet-core'` 直导，白名单外符号深导入其子路径。
// 本入口只导出 sheet 自有能力：组件、tools、组件类型。

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

// 报表纯 TS 内核：renderReport / binding / rules / params / DataConnector（结构见 packages/sheet/AGENTS.md）
export * from './report'
