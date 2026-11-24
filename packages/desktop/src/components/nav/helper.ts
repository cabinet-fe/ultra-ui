import type { NavItem } from '../../types'
import { walkNavWithPath } from './walk-nav-path'

export function getKey(index: number, parentKey: string): string {
  return `${parentKey}-${index}`
}

export function collectNavBranchPaths(menus?: NavItem[]): string[] {
  const paths: string[] = []
  if (!menus?.length) return paths

  for (const menu of menus) {
    walkNavWithPath(menu, (node) => {
      if (node.children?.length) {
        paths.push(node.path)
      }
    })
  }

  return paths
}
