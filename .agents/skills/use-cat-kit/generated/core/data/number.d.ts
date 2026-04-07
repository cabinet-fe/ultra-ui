//#region src/data/number.d.ts
/**
 * 数字处理工具库
 * 提供数字格式化、货币格式化、高精度计算等功能
 */
type CurrencyType = 'CNY' | 'CNY_HAN';
/** 货币格式化配置 */
type CurrencyConfig = {
  /** 保留小数位数 */precision?: number; /** 最小小数位数 */
  minPrecision?: number; /** 最大小数位数 */
  maxPrecision?: number;
};
/**
 * 数字包装类, 提供链式调用
 */
declare class Num {
  private v;
  constructor(n: number);
  /**
   * 数字转货币
   * @param currencyType 货币类型 CNY人民币 CNY_HAN 人民币中文大写
   * @param config 其他配置, 仅precision对CNY_HAN生效
   * @returns
   */
  currency(currencyType: CurrencyType, config: CurrencyConfig): string;
  /**
   * 数字转货币
   * @param currencyType 货币类型 CNY人民币 CNY_HAN 人民币中文大写
   * @param precision 精度, 为CNY_HAN时最大和默认只能支持到小数点后四位(厘)
   * @returns
   */
  currency(currencyType: CurrencyType, precision?: number): string;
  /**
   * 指定数字最大保留几位小数点
   * @param precision 位数
   * @returns 格式化后的字符串
   * @example n(1.2345).fixed(2) // '1.23'
   */
  fixed(precision: number | {
    /** 最小精度 */minPrecision?: number; /** 最大精度 */
    maxPrecision?: number;
  }): string;
  /**
   * 遍历数字 (从 1 到 v)
   * @param fn 回调函数
   * @returns Num 实例
   * @example n(3).each(i => console.log(i)) // 1, 2, 3
   */
  each(fn: (n: number) => void): Num;
  /**
   * 大小区间 (限制在 min 和 max 之间)
   * @param min 最小值
   * @param max 最大值
   * @returns 一个在指定范围内的值
   * @example n(5).range(0, 10) // 5
   * @example n(-5).range(0, 10) // 0
   */
  range(min: number, max: number): number;
  /**
   * 限制最大值 (不超过 val)
   * @param val 最大值
   * @returns 一个不超过最大值的值
   * @example n(10).max(5) // 5
   */
  max(val: number): number;
  /**
   * 限制最小值 (不小于 val)
   * @param val 最小值
   * @returns  一个不小于最小值的值
   * @example n(1).min(5) // 5
   */
  min(val: number): number;
}
/**
 * 创建一个 Num 实例，用于链式调用
 * @param n 数字
 */
declare function n(n: number): Num;
/** 数字格式化选项 */
interface NumberFormatterOptions {
  /** 数字格式的样式 decimal:十进制, currency货币, percent百分比 */
  style?: 'decimal' | 'currency' | 'percent';
  /** 货币符号, 如果style为currency则默认CNY人民币 */
  currency?: 'CNY' | 'USD' | 'JPY' | 'EUR';
  /** 小数精度(小数点位数) */
  precision?: number;
  /** 最大小数位数, 默认3 */
  maximumFractionDigits?: number;
  /** 最小小数位数 */
  minimumFractionDigits?: number;
  /** 表现方法, standard: 标准, scientific: 科学计数法, engineering: 引擎, compact: 简洁计数   */
  notation?: Intl.NumberFormatOptions['notation'];
}
declare const $n: {
  /**
   * 创建数字格式化器
   * @param options 格式化选项
   */
  formatter(options: NumberFormatterOptions): Intl.NumberFormat;
  /**
   * 依次相加 (解决浮点数精度问题)
   * @param numbers 数字列表
   * @returns 相加结果
   * @example $n.plus(0.1, 0.2) // 0.3
   */
  plus(...numbers: number[]): number;
  /**
   * 依次相减 (解决浮点数精度问题)
   * @param numbers 数字列表
   * @returns 相减结果
   * @example $n.minus(1.0, 0.9) // 0.1
   */
  minus(...numbers: number[]): number;
  /**
   * 两数相乘 (解决浮点数精度问题)
   * @param num1 数字1
   * @param num2 数字2
   * @returns 相乘结果
   * @example $n.mul(19.9, 100) // 1990
   */
  mul(num1: number, num2: number): number;
  /**
   * 两数相除 (解决浮点数精度问题)
   * @param num1 被除数
   * @param num2 除数
   * @returns 相除结果
   * @example $n.div(0.3, 0.1) // 3
   */
  div(num1: number, num2: number): number;
  /**
   * 求和 (同 plus)
   * @param numbers 需要求和的数字
   * @returns 总和
   */
  sum(...numbers: number[]): number;
  /**
   * 计算表达式
   * @param expr 表达式字符串, 如 '1 + 3 * (4 / 2)'
   * @throws {Error} 如果表达式为空
   */
  calc(expr: string): number;
};
//#endregion
export { $n, n };
//# sourceMappingURL=number.d.ts.map