import type { DualNavRootItem } from '../../types'
import { walkNavWithPath } from '../nav/walk-nav-path'

/** 根据当前路径反查所属顶层应用 */
export function findRootApp(
  menus: DualNavRootItem[] | undefined,
  currentPath?: string
): DualNavRootItem | undefined {
  if (!currentPath || !menus?.length) return undefined

  for (const app of menus) {
    if (app.path === currentPath) return app

    let matched = false
    walkNavWithPath(app, (node) => {
      if (node.path === currentPath) {
        matched = true
        return false
      }
    })
    if (matched) return app
  }

  return undefined
}
