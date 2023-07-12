import { CLS_PREFIX } from '@ui/shared'

type CLSType = typeof CLS_PREFIX

/** BEM实例 */
export type BEM<N extends string, B extends string = `${CLSType}${N}`> = {
  b: B
  e<const E extends string>(name: E): `${B}__${E}`

  be<const Block extends string, const E extends string>(
    b: Block,
    e: E
  ): `${B}-${Block}__${E}`

  m<const M extends string>(m: M): `${B}--${M}`

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
    /** CSS块 */
    b,
    /**
     * 获取CSS元素
     * @param name 元素名称
     * @returns
     */
    e(name) {
      return `${b}__${name}`
    },
    /**
     * 块和元素组合
     * @param block
     * @param e
     * @returns
     */
    be(block, e) {
      return `${b}-${block}__${e}`
    },
    /**
     * 获取CSS元素与修饰符
     * @param m 修饰符名
     * @returns CSS元素与修饰符
     */
    m(m) {
      return `${b}--${m}`
    },
    /**
     * 获取CSS元素与修饰符
     * @param e 元素名
     * @param m 修饰符名
     * @returns
     */
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
function is<N extends string>(name: N, condition?: boolean) {
  return condition === false ? '' : (`is-${name}` as const)
}

bem.is = is

export { bem }
