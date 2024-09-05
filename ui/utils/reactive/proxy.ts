import { isProxy } from 'vue'

/**
 * 中间代理对象, 用于vue的reactive和shallowReactive方法的中间层
 * @param o 代理对象
 * @param config 代理配置
 * @returns
 */
export function middleProxy<K extends string, O extends Record<string, any>>(
  o: O,
  config?: {
    set?: (field: K, val: any) => void
    get?: (field: K) => any
  }
): O {
  const weakMap = new WeakMap()

  return new Proxy(o, {
    set(target, field: K, val) {
      config?.set?.(field, val)

      target[field] = val

      return true
    },

    get(target, field: K) {
      config?.get?.(field)

      const val = target[field]
      if (typeof val === 'object' && !isProxy(val)) {
        if (weakMap.has(val)) return weakMap.get(val)
        const valProxy = middleProxy(val, config)
        weakMap.set(val, valProxy)
        return valProxy
      }

      return val
    }
  })
}
