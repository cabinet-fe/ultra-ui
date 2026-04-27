# @cat-kit/agent-context 示例

本包以 CLI 为主；若需在代码中引用常量，请使用发布目录下的模块路径：

```ts
import { AC_ROOT_DIR, PLAN_FILE_NAME } from '@cat-kit/agent-context/dist/constants.js'
```

## CLI

```bash
npx agent-context --help
```

## 同步已安装的 ac-workflow Skill

```bash
agent-context sync --check
agent-context sync
```

## 评估 description 触发样例

```bash
agent-context skill-eval
```

## 生成本机全局提示词模板

```bash
agent-context prompt-gen --check
agent-context prompt-gen --profile whj --tools codex
```

> 类型参考：`../../generated/agent-context/cli.d.ts`
