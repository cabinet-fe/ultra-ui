---
"@veltra/sheet": patch
---

内置工具改为 `BUILTIN_TOOLS` 数据，由 `defaultToolRegistry` 构造时装入；移除主入口对 `builtin` 的 side-effect 导入，避免打包器误判无副作用而跳过注册导致工具栏为空。
