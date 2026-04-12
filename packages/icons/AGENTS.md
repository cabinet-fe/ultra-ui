# AGENTS.md — @veltra/icons

SVG 图标组件库，将 SVG 文件自动转换为 Vue SFC 并导出。

## 使用方式

```ts
import { Search, Close } from '@veltra/icons/normal'
import { Logo } from '@veltra/icons/colorful'
```

## 导出子路径

| 子路径                     | 用途                          |
| -------------------------- | ----------------------------- |
| `@veltra/icons`          | 全部图标（normal + colorful） |
| `@veltra/icons/normal`   | 单色图标集合                  |
| `@veltra/icons/colorful` | 多色图标集合                  |

## 目录结构

```
├── src/
│   ├── index.ts        # packageName 常量 + re-export normal & colorful
│   ├── normal.ts       # ⚠️ 自动生成 — 导出全部单色图标 SFC
│   ├── colorful.ts     # ⚠️ 自动生成 — 导出全部多色图标 SFC
│   └── vue/            # ⚠️ 自动生成 — 各图标 .vue SFC
├── scripts/
│   ├── rename-svg-icons.ts   # SVG 文件重命名
│   ├── format-svg.ts         # SVG 格式化（svgo）
│   ├── gen-vue-icons.ts      # SVG → Vue SFC 生成
│   ├── gen-icon-barrels.ts   # 生成 normal.ts / colorful.ts barrel 文件
│   ├── build-vue-icons.ts    # tsdown 构建 Vue 图标到 dist/
│   └── icon-naming.ts        # 命名规则工具
└── package.json
```

## 生成工作流

```bash
bun run icons:rename     # 1. 重命名 SVG 文件
bun run icons:format     # 2. svgo 格式化 SVG
bun run icons:gen        # 3. SVG → Vue SFC + 生成 barrel 文件
bun run icons:build-vue  # 4. tsdown 构建到 dist/
bun run build            # 快捷：icons:gen + icons:build-vue
```

## 注意事项

- `src/normal.ts`、`src/colorful.ts`、`src/vue/` 均为脚本自动生成，**不要手动编辑**
- 新增图标：将 SVG 文件放入对应目录，运行 `bun run build` 即可
- `sideEffects: false` — 支持 tree-shaking

## 依赖

- **peer**：`vue ^3.5.0`
- **devDependencies**：`svgo`、`tsdown`、`unplugin-vue`
