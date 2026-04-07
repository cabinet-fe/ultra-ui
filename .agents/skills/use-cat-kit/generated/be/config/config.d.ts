//#region src/config/config.d.ts
/**
 * 配置文件格式
 */
type ConfigFormat = 'json' | 'yaml' | 'toml';
/**
 * 加载配置选项
 *
 * @template T 配置对象类型
 */
interface LoadConfigOptions<T extends Record<string, unknown>> {
  /** 工作目录，默认使用 `process.cwd()` */
  cwd?: string;
  /** 配置文件格式，如果不指定会根据文件扩展名自动检测 */
  format?: ConfigFormat;
  /** 默认配置值，会与加载的配置合并 */
  defaults?: Partial<T>;
  /**
   * 自定义解析器（覆盖 format）
   *
   * 如果提供了自定义解析器，将忽略 format 选项。
   */
  parser?: (source: string) => T | Promise<T>;
  /**
   * 自定义校验逻辑
   *
   * 如果校验失败应抛出错误。
   */
  validate?: (config: T) => void;
  /**
   * 是否与 defaults 深度合并
   * @default true
   */
  mergeDefaults?: boolean;
}
/**
 * 加载并解析配置文件
 *
 * 支持 JSON、YAML 和 TOML 格式。YAML 和 TOML 需要安装对应的可选依赖：
 * - YAML: `bun add js-yaml`
 * - TOML: `bun add smol-toml`
 *
 * @example
 * ```typescript
 * // 加载 JSON 配置
 * const config = await loadConfig<AppConfig>('./config.json', {
 *   defaults: { port: 3000 }
 * })
 *
 * // 加载 YAML 配置
 * const config = await loadConfig('./config.yaml', {
 *   validate: (c) => {
 *     if (!c.apiKey) throw new Error('apiKey is required')
 *   }
 * })
 * ```
 *
 * @param filePath - 配置文件路径（相对或绝对路径）
 * @param options - 解析及合并选项
 * @returns 解析后的配置对象
 * @throws {PeerDependencyError} 当需要可选依赖但未安装时
 * @throws {Error} 当文件读取失败或解析失败时
 * @template T 配置对象类型
 */
declare function loadConfig<T extends Record<string, unknown> = Record<string, unknown>>(filePath: string, options?: LoadConfigOptions<T>): Promise<T>;
//#endregion
export { ConfigFormat, LoadConfigOptions, loadConfig };
//# sourceMappingURL=config.d.ts.map