import { createBuiltinTools } from '../tools'
import type { ChatTokenUsage, ChatTool } from './types'

export function serializeResult(result: unknown): string {
  if (typeof result === 'string') return result
  try {
    return JSON.stringify(result) ?? 'null'
  } catch {
    return String(result)
  }
}

/** 内置工具 + 用户工具，同名时内置优先 */
export function resolveTools(userTools?: ChatTool[]): ChatTool[] {
  const builtins = createBuiltinTools()
  const names = new Set(builtins.map((t) => t.name))
  return [...builtins, ...(userTools ?? []).filter((t) => !names.has(t.name))]
}

function mergeOptionalCount(a?: number, b?: number): number | undefined {
  if (a == null && b == null) return undefined
  return (a ?? 0) + (b ?? 0)
}

/** 累加两次 usage；缓存字段只在至少一侧有值时保留 */
export function addTokenUsage(a: ChatTokenUsage, b: ChatTokenUsage): ChatTokenUsage {
  const usage: ChatTokenUsage = {
    promptTokens: a.promptTokens + b.promptTokens,
    completionTokens: a.completionTokens + b.completionTokens,
    totalTokens: a.totalTokens + b.totalTokens
  }
  const cacheHitTokens = mergeOptionalCount(a.cacheHitTokens, b.cacheHitTokens)
  if (cacheHitTokens != null) usage.cacheHitTokens = cacheHitTokens
  const cacheMissTokens = mergeOptionalCount(a.cacheMissTokens, b.cacheMissTokens)
  if (cacheMissTokens != null) usage.cacheMissTokens = cacheMissTokens
  const cacheCreationTokens = mergeOptionalCount(a.cacheCreationTokens, b.cacheCreationTokens)
  if (cacheCreationTokens != null) usage.cacheCreationTokens = cacheCreationTokens
  return usage
}
