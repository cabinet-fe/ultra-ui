//#region src/types.d.ts
/**
 * package.json 类型定义
 */
interface PackageJson {
  name: string;
  version: string;
  description?: string;
  private?: boolean;
  type?: 'module' | 'commonjs';
  exports?: Record<string, any>;
  files?: string[];
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  peerDependenciesMeta?: Record<string, {
    optional?: boolean;
  }>;
  workspaces?: string[];
  scripts?: Record<string, string>;
  [key: string]: any;
}
/**
 * 验证结果接口
 */
interface ValidationResult {
  /** 是否通过验证 */
  valid: boolean;
  /** 错误列表 */
  errors: ValidationErrorInfo[];
  /** 警告列表 */
  warnings: ValidationWarning[];
}
/**
 * 验证错误信息
 */
interface ValidationErrorInfo {
  /** 错误代码 */
  code: string;
  /** 错误消息 */
  message: string;
  /** 相关文件路径 */
  file?: string;
  /** 相关字段 */
  field?: string;
}
/**
 * 验证警告
 */
interface ValidationWarning {
  /** 警告代码 */
  code: string;
  /** 警告消息 */
  message: string;
  /** 相关文件路径 */
  file?: string;
  /** 相关字段 */
  field?: string;
}
//#endregion
export { PackageJson, ValidationErrorInfo, ValidationResult, ValidationWarning };
//# sourceMappingURL=types.d.ts.map