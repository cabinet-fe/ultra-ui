import { CLS_PREFIX } from '../constants'

/**
 * css类命名辅助
 * @param name 类block名称
 */
function bem<N extends string>(name: N) {
  const b = `${CLS_PREFIX}${name}` as const
  return {
    /** CSS块 */
    b,
    /**
     * 获取CSS元素
     * @param name 元素名称
     * @returns
     */
    e<E extends string>(name: E) {
      return `${b}__${name}` as const
    },
    /**
     * 获取CSS元素与修饰符
     * @param e 元素名
     * @param m 修饰符名
     * @returns
     */
    em<E extends string, M extends string>(e: E, m: M) {
      return `${b}__${e}--${m}` as const
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
function is<N extends string, C extends boolean>(name: N, condition: C): C extends true ? `is-${N}` : ''
function is<N extends string>(name: N, condition?: boolean) {
  return condition === false ? '' : `is-${name}` as const
}

bem.is = is

export {
  bem
}