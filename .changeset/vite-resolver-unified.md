---
'@veltra/vite': patch
---

resolver 覆盖 `@veltra/ai` 与 `@veltra/sheet`：`VeltraDesktopUIResolver` 改名为
`VeltraUIResolver`，一个 resolver 同时解析 desktop / ai / sheet 的 `U*` 组件（新增
`UAiChat`、`USheet`）；`@veltra/ai`、`@veltra/sheet` 声明为可选 peer。

组件表改由 `bun run resolver:gen`（`scripts/gen-vite-resolver.ts`）扫描各包组件目录生成到
`src/components.gen.ts`，替代原先手工维护的 `DESKTOP_COMPONENTS` 与 `SHARED_STYLE_DIR`；
`ci:verify` 追加 `--check` 防止组件表过期。顺带修掉手工列表里的 `UGroupNavItem`——它是
`group-nav` 的内部子组件，从未从 `@veltra/desktop` 导出，解析它只会产出无效 import。

`include` / `exclude` 选项移除（按需解析本就只在模板用到组件时才注入，过滤无实际意义），
仅保留 `importStyle`。
