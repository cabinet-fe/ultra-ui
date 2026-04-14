# tsdown 入口精简与移除 Sass api

## 补丁内容

1. **`entry`**：仅保留 `src/index.ts` 与 `src/components/**/style.ts`，移除 `src/types/index.ts` 作为独立构建入口；类型仍由主入口 `export type * from './types'` 参与 `dts` 产出，构建后 `dist/types/**` 仍存在。
2. **`css.preprocessorOptions.scss`**：按声明移除 `api: 'modern-compiler'`，保留 `importers: [new NodePackageImporter(repoRoot)]`。

## 影响范围

- 修改文件: `packages/desktop/tsdown.config.ts`
