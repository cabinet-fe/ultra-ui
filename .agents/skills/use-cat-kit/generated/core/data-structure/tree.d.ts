//#region src/data-structure/tree.d.ts
type Obj = Record<string, unknown>;
type Callback<Node extends Obj> = (node: Node, index: number, parent?: Node) => void | boolean;
/**
 * 深度优先遍历
 * @param data - 根节点
 * @param cb - 回调函数，返回 true 时提前终止遍历
 * @param childrenKey - 子节点属性名
 * @returns 如果提前终止返回 true
 */
declare function dfs<T extends Obj>(data: T, cb: Callback<T>, childrenKey?: string): boolean | void;
/**
 * 广度优先遍历
 * @param data - 根节点
 * @param cb - 回调函数，返回 true 时提前终止遍历
 * @param childrenKey - 子节点属性名
 * @returns 如果提前终止返回 true
 */
declare function bfs<T extends Obj>(data: T, cb: Callback<T>, childrenKey?: string): boolean | void;
/**
 * 树节点接口
 * @template T - 原始数据类型
 * @template Self - 节点自身类型，用于 parent/children 的递归类型定义
 *
 * @example
 * // 简单使用
 * type Node = ITreeNode<DataItem>
 *
 * // 扩展使用 - 让 parent/children 类型与扩展后的接口一致
 * interface MyNode extends ITreeNode<DataItem, MyNode> {
 *   extra: string
 * }
 */
interface ITreeNode<T extends Obj = Obj, Self = ITreeNode<T, unknown>> {
  data: T;
  depth: number;
  index: number;
  isLeaf: boolean;
  parent?: Self;
  children?: Self[];
}
/**
 * 树节点类 - 提供节点操作方法
 * @template T - 原始数据类型
 * @template Self - 节点自身类型，用于继承时的类型推导
 *
 * @example
 * // 直接使用
 * const node = new TreeNode(data, 0, 0)
 *
 * // 继承扩展
 * class MyTreeNode<T extends Obj> extends TreeNode<T, MyTreeNode<T>> {
 *   extra: string = ''
 * }
 */
declare class TreeNode<T extends Obj = Obj, Self extends TreeNode<T, Self> = TreeNode<T, any>> implements ITreeNode<T, Self> {
  data: T;
  /** 父节点 */
  parent?: Self;
  /** 子节点 */
  children?: Self[];
  /** 在树中的深度，从零开始 */
  depth: number;
  /** 在树中的索引 */
  index: number;
  get isLeaf(): boolean;
  constructor(data: T, index: number, depth: number, parent?: Self);
  /** 移除当前节点 */
  remove(): void;
  /**
   * 插入子节点
   * @param node - 要插入的节点
   * @param index - 插入位置，默认追加到末尾
   */
  insert(node: Self, index?: number): void;
  /**
   * 获取从根节点到当前节点的路径
   * @returns 路径数组，从根节点到当前节点
   */
  getPath(): Self[];
  /**
   * 获取所有祖先节点
   * @returns 祖先节点数组，从父节点到根节点
   */
  getAncestors(): Self[];
  /**
   * 检查是否为指定节点的祖先
   */
  isAncestorOf(node: Self): boolean;
  /**
   * 检查是否为指定节点的后代
   */
  isDescendantOf(node: Self): boolean;
  /**
   * 获取可见后代节点（用于虚拟滚动的增量更新）
   * @param isExpanded - 判断节点是否展开的函数
   * @returns 可见后代节点数组（深度优先顺序）
   *
   * @example
   * // 展开节点时，获取需要插入的节点
   * const descendants = node.getVisibleDescendants(n => n.expanded)
   * flatList.splice(nodeIndex + 1, 0, ...descendants)
   */
  getVisibleDescendants(isExpanded: (node: Self) => boolean): Self[];
  /**
   * 计算可见后代节点数量（用于虚拟滚动的增量更新）
   * @param isExpanded - 判断节点是否展开的函数
   * @returns 可见后代节点数量
   *
   * @example
   * // 折叠节点时，计算需要移除的节点数量
   * const count = node.getVisibleDescendantCount(n => n.expanded)
   * flatList.splice(nodeIndex + 1, count)
   */
  getVisibleDescendantCount(isExpanded: (node: Self) => boolean): number;
}
/**
 * 节点创建函数类型
 * @template T - 原始数据类型
 * @template Node - 创建的节点类型
 */
type NodeCreator<T extends Obj, Node> = (data: T, index: number, depth: number, parent: Node | undefined) => Node;
/**
 * TreeManager 配置选项（不带 createNode）
 */
