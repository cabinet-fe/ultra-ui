//#region src/data/validator.d.ts
/**
 * 校验问题描述
 */
interface ValidationIssue {
  /**
   * 问题路径（对象字段路径，使用 `.` 连接）
   *
   * @example
   * - `name`
   * - `profile.birthday`
   * - `items.0.id`
   */
  path: string;
  /**
   * 人类可读的错误信息
   */
  message: string;
}
type SafeParseResult<T> = {
  success: true;
  data: T;
} | {
  success: false;
  issues: ValidationIssue[];
};
/**
 * 解析器：将 unknown 解析为目标类型，失败时返回 issues
 */
type Parser<T> = (input: unknown) => SafeParseResult<T>;
/**
 * 解析失败异常（用于 `parse()`）
 */
declare class ValidationError extends Error {
  readonly issues: ReadonlyArray<ValidationIssue>;
  constructor(issues: ValidationIssue[]);
}
interface Validator<T> {
  /**
   * 安全解析：失败不抛错，返回 issues
   */
  safeParse(input: unknown): SafeParseResult<T>;
  /**
   * 解析：失败抛出 `ValidationError`
   */
  parse(input: unknown): T;
}
/**
 * 从 Parser 创建 Validator
 */
declare function createValidator<T>(parser: Parser<T>): Validator<T>;
type InferParser<P> = P extends Parser<infer T> ? T : never;
/**
 * 从对象 schema 推断输出类型
 */
type InferObjectSchema<S extends Record<string, Parser<any>>> = { [K in keyof S]: InferParser<S[K]> };
/**
 * 对象校验器：按字段 schema 校验并返回（会尽量收集所有字段错误）
 *
 * @example
 * ```ts
 * const user = object({
 *   id: number(),
 *   name: string(),
 *   age: optional(number())
 * })
 *
 * const result = user.safeParse({ id: 1, name: 'cat' })
 * if (result.success) {
 *   result.data.id // number
 * }
 * ```
 */
declare function object<S extends Record<string, Parser<any>>>(schema: S): Validator<InferObjectSchema<S>>;
interface OptionalOptions<T> {
  /**
   * 缺省值（当输入为 undefined 时生效）
   */
  default?: T | (() => T);
}
/**
 * 可选字段：当输入为 undefined 时通过（返回 undefined 或 default）
 */
declare function optional<T>(parser: Parser<T>, options?: OptionalOptions<T>): Parser<T | undefined>;
declare function vString(): Parser<string>;
declare function vNumber(): Parser<number>;
declare function vBoolean(): Parser<boolean>;
declare function vDate(): Parser<Date>;
declare function vArray<T>(item: Parser<T>): Parser<T[]>;
//#endregion
export { InferObjectSchema, OptionalOptions, Parser, SafeParseResult, ValidationError, ValidationIssue, Validator, createValidator, object, optional, vArray, vBoolean, vDate, vNumber, vString };
//# sourceMappingURL=validator.d.ts.map