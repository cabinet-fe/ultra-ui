# 修复 sample 中 CodeMirror 多实例导致 code-editor 页崩溃

## 补丁内容

`http://localhost:7788/code-editor/index` 加载 `UCodeEditor` 时控制台报错：`Unrecognized extension value in extension set... multiple instances of @codemirror/state`。原因是 monorepo 的 `node_modules` 里各 `@codemirror/*` 子包嵌套了多份 `@codemirror/state`，Vite 预打包后 `instanceof` 不一致。

在 `apps/sample/vite.config.ts` 中为 CodeMirror / Lezer 相关包配置 `resolve.dedupe`，并对常用语言包与核心包设置 `optimizeDeps.include`，使开发与预构建阶段统一解析到同一份 `@codemirror/state` / `@codemirror/view` 等。

## 影响范围

- 修改文件: `apps/sample/vite.config.ts`
