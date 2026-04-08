import { UITheme } from './theme/ui-theme'
import { lightTheme } from './theme/light'
import { darkTheme } from './theme/dark'
import { shallowRef, type ShallowRef } from 'vue'

export const currentTheme: ShallowRef<UITheme | undefined> =
  shallowRef<UITheme>()

export type * from './type'
export { UITheme } from './theme/ui-theme'
export { lightTheme, darkTheme }

export function setTheme(mode: 'light' | 'dark' | 'auto'): void {
  UITheme.setTheme(mode)
}
