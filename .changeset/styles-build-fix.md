---
"@veltra/styles": patch
---

修复 `@veltra/styles` 构建产物导出路径，将 `import` 与 `default` 条件正确指向 `dist/` 目录；新增 `normalize.ts` 与 `anime/index.ts` 入口文件以支持独立导入；更新 `tsdown.config.ts` 构建入口。
