# 重构 AGENTS.md — 渐进式披露

> 状态: 已执行

## 目标

当前根 `AGENTS.md` 将所有信息堆在一个文件中，导致过长且缺乏层次。需要按渐进式披露原则重构为「根总览 + 子包详情」的两级结构，使 AI Agent 能在根文件快速了解全局，再按需深入子包获取细节。

## 内容

### 步骤 1：生成根 `AGENTS.md`（总览层）

重写 `/AGENTS.md`，仅保留全局视角信息：

- **项目定位**：一句话描述
- **常用命令**：保留现有命令表
- **技术栈**：保留现有表格
- **目录结构**：精简，每个子包附带一句话描述 + 指向子包 `AGENTS.md` 的相对路径引用
- **包依赖关系**：ASCII 图
- **路径别名**：保留
- **全局约定**：命名规则（组件名 `U` 前缀、CSS `u-` 前缀、指令 `v` 前缀、目录 kebab-case、类型命名规则）
- **约束**：commit 校验、sideEffects 声明

**删除下沉到子包的内容**：组件文件结构、组件编写模式、表单组件模式、BEM+SCSS 详细用法、主题系统详细 API。

### 步骤 2：生成 `packages/utils/AGENTS.md`

内容：

- 包职责：工具函数、共享类型、样式系统（BEM/SCSS/CSS变量/主题）
- `src/` 目录结构说明（utils/、shared/、types/、styles/ 各模块作用）
- 样式系统详细说明：BEM mixin 用法（`b/e/m/em/is`）、CSS 变量函数（`fn.use-var()`）、命名空间变量、Sass loadPaths 要求
- 主题系统：`UITheme` 类、`lightTheme`/`darkTheme` 预设、`setTheme()` API、`currentTheme`
- 类型系统：`Theme` 全局类型、`component-common` 公共类型
- 导出约定：`exports` 子路径（`./types`、`./styles`、`./shared` 等）

### 步骤 3：生成 `packages/compositions/AGENTS.md`

内容：

- 包职责：Vue 3 组合式函数集合
- 所有 composition 函数列表及一句话描述
- 关键 API 用法模式（`loadTheme`、`useFormComponent`、`useFormFallbackProps`、`useModel`、`usePop`、`useTransition` 等）
- 依赖关系：`@cat-kit/core` + `@ultra-ui/utils`

### 步骤 4：生成 `packages/directives/AGENTS.md`

内容：

- 包职责：Vue 自定义指令
- 全部指令列表及用途：`vFocus`、`vClickOutside`、`vRipple`
- ripple 指令样式子路径导出说明
- 新增指令的文件结构约定

### 步骤 5：生成 `packages/desktop/AGENTS.md`

内容：

- 包职责：桌面端 UI 组件库主包
- 组件文件结构（`<name>.vue` / `index.ts` / `style.scss` / `style.ts` / `use-*.ts` / `di.ts`）
- 类型定义位置（`src/types/<name>.ts`）
- 组件编写模式（SFC 模板 + BEM + defineOptions）
- 表单组件模式（`useFormComponent` / `useFormFallbackProps` / `FormComponentProps` / `FORM_EMPTY_CONTENT`）
- `install.ts` 全局注册机制
- 导出结构：`components/index.ts` barrel + `types/index.ts` 再导出

### 步骤 6：生成 `packages/icons/AGENTS.md`

内容：

- 包职责：SVG 图标组件库
- 导出路径：`/normal`、`/colorful`
- 生成工作流：`icons:rename` → `icons:format` → `icons:gen` → `icons:build-vue` → `build`
- 文件结构：`src/vue/` 生成的 SFC、`normal.ts` / `colorful.ts` 自动导出
- 使用方式：`import { X } from '@ultra-ui/icons/normal'`
- 注意事项：`src/normal.ts` / `colorful.ts` 为自动生成文件，不要手动编辑

### 步骤 7：生成 `tools/build/AGENTS.md`

内容：

- 职责：构建流水线（tsdown + Rolldown + sass-embedded）
- 构建流程：`build()` → `buildStyles()` → `copyFiles()` → `genFiles()` → 可选 `release()`
- 关键文件说明：`index.ts`（入口）、`build.ts`（JS/DTS）、`build-styles.ts`（SCSS→CSS）、`prepare.ts`（复制+生成发布 package.json）、`release.ts`（发版）、`shared.ts`（路径常量/别名）
- 产物目录：仓库根 `dist/`
- 路径别名映射：`workspaceTsAliases`
- 命令：`bun index.ts`（构建）、`bun index.ts --release`（构建+发版）

### 步骤 8：生成 `tools/cli/AGENTS.md`

内容：

- 职责：开发辅助 CLI 工具集
- 工具列表：`gen-component`（交互式组件脚手架）、`export`（barrel 文件重写）、`rename/types`（.d.ts → .ts 迁移）
- 各工具入口路径与调用方式
- 共享常量：`UI_PATH`、`COMPONENT_PATH`

### 步骤 9：生成 `playgrounds/desktop/AGENTS.md`

内容：

- 职责：组件开发预览应用
- 启动方式：`bun dev`（端口 7788）
- Vite 配置要点：SCSS loadPaths、unplugin-components 自动解析、Vue DevTools
- 路由约定：`src/**/index.vue` 自动注册
- 新增演示页的方式

### 步骤 10：自检

- 检查根 AGENTS.md 是否只包含全局概览，不含子包细节
- 检查每个子包 AGENTS.md 是否自包含、不重复根文件内容
- 检查渐进式披露：根→子包的引用链完整
- 检查 `packages/mobile/` 不生成 AGENTS.md（空包占位）

## 影响范围

- `AGENTS.md` — 重写（全局概览，渐进式披露）
- `packages/utils/AGENTS.md` — 新建（工具函数、样式系统、主题 API）
- `packages/compositions/AGENTS.md` — 新建（组合式函数列表与模式）
- `packages/directives/AGENTS.md` — 新建（指令列表与约定）
- `packages/desktop/AGENTS.md` — 新建（组件编写模式、类型约定、表单模式、DI）
- `packages/icons/AGENTS.md` — 新建（生成工作流、导出路径）
- `tools/build/AGENTS.md` — 新建（构建流程、路径常量、产物结构）
- `tools/cli/AGENTS.md` — 新建（CLI 工具列表、gen-component 流程）
- `playgrounds/desktop/AGENTS.md` — 新建（路由约定、Vite 配置、新增演示页方式）

## 历史补丁
