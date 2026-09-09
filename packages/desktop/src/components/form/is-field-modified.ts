/** 判断字段当前值相对基准值是否已变更 */
export function isFieldModified(current: unknown, initial: unknown): boolean {
  if (current === initial) return false

  const currentNullish = current === null || current === undefined || current === ''
  const initialNullish = initial === null || initial === undefined || initial === ''
  if (currentNullish && initialNullish) return false

  const currentIsObject = current !== null && typeof current === 'object'
  const initialIsObject = initial !== null && typeof initial === 'object'
  if (currentIsObject || initialIsObject) {
    return JSON.stringify(current) !== JSON.stringify(initial)
  }

  return true
}
