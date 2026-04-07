import { Transport } from "./transports.js";

//#region src/logger/logger.d.ts
/**
 * 日志格式类型
 */
type LogFormat = 'text' | 'json';
/**
 * 日志级别枚举
 */
declare enum LogLevel {
  /** 调试信息 */
  DEBUG = "debug",
  /** 一般信息 */
  INFO = "info",
  /** 警告信息 */
  WARN = "warn",
  /** 错误信息 */
  ERROR = "error"
}
/**
 * 日志条目
 */
interface LogEntry {
  /** 日志级别 */
  level: LogLevel;
  /** 日志消息 */
  message: string;
  /** 时间戳 */
  timestamp: string;
  /** 日志器名称 */
  name?: string;
  /** 附加元数据 */
  meta?: Record<string, unknown>;
  /** 错误信息（如果有） */
  error?: {
    message: string;
    stack?: string;
  };
}
/**
 * Text 格式化变量
 */
interface TextFormatVars {
  /** 时间戳 */
  timestamp: string;
  /** 日志级别 */
  level: string;
  /** 日志器名称 */
  name?: string;
  /** 日志消息 */
  message: string;
  /** 附加元数据 JSON */
  meta?: string;
  /** 错误信息 */
  error?: string;
}
/**
 * Text 格式化函数
 */
type TextFormatter = (vars: TextFormatVars, entry: LogEntry) => string;
/**
 * Text 格式化配置
 * - 字符串：使用 {} 引用变量，如 '{timestamp} [{level}] {message}'
 * - 函数：回调函数，接收变量对象
 */
type TextFormatConfig = string | TextFormatter;
/**
 * 日志器选项
 */
interface LoggerOptions {
  /** 日志器名称 */
  name?: string;
  /** 最低日志级别，低于此级别的日志不会被输出 */
  level?: LogLevel;
  /** 日志格式，'text' 为文本格式，'json' 为 JSON 格式 */
  format?: LogFormat;
  /** 传输器列表，用于输出日志 */
  transports?: Transport[];
  /** 上下文信息，会附加到所有日志条目 */
  context?: Record<string, unknown>;
  /** 时间戳格式，默认 'yyyy-MM-dd HH:mm:ss' */
  timestampFormat?: string;
  /** 是否使用 UTC 时间，默认 false */
  utc?: boolean;
  /** Text 格式化配置（仅 format='text' 时生效） */
  textFormat?: TextFormatConfig;
}
/**
 * 结构化日志记录器
 *
 * 支持多级别日志、多种输出格式、多个传输器。
 *
 * @example
 * ```typescript
 * const logger = new Logger({
 *   name: 'app',
 *   level: LogLevel.INFO,
 *   format: 'json',
 *   transports: [
 *     new ConsoleTransport(),
 *     new FileTransport({ path: './logs' })
 *   ]
 * })
 *
 * await logger.info('Server started', { port: 3000 })
 * await logger.error('Failed to connect', error)
 *
 * // 使用自定义 text 格式
 * const customLogger = new Logger({
 *   format: 'text',
 *   textFormat: '[{timestamp}] {level} - {message}'
 * })
 *
 * // 使用函数格式化
 * const fnLogger = new Logger({
 *   format: 'text',
 *   textFormat: (vars) => `${vars.timestamp} | ${vars.message}`
 * })
 * ```
 */
declare class Logger {
  private readonly level;
  private readonly format;
  private readonly timestampFormat;
  private readonly utc;
  private readonly transports;
  private readonly name?;
  private readonly context?;
  private readonly textFormat?;
  /**
   * 创建日志器实例
   * @param options - 日志器选项
   */
  constructor(options?: LoggerOptions);
  /**
   * 生成时间戳
   */
  private getTimestamp;
  private buildEntry;
  private logInternal;
  /**
   * 记录日志
   *
   * @param level - 日志级别
   * @param message - 日志消息
   * @param meta - 附加元数据
   * @param error - 错误对象（如果有）
   */
  log(level: LogLevel, message: string, meta?: Record<string, unknown>, error?: Error): Promise<void>;
  /**
   * 记录 DEBUG 级别日志
   * @param message - 日志消息
   * @param meta - 附加元数据
   */
  debug(message: string, meta?: Record<string, unknown>): Promise<void>;
  /**
   * 记录 INFO 级别日志
   * @param message - 日志消息
   * @param meta - 附加元数据
   */
  info(message: string, meta?: Record<string, unknown>): Promise<void>;
  /**
   * 记录 WARN 级别日志
   * @param message - 日志消息
   * @param meta - 附加元数据
   */
  warn(message: string, meta?: Record<string, unknown>): Promise<void>;
  /**
   * 记录 ERROR 级别日志
   *
   * @param message - 日志消息
   * @param errorOrMeta - 错误对象或元数据
   * @param meta - 附加元数据（当第一个参数是错误对象时使用）
   */
  error(message: string, errorOrMeta?: Error | Record<string, unknown>, meta?: Record<string, unknown>): Promise<void>;
}
//#endregion
export { LogEntry, LogFormat, LogLevel, Logger, LoggerOptions, TextFormatConfig, TextFormatVars, TextFormatter };
//# sourceMappingURL=logger.d.ts.map