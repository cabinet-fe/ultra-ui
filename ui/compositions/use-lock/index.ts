// 数据回显是一个查询过程

import { nextTick } from 'vue'

type Update = (fn: Function) => any
type Lock = (fn: Function) => Promise<void>

/**
 * 数据更新锁
 * @description
 * 更新锁主要用于防止组件数据更新时，循环触发更新。
 *
 * @returns 该函数返回一个长度为2的元组，元组中包含两个函数：
 * 1. update: 更新函数，在非锁定时执行传入的函数
 * 2. lock: 锁定函数，执行时会锁定更新操作，直到锁定操作结束
 */
export function useUpdateLock(): [Update, Lock] {
  let locked = false

  function update(fn: Function) {
    if (locked) return
    return fn()
  }

  async function lock(fn: Function) {
    locked = true
    try {
      await fn()
      await nextTick()
    } catch (error) {
      console.error(error)
    }
    locked = false
  }

  return [update, lock]
}
