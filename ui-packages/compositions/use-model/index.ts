import { ref, watch } from 'vue'

interface ModelOptions<
  P extends Record<string, unknown>,
  N extends keyof P,
  F extends Function
> {
  /** 组件定义的属性 */
  props: P
  /** 属性名称 */
  propName: N
  /** 事件触发函数 */
  emit: F
  /** 是否为本地模式, 本地模式允许组件不受控赋值 */
  local?: boolean
}

/**
 * 返回一个基于提供的选项的响应式模型值。
 * 该方法在将来可能会被替代, 目前使用时为了类型提示可用
 * 如果 local 选项为true, 模型值将是响应式的，并与属性值同步。
 * 如果 local 选项为 false，则模型值将是一个代理对象，具有 getter 和 setter。当值发生更改时，它会触发一个更新事件。
 * @param options - 选项
 * @returns - 一个模型值
 */
export function useModel<
  P extends Record<string, unknown>,
  N extends keyof P,
  F extends Function
>(options: ModelOptions<P, N, F>) {
  // Destructure the options object
  const { props, propName, emit, local = true } = options

  if (local) {
    // 创建一个响应式对象
    const value = ref<P[N]>()

    // 监听属性的变更
    watch(
      () => props[propName],
      v => {
        if (value.value === v) return
        value.value = v
      }
    )

    watch(value, v => {
      emit(`update:${propName as string}`, v)
    })

    return value
  }

  // 创建一个拥有getter和setter的对象
  const value = {
    __v_isRef: true,

    get value() {
      return props[propName]
    },

    set value(v: P[N]) {
      emit(`update:${propName as string}`, v)
    }
  }

  return value
}
