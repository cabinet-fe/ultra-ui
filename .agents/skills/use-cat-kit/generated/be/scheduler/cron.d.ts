//#region src/scheduler/cron.d.ts
/**
 * Cron 字段配置
 */
interface CronFieldConfig {
  /** 最小值 */
  min: number;
  /** 最大值 */
  max: number;
}
/**
 * Cron 表达式解析器
 *
 * 支持标准的 5 位 Cron 表达式格式：`分钟 小时 日 月 星期`
 *
 * @example
 * ```typescript
 * const cron = new CronExpression('0 2 * * *') // 每天凌晨 2 点
 * const next = cron.getNextDate() // 获取下次执行时间
 *
 * // 支持范围、步长和列表
 * const cron2 = new CronExpression('0 9-17 * * 1-5') // 工作日上午 9 点到下午 5 点
 * const cron3 = new CronExpression('*\/5 * * * *') // 每 5 分钟
 * ```
 */
declare class CronExpression {
  private readonly minutes;
  private readonly hours;
  private readonly days;
  private readonly months;
  private readonly weekdays;
  /**
   * 创建 Cron 表达式实例
   *
   * @param expression - 5 位 Cron 表达式字符串
   * @throws {Error} 当表达式格式不正确时抛出错误
   */
  constructor(expression: string);
  /**
   * 获取下一次执行时间
   *
   * @param from - 起始时间，默认使用当前时间
   * @returns 下一次执行时间，如果无法找到则返回 `null`
   */
  getNextDate(from?: Date): Date | null;
}
/**
 * 解析 Cron 表达式
 *
 * 便捷函数，等同于 `new CronExpression(expression)`。
 *
 * @param expression - 5 位 Cron 表达式字符串
 * @returns CronExpression 实例
 * @throws {Error} 当表达式格式不正确时抛出错误
 */
declare function parseCron(expression: string): CronExpression;
//#endregion
export { CronExpression, CronFieldConfig, parseCron };
//# sourceMappingURL=cron.d.ts.map