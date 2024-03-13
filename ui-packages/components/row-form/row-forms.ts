import { shallowReactive } from 'vue'

/** 将里面的对象变成响应式 */
export function wrapDataRows(data: any[]) {
  return data.map((item, index) => {
    const row = shallowReactive({
      ...item
    })

    return row
  })
}

/** 单条删除
 * @param modelData 数据
 * @param index 要删除的下标
 */
export function deleteIndex(modelData: Record<string, any>, index: number) {
  let newData =
    modelData.length === 1
      ? [{}]
      : [...modelData.slice(0, index), ...modelData.slice(index + 1)]

  return newData
}
