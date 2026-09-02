# 树与森林 — API

```ts
declare function dfs<T extends Record<string, unknown>>(
  data: T,
  cb: (node: T, index: number, parent?: T) => void | boolean,
  childrenKey?: string
): boolean | void

declare function bfs<T extends Record<string, unknown>>(
  data: T,
  cb: (node: T, index: number, parent?: T) => void | boolean,
  childrenKey?: string
): boolean | void

declare class TreeManager<T extends Record<string, unknown>, Node = T> {
  constructor(
    data: T,
    options?: {
      childrenKey?: string
      createNode?: NodeCreator<T>
    }
  )
  flatten(filter?: (node: Node) => boolean): Node[]
  flattenVisible(isExpanded: (node: Node) => boolean): Node[]
  // find、dfs、bfs、getRoot 等见 generated
}

declare class Forest<T extends Record<string, unknown>, Node = T> {
  constructor(
    roots: T[],
    options?: {
      childrenKey?: string
      createNode?: ForestNodeCreator<T>
    }
  )
  flatten(filter?: (node: Node) => boolean): Node[]
  flattenVisible(isExpanded: (node: Node) => boolean): Node[]
}
```

`TreeNode` / `ForestNode` 提供 `remove`、`insert`、祖先/可见后代等方法。完整签名见 generated。
