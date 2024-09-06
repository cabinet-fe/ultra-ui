import { isProxy } from 'vue'

function createMiddleProxy(
  o: Record<string, any>,
  handler?: {
    set?: (field: string, val: any) => void
    get?: (field: string) => any
    changed?: (fields: string[]) => void
  },
  options?: {
    weakMap?: WeakMap<Record<string, any>, any>
    parentsField?: string
    changedFields?: string[]
  }
) {
  let { weakMap, parentsField, changedFields = [] } = options || {}
  if (!weakMap) {
    weakMap = new WeakMap()
  }

  return new Proxy(o, {
    set(target, field: string, val) {
      const changedField = parentsField ? `${parentsField}.${field}` : field
      handler?.set?.(changedField, val)
      target[field] = val

      changedFields.push(changedField)
      Promise.resolve().then(() => {
        if (!changedFields.length) return
        handler?.changed?.([...changedFields])
        changedFields.splice(0)
      })

      return true
    },

    get(target, field: string) {
      handler?.get?.(field)

      const val = target[field]
      if (val !== null && typeof val === 'object' && !isProxy(val)) {
        if (weakMap.has(val)) return weakMap.get(val)
        const valProxy = createMiddleProxy(val, handler, {
          weakMap,
          parentsField: parentsField ? `${parentsField}.${field}` : field,
          changedFields
        })
        weakMap.set(val, valProxy)

        return valProxy
      }

      return val
    }
  })
}

/**
 * 中间代理对象, 用于vue的reactive和shallowReactive方法的中间层
 * @param o 代理对象
 * @param config 代理配置
 * @returns
 */
export function middleProxy<O extends Record<string, any>>(
  o: O,
  handler?: {
    set?: (field: string, val: any) => void
    get?: (field: string) => any
    changed?: (fields: string[]) => void
  }
): O {
  return createMiddleProxy(o, handler) as O
}
