//#region src/data/number/format.d.ts
/** 货币格式化配置 */
type CurrencyConfig = {
  /** 保留小数位数 */ precision?: number /** 最小小数位数 */
  minPrecision?: number /** 最大小数位数 */
  maxPrecision?: number
}
//#endregion
export { CurrencyConfig }
