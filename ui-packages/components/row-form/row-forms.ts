import type { Row } from '@ui/types/components/row-form'
import { isReactive, shallowReactive } from 'vue'

/** 将里面的对象变成响应式 */
export function wrapDataRows(data: Record<string, any>[]) {
  return data.map((item: Record<string, any>, index: number) => {
    return createRow(item, index)
  })
}

let uid = 0

/** 创建row
 * @param 当前条
 */
const createRow = (
  data: Record<string, any>,
  index: number
): Row<Record<string, any>> => {
  return shallowReactive({
    /** 数据 */
    data: isReactive(data) ? data : shallowReactive(data),
    /** 下标 */
    index,
    /** 叶子节点 */
    isLeaf: false,
    /** 加载 */
    loading: false,
    /** 是否展开 */
    expanded: false,
    /** 数据的id */
    uid: uid++,
    /** 树深度 */
    depth: 0
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
