/**
 * 创建一个介于vue的reactive和shallowReactive对象的中间层
 * @description
 * 如果对象含有嵌套对象，则**递归**进行中间代理
 *
 * @param o 代理对象
 * @param handler 处理函数
 * @param options 代理配置
 * @returns 中间代理对象
 */
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
      if (val !== null && typeof val === 'object') {
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
 * 中间代理, 用于vue的reactive和shallowReactive方法的中间层
 * @param o 代理对象
 * @param config 代理配置
 * @returns
 */
export function middleProxy<O extends Record<string, any>>(
  o: O,
  handler?: {
    set?: (field: string, val: any) => void
    get?: (field: string) => any
    /**
     * 数值变更回调，传入的参数是本次模型值变更的所有字段
     * @param fields 变更的字段
     */
    changed?: (fields: string[]) => void
  }
): O {
  return createMiddleProxy(o, handler) as O
}
