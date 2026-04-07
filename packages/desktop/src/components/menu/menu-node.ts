import { TreeNode } from 'cat-kit'

export class MenuNode<Data extends Record<string, any>> extends TreeNode<Data> {
  override parent: MenuNode<Data> | null = null
  override children?: MenuNode<Data>[]
}
