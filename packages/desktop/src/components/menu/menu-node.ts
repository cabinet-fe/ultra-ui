import { TreeNode } from '@cat-kit/core'

export class MenuNode<Data extends Record<string, any>> extends TreeNode<
  Data,
  MenuNode<Data>
> {
  declare parent?: MenuNode<Data>
  declare children?: MenuNode<Data>[]
}
