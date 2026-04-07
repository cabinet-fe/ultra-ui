import { ProtocolResolveOptions } from "./protocol.js";

//#region src/release/types.d.ts
/**
 * 创建 git tag 的选项
 */
interface GitTagOptions {
  /** 仓库根目录（绝对路径） */
  cwd: string;
  /** tag 名称 */
  tag: string;
  /** 注释内容，未提供时使用 tag 文本 */
  message?: string;
  /** 是否推送到远端 */
  push?: boolean;
  /** 推送使用的远端名称，默认 origin */
  remote?: string;
  /** 是否允许覆盖已有 tag */
  force?: boolean;
}
/**
 * 提交并推送代码的选项
 */
interface GitCommitAndPushOptions {
  /** 仓库根目录（绝对路径） */
  cwd: string;
  /** 提交信息 */
  message: string;
  /** 是否自动执行 git add -A，默认 true */
  addAll?: boolean;
  /** 是否允许空提交 */
  allowEmpty?: boolean;
  /** 推送远端名称，默认 origin */
  remote?: string;
  /** 推送分支名称，默认当前分支 */
  branch?: string;
  /** 是否同时推送所有 tag */
  pushTags?: boolean;
}
/**
 * npm 发布选项
 *
 * 支持三种发布模式：
 * 1. 单包发布：仅提供 cwd，发布 cwd 目录下的包
 * 2. 指定工作区发布：提供 cwd + workspace，使用 npm 原生 --workspace 参数
 * 3. 全部工作区发布：提供 cwd + workspaces=true，使用 npm 原生 --workspaces 参数
 */
interface PublishOptions {
  /** 仓库根目录或包所在目录 */
  cwd: string;
  /**
   * 要发布的工作区名称或路径列表
   *
   * 使用 npm 原生的 --workspace 参数，可以是：
   * - 工作区名称（如 '@cat-kit/core'）
   * - 工作区目录路径
   * - 父目录路径（会发布该目录下所有工作区）
   *
   * @example
   * ```ts
   * // 发布指定工作区
   * await publishPackage({
   *   cwd: '/path/to/monorepo',
   *   workspace: ['@cat-kit/core', '@cat-kit/fe']
   * })
   * ```
   */
  workspace?: string[];
  /**
   * 是否发布所有工作区
   *
   * 使用 npm 原生的 --workspaces 参数
   *
   * @example
   * ```ts
   * // 发布所有工作区
   * await publishPackage({
   *   cwd: '/path/to/monorepo',
   *   workspaces: true
   * })
   * ```
   */
  workspaces?: boolean;
  /**
   * 是否包含根工作区
   *
   * 仅在 workspace 或 workspaces 生效时有效
   */
  includeWorkspaceRoot?: boolean;
  /** 自定义 registry，默认使用 npm 官方源 */
  registry?: string;
  /** 发布 dist-tag，默认 latest */
  tag?: string;
  /** 2FA 动态验证码 */
  otp?: string;
  /** 是否仅做 dry-run，不真正上传 */
  dryRun?: boolean;
  /** 包访问级别 */
  access?: 'public' | 'restricted';
  /** 启用 provenance（npm 9+ 支持，需要在 CI/CD 环境中使用） */
  provenance?: boolean;
  /** provenance 文件路径（与 provenance 互斥） */
  provenanceFile?: string;
  /**
   * 协议解析选项
   *
   * 类似 pnpm 和 bun 的行为，在发布时自动将 `workspace:` 和 `catalog:` 协议
   * 替换为实际的版本范围。
   *
   * - `workspace:*` -> 精确版本 (如 "1.0.0")
   * - `workspace:^` -> caret 范围 (如 "^1.0.0")
   * - `workspace:~` -> tilde 范围 (如 "~1.0.0")
   * - `catalog:` -> 从 catalog 定义中解析版本
   *
   * 协议解析仅在发布时临时进行，不会修改源代码中的版本号。
   *
   * @example
   * ```ts
   * await publishPackage({
   *   cwd: '/path/to/pkg',
   *   resolveProtocol: {
   *     workspaces: [
   *       { name: '@cat-kit/core', version: '1.0.0' },
   *       { name: '@cat-kit/fe', version: '1.0.0' }
   *     ],
   *     catalogs: {
   *       default: { react: '^18.2.0' }
   *     }
   *   }
   * })
   * ```
   */
  resolveProtocol?: ProtocolResolveOptions;
  /**
   * 需要解析协议的包目录列表（批量发布模式）
   *
   * 当使用 `workspace` 或 `workspaces` 参数批量发布时，
   * 需要提供此列表以指定哪些包的 package.json 需要处理协议。
   *
   * @example
   * ```ts
   * await publishPackage({
   *   cwd: '/path/to/monorepo',
   *   workspace: ['@cat-kit/core', '@cat-kit/fe'],
   *   resolveProtocol: {
   *     workspaces: [
   *       { name: '@cat-kit/core', version: '1.0.0' },
   *       { name: '@cat-kit/fe', version: '1.0.0' }
   *     ]
   *   },
   *   resolveProtocolDirs: [
   *     '/path/to/monorepo/packages/core',
   *     '/path/to/monorepo/packages/fe'
   *   ]
   * })
   * ```
   */
  resolveProtocolDirs?: string[];
}
/**
 * 提交结果
 */
interface GitCommitResult {
  /** 完整提交哈希 */
  commitHash: string;
  /** 推送的分支 */
  branch: string;
}
/**
 * tag 结果
 */
interface GitTagResult {
  /** 创建的 tag 名称 */
  tag: string;
}
/**
 * 发布结果
 */
interface PublishResult {
  /** 发布命令输出 */
  output: string;
}
//#endregion
export { GitCommitAndPushOptions, GitCommitResult, GitTagOptions, GitTagResult, PublishOptions, PublishResult };
//# sourceMappingURL=types.d.ts.map