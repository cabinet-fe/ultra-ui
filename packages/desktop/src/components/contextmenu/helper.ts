import type { ContextmenuItem } from '../../types'

export function getMenuDisabled(menu: ContextmenuItem): boolean {
  return (typeof menu.disabled === 'function' ? menu.disabled() : menu.disabled) ?? false
}
