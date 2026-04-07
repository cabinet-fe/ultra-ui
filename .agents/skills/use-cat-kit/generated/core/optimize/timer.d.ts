//#region src/optimize/timer.d.ts
/**
 * 防抖
 * @param fn 要调用的目标函数
 * @param delay 延迟时间
 * @param immediate 是否立即调用一次, 默认true
 * @returns
 */
declare function debounce<T extends any[]>(fn: (...args: T) => void, delay?: number, immediate?: boolean): (this: any, ...args: T) => void;
/**
 * 节流
 * @param fn 要调用的目标函数
 * @param delay 间隔时间
 * @param cb 结果回调
 * @returns
 */
declare function throttle<T extends any[], R>(fn: (...args: T) => R, delay?: number, cb?: (v: R) => void): (this: any, ...args: T) => R;
/**
 * 睡眠一定时间
 * @param ms 毫秒数
 * @returns
 */
declare function sleep(ms: number): Promise<void>;
//#endregion
export { debounce, sleep, throttle };
//# sourceMappingURL=timer.d.ts.map