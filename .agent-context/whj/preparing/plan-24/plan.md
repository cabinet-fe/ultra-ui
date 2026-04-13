# 创建 use-compositions 和 use-styles-theme 文档型技能

> 状态: 未执行

## 目标

为 `@veltra/compositions`（14 个组合式函数）和 `@veltra/styles`（主题系统 + BEM + SCSS 工具）分别创建文档型技能，使 AI 代理能正确使用组合式函数和样式/主题系统。复用 plan-23 中建立的同步脚本模式和技能结构规范。

## 内容

### 1. 创建 use-compositions 技能

目录结构：
```
.agents/skills/use-compositions/
├── SKILL.md                    # 函数目录、API 签名速查、使用场景（≤300 行）
├── scripts/
│   └── sync-docs.ts            # 同步脚本：从 compositions/src/ 各子目录的 index.ts 提取完整源码
├── generated/
│   ├── manifest.json
│   └── api-reference.md        # 14 个函数的完整源码 + 类型定义
└── references/
    └── usage-patterns.md       # 集成模式（从 desktop 组件和 playground 中提取的真实用法）
```

**SKILL.md 内容**：
- frontmatter：触发词包括"组合式函数、composable、useModel、usePop、useVirtual、表单回退"等
- 函数速查表（函数名 | 用途 | 关键参数 | 返回值），14 行
- 导入约定（`import { useXxx } from '@veltra/compositions'`）
- 按场景分组说明：状态管理（useModel, useUpdateLock）、UI 交互（useDrag, useFocus, useTransition）、布局定位（usePop, useReactiveSize, useResizeObserver, useVirtual）、表单集成（useFallbackProps, useFormFallbackProps, useFormComponent, useConfig）、组件增强（useComponentProps）

**同步脚本**：读取 `packages/compositions/src/` 下每个子目录的所有 `.ts` 文件完整源码，按函数名组织输出到 `api-reference.md`。

**usage-patterns.md**：
- useModel 的 local vs proxy 模式，附 desktop 中 input/select 组件的实际调用代码
- useFallbackProps 的三级回退链（组件 props → 表单 context → 全局 config），附实际组件示例
- usePop 的浮层定位集成，附 select/dropdown 组件的实际调用
- useVirtual 的虚拟滚动集成，附 tree/list 组件的实际调用
- useTransition 的 CSS vs Style 模式，附 dialog/drawer 组件的实际调用

### 2. 创建 use-styles-theme 技能

目录结构：
```
.agents/skills/use-styles-theme/
├── SKILL.md                    # 主题系统架构、BEM 速查、SCSS 导入约定（≤300 行）
├── scripts/
│   └── sync-docs.ts            # 同步脚本：从 styles/src/ 提取 SCSS 和 TS 源码
├── generated/
│   ├── manifest.json
│   ├── theme-tokens.md         # Theme 接口完整定义 + light/dark 预设值
│   ├── scss-api.md             # _mixins.scss + _functions.scss + _vars.scss 完整源码
│   └── theme-ts-api.md         # UITheme 类 + loadTheme/setTheme 的完整源码
└── references/
    └── theming-guide.md        # 主题定制实操指南
```

**SKILL.md 内容**：
- frontmatter：触发词包括"主题、样式、BEM、CSS 变量、深色模式、SCSS、theme"等
- 主题系统架构概述：Theme 类型 → UITheme 实例 → CSS 变量注入 → SCSS 消费
- BEM 命名速查：`@include m.b(name)` → `.u-name`、`@include m.e(el)` → `&__el`、`@include m.m(mod)` → `&--mod`、`@include m.is(state)` → `.is-state`
- SCSS 导入三件套：`@use 'pkg:@veltra/styles/mixins' as m`、`@use 'pkg:@veltra/styles/functions' as fn`、`@use 'pkg:@veltra/styles/vars'`
- CSS 变量使用：`fn.use-var(text-color, main)` → `var(--u-text-color-main)`、`fn.component-var(button, height)` → 组件级变量
- TS 主题 API 速查：`loadTheme()` / `setTheme('dark')` / `UITheme.new(partial)` / `currentTheme`

**同步脚本**：
- 读取 `_mixins.scss`、`_functions.scss`、`_vars.scss` 完整源码 → `scss-api.md`
- 读取 `theme/type.ts`、`theme/light.ts`、`theme/dark.ts` → `theme-tokens.md`
- 读取 `theme/ui-theme.ts`、`load-theme.ts`、`theme/helper.ts` → `theme-ts-api.md`

**theming-guide.md**：
- 快速开始：`loadTheme()` 一行代码启用默认主题
- 深色模式：`setTheme('dark'|'light'|'auto')` + CSS `@include m.dark()` 适配
- 自定义主题：`lightTheme.new({ color: { primary: '#xxx' } })` 扩展预设
- 组件级 token：在组件 SCSS 中用 `fn.component-var()` 声明和消费 `--u-{component}-*`
- 尺寸系统：`html.small|default|large` + `fn.use-var(form-component-height)` 响应

### 3. 注册同步命令

在根 `package.json` 添加：
- `"sync-use-compositions": "bun .agents/skills/use-compositions/scripts/sync-docs.ts"`
- `"sync-use-styles-theme": "bun .agents/skills/use-styles-theme/scripts/sync-docs.ts"`

## 影响范围

## 历史补丁
