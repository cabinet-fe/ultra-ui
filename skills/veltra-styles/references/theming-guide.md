# @veltra/styles — 主题定制实操

## 快速开始：默认主题

在应用入口（如 `main.ts`）调用一次即可注入内置 light/dark CSS 变量，并与 `setTheme` 联动：

```typescript
import { loadTheme } from '@veltra/styles/theme'

loadTheme()
```

不传参时等价于内置 `lightTheme`，并注册 dark 预设；详见 `generated/theme-ts-api.md` 中 `load-theme.ts` 注释。

## 深色模式与 `auto`

```typescript
import { setTheme } from '@veltra/styles/theme'

setTheme('dark') // 或 'light' | 'auto'
```

- `light` / `dark`：写入 `document.documentElement.dataset.theme`。
- `auto`：移除 `data-theme`，由内置媒体查询跟随系统。

组件 SCSS 中可用 `@include m.dark() { ... }` 书写仅暗色下生效的覆盖（参见 [SKILL.md](../SKILL.md) BEM 小节与 `generated/scss-api.md`）。

## 自定义主题：基于预设 `new`

```typescript
import { lightTheme, UITheme } from '@veltra/styles/theme'

const custom = lightTheme.new({
  color: {
    primary: '#0066cc'
  }
})

loadTheme(custom)
```

`UITheme.new` / `lightTheme.new` 会合并进完整 `Theme` 对象并（在 reactive 模式下）深度监听变更后重新注入 CSS。

## 组件级 token

1. 在 `Theme` 类型对应位置声明组件命名空间下的字段（见 `generated/theme-tokens.md` 中 `Theme` 接口）。
2. 在组件 SCSS 中用 `fn.component-var(button, height)` 等生成 `var(--u-button-height)` 消费侧变量。

保持「TS 主题对象字段」与「SCSS 中 `fn.component-var` 名称参数」一致，可避免运行时缺变量。

## 文档尺寸与 `html` class

`loadTheme` 会通过 `useConfig()` 在 `document.documentElement` 上添加尺寸 class（如 `default` / `small` / `large`，具体以全局配置为准）。表单控件高度等 token 常与之联动，SCSS 中可用 `fn.use-var(form-component-height)` 等读取。

## SCSS 侧三件套导入

构建侧需启用 Sass `NodePackageImporter`（本 monorepo 已配置）；组件样式推荐：

```scss
@use 'pkg:@veltra/styles/mixins' as m;
@use 'pkg:@veltra/styles/functions' as fn;
@use 'pkg:@veltra/styles/vars';
```

完整 mixin/function 源码见 `generated/scss-api.md`。
