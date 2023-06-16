/** 上下文组件属性 */
export interface ContextProps<ScopeResult extends any = any> {
  scope: () => ScopeResult
}

/** 上下文暴露的属性和方法 */
export interface ContextExposed {}
