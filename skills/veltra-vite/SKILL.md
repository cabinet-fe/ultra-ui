---
name: veltra-vite
description: 面向 @veltra/vite 的 Vite 集成文档技能。用于在任意 Vite 项目中接入 VeltraDesktopUIResolver 与 unplugin-vue-components，排查 @veltra/desktop 组件自动导入、样式 sideEffects、development 和 import 条件导出差异，或确认消费项目里 @veltra/vite 安装产物与源码位置时使用。
---

# Veltra Vite

## 先判断你在做什么

- 需要先在当前项目里定位 `@veltra/vite`、`@veltra/desktop`、安装产物或 workspace 源码时，读取 [references/source-discovery.md](references/source-discovery.md)
- 需要新增或修正 `vite.config.ts` 里的 resolver 配置、确认依赖与最小接入方式时，读取 [references/integration.md](references/integration.md)
- 需要排查组件没有自动导入、样式没进来、dev/build 行为不一致、子组件样式映射异常时，读取 [references/troubleshooting.md](references/troubleshooting.md)
- 需要确认 resolver 的精确契约、`importStyle` 选项和共目录样式映射表时，读取 [references/resolver-contract.md](references/resolver-contract.md)

## 执行时保持这些约束

- 把 `@veltra/vite` 当作消费侧集成包，不要假设当前环境一定存在本仓库的 `packages/vite`
- `VeltraDesktopUIResolver()` 只负责 `@veltra/desktop` 组件自动导入，不负责安装依赖、不负责处理非 `U` 前缀组件
- 样式副作用默认开启；只有显式传入 `importStyle: false` 时才关闭
- 样式副作用路径固定指向 `@veltra/desktop/components/<dir>/style`，不要在消费项目里手写 `src` 或 `dist` 路径
- dev 与 build 的样式解析依赖 `@veltra/desktop` 的条件导出；排错时优先检查被消费包的 `exports`，不要先怀疑 resolver 本身

## 处理跨包问题时顺带查这些 skill

- 组件实现、`style.ts` 入口与组件目录约定：`veltra-desktop`
- Sass 基础设施、`pkg:@veltra/styles/...` 与主题运行时：`veltra-styles`

## 快速源码锚点

- `node_modules/@veltra/vite/package.json`
- `node_modules/@veltra/vite/src/resolver.ts`
- `node_modules/@veltra/vite/dist/index.mjs`
- `node_modules/@veltra/vite/dist/index.d.mts`
- `node_modules/@veltra/desktop/package.json`
