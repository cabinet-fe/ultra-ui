import { DependencyGraph, PackageInfo } from "./types.js";

//#region src/deps/graph.d.ts
/**
 * 构建依赖关系图
 *
 * @param packages - 包列表，每个包需要包含 name、version 和 pkg（package.json 内容）
 * @returns 依赖关系图
 *
 * @example
 * ```ts
 * import { buildDependencyGraph } from '@cat-kit/maintenance'
 *
 * const packages = [
 *   { name: '@my/core', version: '1.0.0', pkg: corePackageJson },
 *   { name: '@my/utils', version: '1.0.0', pkg: utilsPackageJson }
 * ]
 *
 * const graph = buildDependencyGraph(packages)
 * console.log(`包含 ${graph.nodes.length} 个节点和 ${graph.edges.length} 条边`)
 * ```
 */
declare function buildDependencyGraph(packages: (PackageInfo & {
  version: string;
})[]): DependencyGraph;
/**
 * 可视化依赖关系图（生成 Mermaid 格式）
 *
 * @param graph - 依赖关系图
 * @param options - 可选配置
 * @returns Mermaid 格式的图表字符串
 *
 * @example
 * ```ts
 * const graph = buildDependencyGraph(packages)
 * const mermaid = visualizeDependencyGraph(graph, { includeExternal: false })
 * console.log(mermaid)
 * // graph TD
 * //   cat-kit/fe-->cat-kit/core
 * ```
 */
declare function visualizeDependencyGraph(graph: DependencyGraph, options?: {
  /** 是否包含外部依赖（默认 false） */includeExternal?: boolean; /** 是否区分依赖类型（默认 true） */
  distinguishTypes?: boolean;
}): string;
//#endregion
export { buildDependencyGraph, visualizeDependencyGraph };
//# sourceMappingURL=graph.d.ts.map