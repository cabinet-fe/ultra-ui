//#region src/data/number/big.d.ts
/** 允许的输入值类型 */
type BigInput = Big | string | number | bigint;
/**
 * 舍入模式
 * - 0: 向零截断；
 * - 1: 四舍五入（5 进）；
 * - 2: 银行家舍入；
 * - 3: 远离零。
 */
type RoundingMode = 0 | 1 | 2 | 3;
/** Node.js inspect 符号 */
declare const NODE_INSPECT_SYMBOL: unique symbol;
/**
 * 高精度十进制对象。
 */
declare class Big {
  /** 除法与开方的小数位数 */
  static DP: number;
  /** 默认舍入模式 */
  static RM: RoundingMode;
  /** 科学计数法负指数阈值 */
  static NE: number;
  /** 科学计数法正指数阈值 */
  static PE: number;
  /** 舍入模式常量 */
  static readonly roundDown = 0;
  static readonly roundHalfUp = 1;
  static readonly roundHalfEven = 2;
  static readonly roundUp = 3;
  /** 符号：1 或 -1 */
  s: -1 | 1;
  /** 十进制指数 */
  e: number;
  /** 系数数组（每位一个 0~9） */
  c: number[];
  constructor(value: BigInput);
  /** 返回绝对值 */
  abs(): Big;
  /** 比较大小：1(大于)、0(等于)、-1(小于) */
  cmp(value: BigInput): -1 | 0 | 1;
  /** 除法 */
  div(value: BigInput): Big;
  /** 等于 */
  eq(value: BigInput): boolean;
  /** 大于 */
  gt(value: BigInput): boolean;
  /** 大于等于 */
  gte(value: BigInput): boolean;
  /** 小于 */
  lt(value: BigInput): boolean;
  /** 小于等于 */
  lte(value: BigInput): boolean;
  /** 减法 */
  minus(value: BigInput): Big;
  /** 减法别名 */
  sub(value: BigInput): Big;
  /** 取模 */
  mod(value: BigInput): Big;
  /** 取反 */
  neg(): Big;
  /** 加法 */
  plus(value: BigInput): Big;
  /** 加法别名 */
  add(value: BigInput): Big;
  /** 幂运算 */
  pow(n: number): Big;
  /** 按有效位数舍入 */
  prec(sd: number, rm?: RoundingMode): Big;
  /** 按小数位舍入 */
  round(dp?: number, rm?: RoundingMode): Big;
  /** 开平方 */
  sqrt(): Big;
  /** 乘法 */
  times(value: BigInput): Big;
  /** 乘法别名 */
  mul(value: BigInput): Big;
  /** 转科学计数法字符串 */
  toExponential(dp?: number, rm?: RoundingMode): string;
  /** 转固定小数字符串 */
  toFixed(dp?: number, rm?: RoundingMode): string;
  /** 转普通字符串（必要时自动科学计数法） */
  toString(): string;
  /** JSON 序列化字符串 */
  toJSON(): string;
  /** Node.js 自定义 inspect 输出 */
  [NODE_INSPECT_SYMBOL](): string;
  /** 转原生 number */
  toNumber(): number;
  /** 按有效位输出字符串 */
  toPrecision(sd?: number, rm?: RoundingMode): string;
  /** valueOf */
  valueOf(): string;
}
/**
 * 创建隔离配置的 Big 构造器，避免不同调用方共享静态配置导致相互影响。
 */
declare function createBigConstructor(): typeof Big;
//#endregion
export { Big, BigInput, RoundingMode, createBigConstructor };
//# sourceMappingURL=big.d.ts.map