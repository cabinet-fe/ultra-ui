# @cat-kit/agent-context 示例

本包以 CLI 为主；若需在代码中引用常量，请使用发布目录下的模块路径（包未设置统一 `exports` 时以实际安装树为准）：

```ts
import { AC_ROOT_DIR, PLAN_FILE_NAME } from '@cat-kit/agent-context/dist/constants.js'
```

## CLI

```bash
npx agent-context --help
```

类型镜像见 [`generated/constants.d.ts`](generated/constants.d.ts)。
