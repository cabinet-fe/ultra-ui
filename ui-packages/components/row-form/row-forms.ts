import type { rowType } from '@ui/types/components/row-form'
import { isReactive, shallowReactive } from 'vue'

/** 将里面的对象变成响应式 */
export function wrapDataRows(data: rowType[]) {
  return data.map(item => {
    const row: rowType = isReactive(item) ? item : shallowReactive(item)
    // console.log({...row, children: row.children ? row.children : []},'123')

    return row
  })
}

/** 创建row
 * @param 当前条
 */
export function createRow(row: rowType) {
  // const newRow = { ...row, children: row.children ? row.children : [] }
  // return shallowReactive(newRow)
}

/** 单条删除
 * @param modelData 数据
 * @param index 要删除的下标
 */
export function deleteIndex(modelData: rowType[], index: number) {
  let newData =
    modelData.length === 1
      ? [{}]
      : [...modelData.slice(0, index), ...modelData.slice(index + 1)]

  return newData
}

/** 插入
 * @param modelData 数据
 * @param index 下标
 */
export function insetTo(modelData: rowType[], index: number) {
  // console.log(modelData, index, 'modelData: rowType[]')
  // 创建一个空数据对象
  const emptyData = { dd: '新条目', cc: '' }
  // let a = modelData
  modelData.splice(index + 1, 0, emptyData)

  return modelData
}