interface TreeManagerOptionsBase {
  childrenKey?: string;
}
/**
 * TreeManager 配置选项（带 createNode）
 */
interface TreeManagerOptionsWithCreator<T extends Obj, Node> extends TreeManagerOptionsBase {
  createNode: NodeCreator<T, Node>;
}
/**
 * 树管理器 - 用于构建和管理树结构
 * @template T - 原始数据类型
 * @template Node - 节点类型
 *
 * @example
 * // 不使用 createNode，直接使用原始数据
 * const tree = new TreeManager(data)
 *
 * // 使用 createNode 创建自定义节点
 * const tree = new TreeManager(data, {
 *   createNode: (data, index, depth, parent) => ({
 *     data,
 *     index,
 *     depth,
 *     get isLeaf() { return !data.children?.length },
 *     parent
 *   })
 * })
 */
declare class TreeManager<T extends Obj, Node extends Obj = T> {
  protected _root: Node;
  get root(): Node;
  protected nodeCreator?: NodeCreator<T, Node>;
  protected childrenKey: string;
  /**
   * 构造函数 - 不使用 createNode
   */
  constructor(data: T, options?: TreeManagerOptionsBase);
  /**
   * 构造函数 - 使用 createNode
   */
  constructor(data: T, options: TreeManagerOptionsWithCreator<T, Node>);
  /**
   * 从原始数据构建节点树
   */
  protected buildTree(data: T): Node;
  /**
   * 深度优先遍历
   * @param callback - 回调函数，返回 true 时提前终止
   */
  dfs(callback: (node: Node, index: number, parent?: Node) => void | boolean): void;
  /**
   * 广度优先遍历
   * @param callback - 回调函数，返回 true 时提前终止
   */
  bfs(callback: (node: Node, index: number, parent?: Node) => void | boolean): void;
  /**
   * 扁平化树为数组
   * @param filter - 可选的过滤函数
   * @returns 节点数组
   */
  flatten(filter?: (node: Node) => boolean): Node[];
  /**
   * 查找单个节点
   * @param predicate - 匹配函数
   * @returns 第一个符合条件的节点，未找到返回 null
   */
  find(predicate: (node: Node) => boolean): Node | null;
  /**
   * 查找所有符合条件的节点
   * @param predicate - 匹配函数
   * @returns 所有符合条件的节点数组
   */
  findAll(predicate: (node: Node) => boolean): Node[];
  /**
   * 获取所有叶子节点
   */
  getLeaves(): Node[];
  /**
   * 获取指定深度的所有节点
   * @param depth - 目标深度
   */
  getNodesAtDepth(depth: number): Node[];
  /**
   * 计算树的最大深度
   */
  getMaxDepth(): number;
  /**
   * 获取节点的可见后代（用于虚拟滚动的增量更新）
   *
   * @param node - 目标节点
   * @param isExpanded - 判断节点是否展开的函数
   * @returns 可见后代节点数组（深度优先顺序）
   *
   * @example
   * // 展开节点时，获取需要插入的节点
   * const descendants = tree.getVisibleDescendants(node, n => n.expanded)
   * flatList.splice(nodeIndex + 1, 0, ...descendants)
   */
  getVisibleDescendants(node: Node, isExpanded: (node: Node) => boolean): Node[];
  /**
   * 计算节点的可见后代数量（用于虚拟滚动的增量更新）
   *
   * @param node - 目标节点
   * @param isExpanded - 判断节点是否展开的函数
   * @returns 可见后代节点数量
   *
   * @example
   * // 折叠节点时，计算需要移除的节点数量
   * const count = tree.getVisibleDescendantCount(node, n => n.expanded)
   * flatList.splice(nodeIndex + 1, count)
   */
  getVisibleDescendantCount(node: Node, isExpanded: (node: Node) => boolean): number;
  /**
   * 扁平化树为数组（仅包含可见节点，用于虚拟滚动）
   *
   * @param isExpanded - 判断节点是否展开的函数
   * @returns 可见节点数组（深度优先顺序）
   *
   * @example
   * // 初始化时获取可见节点列表
   * const flatList = tree.flattenVisible(n => n.expanded)
   */
  flattenVisible(isExpanded: (node: Node) => boolean): Node[];
}
//#endregion
export { ITreeNode, NodeCreator, TreeManager, TreeManagerOptionsBase, TreeManagerOptionsWithCreator, TreeNode, bfs, dfs };
//# sourceMappingURL=tree.d.ts.map