export type BEM<N extends string, P extends string = 'u-', B extends string = `${P}${N}`> = {
  b: B

  e<const E extends string>(name: E): `${B}__${E}`

  create<const Block extends string>(block: Block): BEM<`${N}-${Block}`, P>

  m<const M extends string>(m: M): `${B}--${M}`

  em<const E extends string, const M extends string>(e: E, m: M): `${B}__${E}--${M}`
}

export interface BEMFactory<Prefix extends string> {
  <N extends string>(name: N): BEM<N, Prefix>
  is<const N extends string>(name: N): `is-${N}`
  is<const N extends string, C extends boolean | undefined>(
    name: N,
    condition: C
  ): C extends true ? `is-${N}` : ''
}

export function makeBEM<Prefix extends '' | `${string}-`>(prefix: Prefix): BEMFactory<Prefix> {
  function bem<N extends string>(name: N): BEM<N, Prefix> {
    const b = `${prefix}${name}` as BEM<N, Prefix>['b']
    return {
      b,

      e(name) {
        return `${b}__${name}`
      },

      create(block) {
        return bem(`${name}-${block}`)
      },

      m(m) {
        return `${b}--${m}`
      },

      em(e, m) {
        return `${b}__${e}--${m}`
      }
    }
  }

  function is<const N extends string>(name: N): `is-${N}`
  function is<const N extends string, C extends boolean | undefined>(
    name: N,
    condition: C
  ): C extends true ? `is-${N}` : ''

  function is<N extends string>(name: N, condition?: boolean) {
    if (arguments.length < 2) return `is-${name}`
    return condition !== true ? '' : (`is-${name}` as const)
  }

  bem.is = is

  return bem
}
