# 包内相对路径 + TS 开发期类型解析

> 状态: 已执行

## 目标

1. `packages/*` 内引用**本包**源码时一律改为相对路径，避免自引用走 `exports`。
2. 在**不修改**各包 `package.json` 的 `development` 条件导出的前提下，通过 `tsconfig` 的 `baseUrl`/`paths` 让 TypeScript 在开发期解析到 `src`（与 Vite 的 development 行为对齐），而非缺失或过期的 `dist/*.d.ts`。

## 内容

1. 扫描 `packages/desktop/src`，将 `@veltra/desktop`、`@veltra/desktop/types`、`@veltra/desktop/components` 替换为自文件到 `src/index.ts`、`src/types/index.ts`、`src/components/index.ts` 的相对路径（不含扩展名，目录导入等价于原 subpath）。
2. 在 `packages/desktop/tsconfig.json` 中增加 `baseUrl` 与 `paths`：映射本包子路径及 workspace 依赖 `@veltra/compositions`、`@veltra/directives`、`@veltra/icons`（含 `normal`/`colorful`）到对应包的 `src`。
3. 在 `packages/directives`、`packages/icons`、`packages/compositions` 的 `tsconfig.json` 中为各自包名增加指向 `src` 的 `paths`（供包内或工具链解析）。
4. 在 `playgrounds/desktop/tsconfig.json` 中增加从 playground 根到各包 `src` 的 `paths`，保证预览应用内 TS 与 Vite 一致。
5. 运行 `bunx tsc -b`（或项目既有类型检查命令）验证通过。

## 影响范围

- `packages/desktop/src/**`：自引用改为相对路径（约 148 个文件）。
- `packages/desktop/tsconfig.json`、`packages/utils/tsconfig.json`、`packages/compositions/tsconfig.json`、`packages/directives/tsconfig.json`、`packages/icons/tsconfig.json`：`baseUrl` + `paths`（仅本包）+ `customConditions: ["development"]` + `ignoreDeprecations: "6.0"`。
- `playgrounds/desktop/tsconfig.json`：`paths` 指向各包 `src` + `customConditions` + `ignoreDeprecations`。

## 历史补丁
