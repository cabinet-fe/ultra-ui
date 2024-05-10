import { isArray } from 'cat-kit/fe'

interface ArrayItem {
  name?: string
  children?: ArrayItem[]
}

interface ArrayItem {
  [key: string]: any
}

export function processRecursiveArray(
  arr: Record<string,any>,
  key: string,
  cb: (item: ArrayItem) => void
): void {
  if (!isArray(arr)) {
    throw new Error('需要数组')
  }

  // 递归处理数组的函数
  function processArray(items: ArrayItem[]): void {
    items.forEach(item => {
      cb(item)

      if (item[key] && Array.isArray(item[key])) {
        processArray(item[key])
      }
    })
  }

  processArray(arr)
}
