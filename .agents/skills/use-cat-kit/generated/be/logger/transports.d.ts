import { LogEntry, LogFormat, LogLevel } from "./logger.js";

//#region src/logger/transports.d.ts
/**
 * 日志传输器接口
 *
 * 用于将日志输出到不同的目标（控制台、文件等）。
 */
interface Transport {
  /** 最低日志级别，低于此级别的日志不会被输出 */
  level?: LogLevel;
  /**
   * 写入日志条目
   *
   * @param entry - 日志条目
   * @param formatted - 格式化后的日志字符串
   * @param format - 日志格式
   */
  write(entry: LogEntry, formatted: string, format: LogFormat): void | Promise<void>;
}
/**
 * 控制台传输器选项
 */
interface ConsoleTransportOptions {
  /** 是否使用颜色，默认 true */
  useColors?: boolean;
  /** 日志级别 */
  level?: LogLevel;
}
/**
 * 控制台日志传输器
 *
 * 将日志输出到控制台，支持颜色高亮。
 *
 * @example
 * ```typescript
 * const transport = new ConsoleTransport({ useColors: true })
 * const logger = new Logger({ transports: [transport] })
 * ```
 */
declare class ConsoleTransport implements Transport {
  private readonly options;
  level?: LogLevel;
  /**
   * 创建控制台传输器实例
   * @param options - 传输器选项
   */
  constructor(options?: ConsoleTransportOptions);
  write(entry: LogEntry, formatted: string, format: LogFormat): void;
}
/**
 * 文件传输器选项
 */
interface FileTransportOptions {
  /**
   * 日志路径，可以是目录或文件
   * - 目录：日志文件按日期命名（如 2024-01-15.log）
   * - 文件：直接写入该文件
   */
  path: string;
  /** 最大文件大小（字节），超过此大小会自动轮转或创建新文件 */
  maxSize?: number;
  /** 换行符，默认 '\n' */
  newline?: string;
  /** 日志级别 */
  level?: LogLevel;
}
/**
 * 文件日志传输器
 *
 * 将日志写入文件，支持文件大小轮转和目录模式。
 *
 * @example
 * ```typescript
 * // 文件模式：超过大小时轮转
 * const transport = new FileTransport({
 *   path: './logs/app.log',
 *   maxSize: 10 * 1024 * 1024 // 10MB
 * })
 *
 * // 目录模式：按日期创建新文件
 * const transport = new FileTransport({
 *   path: './logs',
 *   maxSize: 10 * 1024 * 1024 // 10MB
 * })
 * ```
 */
declare class FileTransport implements Transport {
  private readonly options;
  level?: LogLevel;
  private queue;
  private isDirectory;
  /**
   * 创建文件传输器实例
   * @param options - 传输器选项
   */
  constructor(options: FileTransportOptions);
  write(_: LogEntry, formatted: string, _format: LogFormat): Promise<void>;
  /**
   * 获取当前日志文件路径
   */
  private getLogFilePath;
  private writeInternal;
  /**
   * 处理文件大小限制
   */
  private handleSizeLimit;
}
//#endregion
export { ConsoleTransport, ConsoleTransportOptions, FileTransport, FileTransportOptions, Transport };
//# sourceMappingURL=transports.d.ts.map