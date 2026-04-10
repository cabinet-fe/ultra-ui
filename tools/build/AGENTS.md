# AGENTS.md — tools/build

多包发版辅助：在仓库根执行 `turbo run build`，可选交互式对齐版本号、打 tag、按包 `npm publish`。

## 命令

```bash
cd tools/build
bun index.ts           # 等价于在仓库根执行 bun run build（turbo 编排各包 tsdown）
bun index.ts --release # 选择版本 → 写入各发布包 package.json → turbo build → 提交/tag/发布
# 或
bun run release
```

## 目录

| 文件 | 职责 |
| ---- | ---- |
| `index.ts` | 非 release：调用仓库根 `bun run build`；`--release`：版本号 + 构建 + `release()` |
| `release.ts` | 版本提示与写入、`commitRelease`、`createTag`、多包 `npm publish` |

## 发布包列表

与 `release.ts` 中 `PUBLISH_PKG_ROOTS` 一致：`@ultra-ui/utils`、`@ultra-ui/styles`、`@ultra-ui/compositions`、`@ultra-ui/directives`、`@ultra-ui/desktop`、`@ultra-ui/icons`。

## 依赖

- `@cat-kit/be`（readJson / writeJson）、`@inquirer/prompts`、`execa`、`typescript`

## Turbo

`package.json` 的 `build` 为 **no-op**，避免 `turbo run build` 递归进入本目录再次触发构建。
