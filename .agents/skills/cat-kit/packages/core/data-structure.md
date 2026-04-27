# core — data-structure

树（Tree）和森林（Forest）数据结构实现及相关遍历工具。

## TreeManager

```ts
class TreeManager<T, Node extends ITreeNode<T, Node> = TreeNode<T, TreeNode<T, any>>>
```

树管理器，以单个根节点管理整棵树。

**构造器**：

```ts
new TreeManager(rootData: T, options?: TreeManagerOptionsBase)
// 或带自定义节点创建器
new TreeManager(rootData: T, options: TreeManagerOptionsWithCreator<T, Node>)
```

选项：`childrenKey`（默认 `'children'`）、`createNode`（自定义节点工厂）。

**属性**：

| 属性 | 说明 |
|------|------|
| `.root` | 树的根节点 |

**遍历方法**：

| 方法 | 说明 |
|------|------|
| `.dfs(cb)` | 深度优先遍历。cb 返回 `true` 提前终止 |
| `.bfs(cb)` | 广度优先遍历。cb 返回 `true` 提前终止 |
| `.flatten(filter?)` | 扁平化为数组，可按条件过滤 |
| `.flattenVisible(isExpanded)` | 按展开状态扁平化可见节点 |

**查找方法**：

| 方法 | 说明 |
|------|------|
| `.find(predicate)` | 查找第一个匹配节点 |
| `.findAll(predicate)` | 查找所有匹配节点 |
| `.getLeaves()` | 获取所有叶子节点 |
| `.getNodesAtDepth(depth)` | 获取指定深度的节点 |
| `.getMaxDepth()` | 获取最大深度 |
| `.getVisibleDescendants(node, isExpanded)` | 获取节点在展开状态下的可见后代 |
| `.getVisibleDescendantCount(node, isExpanded)` | 获取可见后代数量 |

## TreeNode

```ts
class TreeNode<T, Self>
```

**属性**：

| 属性 | 类型 | 说明 |
|------|------|------|
| `.data` | `T` | 节点数据 |
| `.depth` | `number` | 深度（根节点为 0） |
| `.index` | `number` | 在父节点 children 中的索引 |
| `.isLeaf` | `boolean` | 是否为叶节点 |
| `.parent` | `Self \| null` | 父节点 |
| `.children` | `Self[]` | 子节点列表 |

**方法**：

| 方法 | 说明 |
|------|------|
| `.remove()` | 从父节点移除自身（含 index 过期兜底） |
| `.insert(node, index?)` | 插入子节点（自动更新子树 depth） |
| `.getPath()` | 从根到自身的节点路径 |
| `.getAncestors()` | 获取所有祖先节点（由近到远） |
| `.isAncestorOf(node)` | 判断是否为指定节点的祖先 |
| `.isDescendantOf(node)` | 判断是否为指定节点的后代 |
| `.getVisibleDescendants(isExpanded)` | 获取展开状态下的可见后代 |
| `.getVisibleDescendantCount(isExpanded)` | 获取可见后代数量 |

## Forest

```ts
class Forest<T, Node extends IForestNode<T, Node> = ForestNode<T, ForestNode<T, any>>>
```

森林管理器，管理多棵树的集合。

**构造器**：

```ts
new Forest(options: ForestOptionsBase<T>)
// 或带自定义节点创建器
new Forest(options: ForestOptionsWithCreator<T, Node>)
```

**属性**：

| 属性 | 说明 |
|------|------|
| `.roots` | 所有根节点数组 |
| `.size` | 树干总数 |

**方法**与 `TreeManager` 类似：`dfs`、`bfs`、`flatten`、`find`、`findAll`、`getLeaves`、`getMaxDepth`、`flattenVisible`、`getVisibleDescendants`、`getVisibleDescendantCount`。

## 通用遍历工具

### `dfs`

```ts
function dfs<T extends Obj>(data: T, cb: Callback<T>, childrenKey?: string): boolean | void
```

深度优先遍历（非递归栈实现）。cb 返回 `true` 时提前终止。

### `bfs`

```ts
function bfs<T extends Obj>(data: T, cb: Callback<T>, childrenKey?: string): boolean | void
```

广度优先遍历（队列实现）。cb 返回 `true` 时提前终止。

```ts
const tree = { id: 1, items: [{ id: 2, items: [] }, { id: 3, items: [] }] }
dfs(tree, (node) => {
  console.log(node.id)
}, 'items') // 1, 2, 3
bfs(tree, (node) => {
  console.log(node.id)
}, 'items') // 1, 2, 3
```

> 类型签名：`../../generated/core/data-structure/`
