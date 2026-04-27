# @cat-kit/cli

命令行工具包。当前提供 `verify-commit` 命令用于校验 git commit message 格式。

## 运行环境

Node.js（CLI 工具）。

## 命令

### `verify-commit`

```bash
cat-cli verify-commit [file] [-m <message>]
```

校验 git commit message 是否符合规范格式。常用作 git hook（`commit-msg` hook）。

**参数**：
- `file`：包含提交信息的文件路径（如 `.git/COMMIT_EDITMSG`）

**选项**：
- `-m, --message <msg>`：直接传入提交信息字符串

**校验规则**：
提交信息必须匹配格式：`<type>(<scope>)?!?: <subject>`

| type | 说明 |
|------|------|
| `feat` | 新功能 |
| `fix` | 修复 |
| `docs` | 文档 |
| `style` | 代码风格 |
| `refactor` | 重构 |
| `perf` | 性能优化 |
| `test` | 测试 |
| `build` | 构建系统 |
| `ci` | CI/CD |
| `chore` | 杂项 |
| `revert` | 回滚 |
| `release` | 发布 |

```bash
# 客户端 hook 用法
cat-cli verify-commit "$1"
# 或手动校验
cat-cli verify-commit -m "feat: add verify-commit command"
```

**测试用的公共函数**：

```ts
import { verifyCommitMessage, stripComments } from '@cat-kit/cli'

const result = verifyCommitMessage('feat(api): add new endpoint')
// { valid: true }

const result2 = verifyCommitMessage('bad message')
// { valid: false, reason: '提交信息格式不正确...' }
```

- `verifyCommitMessage(message)` 返回 `{ valid: boolean; reason?: string }`，无副作用，可直接用于单元测试
- `stripComments(raw)` 去除 `#` 开头的注释行

## npm bin

可执行文件为 `cat-cli`（见包 `package.json` 的 `bin` 字段）。

> 类型签名：`../../generated/cli/cli.d.ts`
