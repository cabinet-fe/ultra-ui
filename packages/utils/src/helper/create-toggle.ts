type Active = boolean | ((active: boolean) => boolean) | ((active: boolean) => Promise<boolean>)

type ToggleReturn = [{ value: boolean }, (active: Active) => void]

export function createToggle(initial = false, onChange?: (active: boolean) => void): ToggleReturn {
  const state = { value: initial }

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
