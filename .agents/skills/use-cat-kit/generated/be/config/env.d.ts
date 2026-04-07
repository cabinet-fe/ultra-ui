//#region src/config/env.d.ts
/**
 * 环境变量记录类型
 */
type EnvRecord = Record<string, string>;
/**
 * 加载环境变量选项
 */
interface LoadEnvOptions {
  /** 工作目录，默认使用 `process.cwd()` */
  cwd?: string;
  /**
   * 当前运行模式，如 development / production
   *
   * 会根据模式加载对应的 `.env.${mode}` 和 `.env.${mode}.local` 文件
   */
  mode?: string;
  /**
   * 自定义加载顺序
   *
   * 如果不指定，默认加载顺序为：
   * 1. `.env`
   * 2. `.env.local`
   * 3. `.env.${mode}` (如果指定了 mode)
   * 4. `.env.${mode}.local` (如果指定了 mode)
   */
  files?: string[];
  /**
   * 是否覆盖 process.env 中已有的值
   * @default false
   */
  override?: boolean;
  /**
   * 是否写入 process.env
   * @default true
   */
  injectToProcess?: boolean;
}
/**
 * 将 .env 文件内容解析为键值对
 *
 * 支持以下格式：
 * - `KEY=value`
 * - `export KEY=value`
 * - `KEY="quoted value"`
 * - `KEY='quoted value'`
 * - `# 注释行`
 *
 * @param content - 原始文件内容
 * @returns 解析出的环境变量映射
 */
declare function parseEnvFile(content: string): EnvRecord;
/**
 * 读取并解析 .env 文件集合
 *
 * 按照优先级顺序加载多个 .env 文件，后面的文件会覆盖前面的同名变量。
 * 默认会将解析的环境变量注入到 `process.env` 中。
 *
 * @example
 * ```typescript
 * // 加载环境变量
 * const env = await loadEnv({
 *   mode: 'production',
 *   override: false // 不覆盖已存在的环境变量
 * })
 *
 * // 只解析不注入
 * const env = await loadEnv({
 *   injectToProcess: false
 * })
 * ```
 *
 * @param options - 加载选项
 * @returns 聚合后的环境变量映射
 */
declare function loadEnv(options?: LoadEnvOptions): Promise<EnvRecord>;
/**
 * 环境变量值类型
 */
type EnvValueType = 'string' | 'number' | 'boolean' | 'json' | 'array';
/**
 * 环境变量定义
 *
 * @template T 值的类型
 */
interface EnvDefinition<T> {
  /**
   * 值类型或自定义转换函数
   *
   * - `'string'`: 字符串（默认）
   * - `'number'`: 数字
   * - `'boolean'`: 布尔值（'true', '1', 'yes', 'on' 为 true）
   * - `'json'`: JSON 对象
   * - `'array'`: 数组（使用 delimiter 分隔）
   * - 函数: 自定义转换函数
   */
  type?: EnvValueType | ((value: string | undefined, key: string) => T);
  /** 默认值 */
  default?: T;
  /** 是否必填 */
  required?: boolean;
  /** 数组分隔符（当 type 为 'array' 时使用），默认 ',' */
  delimiter?: string;
  /** 值转换函数，在类型转换后执行 */
  transform?: (value: T, key: string) => T;
}
/**
 * 环境变量 Schema 类型
 *
 * @template T 配置对象类型
 */
type EnvSchema<T extends Record<string, any>> = { [K in keyof T]: EnvDefinition<T[K]> };
/**
 * 根据 schema 校验并转换环境变量
 *
 * 支持类型转换、默认值、必填校验和自定义转换函数。
 *
 * @example
 * ```typescript
 * const config = parseEnv({
 *   port: { type: 'number', default: 3000 },
 *   debug: { type: 'boolean', default: false },
 *   apiKey: { type: 'string', required: true },
 *   hosts: { type: 'array', delimiter: ',' }
 * })
 * ```
 *
 * @param schema - 环境变量定义 schema
 * @param source - 数据源，默认使用 `process.env`
 * @returns 转换后的类型安全结果
 * @throws {Error} 当 required 字段缺失或类型转换失败时抛出
 * @template T 结果类型
 */
declare function parseEnv<T extends Record<string, any>>(schema: EnvSchema<T>, source?: Record<string, string | undefined>): T;
//#endregion
export { EnvDefinition, EnvRecord, EnvSchema, EnvValueType, LoadEnvOptions, loadEnv, parseEnv, parseEnvFile };
//# sourceMappingURL=env.d.ts.map