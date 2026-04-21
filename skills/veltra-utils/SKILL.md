---
name: veltra-utils
description: >
  @veltra/utils 工具函数与共享类型文档。
  当涉及工具函数、BEM、类名、DOM 操作、滚动、高亮、z-index、表单校验、Validator、
  补间 Tween、帧回调、浅计算、响应式 middleProxy、命名空间常量、ComponentSize、
  FormComponentProps 等时使用。详细源码见 `generated/api/*.md` 与
  generated/shared-types.md；BEM 用法见 references/bem-guide.md。
---

# veltra-utils

## 生成物

| 文件                                                   | 内容                                                                  |
| ------------------------------------------------------ | --------------------------------------------------------------------- |
| [generated/api/](generated/api/)                       | 按域拆分：`entry.md`、`dom.md`、`form.md`、`helper.md`、`reactive.md` |
| [generated/shared-types.md](generated/shared-types.md) | `shared/`、`types/` 下全部 `.ts` 源码                                 |
| [generated/manifest.json](generated/manifest.json)     | 同步时间与文件列表                                                    |
| [references/bem-guide.md](references/bem-guide.md)     | `bem` / `makeBEM` API 与组件内用法                                    |

根目录执行 `bun run sync-veltra-utils` 或 `bun run sync-skills` 可重新生成 `generated/`。

## 导入约定

```typescript
import {
  bem,
  addClass,
  removeClass,
  getScrollParents,
  scrollIntoContainerView,
  withUnit,
  setStyles,
  removeStyles,
  zIndex,
  getHighlightChunks,
  Validator,
  makeBEM,
  createIncrease,
  createToggle,
  Tween,
  nextFrame,
  shallowComputed,
  isTextNode,
  isFragment,
  isComment,
  isTemplate,
  extractNormalVNodes,
  middleProxy
} from '@veltra/utils'

import { NAME_SPACE, CLS_PREFIX, FORM_EMPTY_CONTENT } from '@veltra/utils/shared'
```

按需引入即可；无默认导出。共享常量与部分类型也可从 `@veltra/utils/shared` 引用。

## 按目录的函数速查

### DOM

| 符号                         | 用途                                                                    |
| ---------------------------- | ----------------------------------------------------------------------- |
| `addClass` / `removeClass`   | 元素 class 增删                                                         |
| `getScrollParents`           | 可滚动祖先链                                                            |
| `scrollIntoContainerView`    | 在容器内滚入视区                                                        |
| `withUnit`                   | 数值补单位                                                              |
| `setStyles` / `removeStyles` | 行内样式批量设置/清理                                                   |
| `zIndex`                     | 全局 z-index 栈                                                         |
| `getHighlightChunks`         | 文本高亮分片                                                            |
| `bem`                        | 默认 `u-` 前缀的 BEM 工厂（见 [bem-guide.md](references/bem-guide.md)） |

### 表单校验

| 符号        | 用途       |
| ----------- | ---------- |
| `Validator` | 表单校验器 |

### 辅助

| 符号                              | 用途                         |
| --------------------------------- | ---------------------------- |
| `makeBEM`                         | 自定义前缀 BEM 工厂          |
| `createIncrease` / `createToggle` | 递增 id、布尔切换            |
| `Tween`                           | 补间                         |
| `nextFrame`                       | `requestAnimationFrame` 封装 |
| `shallowComputed`                 | 浅层 computed 辅助           |

### Vue 辅助

| 符号                                                     | 用途              |
| -------------------------------------------------------- | ----------------- |
| `isTextNode` / `isFragment` / `isComment` / `isTemplate` | 节点类型判断      |
| `extractNormalVNodes`                                    | 规范化 vnode 列表 |

### 响应式

| 符号          | 用途           |
| ------------- | -------------- |
| `middleProxy` | 中间层代理工具 |

### 常量（`@veltra/utils/shared`）

| 符号                        | 用途             |
| --------------------------- | ---------------- |
| `NAME_SPACE` / `CLS_PREFIX` | 类名前缀         |
| `FORM_EMPTY_CONTENT`        | 表单只读占位展示 |

## 共享类型速查

常用类型定义在 `types/` 中镜像于 [shared-types.md](generated/shared-types.md)，例如：

- `ComponentSize`、`ColorType`（见 `types/component-common.ts`）
- `FormComponentProps` 及表单上下文类型（见 `types/form-context.ts` 等）

具体字段以生成文件中的源码为准。
