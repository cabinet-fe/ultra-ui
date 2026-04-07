//#region src/data-structure/tree.d.ts
type Callback<Node extends TreeNode<any>> = (node: Node, index: number, parent?: Node) => void | boolean;
declare class TreeNode<T extends Record<string, any> = Record<string, any>> {
  data: T;
  /** 父节点 */
  parent?: this;
  /** 子节点 */
  children?: this[];
  /** 在树中的深度 */
  depth: number;
  /** 是否叶子节点 */
  isLeaf: boolean;
  /** 在树中的索引 */
  index: number;
  constructor(data: T);
  dfs(cb: Callback<this>): boolean | void;
  bfs(cb: Callback<this>): boolean | void;
  /** 移除当前节点 */
  remove(): void;
}
interface TreeOptions<Data extends Record<string, any>, Node extends TreeNode<Data>> {
  data: Data;
  TreeNode: new (data: Data) => Node;
  childrenKey?: string;
}
declare class Tree<Data extends Record<string, any>, Node extends TreeNode<Data>> {
  readonly root: Node;
  constructor(options: TreeOptions<Data, Node>);
  dfs(cb: Callback<Node>): boolean | void;
  bfs(cb: Callback<Node>): boolean | void;
  /**
   * 查找第一个满足条件的节点
   * @param predicate 条件
   * @returns 满足条件的节点或 null
   */
  find(predicate: (node: Node) => boolean): Node | null;
  /**
   * 查找所有满足条件的节点
   * @param predicate 条件
   * @returns 满足条件的节点数组
   */
  findAll(predicate: (node: Node) => boolean): Node[];
}
//#endregion
export { Tree, TreeNode };
//# sourceMappingURL=tree.d.ts.map