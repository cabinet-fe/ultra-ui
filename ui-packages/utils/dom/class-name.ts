import { CLS_PREFIX } from '@ui/shared'

type CLSType = typeof CLS_PREFIX

/** BEM实例 */
export type BEM<N extends string, B extends string = `${CLSType}${N}`> = {
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

/**
 * css类命名辅助
 * @param name 类block名称
 */
function bem<N extends string, B extends `${CLSType}${N}` = `${CLSType}${N}`>(
  name: N
): BEM<N, B> {
  const b = `${CLS_PREFIX}${name}` as B
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
 * 生成辅助
 * @param name 辅助类名称
 */
function is<const N extends string>(name: N): `is-${N}`
/**
 * 生成辅助类
 * @param name 辅助类名称
 * @param condition 辅助类显示条件
 */
function is<N extends string, C extends boolean>(
  name: N,
  condition: C
): C extends true ? `is-${N}` : ''
function is<N extends string>(name: N, condition?: undefined | boolean) {
  return condition === false ? '' : (`is-${name}` as const)
}

bem.is = is

export { bem }
