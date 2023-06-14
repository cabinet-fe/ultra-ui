/**
 * 给数值加上单位
 * @param value 数值
 * @param unit 单位
 * @returns
 */
export function withUnit(value: number | string | undefined, unit: string) {
  return value === undefined
    ? undefined
    : typeof value === 'number'
    ? String(value) + unit
    : value
}
