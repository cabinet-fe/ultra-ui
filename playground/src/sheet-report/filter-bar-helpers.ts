import type { DatasetQueryParamValues } from './dataset-hub'

function toParamString(value: unknown): string {
  if (value == null || value === '') return ''
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  return ''
}

/** 将运行时 date-range 参数值规范为 [from, to] 字符串元组 */
export function parseDateRangeValue(raw: unknown): [string, string] {
  if (Array.isArray(raw)) {
    return [toParamString(raw[0]), toParamString(raw[1])]
  }
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>
    return [toParamString(obj.from ?? obj.start), toParamString(obj.to ?? obj.end)]
  }
  return ['', '']
}

/** 将运行时 number 参数值规范为 UNumberInput 可接受的 number | undefined */
export function resolveNumberParamValue(raw: unknown): number | undefined {
  if (raw === '' || raw == null) return undefined
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : undefined
}

/** 合并单参数变更，保持其余参数值不变 */
export function patchParamValues(
  values: DatasetQueryParamValues,
  id: string,
  value: unknown
): DatasetQueryParamValues {
  return { ...values, [id]: value }
}
