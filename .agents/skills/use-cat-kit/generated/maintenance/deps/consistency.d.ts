import { ConsistencyResult, PackageInfo } from "./types.js";

//#region src/deps/consistency.d.ts
/**
 * 检查版本一致性
 *
 * 检测多个包中相同依赖是否使用了不同的版本
 *
 * @param packages - 包列表，每个包需要包含 name 和 pkg（package.json 内容）
 * @param options - 可选配置
 * @returns 一致性检查结果
 *
 * @example
 * ```ts
 * import { checkVersionConsistency } from '@cat-kit/maintenance'
 *
 * const packages = [
 *   { name: '@my/core', pkg: corePackageJson },
 *   { name: '@my/utils', pkg: utilsPackageJson }
 * ]
 *
 * const result = checkVersionConsistency(packages)
 * if (!result.consistent) {
 *   console.log('发现版本不一致:')
 *   result.inconsistent.forEach(dep => {
 *     console.log(`${dep.name}:`)
 *     dep.versions.forEach(v => {
 *       console.log(`  ${v.version} 被 ${v.usedBy.join(', ')} 使用`)
 *     })
 *   })
 * }
 * ```
 */
declare function checkVersionConsistency(packages: PackageInfo[], options?: {
  /** 忽略的依赖包（不检查版本一致性） */ignore?: string[];
}): ConsistencyResult;
//#endregion
export { checkVersionConsistency };
//# sourceMappingURL=consistency.d.ts.map