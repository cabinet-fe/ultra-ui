export function objMap<K extends string, V, R>(
  obj: Record<K, V>,
  fn: (value: V, key: K) => R
): Record<K, R> {
  const out = {} as Record<K, R>
  for (const key of Object.keys(obj) as K[]) {
    out[key] = fn(obj[key], key)
  }
  return out
}
