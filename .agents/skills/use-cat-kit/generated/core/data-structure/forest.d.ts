import { ITreeNode, TreeNode } from "./tree.js";

//#region src/data-structure/forest.d.ts
type Obj = Record<string, unknown>;
/**
 * 森林节点接口
 * @template T - 原始数据类型
 * @template Self - 节点自身类型
 */
interface IForestNode<T extends Obj = Obj, Self = IForestNode<T, unknown>> extends ITreeNode<T, Self> {
  /** 所属森林实例 */
  forest: Forest<T, Self extends Obj ? Self : Obj>;
}
/**
 * 森林节点类 - 支持根节点级别的移除操作
 * @template T - 原始数据类型
 * @template Self - 节点自身类型，用于继承时的类型推导
 *
 * @example
 * class MyForestNode<T extends Obj> extends ForestNode<T, MyForestNode<T>> {
 *   selected = false
 * }
 */
declare class ForestNode<T extends Obj = Obj, Self extends ForestNode<T, Self> = ForestNode<T, any>> extends TreeNode<T, Self> {
  /** 索引签名，支持动态属性访问 */
  [key: string]: unknown;
  readonly forest: Forest<T, Self>;
  constructor(data: T, index: number, depth: number, forest: Forest<T, Self>, parent?: Self);
  remove(): void;
}
/**
 * 节点创建函数类型
 */
type ForestNodeCreator<T extends Obj, Node extends Obj> = (data: T, index: number, depth: number, forest: Forest<T, Node>, parent: Node | undefined) => Node;
/**
 * Forest 配置选项（基础）
 */
interface ForestOptionsBase<T extends Obj> {
  data: T[];
  childrenKey?: string;
}
/**
 * Forest 配置选项（带 createNode）
 */
interface ForestOptionsWithCreator<T extends Obj, Node extends Obj> extends ForestOptionsBase<T> {
  createNode: ForestNodeCreator<T, Node>;
}
/**
 * 森林管理器 - 管理多棵树
 * @template T - 原始数据类型
 * @template Node - 节点类型
 *
 * @example
 * // 使用自定义节点
 * const forest = new Forest({
 *   data: [{ id: 1 }, { id: 2, children: [{ id: 3 }] }],
 *   createNode: (data, index, depth, forest, parent) => ({
 *     data,
 *     index,
 *     depth,
 *     forest,
 *     parent,
 *     get isLeaf() { return !data.children?.length }
 *   })
 * })
 */
declare class Forest<T extends Obj, Node extends Obj = T> {
  roots: Node[];
  protected childrenKey: string;
  protected nodeCreator?: ForestNodeCreator<T, Node>;
  constructor(options: ForestOptionsBase<T>);
  constructor(options: ForestOptionsWithCreator<T, Node>);
  /**
   * 构建单棵树
   */
  protected buildTree(data: T, rootIndex: number): Node;
  /**
   * 深度优先遍历所有树
   * @param callback - 回调函数，返回 true 时提前终止当前树的遍历
   */
  dfs(callback: (node: Node, index: number, parent?: Node) => void | boolean): void;
  /**
   * 广度优先遍历所有树
   * @param callback - 回调函数，返回 true 时提前终止当前树的遍历
   */
  bfs(callback: (node: Node, index: number, parent?: Node) => void | boolean): void;
  /**
   * 扁平化所有树为数组
   * @param filter - 可选的过滤函数
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
   */
  findAll(predicate: (node: Node) => boolean): Node[];
  /**
   * 获取所有叶子节点
   */
  getLeaves(): Node[];
  /**
   * 获取节点总数
   */
  get size(): number;
  /**
   * 计算所有树的最大深度
   */
  getMaxDepth(): number;
  /**
   * 获取节点的可见后代（用于虚拟滚动的增量更新）
   *
   * @param node - 目标节点
   * @param isExpanded - 判断节点是否展开的函数
   * @returns 可见后代节点数组（深度优先顺序）
   */
  getVisibleDescendants(node: Node, isExpanded: (node: Node) => boolean): Node[];
  /**
   * 计算节点的可见后代数量（用于虚拟滚动的增量更新）
   *
   * @param node - 目标节点
   * @param isExpanded - 判断节点是否展开的函数
   * @returns 可见后代节点数量
   */
  getVisibleDescendantCount(node: Node, isExpanded: (node: Node) => boolean): number;
  /**
   * 扁平化森林为数组（仅包含可见节点，用于虚拟滚动）
   *
   * @param isExpanded - 判断节点是否展开的函数
   * @returns 可见节点数组（深度优先顺序）
   */
  flattenVisible(isExpanded: (node: Node) => boolean): Node[];
}
//#endregion
export { Forest, ForestNode, ForestNodeCreator, ForestOptionsBase, ForestOptionsWithCreator, IForestNode };
//# sourceMappingURL=forest.d.ts.map