//#region src/optimize/safe.d.ts
/**
 * 安全运行
 * @param fn 待执行的函数
 */
declare function safeRun<T>(fn: () => T): T | undefined;
/**
 * 安全运行并提供默认返回值
 * @param fn 待执行的函数
 * @param defaultVal 指定的默认值
 */
declare function safeRun<T>(fn: () => T, defaultVal: T): T;
//#endregion
export { safeRun };
//# sourceMappingURL=safe.d.ts.map