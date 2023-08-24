/** 上下文组件属性 */
export interface ContextProps<Scope extends any> {
  scope: Scope
}

/** 上下文暴露的属性和方法 */
export interface ContextExposed {}
