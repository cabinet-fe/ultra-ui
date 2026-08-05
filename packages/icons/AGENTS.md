# AGENTS.md — @veltra/icons

SVG 图标 → Vue SFC，支持 tree-shaking。

## 使用

```ts
import { Search, Close } from '@veltra/icons/normal'
import { Logo, FontColor } from '@veltra/icons/colorful'
```

## 目录结构

```
src/
├── index.ts
├── normal.ts       # ⚠️ 自动生成
├── colorful.ts     # ⚠️ 自动生成
└── vue/            # ⚠️ 自动生成 .vue SFC
scripts/
├── rename-svg-icons.ts
├── format-svg.ts
├── gen-vue-icons.ts
└── gen-icon-barrels.ts
```

## 工作流

```bash
bun run icons:rename
bun run icons:format
bun run icons:gen
bun run icons:build-vue   # vp pack
bun run build             # icons:gen + icons:build-vue
```

`normal.ts`、`colorful.ts`、`vue/` 勿手改；新增 SVG 后跑 `bun run build`。

## 依赖

- **peer**：`vue`
- **devDependencies**：`svgo`

## 验证

```bash
bun run lint
vp run -F @veltra/icons build
bun run build
```
