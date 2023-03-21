import { CLS_PREFIX } from '../constants'

export default function className<N extends string>(name: N) {
  const b = `${CLS_PREFIX}-${name}` as const
  return {
    b,
    e<E extends string>(name: E) {
      return `${b}__${name}` as const
    },
    em<E extends string, M extends string>(e: E, m: M) {
      return `${b}__${e}--${m}` as const
    }
  }
}
