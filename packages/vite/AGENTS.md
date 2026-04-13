# AGENTS.md — @veltra/vite

面向宿主 Vite 的辅助能力（如 `unplugin-vue-components` 的 `VeltraDesktopUIResolver`）。

## 目录结构

```
src/
├── index.ts       # 入口，re-export resolver
└── resolver.ts    # VeltraDesktopUIResolver 实现
```

## 导出

| 导出                             | 类型     | 说明                                    |
| -------------------------------- | -------- | --------------------------------------- |
| `VeltraDesktopUIResolver`        | function | `unplugin-vue-components` 组件 resolver |
| `VeltraDesktopUIResolverOptions` | type     | resolver 选项                           |

## 用法

```ts
// vite.config.ts
import { VeltraDesktopUIResolver } from '@veltra/vite'
import Components from 'unplugin-vue-components/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    Components({
      resolvers: [VeltraDesktopUIResolver()],
    }),
  ],
})
```

## 开发 / 生产环境差异

Resolver 返回的样式副作用路径 `@veltra/desktop/components/<dir>/style`（无扩展名），依赖 `@veltra/desktop` 的 package exports conditions 自动路由：

| 环境                        | condition       | 解析目标                                | 说明                     |
| --------------------------- | --------------- | --------------------------------------- | ------------------------ |
| `vite dev`（开发）          | `development`   | `src/components/<dir>/style.ts`         | 源码 SCSS 管线，支持 HMR |
| `vite build`（生产）        | `import`        | `dist/components/<dir>/style.js`        | 预编译，CSS 已 inject    |

## 共目录组件映射

部分子组件与父组件共享同一目录和 `style.ts`，resolver 内部维护 `SHARED_STYLE_DIR` 映射表：

| 子组件 kebab 名     | 样式目录   |
| -------------------- | ---------- |
| `button-group`       | `button`   |
| `action-group`       | `action`   |
| `card-header/cover/content/action` | `card` |
| `checkbox-button`    | `checkbox` |
| `grid-item`          | `grid`     |
| `list-item`          | `list`     |
| `menu-sub/item`      | `menu`     |

## 依赖

- **peer**：`@veltra/desktop`、`unplugin-vue-components`
