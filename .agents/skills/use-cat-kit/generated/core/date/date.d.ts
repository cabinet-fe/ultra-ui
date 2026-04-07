//#region src/date/date.d.ts
type DateInput = number | string | Date | Dater;
type DateCompareReducer<R> = (timeDiff: number) => R;
type FormatOptions = {
  utc?: boolean;
};
type DiffUnit = 'milliseconds' | 'seconds' | 'minutes' | 'hours' | 'days' | 'weeks' | 'months' | 'years';
type DiffOptions = {
  absolute?: boolean;
  float?: boolean;
};
type RangeInclusive = '()' | '[]' | '[)' | '(]';
type StartEndUnit = 'day' | 'week' | 'month' | 'year';
declare class Dater {
  private date;
  constructor(date: DateInput);
  /** 原始日期对象 */
  get raw(): Date;
  private static matchers;
  private getParts;
  /** 时间戳 */
  get timestamp(): number;
  setTime(timestamp: number): Dater;
  /** 年 */
  get year(): number;
  /**
   * 设置年份
   * @param year 年份
   * @returns
   */
  setYear(year: number): Dater;
  /** 月 */
  get month(): number;
  /**
   * 设置月份
   * @param month 月份，从1开始
   * @returns
   */
  setMonth(month: number): Dater;
  /** 周 */
  get weekDay(): number;
  /** 日 */
  get day(): number;
  /**
   * 设置日
   * @param day 日, 如果为0则表示上个月的最后一天
   * @returns
   */
  setDay(day: number): Dater;
  /** 时 */
  get hours(): number;
  /**
   * 设置小时
   * @param hours 时
   * @returns
   */
  setHours(hours: number): Dater;
  /** 分 */
  get minutes(): number;
  /**
   * 设置分
   * @param minutes 分
   */
  setMinutes(minutes: number): Dater;
  /** 秒 */
  get seconds(): number;
  /**
   * 设置秒
   * @param sec 秒
   */
  setSeconds(sec: number): Dater;
  /** 克隆当前日期 */
  clone(): Dater;
  /** 格式化日期 */
  format(formatter?: string, options?: FormatOptions): string;
  /**
   * 计算相对此刻的日期
   * @param timeStep 计算的日期, 负数表示之前的日期, 正数表示之后的日期
   * @param type 时间步长类别, 默认以天为单位
   */
  calc(timeStep: number, type?: 'days' | 'weeks' | 'months' | 'years'): Dater;
  /** 不可变加减封装 */
  addDays(days: number): Dater;
  addWeeks(weeks: number): Dater;
  addMonths(months: number): Dater;
  addYears(years: number): Dater;
  private resetTime;
  /**
   * 对齐到指定单位的开始
   * @param unit 单位: day/week/month/year
   */
  startOf(unit: StartEndUnit): Dater;
  /**
   * 对齐到指定单位的结束
   * @param unit 单位: day/week/month/year
   */
  endOf(unit: StartEndUnit): Dater;
  /**
   * 比较日期, 并返回天数差
   * @param date 日期
   * @returns 天数差
   */
  compare(date: DateInput): number;
  /**
   * 比较日期, 返回自定义结果
   * @param date 日期
   * @param reducer 处理器
   * @returns 自定义结果
   */
  compare<R>(date: DateInput, reducer: DateCompareReducer<R>): R;
  /**
   * 计算差值
   * @param date 对比日期
   * @param unit 单位
   * @param options absolute 为 true 时返回绝对值, float 为 true 时返回小数（仅限毫秒-周）
   */
  diff(date: DateInput, unit?: DiffUnit, options?: DiffOptions): number;
  /**
   * 判断是否在区间内
   * @param start 开始日期
   * @param end 结束日期
   * @param options inclusive: '[]' 闭区间, '()' 开区间, '[)' 左闭右开, '(]' 左开右闭
   */
  isBetween(start: DateInput, end: DateInput, options?: {
    inclusive?: RangeInclusive;
  }): boolean;
  isSameDay(date: DateInput): boolean;
  isSameMonth(date: DateInput): boolean;
  isSameYear(date: DateInput): boolean;
  isWeekend(): boolean;
  isLeapYear(): boolean;
  /**
   * 跳转至月尾
   * @param offsetMonth 月份偏移量，默认为0，即当月
   */
  toEndOfMonth(offsetMonth?: number): Dater;
  /**
   * 获取这个月的天数
   */
  getDays(): number;
  private static diffInCalendarMonths;
  private static diffInCalendarYears;
  private static escapeReg;
  private static parseByFormat;
  /**
   * 解析日期字符串
   * @param value 输入字符串
   * @param format 可选格式化模板（使用 format 支持的占位符）
   * @param options utc: 是否按 UTC 解析
   */
  static parse(value: string, format?: string, options?: FormatOptions): Dater;
}
/** 日期 */
declare function date(d?: DateInput): Dater;
//#endregion
export { Dater, date };
//# sourceMappingURL=date.d.ts.map