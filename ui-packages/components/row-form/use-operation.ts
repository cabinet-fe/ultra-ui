import { isArray } from 'cat-kit/fe'
import { wrapDataRows } from './row-forms'

export const useOperation = () => {
  /** 插入
   * @param arr 要插入行的数组
   * @param indexes 要插入的行的索引数组
   * @returns 插入行的新数组
   */
  const insetTo = (arr: any[], index: number) => {
    if (index < 0 || index > arr.length)
      return console.error('不能传index=0或者arr=0的数据')

    let insetIndex = index + 1

    return wrapDataRows([
      ...arr.slice(0, insetIndex),
      {},
      ...arr.slice(insetIndex)
    ])
  }

  /** 删除row
   * @param arr 要删除行的数组
   * @param indexes 要删除的行的索引数组
   * @returns 删除行后的新数组
   */
  const delRows = (arr: any[], indexes: number[]) => {
    // 参数验证
    if (!isArray(arr) || !isArray(indexes)) {
      throw new Error('传入数组')
    }

    for (const index of indexes) {
      if (index > arr.length) {
        throw new Error('索引超出数组最大索引')
      }
    }

    /** 如果删除的是仅剩的一条就清空数据 */
    if (arr.length === 1) {
      return wrapDataRows([{}])
    }

    // 创建新数组，删除指定索引处的元素
    const newArray = arr.filter((_, index) => !indexes.includes(index))

    return wrapDataRows(newArray)
  }

  return { insetTo, delRows }
}
