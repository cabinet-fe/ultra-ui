# 创建 @veltra/vite 包 — VeltraDesktopUIResolver

> 状态: 已执行

## 目标

为 `@veltra/desktop` 提供 `unplugin-vue-components` 的自动导入 resolver，让宿主项目无需手动 import 组件和样式。包名 `@veltra/vite`，目录复用 `packages/vite-plugin/`。

## 内容

### 1. 创建包基础文件

- `packages/vite-plugin/package.json`：包名 `@veltra/vite`，peer 依赖 `@veltra/desktop` + `unplugin-vue-components`
- `packages/vite-plugin/tsconfig.json`：extends `@cat-kit/tsconfig/tsconfig.node.json`
- `packages/vite-plugin/tsdown.config.ts`：单入口 `src/index.ts`，ESM + DTS

### 2. 实现 VeltraDesktopUIResolver

位于 `packages/vite-plugin/src/resolver.ts`，核心逻辑：

1. 匹配 `U[A-Z]` 前缀的组件名
2. PascalCase → kebab-case 得到组件目录名
3. 维护 `SHARED_STYLE_DIR` 映射表处理共目录组件（7 组共 11 个子组件）：
   - `button-group` → `button`
   - `action-group` → `action`
   - `card-header/cover/content/action` → `card`
   - `checkbox-button` → `checkbox`
   - `grid-item` → `grid`
   - `list-item` → `list`
   - `menu-sub/item` → `menu`
4. 返回 `{ name, from: '@veltra/desktop', sideEffects }`
5. sideEffects 使用 **无扩展名** 路径 `@veltra/desktop/components/<dir>/style`，依赖 `@veltra/desktop` 的 package exports conditions 自动处理开发/生产差异：
   - 开发（Vite dev，`development` condition）→ `src/components/<dir>/style.ts`（源码，SCSS 管线处理）
   - 生产（Vite build，`import` condition）→ `dist/components/<dir>/style.js`（预编译，CSS 已 inject）

### 3. 入口与导出

`packages/vite-plugin/src/index.ts` 导出 `VeltraDesktopUIResolver` 函数和 `VeltraDesktopUIResolverOptions` 类型。

### 4. AGENTS.md

编写 `packages/vite-plugin/AGENTS.md` 文档。

### 5. 修复 playground 依赖

`playgrounds/desktop/package.json` 中 `@veltra/vite-plugin` → `@veltra/vite`。

### 6. 验证

- `bun install` 通过
- `bun run check-types` 通过（至少 vite-plugin 包通过）

## 影响范围

- `packages/vite-plugin/package.json` — 新建，包名 `@veltra/vite`
- `packages/vite-plugin/tsconfig.json` — 新建
- `packages/vite-plugin/tsdown.config.ts` — 新建
- `packages/vite-plugin/src/index.ts` — 新建，入口导出
- `packages/vite-plugin/src/resolver.ts` — 新建，VeltraDesktopUIResolver 实现
- `packages/vite-plugin/AGENTS.md` — 新建，包文档
- `playgrounds/desktop/package.json` — 修改，`@veltra/vite-plugin` → `@veltra/vite`
- `package.json` — 根 devDependencies 增加 `@types/node`、`unplugin-vue-components`
- `packages/vite/package.json` — 移除通用 devDependencies，仅保留 `@veltra/desktop`

## 历史补丁

- patch-1: @veltra/vite 通用 devDependencies 上收至仓库根
