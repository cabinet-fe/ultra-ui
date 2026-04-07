import { PublishOptions, PublishResult } from "./types.js";

//#region src/release/publish.d.ts
/**
 * 发布 npm 包
 *
 * 支持三种发布模式：
 * 1. **单包发布**：仅提供 `cwd`，发布该目录下的包
 * 2. **指定工作区发布**：提供 `workspace` 数组，使用 npm 原生 `--workspace` 参数
 * 3. **全部工作区发布**：设置 `workspaces: true`，使用 npm 原生 `--workspaces` 参数
 *
 * 使用实时输出模式，让用户可以看到发布进度。
 *
 * 类似 pnpm 和 bun，此函数会自动处理 `workspace:` 和 `catalog:` 协议：
 * - `workspace:*` -> 精确版本 (如 "1.0.0")
 * - `workspace:^` -> caret 范围 (如 "^1.0.0")
 * - `workspace:~` -> tilde 范围 (如 "~1.0.0")
 * - `catalog:` -> 从 catalog 定义中解析版本
 *
 * 协议解析仅在发布时临时进行，不会修改源代码中的版本号。
 *
 * @param options - 发布配置
 * @returns 发布结果
 * @throws {PublishError} 当发布失败时
 *
 * @example
 * ```ts
 * // 单包发布（自动解析协议）
 * await publishPackage({
 *   cwd: '/path/to/pkg',
 *   registry: 'https://registry.npmmirror.com',
 *   tag: 'next',
 *   resolveProtocol: {
 *     workspaces: [
 *       { name: '@cat-kit/core', version: '1.0.0' }
 *     ]
 *   }
 * })
 *
 * // 发布指定工作区
 * await publishPackage({
 *   cwd: '/path/to/monorepo',
 *   workspace: ['@cat-kit/core', '@cat-kit/fe'],
 *   access: 'public'
 * })
 *
 * // 发布所有工作区
 * await publishPackage({
 *   cwd: '/path/to/monorepo',
 *   workspaces: true,
 *   access: 'public'
 * })
 * ```
 */
declare function publishPackage(options: PublishOptions): Promise<PublishResult>;
//#endregion
export { publishPackage };
//# sourceMappingURL=publish.d.ts.map