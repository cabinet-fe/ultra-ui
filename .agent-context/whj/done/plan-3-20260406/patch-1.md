# review 后修正 dist manifest 与 AGENTS 表述

## 补丁内容

- **`build/prepare.ts`**：`writeDistPackageJson` 在 `syncDependencies` 之后，将写入各包 `dist/package.json` 的字段中 `./dist/` 前缀改写为相对 dist 根目录的 `./`，并移除 `files: ["dist"]`，避免嵌套在 `dist/` 内的 manifest 指向错误的入口路径。
- **`AGENTS.md`**：技术栈「核心依赖」一行与 plan-3 对齐，明确 `@cat-kit/core`（core）与 `lucide-vue-next`（pc）的分工。

## 影响范围

- 修改文件: `build/prepare.ts`
- 修改文件: `AGENTS.md`
