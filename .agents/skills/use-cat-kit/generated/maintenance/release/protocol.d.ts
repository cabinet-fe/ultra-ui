import { PackageJson } from "../types.js";

//#region src/release/protocol.d.ts
/**
 * workspace 协议解析结果
 */
interface WorkspaceProtocolResolution {
  /** 原始协议值 (如 "workspace:*") */
  original: string;
  /** 解析后的版本范围 (如 "^1.0.0") */
  resolved: string;
}
/**
 * catalog 协议解析结果
 */
interface CatalogProtocolResolution {
  /** 原始协议值 (如 "catalog:react18") */
  original: string;
  /** 解析后的版本范围 (如 "^18.3.1") */
  resolved: string;
}
/**
 * 工作区信息 (用于解析 workspace 协议)
 */
interface WorkspaceInfo {
  /** 包名 */
  name: string;
  /** 版本号 */
  version: string;
}
/**
 * Catalog 定义 (来自 pnpm-workspace.yaml 或 package.json)
 */
interface CatalogDefinition {
  /** 默认 catalog */
  default?: Record<string, string>;
  /** 命名 catalog */
  [name: string]: Record<string, string> | undefined;
}
/**
 * 协议解析选项
 */
interface ProtocolResolveOptions {
  /** 工作区信息列表 (用于解析 workspace 协议) */
  workspaces?: WorkspaceInfo[];
  /** Catalog 定义 (用于解析 catalog 协议) */
  catalogs?: CatalogDefinition;
}
/**
 * 解析 workspace 协议
 *
 * 根据 pnpm/bun 的规范，workspace 协议会被替换为:
 * - `workspace:*` -> 精确版本 (如 "1.0.0")
 * - `workspace:^` -> caret 范围 (如 "^1.0.0")
 * - `workspace:~` -> tilde 范围 (如 "~1.0.0")
 * - `workspace:^1.0.0` -> 保持原样 (如 "^1.0.0")
 *
 * @param protocol - workspace 协议值
 * @param targetVersion - 目标包的版本号
 * @returns 解析后的版本范围
 *
 * @example
 * ```ts
 * resolveWorkspaceProtocol('workspace:*', '1.2.3')   // '1.2.3'
 * resolveWorkspaceProtocol('workspace:^', '1.2.3')   // '^1.2.3'
 * resolveWorkspaceProtocol('workspace:~', '1.2.3')   // '~1.2.3'
 * resolveWorkspaceProtocol('workspace:^2.0.0', '1.2.3') // '^2.0.0'
 * ```
 */
declare function resolveWorkspaceProtocol(protocol: string, targetVersion: string): string;
/**
 * 解析 catalog 协议
 *
 * 根据 pnpm 的规范，catalog 协议会被替换为 catalog 中定义的版本:
 * - `catalog:` -> 使用默认 catalog
 * - `catalog:react18` -> 使用命名 catalog
 *
 * @param protocol - catalog 协议值
 * @param depName - 依赖名称
 * @param catalogs - catalog 定义
 * @returns 解析后的版本范围，如果找不到则返回 null
 *
 * @example
 * ```ts
 * const catalogs = {
 *   default: { react: '^18.2.0' },
 *   react18: { react: '^18.3.1' }
 * }
 *
 * resolveCatalogProtocol('catalog:', 'react', catalogs)       // '^18.2.0'
 * resolveCatalogProtocol('catalog:react18', 'react', catalogs) // '^18.3.1'
 * ```
 */
declare function resolveCatalogProtocol(protocol: string, depName: string, catalogs: CatalogDefinition): string | null;
/**
 * 检查版本字符串是否是协议格式
 */
declare function isProtocolVersion(version: string): boolean;
/**
 * 处理 package.json 中的协议，返回转换后的副本
 *
 * 此函数会遍历 dependencies、devDependencies、peerDependencies、optionalDependencies，
 * 将其中的 workspace: 和 catalog: 协议替换为实际的版本范围。
 *
 * @param pkg - 原始 package.json 内容
 * @param options - 解析选项
 * @returns 处理后的 package.json 副本
 *
 * @example
 * ```ts
 * const pkg = {
 *   name: '@my/pkg',
 *   version: '1.0.0',
 *   dependencies: {
 *     '@my/core': 'workspace:^',
 *     'react': 'catalog:'
 *   }
 * }
 *
 * const resolved = resolveProtocols(pkg, {
 *   workspaces: [{ name: '@my/core', version: '2.0.0' }],
 *   catalogs: { default: { react: '^18.2.0' } }
 * })
 *
 * // resolved.dependencies = {
 * //   '@my/core': '^2.0.0',
 * //   'react': '^18.2.0'
 * // }
 * ```
 */
declare function resolveProtocols(pkg: PackageJson, options: ProtocolResolveOptions): PackageJson;
/**
 * 包装发布流程，临时替换 package.json 中的协议
 *
 * 此函数会:
 * 1. 备份原始 package.json
 * 2. 写入处理后的 package.json
 * 3. 执行发布操作
 * 4. 恢复原始 package.json
 *
 * @param pkgDir - 包目录
 * @param options - 协议解析选项
 * @param publishFn - 实际的发布函数
 *
 * @example
 * ```ts
 * await withResolvedProtocols(
 *   '/path/to/pkg',
 *   { workspaces: [...] },
 *   async () => {
 *     // 此时 package.json 已被临时替换
 *     await execPublish()
 *   }
 * )
 * // 执行完毕后 package.json 已恢复
 * ```
 */
declare function withResolvedProtocols<T>(pkgDir: string, options: ProtocolResolveOptions, publishFn: () => Promise<T>): Promise<T>;
/**
 * 批量包装发布流程，临时替换多个包的 package.json 中的协议
 *
 * 此函数会:
 * 1. 备份所有包的原始 package.json
 * 2. 写入处理后的 package.json
 * 3. 执行发布操作
 * 4. 恢复所有原始 package.json
 *
 * @param pkgDirs - 包目录列表
 * @param options - 协议解析选项
 * @param publishFn - 实际的发布函数
 *
 * @example
 * ```ts
 * await withResolvedProtocolsBatch(
 *   ['/path/to/pkg1', '/path/to/pkg2'],
 *   { workspaces: [...] },
 *   async () => {
 *     // 此时所有 package.json 已被临时替换
 *     await execPublish()
 *   }
 * )
 * // 执行完毕后所有 package.json 已恢复
 * ```
 */
declare function withResolvedProtocolsBatch<T>(pkgDirs: string[], options: ProtocolResolveOptions, publishFn: () => Promise<T>): Promise<T>;
//#endregion
export { CatalogDefinition, CatalogProtocolResolution, ProtocolResolveOptions, WorkspaceInfo, WorkspaceProtocolResolution, isProtocolVersion, resolveCatalogProtocol, resolveProtocols, resolveWorkspaceProtocol, withResolvedProtocols, withResolvedProtocolsBatch };
//# sourceMappingURL=protocol.d.ts.map