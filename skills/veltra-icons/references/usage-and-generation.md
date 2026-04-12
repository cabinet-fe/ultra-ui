# Usage And Generation

## public imports

推荐按集合引入：

```ts
import { Search, Close } from '@veltra/icons/normal'
import { Pdf, Excel } from '@veltra/icons/colorful'
```

也可以从 `@veltra/icons` 聚合入口读取全部图标，但日常更推荐按集合区分。

## 目录角色

source of truth：

- `packages/icons/src/svg/normal/**/*.svg`
- `packages/icons/src/svg/colorful/**/*.svg`

生成产物：

- `packages/icons/src/vue/normal/*.vue`
- `packages/icons/src/vue/colorful/*.vue`
- `packages/icons/src/normal.ts`
- `packages/icons/src/colorful.ts`

## 生成工作流

当前脚本：

- `bun run icons:rename`
- `bun run icons:format`
- `bun run icons:gen`
- `bun run icons:build-vue`
- `bun run build`

含义：

- `rename`
  按命名规则修正 SVG 文件名
- `format`
  用 `svgo` 格式化 SVG
- `gen`
  生成 Vue SFC 与 barrel 文件
- `build-vue`
  构建图标产物到 `dist/`

## 命名规则

源码：`packages/icons/scripts/icon-naming.ts`

规则：

- 只用 kebab-case、小写、ASCII
- 不在文件名里重复 `normal-` / `colorful-`
- 目录表达分类，文件名表达语义
- 已知 typo 通过 `KNOWN_TYPOS` 修正，例如 `sort-rigth` -> `sort-right`

## Vue SFC 生成规则

源码：`packages/icons/scripts/gen-vue-icons.ts`

关键点：

- 组件名由 kebab-case 转 PascalCase
- normal 图标会把常见黑色 `fill` / `stroke` 替换成 `currentColor`
- colorful 图标不做这类替换
- 生成文件头会带 hash 与 `GEN_TAG`，未变更时跳过重写

## barrel 生成规则

源码：`packages/icons/scripts/gen-icon-barrels.ts`

关键点：

- 扫描 `src/vue/<sub>/*.vue`
- 生成 `src/normal.ts` 与 `src/colorful.ts`
- 导出名按组件名排序

## 修改后检查

- 是否只改了 `src/svg/**` 或脚本，而不是直接改生成文件
- 是否重新执行 `bun run build`
- 是否 import 到正确集合
