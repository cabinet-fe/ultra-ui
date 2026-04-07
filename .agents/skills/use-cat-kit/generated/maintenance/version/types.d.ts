//#region src/version/types.d.ts
/**
 * Semver 版本对象
 */
interface SemverVersion {
  /** 主版本号 */
  major: number;
  /** 次版本号 */
  minor: number;
  /** 修订号 */
  patch: number;
  /** 预发布标识（如 ['alpha', '1']） */
  prerelease?: string[];
  /** 构建元数据 */
  build?: string;
  /** 原始版本字符串 */
  raw: string;
}
/**
 * 版本递增类型
 */
type BumpType = 'major' | 'minor' | 'patch' | 'premajor' | 'preminor' | 'prepatch' | 'prerelease';
/**
 * 包版本配置（用于同步函数）
 */
interface PackageVersionConfig {
  /** 包目录（绝对路径） */
  dir: string;
  /** 包名称（可选，用于日志输出） */
  name?: string;
}
/**
 * 版本更新选项
 */
interface BumpOptions {
  /**
   * 更新类型
   *
   * 当未指定时，系统会根据当前版本智能推断：
   * - 如果当前是预发布版本（如 `1.0.0-alpha.0`），默认使用 `prerelease`
   * - 如果当前是稳定版本（如 `1.2.3`），默认使用 `patch`
   */
  type?: BumpType;
  /** 新版本号（如果指定则忽略 type） */
  version?: string;
  /**
   * 预发布标识（如 'alpha', 'beta'，用于 pre* 类型）
   * @default 'alpha'
   */
  preid?: string;
}
/**
 * 版本更新结果
 */
interface BumpResult {
  /** 新版本号 */
  version: string;
  /** 已更新的包列表 */
  updated: Array<{
    /** 包名称 */name: string; /** 旧版本 */
    oldVersion: string; /** 新版本 */
    newVersion: string;
  }>;
}
/**
 * Changelog 配置
 */
interface ChangelogOptions {
  /** 起始版本或 git tag（不指定则从上一个 tag 开始） */
  from?: string;
  /** 结束版本或 git tag（不指定则到 HEAD） */
  to?: string;
  /** 是否包含提交链接 */
  includeLinks?: boolean;
  /** 提交类型映射（用于自定义类型名称） */
  typeMap?: Record<string, string>;
}
/**
 * Changelog 条目
 */
interface ChangelogEntry {
  /** 提交类型（如 feat、fix、chore） */
  type: string;
  /** 作用域（可选） */
  scope?: string;
  /** 提交主题 */
  subject: string;
  /** 提交哈希 */
  hash: string;
  /** 作者 */
  author: string;
  /** 提交日期 */
  date: Date;
}
/**
 * Git 提交信息
 */
interface GitCommit {
  /** 提交哈希 */
  hash: string;
  /** 提交消息 */
  message: string;
  /** 作者 */
  author: string;
  /** 提交日期 */
  date: Date;
}
//#endregion
export { BumpOptions, BumpResult, BumpType, ChangelogEntry, ChangelogOptions, GitCommit, PackageVersionConfig, SemverVersion };
//# sourceMappingURL=types.d.ts.map