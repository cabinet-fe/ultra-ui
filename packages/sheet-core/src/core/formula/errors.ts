/**
 * 公式错误值体系。
 *
 * 求值器内部以 FormulaError 标记对象传递错误（随运算传播）；
 * 写入单元格时序列化为 `v = 错误码, t = 'e'`（决策 2 的 CellData 格式）。
 */

/** 公式错误码（Excel 子集 + 解析失败 #ERROR!、循环引用 #CYCLE!） */
export const FORMULA_ERROR_CODES = [
  '#DIV/0!',
  '#VALUE!',
  '#NAME?',
  '#REF!',
  '#ERROR!',
  '#CYCLE!'
] as const

export type FormulaErrorCode = (typeof FORMULA_ERROR_CODES)[number]

const ERROR_BRAND: unique symbol = Symbol('veltra-sheet.formula-error')

/** 求值过程中的错误标记（不参与普通值运算，遇运算即传播） */
export interface FormulaError {
  readonly [ERROR_BRAND]: true
  readonly code: FormulaErrorCode
}

/** 构造错误标记 */
export function formulaError(code: FormulaErrorCode): FormulaError {
  return { [ERROR_BRAND]: true, code }
}

/** 判定错误标记 */
export function isFormulaError(value: unknown): value is FormulaError {
  return typeof value === 'object' && value !== null && ERROR_BRAND in value
}

/** 判定合法错误码（读取 t='e' 的单元格时校验） */
export function isFormulaErrorCode(value: unknown): value is FormulaErrorCode {
  return typeof value === 'string' && (FORMULA_ERROR_CODES as readonly string[]).includes(value)
}
