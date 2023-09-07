/** 网格布局组件属性 */
export type GridProps = {
  /**
   * 列配置, 如果不指定, 那么列就会基于断点配置自动响应式布局
   * @example 以下都是合法的cols值
   *
   * ```js
   * // 表示2列
   * const cols = 2
   *
   * // 表示2列, 分别为200px宽度, 1fr宽度, 其中fr表示弹性尺寸
   * const cols = "200px 1fr"
   *
   * // 和上面的写法等价
   * const cols= ['200px', '1fr']  和上面的写法等价
   * ```
   */
  cols?: number | string | (string | number)[]
  /** 渲染标签 */
  tag?: string
  /** 间隔, 单位px */
  gap?: number
  /** 列宽 */

}
