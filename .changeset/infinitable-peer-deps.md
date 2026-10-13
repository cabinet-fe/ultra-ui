---
"@veltra/desktop": patch
"@veltra/sheet": patch
---

refactor(deps): infinitable 转为对等依赖由宿主统一提供。@veltra/sheet 声明非可选 peer（`^0.2.2`）；@veltra/desktop 声明可选 peer（`peerDependenciesMeta.optional`），未安装 infinitable 时文件预览的电子表格预览按既有降级逻辑显示不可用，宿主不再被强制安装表格引擎，也避免宿主直连 infinitable 时出现双副本
