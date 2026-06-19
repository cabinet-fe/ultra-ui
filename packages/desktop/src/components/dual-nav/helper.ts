import type { DualNavRootItem, NavItem } from '../../types'
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

/** 深度优先查找首个叶子节点（无子级或子级为空） */
export function findFirstLeaf(node: NavItem): NavItem {
  if (!node.children?.length) return node
  return findFirstLeaf(node.children[0]!)
}
