import { BumpOptions, BumpResult } from "./types.js";

//#region src/version/bump.d.ts
/**
 * 更新单个包的版本号
 *
 * 支持通过指定版本号或递增类型来更新包版本。
 * 当不指定 type 时，会根据当前版本智能推断：
 * - 预发布版本（如 1.0.0-alpha.0）→ 自动使用 prerelease
 * - 稳定版本（如 1.2.3）→ 自动使用 patch
 *
 * @param pkgPath - package.json 的路径或包含 package.json 的目录
 * @param options - 版本更新选项（可选，默认为空对象）
 * @returns 版本更新结果
 * @throws {SemverError} 当版本号格式无效时
 * @throws {ConfigError} 当包配置无效时
 *
 * @example
 * ```ts
 * import { bumpVersion } from '@cat-kit/maintenance'
 * import { resolve } from 'node:path'
 *
 * // 自动递增版本（智能推断类型）
 * // 1.0.0 → 1.0.1（稳定版本自动 patch）
 * // 1.0.0-alpha.0 → 1.0.0-alpha.1（预发布版本自动递增）
 * const result = await bumpVersion(resolve('packages/core'), {})
 *
 * // 显式指定递增类型
 * const result = await bumpVersion(resolve('packages/core'), {
 *   type: 'minor'
 * })
 *
 * // 直接设置特定版本号
 * const result = await bumpVersion('packages/core/package.json', {
 *   version: '2.0.0'
 * })
 *
 * // 创建预发布版本（preid 默认为 'alpha'）
 * const result = await bumpVersion('packages/core', {
 *   type: 'prerelease'
 * })
 * ```
 */
declare function bumpVersion(pkgPath: string, options?: BumpOptions): Promise<BumpResult>;
//#endregion
export { bumpVersion };
//# sourceMappingURL=bump.d.ts.map