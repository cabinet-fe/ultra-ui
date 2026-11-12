---
"@veltra/styles": major
---

古风主题更名「宣纸」（breaking）：导出 `ancientTheme` → `xuanzhiTheme`，preset 文件 `ancient.ts` → `xuanzhi.ts`。迁移方式：代码里引用 `ancientTheme` 的地方改为 `xuanzhiTheme`：

```ts
// 旧
import { ancientTheme } from '@veltra/styles'
// 新
import { xuanzhiTheme } from '@veltra/styles'
```

主题配色不变（松烟绿 + 宣纸底），仅名字调整；与 `sakura` 等命名惯例对齐采用拼音 `xuanzhi`。

