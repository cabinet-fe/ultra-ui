import type { InjectionKey } from 'vue'

export interface GridContext {
  /**
   * 设置响应式布局
   * @param enable 是否开启
   */
  setResponsive: (enable: boolean) => void
}

export const GridDIKey: InjectionKey<GridContext> = Symbol('GridDIKey')
