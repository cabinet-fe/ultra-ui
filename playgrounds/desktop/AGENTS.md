# AGENTS.md — playgrounds/desktop

组件开发预览，调试与演示 Ultra UI。

## 启动

```bash
cd playgrounds/desktop
vp dev    # 端口 7788，host: true
```

## 路由

`src/<component-name>/index.vue` → `/<component-name>/index`，由 `import.meta.glob('./src/**/index.vue')` 自动生成。

## Vite 要点

- SCSS：`NodePackageImporter`（仓库根）解析 `pkg:@veltra/styles/...`
- `VeltraDesktopUIResolver`（`@veltra/vite`）：`U*` 组件 + 对应 `style.ts`
- `@veltra/vite` 为本 playground 的 devDependency

## 结构

```
App.vue
main.ts           # normalize + router
router.ts
vite.config.ts
src/<name>/index.vue
```

## 浏览器调试

改 UI 后优先用浏览器工具验证；若 dev server 已在跑，先探测 7788 再决定是否启动。

## 依赖

- **dependencies**：`@veltra/*`、`@cat-kit/core`、`@cat-kit/fe`、`@cat-kit/excel`、`vue`、`vue-router`
- **devDependencies**：`@veltra/vite`、`vite-plugin-vue-devtools`

## 验证

```bash
# 仓库根
bun run lint
bun run build

# 本 playground
cd playgrounds/desktop && vp dev      # 交互验证
cd playgrounds/desktop && vp build    # 生产构建
```
