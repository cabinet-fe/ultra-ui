---
name: veltra-vite
description: 指导在 Vite 中集成 `@veltra/vite`（`VeltraDesktopUIResolver`）与 `unplugin-vue-components`，理解样式副作用路径、`development`/`import` exports 分流、共目录子组件的样式映射。在用户配置或排查 Vite 自动按需组件与样式、对比 playground 与宿主项目差异时使用。
---

# Veltra Vite（@veltra/vite）

## 权威文档

实现细节、导出表与共目录映射清单以仓库内为准，先读：

- `packages/vite/AGENTS.md`

## 集成要点

- **包名**：`@veltra/vite`；源码在 `packages/vite/src/`（`resolver.ts`、`index.ts`）。
- **peer**：宿主须安装 `@veltra/desktop` 与 `unplugin-vue-components`（版本见包内 `peerDependencies`）。
- **用法**：在 `vite.config.ts` 中 `import Components from 'unplugin-vue-components/vite'`，`resolvers` 传入 `VeltraDesktopUIResolver()`；可选 `VeltraDesktopUIResolver({ importStyle: false })` 关闭样式副作用。
- **样式路径**：resolver 的 `sideEffects` 指向 `@veltra/desktop/components/<dir>/style`（无扩展名），由 `@veltra/desktop` 的 `exports` 条件在 **dev**（`development` → 源码 `style.ts` + SCSS/HMR）与 **build**（`import` → `dist` 预编译样式入口）之间切换。

## 本仓库参考实现

- `playgrounds/desktop/vite.config.ts`：`Components({ resolvers: [VeltraDesktopUIResolver()], dts: true })`，以及 SCSS `NodePackageImporter`（`pkg:@veltra/styles/...` 与 playground 的 `AGENTS.md`）。

## 跨包排查时顺带读

- 组件与 `style.ts` 约定：`veltra-desktop`
- 主题与 SCSS 管线：`veltra-styles`
