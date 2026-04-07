import { PackageJson } from "../types.js";
import { BumpOptions } from "../version/types.js";
import { BuildConfig } from "../build/types.js";
import { PublishOptions } from "../release/types.js";

//#region src/monorepo/types.d.ts
/**
 * Monorepo 工作区信息
 */
interface MonorepoWorkspace {
  /** 包名称 */
  name: string;
  /** 包目录（绝对路径） */
  dir: string;
  /** 包版本 */
  version: string;
  /** package.json 内容 */
  pkg: PackageJson;
  /** 是否为私有包 */
  private: boolean;
}
/**
 * Monorepo 根目录信息
 */
interface MonorepoRoot {
  /** 根目录（绝对路径） */
  dir: string;
  /** package.json 内容 */
  pkg: PackageJson;
  /** 工作区 glob 模式 */
  workspacePatterns: string[];
}
/**
 * 工作区构建配置（不包含 dir）
 */
type WorkspaceBuildConfig = Omit<BuildConfig, 'dir'>;
/**
 * 工作区分组构建选项
 */
interface GroupBuildOptions {
  /** 是否并行构建同一批次的包，默认 true */
  parallel?: boolean;
}
/**
 * 工作区分组版本更新选项
 */
interface GroupBumpOptions extends BumpOptions {
  /** 是否同步 peerDependencies，默认 true */
  syncPeer?: boolean;
  /** 是否同步 dependencies 中的 workspace:* 引用，默认 true */
  syncDeps?: boolean;
}
/**
 * 工作区分组发布选项
 */
interface GroupPublishOptions extends Omit<PublishOptions, 'cwd' | 'workspace' | 'workspaces' | 'includeWorkspaceRoot'> {
  /** 是否跳过私有包，默认 true */
  skipPrivate?: boolean;
}
/**
 * 构建结果摘要
 */
interface BuildSummary {
  /** 总耗时（毫秒） */
  totalDuration: number;
  /** 成功数量 */
  successCount: number;
  /** 失败数量 */
  failedCount: number;
  /** 各包构建结果 */
  results: Array<{
    name: string;
    success: boolean;
    duration: number;
    error?: Error;
  }>;
}
/**
 * 验证结果
 */
interface MonorepoValidationResult {
  /** 是否有效 */
  valid: boolean;
  /** 是否有循环依赖 */
  hasCircular: boolean;
  /** 循环依赖链 */
  circularChains: string[][];
  /** 版本不一致的依赖 */
  inconsistentDeps: Array<{
    name: string;
    versions: Array<{
      version: string;
      usedBy: string[];
    }>;
  }>;
}
/**
 * 依赖图结果
 */
interface DependencyGraphResult {
  /** 节点列表 */
  nodes: Array<{
    id: string;
    version: string;
    external: boolean;
  }>;
  /** 边列表 */
  edges: Array<{
    from: string;
    to: string;
    type: 'dependencies' | 'devDependencies' | 'peerDependencies';
  }>;
  /** Mermaid 格式的依赖图 */
  mermaid: string;
}
/**
 * 回滚上下文
 */
interface RollbackContext {
  /** 原始版本号 */
  originalVersion: string;
  /** 需要回滚的包目录列表 */
  packageDirs: string[];
  /** Git 提交哈希（用于 reset） */
  commitHash?: string;
}
//#endregion
export { BuildSummary, DependencyGraphResult, GroupBuildOptions, GroupBumpOptions, GroupPublishOptions, MonorepoRoot, MonorepoValidationResult, MonorepoWorkspace, RollbackContext, WorkspaceBuildConfig };
//# sourceMappingURL=types.d.ts.map