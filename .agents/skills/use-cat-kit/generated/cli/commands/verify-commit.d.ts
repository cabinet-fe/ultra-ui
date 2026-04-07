/**
 * 核心校验逻辑 (无副作用，易于测试)
 */
export declare function verifyCommitMessage(message: string): {
    valid: boolean;
    reason?: string;
};
export declare function stripComments(raw: string): string;
/**
 * CLI 命令适配器
 *
 * 消息来源优先级: --message > file 参数 > .git/COMMIT_EDITMSG
 */
export declare function verifyCommitAction(file: string | undefined, options: {
    message?: string;
}, _command: any): Promise<void>;
