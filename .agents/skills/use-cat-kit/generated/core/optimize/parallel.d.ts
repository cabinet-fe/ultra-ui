//#region src/optimize/parallel.d.ts
interface ParallelOptions {
  /**
   * 并发上限
   *
   * - 不传：默认等于 tasks.length（尽可能并发）
   * - 必须为正整数
   */
  concurrency?: number;
}
/**
 * 并发执行任务，并保持返回结果与任务顺序一致。
 *
 * 注意：该函数为异步函数，返回 Promise。
 *
 * @param tasks - 任务数组（每个任务可返回值或 Promise）
 * @param options - 并发控制
 * @returns 按任务顺序排列的结果数组
 */
declare function parallel<T>(tasks: ReadonlyArray<() => T | Promise<T>>, options?: ParallelOptions): Promise<T[]>;
//#endregion
export { ParallelOptions, parallel };
//# sourceMappingURL=parallel.d.ts.map