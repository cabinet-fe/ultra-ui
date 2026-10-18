---
'@veltra/styles': minor
---

主题新增容器级菜单深浅变体与菜单表面装饰 token：

- `loadTheme` 额外注入 `html[data-theme] [data-nav-variant='dark'|'light']` 规则：同一主题下任意子树加 `data-nav-variant` 即可切换菜单深浅，无需重建主题；同时写入 `html[data-nav-surface]`（当前默认变体的实际底色色调）。
- 主题 `nav.variants[variant]` 可为深/浅两个菜单变体分别定制外观，未声明的变体回落到内置「主题系列 × 变体」token；`nav` 顶层键仍对所有变体生效。预设的个性侧栏色（古风/樱花/海盐的深墨侧栏）改为按变体声明，切换变体不再串色。
- 新增 `UITheme#withNavVariant()`、`UITheme#navSidebarColors()`（解析出具体色值，供主题选择器预览）以及 `navSurfaceTone()`、`navSurfaceTokens()`。
- 新增 `--u-nav-surface-*` 表面装饰 token（叠层渐变、分隔描边、chip 底色/描边/悬浮、品牌标记环、选中态渐变/描边/强调条、滚动条），按菜单实际底色色调给出配套值，应用壳无需再写 `[data-theme]` 分支。
- 修正菜单选中态对比度：深色系列的浅色菜单选中文字改为白色；浅色系列的浅色菜单选中文字加深为 `primary-dark-3`。
