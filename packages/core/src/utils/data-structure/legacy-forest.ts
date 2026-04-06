import { o } from '@cat-kit/core'
import type { TreeNode } from '@cat-kit/core'

type DataOf<N extends TreeNode<any>> = N extends TreeNode<infer D>
  ? D extends Record<string, any>
    ? D
    : Record<string, any>
  : Record<string, any>

export interface ForestCreateOptions<Node extends TreeNode<any>> {
  createNode: (data: DataOf<Node>, index: number, parent?: Node) => Node
  childrenKey?: string
}

/**
 * 与历史 cat-kit/fe 对齐：`Forest.create`、`nodes`、`size`、`dft` / `bft`
 *（回调返回 `false` 时不继续遍历该节点子树）。
 */
export class Forest<Node extends TreeNode<any>> {
  nodes: Node[]

  size = 0

  private constructor(nodes: Node[]) {
    this.nodes = nodes
    this.recomputeSize()
  }

  static create<Node extends TreeNode<any>>(
    data: DataOf<Node>[],
    options: ForestCreateOptions<Node>
  ): Forest<Node> {
    const { createNode, childrenKey = 'children' } = options
    const nodes = data.map((item, index) =>
      buildNodeTree(item, index, undefined, createNode, childrenKey, 0)
    )
    return new Forest(nodes)
  }

  private recomputeSize(): void {
    let n = 0
    this.dft(() => {
      n++
    })
    this.size = n
  }

  dft(cb: (node: Node) => void | false): void {
    for (const root of this.nodes) {
      dfsNode(root, cb)
    }
  }

  bft(cb: (node: Node) => void | false): void {
    const queue: Node[] = [...this.nodes]
    while (queue.length) {
      const node = queue.shift()!
      const ret = cb(node)
      if (ret === false) continue
      const ch = node.children as Node[] | undefined
      if (ch?.length) queue.push(...ch)
    }
  }
}

function dfsNode<Node extends TreeNode<any>>(
  node: Node,
  cb: (node: Node) => void | false
): void {
  const ret = cb(node)
  if (ret === false) return
  const ch = node.children as Node[] | undefined
  if (!ch?.length) return
  for (const c of ch) dfsNode(c as Node, cb)
}

function buildNodeTree<Node extends TreeNode<any>>(
  data: DataOf<Node>,
  index: number,
  parent: Node | undefined,
  createNode: (data: DataOf<Node>, index: number, parent?: Node) => Node,
  childrenKey: string,
  depth: number
): Node {
  const node = createNode(data, index, parent)
  node.index = index
  node.depth = depth
  ;(node as { parent?: Node }).parent = parent

  const rawChildren = o(data).get(childrenKey)
  if (Array.isArray(rawChildren) && rawChildren.length) {
    ;(node as { children?: Node[] }).children = rawChildren.map(
      (child: DataOf<Node>, i: number) =>
        buildNodeTree(child, i, node, createNode, childrenKey, depth + 1)
    )
    node.isLeaf = false
  } else {
    node.children = undefined
    node.isLeaf = true
  }

  return node
}
