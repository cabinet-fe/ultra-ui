# 修复 load-theme 重复声明导致 Vite 无法解析

## 补丁内容

`packages/compositions/src/load-theme.ts` 中同时使用 `import type { UITheme }` 与 `import { UITheme, ... }`，在 Rolldown/Vite 依赖扫描阶段会报 `Identifier 'UITheme' has already been declared`，sample 全站无法加载。

已移除单独的 `import type { UITheme }` 行，仅保留值导入。`loadTheme(theme?: UITheme)` 中类型位置的 `UITheme` 仍指向类的实例类型（TypeScript 对 class 的常规语义），行为不变。

## 影响范围

- 修改文件: `packages/compositions/src/load-theme.ts`
