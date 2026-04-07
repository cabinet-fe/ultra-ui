import { PackageVersionConfig } from "./types.js";

//#region src/version/sync.d.ts
/**
 * 同步 peerDependencies 中的版本约束
 *
 * 此函数复用了 build/release.ts 中的 peerDependencies 同步逻辑
 * 它会遍历指定包，将 peerDependencies 中的内部包版本更新为 >=version
 *
 * @param packages - 包配置列表
 * @param version - 目标版本号
 * @param options - 同步选项
 *
 * @example
 * ```ts
 * import { syncPeerDependencies } from '@cat-kit/maintenance'
 * import { resolve } from 'node:path'
 *
 * const packages = [
 *   { dir: resolve(process.cwd(), 'packages/core') },
 *   { dir: resolve(process.cwd(), 'packages/fe') }
 * ]
 *
 * // 将包的 peerDependencies 中的内部包版本更新为 >=1.2.3
 * await syncPeerDependencies(packages, '1.2.3')
 *
 * // 只同步特定的包
 * await syncPeerDependencies(packages, '1.2.3', {
 *   only: ['@cat-kit/core', '@cat-kit/fe']
 * })
 * ```
 */
declare function syncPeerDependencies(packages: PackageVersionConfig[], version: string, options?: {
  /** 只同步指定的包名（不指定则同步所有 peerDependencies） */only?: string[];
}): Promise<void>;
/**
 * 同步 dependencies 中的工作空间版本约束
 *
 * 将 dependencies 中使用 workspace:* 的包替换为具体版本号
 *
 * @param packages - 包配置列表
 * @param version - 目标版本号
 * @param options - 同步选项
 *
 * @example
 * ```ts
 * import { syncDependencies } from '@cat-kit/maintenance'
 * import { resolve } from 'node:path'
 *
 * const packages = [
 *   { dir: resolve(process.cwd(), 'packages/core') },
 *   { dir: resolve(process.cwd(), 'packages/fe') }
 * ]
 *
 * // 将 workspace:* 替换为 ^1.2.3
 * await syncDependencies(packages, '1.2.3')
 * ```
 */
declare function syncDependencies(packages: PackageVersionConfig[], version: string, options?: {
  /** 只同步指定的包名 */only?: string[];
}): Promise<void>;
//#endregion
export { syncDependencies, syncPeerDependencies };
//# sourceMappingURL=sync.d.ts.map