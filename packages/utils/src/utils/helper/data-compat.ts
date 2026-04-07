import { isObj, o, str } from '@cat-kit/core'

export { isObj }

export function kebabCase(s: string): string {
  return str(s).kebabCase()
}

export function getChainValue(obj: unknown, path: string): any {
  return String(path).split('.').reduce((o: any, k) => o?.[k], obj as any)
}

export function setChainValue(
  target: Record<string, any>,
  path: string,
  value: unknown
): Record<string, any> {
  const keys = String(path).split('.')
  let cur: Record<string, any> = target
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i]!
    if (cur[k] == null || typeof cur[k] !== 'object') cur[k] = {}
    cur = cur[k]
  }
  cur[keys[keys.length - 1]!] = value
  return target
}

export function equal(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true
  if (a == null || b == null) return a === b
  if (typeof a !== typeof b) return false
  if (typeof a !== 'object') return false
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false
    return a.every((v, i) => equal(v, b[i]))
  }
  const ak = Object.keys(a as object).sort()
  const bk = Object.keys(b as object).sort()
  if (ak.length !== bk.length) return false
  for (let i = 0; i < ak.length; i++) {
    if (ak[i] !== bk[i]) return false
    if (
      !equal(
        (a as Record<string, unknown>)[ak[i]!],
        (b as Record<string, unknown>)[bk[i]!]
      )
    ) {
      return false
    }
  }
  return true
}

export function pick<O extends Record<string, any>, K extends keyof O>(
  src: O,
  keys: readonly K[]
): Pick<O, K> {
  return o(src).pick([...keys] as K[]) as Pick<O, K>
}

export function omit<O extends Record<string, any>, K extends keyof O>(
  src: O,
  keys: readonly K[]
): Omit<O, K> {
  return o(src).omit([...keys] as K[]) as Omit<O, K>
}

export function objMap<K extends string, V, R>(
  obj: Partial<Record<K, V>>,
  fn: (v: V, k: K) => R
): Partial<Record<K, R>> {
  const out: Partial<Record<K, R>> = {}
  for (const k of Object.keys(obj) as K[]) {
    const v = obj[k]
    if (v !== undefined) out[k] = fn(v, k)
  }
  return out
}

export function mergeDeep<T extends Record<string, any>>(
  target: T,
  source: Record<string, any>
): T {
  const out: Record<string, any> = { ...target }
  for (const key of Object.keys(source)) {
    const sv = source[key]
    const tv = out[key]
    if (isObj(sv) && isObj(tv)) {
      out[key] = mergeDeep(tv as Record<string, any>, sv as Record<string, any>)
    } else if (sv !== undefined) {
      out[key] = sv
    }
  }
  return out as T
}
