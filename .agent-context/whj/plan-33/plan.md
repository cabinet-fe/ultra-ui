# 优化 Monorepo 工具链依赖归属

> 状态: 已执行

## 目标

将 Ultra UI monorepo 中重复分散声明的工具链型开发依赖统一收敛到根 `package.json`，降低 workspace 维护成本，避免 `tsdown`、`typescript`、`vitest`、`vue-tsc`、`sass-embedded` 等仅用于构建、类型检查、测试和样式编译的工具在子包内重复声明，同时不影响各包真实的 runtime / peer 依赖边界。

## 内容

1. 审查根包与各 workspace 的 `package.json`，区分工具链型开发依赖与必须保留在子包的运行时、peer 或发布期依赖，确定需要移除的重复项。
2. 修改受影响的 `package.json`，将重复的工具链型依赖从子 workspace 中移除，仅保留根 `package.json` 作为统一入口，并保持各 workspace 现有脚本可继续通过根工具链执行。
3. 运行依赖安装与必要校验，确认 lockfile 和 workspace 解析结果一致，确保构建或类型检查命令在调整后仍可正常工作。

## 影响范围

- `packages/compositions/package.json`
- `packages/desktop/package.json`
- `packages/directives/package.json`
- `packages/icons/package.json`
- `packages/styles/package.json`
- `packages/utils/package.json`
- `playgrounds/desktop/package.json`

## 历史补丁
