import type { Row } from '@ui/types/components/row-form'
import { isReactive, shallowReactive } from 'vue'

/** 将里面的对象变成响应式 */
export function wrapDataRows(data: Record<string, any>[]) {
  return data.map((item: Record<string, any>, index: number) => {
    return isReactive(item) ? item : shallowReactive(item)
  })
}

const getIndexes = (indexes: number | number[]) => {
  if (Array.isArray(indexes)) {
    return indexes
  }
  if (typeof indexes === 'number') {
    return [indexes]
  }

  throw new Error('参数indexes类型错误')
}

/**
 *
 * @param indexes
 */
export function find(indexes: number) {
  let a = getIndexes(indexes)
  console.log(a, 'a')
}

/** 删除
 * @param indexes下标
 */
export function delRow(indexes: number | number[]) {}

/** 插入
 * @param modelData 数据
 * @param index 下标
 */
export function insetTo(modelData: Row<Record<string, any>>[], index: number) {
  return modelData
}
