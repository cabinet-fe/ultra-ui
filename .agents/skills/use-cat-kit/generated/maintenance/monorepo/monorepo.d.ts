import { BumpResult } from "../version/types.js";
import { DependencyGraphResult, GroupBumpOptions, GroupPublishOptions, MonorepoRoot, MonorepoValidationResult, MonorepoWorkspace, WorkspaceBuildConfig } from "./types.js";

//#region src/monorepo/monorepo.d.ts
/**
 * 工作区分组类
 *
 * 用于对一组工作区进行批量操作
 */
declare class WorkspaceGroup<Workspaces extends string> {
  #private;
  constructor(repo: Monorepo, workspaceNames: Workspaces[]);
  /**
   * 工作区列表
   */
  get workspaces(): MonorepoWorkspace[];
  /**
   * 构建工作区
   *
   *
   *
   * @param configs - 工作区配置, 如果传入将会被合并
   */
  build(configs?: Partial<Record<Workspaces, WorkspaceBuildConfig>>): Promise<void>;
  /**
   * 更新版本号
   */
  bumpVersion(options: GroupBumpOptions): Promise<BumpResult>;
  /**
   * 批量发布包
   *
   * 使用 npm 原生的 --workspace 参数发布指定工作区。
   * npm 会自动处理发布顺序和依赖关系。
   *
   * 自动处理 `workspace:` 和 `catalog:` 协议，类似 pnpm 和 bun 的行为。
   * 协议解析仅在发布时临时进行，不会修改源代码中的版本号。
   *
   * @param options - 发布选项
   * @throws {PublishError} 当发布失败时
   */
  publish(options?: GroupPublishOptions): Promise<void>;
}
/**
 * Monorepo 管理类
 *
 * @example
 * ```ts
 * const repo = new Monorepo('/path/to/repo')
 *
 * // 获取所有工作区
 * console.log(repo.workspaces)
 *
 * // 对指定包进行操作
 * const group = repo.group(['@cat-kit/core', '@cat-kit/fe'])
 * await group.build({
 *   '@cat-kit/core': { entry: 'src/index.ts' }
 * })
 * ```
 */
declare class Monorepo {
  #private;
  constructor(rootDir?: string);
  /**
   * 根目录信息
   */
  get root(): MonorepoRoot;
  /**
   * 工作区列表
   */
  get workspaces(): MonorepoWorkspace[];
  /**
   * 按工作区名称分组
   */
  group<const T extends readonly string[]>(names: T): WorkspaceGroup<T[number]>;
  /**
   * 验证 monorepo 的有效性
   *
   * - 检测循环依赖
   * - 检测版本不一致
   */
  validate(): MonorepoValidationResult;
  /**
   * 构建依赖关系图
   */
  buildDependencyGraph(options?: {
    /** 是否包含外部依赖 */includeExternal?: boolean;
  }): DependencyGraphResult;
}
//#endregion
export { Monorepo, WorkspaceGroup };
//# sourceMappingURL=monorepo.d.ts.map