# @cat-kit/cli

CatKit 命令行工具。

## verify-commit

校验 Git 提交信息是否符合 Conventional Commit 格式。

### 用法

```bash
# 直接传入提交信息
cat-cli verify-commit --message "feat(cli): add verify command"

# 读取文件
cat-cli verify-commit .git/COMMIT_EDITMSG

# 从 stdin 读取
echo "fix(core): handle edge case" | cat-cli verify-commit
```

### 校验规则

```text
^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\(.+\))?!?: .+
```

合法示例：
- `feat(cli): add verify command`
- `fix(core)!: drop legacy parser`
- `docs: update README`

### 接入 Git Hook

```bash
# .husky/commit-msg 或 .git/hooks/commit-msg
cat-cli verify-commit "$1"
```

校验失败以退出码 `1` 结束。

### 编程接口

```typescript
function verifyCommitMessage(message: string): { valid: boolean; reason?: string }
```
