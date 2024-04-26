/** BEM实例 */
export type BEM<
  N extends string,
  P extends string = string,
  B extends string = `${P}${N}`
> = {
  /** BEM中的块 */
  b: B

  /**
   * BEM中的元素(E)
   * @param name 元素名称
   * @returns
   */
  e<const E extends string>(name: E): `${B}__${E}`

  /**
   * 块和元素组合(B-E)
   * @param block
   * @param e
   * @returns
   */
  be<const Block extends string, const E extends string>(
    b: Block,
    e: E
  ): `${B}-${Block}__${E}`

  /**
   * BEM中的修饰符(M)
   * @param m 修饰符名
   * @returns 修饰符
   */
  m<const M extends string>(m: M): `${B}--${M}`

  /**
   * BEM中的元素与修饰符(E--M)
   * @param e 元素名
   * @param m 修饰符名
   * @returns
   */
  em<const E extends string, const M extends string>(
    e: E,
    m: M
  ): `${B}__${E}--${M}`
}

/** BEM工厂 */
export interface BEMFactory<Prefix extends string> {
  <N extends string>(name: N): BEM<N, Prefix>
  /**
   * 生成is辅助类
   * @param name 辅助类名称
   */
  is<const N extends string>(name: N): `is-${N}`
  /**
   * 生成is辅助类
   * @param name 辅助类名称
   * @param condition 辅助类显示条件
   */
  is<const N extends string, C extends boolean | undefined>(
    name: N,
    condition: C
  ): C extends true ? `is-${N}` : ''
}

/**
 * 创建一个bem函数
 * @param prefix 前缀
 */
export function makeBEM<Prefix extends `${string}-`>(
  prefix: Prefix
): BEMFactory<Prefix> {
  /**
   * css类命名辅助
   * @param name 类block名称
   */
  function bem<N extends string>(name: N): BEM<N, Prefix> {
    const b = `${prefix}${name}` as BEM<N, Prefix>['b']
    return {
      b,

      e(name) {
        return `${b}__${name}`
      },

      be(block, e) {
        return `${b}-${block}__${e}`
      },

      m(m) {
        return `${b}--${m}`
      },

      em(e, m) {
        return `${b}__${e}--${m}`
      }
    }
  }

  /**
   * 生成is辅助类
   * @param name 辅助类名称
   */
  function is<const N extends string>(name: N): `is-${N}`
  /**
   * 生成is辅助类
   * @param name 辅助类名称
   * @param condition 辅助类显示条件
   */
  function is<const N extends string, C extends boolean | undefined>(
    name: N,
    condition: C
  ): C extends true ? `is-${N}` : ''

  function is<N extends string>(name: N, condition?: boolean) {
    if (arguments.length < 2) return `is-${name}`
    return condition === false ? '' : (`is-${name}` as const)
  }

  bem.is = is

  return bem
}
