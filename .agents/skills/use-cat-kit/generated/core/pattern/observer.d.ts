//#region src/pattern/observer.d.ts
/**
 * 属性处理器接口
 */
interface PropHandler {
  /** 要观察的属性名数组 */
  params: string[];
  /** 属性变化时的回调函数 */
  callback: (state: any) => void | Promise<void>;
  /** 是否同步执行回调 */
  sync?: boolean;
  /** 是否只执行一次 */
  once?: boolean;
}
/**
 * 观察选项接口
 */
interface ObserveOptions {
  /** 是否立即执行一次回调 */
  immediate?: boolean;
  /** 是否只执行一次 */
  once?: boolean;
  /** 是否同步执行回调 */
  sync?: boolean;
}
/**
 * 可观察对象类
 * 用于创建可被观察的状态对象
 */
declare class Observable<S extends object, K extends keyof S> {
  /** 可观察的状态对象 */
  readonly state: S;
  /** 属性处理器映射 */
  private propsHandlers;
  /** 是否正在等待微任务执行 */
  private waitingMicrotask;
  /** 微任务队列 */
  private microtasks;
  /** 是否暂停观察 */
  private paused;
  /**
   * 构造函数
   * @param data 初始状态对象
   */
  constructor(data: S);
  /**
   * 执行微任务
   */
  private runMicrotasks;
  /**
   * 触发属性变更事件
   * @param prop 属性名
   */
  trigger(prop: string | symbol): void;
  /**
   * 观察属性变化
   * @param props 要观察的属性名数组
   * @param callback 属性变化时的回调函数
   * @param options 观察选项
   * @returns 取消观察的函数
   */
  observe<const P extends K[]>(props: P, callback: (values: { [key in keyof P]: S[P[key]] }) => void, options?: ObserveOptions): () => void;
  /**
   * 获取状态对象
   * @returns 状态对象
   */
  getState(): S;
  /**
   * 设置状态对象
   * @param state 状态对象
   */
  setState(state: Partial<S>): Observable<S, K>;
  /**
   * 取消观察处理器
   * @param handler 要取消的处理器
   */
  unobserveHandler(handler: PropHandler): void;
  /**
   * 取消观察特定属性
   * @param props 要取消观察的属性名数组
   * @param handler 要取消的处理器, 不填则取消所有处理器
   */
  unobserve<const P extends K[]>(props: P, handler?: PropHandler): void;
  /**
   * 销毁所有观察者
   */
  destroyAll(): void;
}
//#endregion
export { Observable, ObserveOptions, PropHandler };
//# sourceMappingURL=observer.d.ts.map