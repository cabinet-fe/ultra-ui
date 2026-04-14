# 恢复 style 副作用链并修复 dist 摇树裁掉依赖

## 补丁内容

1. **撤销 plan-27 的 Sass 方案**：将 `packages/desktop/src/components/**/style.ts`、`style.scss` 恢复为与 `HEAD` 一致。通过 `@use '../foo/style.scss'` 把依赖样式打进同一入口的 `style2.css`，会在按需加载多个组件时**重复注入同一段 CSS**，且破坏「一组件一 CSS 文件」的分割语义。

2. **在构建层修复根因**：`@tsdown/css` 在 `inject + splitting` 下会把对「纯 CSS chunk」的 import 改写成对 `*.css` 的引用；但若 Rolldown 在摇树阶段认为 `**/components/*/style.ts` 无副作用，会先**删掉**对其它 `style.ts` 的 import，后续 inject 无法恢复，表现为 dist 中 `style.js` 仅剩 `import "./style2.css"`、依赖样式缺失。在 `packages/desktop/tsdown.config.ts` 中为匹配 `**/components/<name>/style.ts` 的模块设置 `treeshake.moduleSideEffects` 返回 `true`，显式保留各样式入口的副作用链（与 `package.json` 中 `sideEffects` 的意图一致）。`moduleSideEffects` 判断前将 `id` 中的 `\\` 规范为 `/`，避免 Windows 路径下漏匹配。

3. **恢复 `install.ts` 构建入口**：与 `HEAD` 一致，继续参与 `tsdown` 多入口构建。

## 影响范围

- 修改文件: `packages/desktop/tsdown.config.ts`
