import { o } from '@cat-kit/core'

export function getChainValue<T = unknown>(obj: object, path: string): T {
  return o(obj as Record<string, unknown>).get(path) as T
}

export function setChainValue(obj: object, path: string, value: unknown): void {
  o(obj as Record<string, unknown>).set(path, value)
}
