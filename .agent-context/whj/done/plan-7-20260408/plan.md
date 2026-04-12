# playground 源码解析与条件导出

> 状态: 已执行

## 目标

在开发 `@playgrounds/desktop` 时通过 Node `exports` 的 `development` 条件解析到各包源码，避免依赖先构建产物（尤其 `@veltra/icons` 的 `dist`）；生产构建仍走 `import` 等默认条件指向构建产物。用包导出替代 playground 内重复的 `resolve.alias`，并显式配置 turbo 的 `dev` 任务不依赖上游 `build`。

## 内容

1. 更新 `packages/desktop`、`packages/utils`、`packages/compositions`、`packages/directives` 的 `exports`：为现有子路径补充 `development`（与当前 `import`/`types` 一样指向 `src`）；为 `@veltra/desktop` 增加 `"./*"` 映射以支持深路径（如 `components/.../style.ts`），`import` 在 workspace 内仍指向 `src`（桌面库发布产物仍由 `tools/build` 生成根目录 `dist/package.json`，不在此包内维护 `dist`）。
2. 更新 `packages/icons` 的 `exports`：为各子路径增加 `development`，指向 `src` 下对应 `.ts` / `.vue`；保留现有 `import`/`types` 指向 `dist`，供 `vite build` 与未使用 `development` 的解析使用。
3. 精简 `playgrounds/desktop/vite.config.ts`：删除与 `@veltra/desktop` / `utils` / `compositions` / `directives` / `icons` 重复的 alias，保留 `ultra-ui` 兼容别名、CodeMirror `dedupe`、`scss` `loadPaths`；必要时为 `resolve` 设置 `preserveSymlinks` 或依赖默认条件（Vite 开发模式包含 `development`）。
4. 更新 `vitest.config.ts`：与 playground 一致改为依赖包 `exports` 解析（移除或收窄手写 alias），并为测试环境设置 `resolve.conditions` 使 `development` 优先于默认 `import`，从而在未构建 icons `dist` 时仍能跑测试。
5. 更新根目录 `turbo.json`：为 `dev` 任务显式设置 `dependsOn: []`，避免后续误加对 `^build` 的依赖。

## 影响范围

- `packages/desktop/package.json`
- `packages/utils/package.json`
- `packages/compositions/package.json`
- `packages/directives/package.json`
- `packages/icons/package.json`
- `playgrounds/desktop/vite.config.ts`
- `playgrounds/desktop/ultra-ui.ts`
- `vitest.config.ts`
- `turbo.json`
- `packages/desktop/src/components/code-editor/code-editor.vue`

## 历史补丁
