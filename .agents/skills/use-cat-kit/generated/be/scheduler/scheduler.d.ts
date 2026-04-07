import { CronExpression } from "./cron.js";

//#region src/scheduler/scheduler.d.ts
/**
 * 任务函数类型
 */
type TaskFunction = () => void | Promise<void>;
/**
 * 任务类型
 */
type TaskType = 'cron' | 'timeout' | 'interval';
/**
 * 任务信息
 */
interface TaskInfo {
  /** 任务 ID */
  id: string;
  /** 任务类型 */
  type: TaskType;
  /** 下次执行时间 */
  nextRun?: Date;
  /** 是否正在运行 */
  running: boolean;
}
/**
 * 任务调度器
 *
 * 支持 Cron 表达式、延迟执行和定时执行三种任务类型。
 *
 * @example
 * ```typescript
 * const scheduler = new Scheduler()
 *
 * // Cron 任务
 * scheduler.schedule('backup', '0 2 * * *', async () => {
 *   await backupDatabase()
 * })
 *
 * // 延迟执行
 * scheduler.once('cleanup', 3600000, () => {
 *   cleanupTempFiles()
 * })
 *
 * // 定时执行
 * scheduler.interval('heartbeat', 30000, () => {
 *   sendHeartbeat()
 * })
 *
 * scheduler.start()
 * ```
 */
declare class Scheduler {
  private readonly tasks;
  private running;
  schedule(id: string, cron: string | CronExpression, task: TaskFunction): void;
  /**
   * 调度延迟执行任务（只执行一次）
   *
   * @param id - 任务唯一标识
   * @param delay - 延迟时间（毫秒）
   * @param task - 要执行的任务函数
   * @throws {Error} 当 delay 小于 0 时抛出错误
   */
  once(id: string, delay: number, task: TaskFunction): void;
  /**
   * 调度定时执行任务（重复执行）
   *
   * @param id - 任务唯一标识
   * @param interval - 执行间隔（毫秒）
   * @param task - 要执行的任务函数
   * @throws {Error} 当 interval 小于等于 0 时抛出错误
   */
  interval(id: string, interval: number, task: TaskFunction): void;
  /**
   * 取消任务
   *
   * @param id - 任务 ID
   * @returns 如果任务存在并成功取消返回 `true`，否则返回 `false`
   */
  cancel(id: string): boolean;
  /**
   * 启动调度器
   *
   * 开始执行所有已添加的任务。如果调度器已经在运行，则不会重复启动。
   */
  start(): void;
  /**
   * 停止调度器
   *
   * 停止所有任务的执行，但不会删除任务。可以再次调用 `start()` 恢复执行。
   */
  stop(): void;
  /**
   * 获取指定任务的信息
   *
   * @param id - 任务 ID
   * @returns 任务信息，如果任务不存在返回 `undefined`
   */
  getTask(id: string): TaskInfo | undefined;
  /**
   * 获取所有任务的信息
   *
   * @returns 所有任务的信息数组
   */
  getTasks(): TaskInfo[];
  private addTask;
  private planTask;
  private planCronTask;
  private planTimeoutTask;
  private planIntervalTask;
  private executeTask;
}
//#endregion
export { Scheduler, TaskFunction, TaskInfo };
//# sourceMappingURL=scheduler.d.ts.map