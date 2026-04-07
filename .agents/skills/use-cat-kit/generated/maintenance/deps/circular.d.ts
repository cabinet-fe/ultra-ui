import { CircularDependencyResult, PackageInfo } from "./types.js";

//#region src/deps/circular.d.ts
/**
 * 检测循环依赖
 *
 * 使用 Tarjan 算法查找强连通分量（Strongly Connected Components）
 *
 * @param packages - 包列表，每个包需要包含 name 和 pkg（package.json 内容）
 * @returns 循环依赖检查结果
 *
 * @example
 * ```ts
 * import { checkCircularDependencies } from '@cat-kit/maintenance'
 *
 * const packages = [
 *   { name: '@my/core', pkg: corePackageJson },
 *   { name: '@my/utils', pkg: utilsPackageJson }
 * ]
 *
 * const result = checkCircularDependencies(packages)
 * if (result.hasCircular) {
 *   console.log('发现循环依赖:')
 *   result.cycles.forEach(cycle => {
 *     console.log(cycle.chain.join(' -> '))
 *   })
 * }
 * ```
 */
declare function checkCircularDependencies(packages: PackageInfo[]): CircularDependencyResult;
//#endregion
export { checkCircularDependencies };
//# sourceMappingURL=circular.d.ts.map