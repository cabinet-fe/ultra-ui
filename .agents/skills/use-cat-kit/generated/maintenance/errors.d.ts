//#region src/errors.d.ts
/**
 * 基础维护错误类
 */
declare class MaintenanceError extends Error {
  readonly code: string;
  readonly originalError?: unknown | undefined;
  constructor(message: string, code: string, originalError?: unknown | undefined);
}
/**
 * 配置错误
 */
declare class ConfigError extends MaintenanceError {
  readonly configPath?: string | undefined;
  constructor(message: string, configPath?: string | undefined, originalError?: unknown);
}
/**
 * 版本错误
 */
declare class SemverError extends MaintenanceError {
  readonly version?: string | undefined;
  constructor(message: string, version?: string | undefined, originalError?: unknown);
}
/**
 * 验证错误
 */
declare class ValidationError extends MaintenanceError {
  readonly filePath?: string | undefined;
  readonly field?: string | undefined;
  constructor(message: string, filePath?: string | undefined, field?: string | undefined, originalError?: unknown);
}
/**
 * Git 操作错误
 */
declare class GitError extends MaintenanceError {
  readonly command?: string | undefined;
  constructor(message: string, command?: string | undefined, originalError?: unknown);
}
/**
 * 发布错误
 */
declare class PublishError extends MaintenanceError {
  readonly command?: string | undefined;
  constructor(message: string, command?: string | undefined, originalError?: unknown);
}
//#endregion
export { ConfigError, GitError, MaintenanceError, PublishError, SemverError, ValidationError };
//# sourceMappingURL=errors.d.ts.map