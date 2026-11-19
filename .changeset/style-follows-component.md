---
"@veltra/desktop": minor
"@veltra/ai": minor
"@veltra/sheet": minor
"@veltra/mobile": minor
---

组件样式改为随组件模块自身按需加载：组件 SFC 的 script 首部 `import './style'`，宿主显式 `import { UButton } from '@veltra/desktop'` 即可获得对应样式（依赖组件样式一并带出），不再需要 `@veltra/vite` resolver 或手动 `import '@veltra/desktop/components/<name>/style'`。未用到的组件与样式保持同粒度 tree-shake。`@veltra/vite` 已废弃并在 npm 标记 deprecate；全量样式入口 `@veltra/<pkg>/style` 与 `install` 全局注册不受影响。
