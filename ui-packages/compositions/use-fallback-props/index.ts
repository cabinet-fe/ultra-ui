import { computed, type ComputedRef } from 'vue'
import { useConfig } from '../use-config'

type MapTuple<T extends any[], U> = {
  [K in keyof T]: U
}

/**
 * 使用回滚属性，用于控制多级属性的使用优先级，如果多级属性中不存在该值，则使用全局配置中的属性，如再不存在则为undefined
 * @param propsList 属性列表，最右边的属性优先级最高
 * @param propNames 属性名称
 */
export function useFallbackProps<Names extends string[]>(
  propsList: Record<string, any>[],
  propNames: [...Names]
): MapTuple<Names, ComputedRef<any>> {
  const { config } = useConfig()

  return propNames.map(propName => {
    return computed<any>(() => {
      for (let i = propsList.length - 1; i > -1; --i) {
        const props = propsList[i]!
        if (props[propName] !== undefined) {
          return props[propName]
        }
      }

      return config[propName as string]
    })
  }) as MapTuple<Names, ComputedRef<any>>
}

/**
 * 表单组件的回滚属性
 * @param propsList props列表
 * @returns
 */
export function useFormFallbackProps(
  propsList: Record<string, any>[],
) {
  const propNames =  ['size', 'disabled', 'readonly']
  const result = useFallbackProps(propsList, propNames)

  return propNames.reduce((acc, cur, index) => {
    acc[cur] = result[index]
    return acc
  }, {}) as {
    [key in 'size' | 'disabled' | 'readonly']: ComputedRef<any>
  }
}