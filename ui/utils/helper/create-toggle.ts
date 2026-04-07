type Active =
  | boolean
  | ((active: boolean) => boolean)
  | ((active: boolean) => Promise<boolean>)

type ToggleReturn = [{ value: boolean }, (active: Active) => void]
/**
 * 创建一个toggle函数
 * @param initial 初始值
 * @param onChange 值变化时的回调
 * @returns
 */
export function createToggle(
  initial = false,
  onChange?: (active: boolean) => void
): ToggleReturn {
  const state = {
    value: initial
  }

  function toggle(active: Active) {
    if (typeof active === 'boolean') {
      state.value = active
      return onChange?.(state.value)
    }

    const result = active(state.value)

    if (result instanceof Promise) {
      result.then(toggle)
    } else {
      toggle(result)
    }
  }

  return [state, toggle]
}
