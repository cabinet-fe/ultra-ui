# AGENTS.md — playgrounds/desktop

组件开发预览应用，用于调试和演示 Ultra UI 组件。

## 启动

```bash
cd playgrounds/desktop
bun dev    # Vite 开发服务器，端口 7788
```

## 路由约定

`src/<component-name>/index.vue` 自动注册为路由：

```
src/button/index.vue  → /button/index
src/table/index.vue   → /table/index
```

基于 `import.meta.glob('./src/**/index.vue')` 动态生成，无需手动维护路由表。

## 新增演示页

在 `src/` 下创建 `<component-name>/index.vue` 即可，自动被路由发现。

## Vite 配置要点

- **SCSS**：`sass-embedded` 现代 API + `NodePackageImporter`（入口目录为仓库根），解析 `pkg:@veltra/styles/...`
- **unplugin-components**：`U` 前缀组件自动从 `@veltra/desktop` 解析，同时自动引入对应 `style.ts`
- **端口**：7788，`host: true`

## 项目结构

```
├── App.vue               # 应用根组件
├── main.ts               # 入口（引入 normalize 样式，挂载 router）
├── router.ts             # 自动路由生成
├── vite.config.ts        # Vite 配置
├── index.html
└── src/                  # 演示页（~61 个组件演示）
    ├── button/index.vue
    ├── table/index.vue
    ├── form/index.vue
    └── ...
```

## 依赖

- `@veltra/compositions`、`@veltra/desktop`、`@veltra/directives`、`@veltra/icons`、`@veltra/styles`、`@veltra/utils`
- `vue`、`vue-router`
- `sass-embedded`、`unocss`、`vite-plugin-vue-devtools`
