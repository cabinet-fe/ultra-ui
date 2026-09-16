---
'@veltra/sheet-core': patch
'@veltra/sheet': patch
---

- sheet-core：深导入 `@veltra/sheet-core/core/*` 一律补 `.js` 后缀（exports `./*` 原样映射到 `dist/*`，不做扩展名补全，无后缀请求 tsc 报 TS2307）
- sheet-core：`core/events` 列入 pack entry，补上缺失的 `dist/core/events.d.ts`（消费方 `@veltra/sheet` 深导入该模块时类型此前解析不到）
- sheet：源码内 sheet-core 深导入补 `.js` 后缀，移除 tsconfig 的 `paths` 兜底与配套 `references`
