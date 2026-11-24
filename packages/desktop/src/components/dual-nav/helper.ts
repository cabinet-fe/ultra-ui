import type { DualNavRootItem, NavItem } from '../../types'
import { walkNavWithPath } from '../nav/walk-nav-path'

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

export function findFirstLeaf(node: NavItem): NavItem {
  if (!node.children?.length) return node
  return findFirstLeaf(node.children[0]!)
}
