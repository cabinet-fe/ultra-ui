import { GitCommitAndPushOptions, GitCommitResult, GitTagOptions, GitTagResult } from "./types.js";

//#region src/release/git.d.ts
/**
 * 执行 git 命令
 * @param cwd - 工作目录
 * @param args - git 命令参数
 * @returns 命令输出
 * @throws {GitError} 当 git 命令执行失败时
 */
declare function execGit(cwd: string, args: string[]): Promise<string>;
/**
 * 创建 git tag（可选推送）
 * @param options - 创建配置
 * @returns 创建结果
 * @throws {GitError} 当 git 命令执行失败时
 * @example
 * ```ts
 * await createGitTag({
 *   cwd: '/path/to/repo',
 *   tag: 'v1.2.3',
 *   message: '发布 1.2.3',
 *   push: true
 * })
 * ```
 */
declare function createGitTag(options: GitTagOptions): Promise<GitTagResult>;
/**
 * 提交并推送代码（可选推送 tag）
 *
 * 如果没有待提交的变更，将跳过提交步骤，视为提交完成。
 *
 * @param options - 提交与推送配置
 * @returns 提交结果
 * @throws {GitError} 当 git 命令执行失败时
 * @example
 * ```ts
 * await commitAndPush({
 *   cwd: '/path/to/repo',
 *   message: 'chore: release',
 *   pushTags: true
 * })
 * ```
 */
declare function commitAndPush(options: GitCommitAndPushOptions): Promise<GitCommitResult>;
//#endregion
export { commitAndPush, createGitTag, execGit };
//# sourceMappingURL=git.d.ts.map