import { TreeNode } from "./tree.js";

//#region src/data-structure/forest.d.ts
declare class ForestNode<Data extends Record<string, any> = Record<string, any>> extends TreeNode<Data> {
  readonly forest: Forest<Data, ForestNode<Data>>;
  constructor(data: Data, forest: Forest<Data, ForestNode<Data>>);
  remove(): void;
}
declare class Forest<Data extends Record<string, any>, Node extends ForestNode<Data>> {
  roots: Node[];
  constructor(options: {
    data: Data[];
    ForestNode: new (data: Data, forest: Forest<Data, any>) => Node;
    childrenKey?: string;
  });
  dfs(cb: (node: Node) => void | boolean): void;
}
//#endregion
export { Forest, ForestNode };
//# sourceMappingURL=forest.d.ts.map