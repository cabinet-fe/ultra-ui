
/**
 * 创建一个自增函数
 * @param initial 初始值
 * @returns
 */
export function createIncrease(initial = 1000): () => number {
  let value = initial

  const increase = () => {
    return value++
  }

  return increase
}
