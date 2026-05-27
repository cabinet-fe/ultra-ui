# AGENTS.md — @veltra/vite

宿主 Vite 辅助：`unplugin-vue-components` 的 `VeltraDesktopUIResolver`。

## 导出

| 导出 | 说明 |
| ---- | ---- |
| `VeltraDesktopUIResolver` | 组件 + 样式副作用 resolver |
| `VeltraDesktopUIResolverOptions` | resolver 选项 |

## 用法

```ts
import { VeltraDesktopUIResolver } from '@veltra/vite'
import Components from 'unplugin-vue-components/vite'

export default defineConfig({
  plugins: [Components({ resolvers: [VeltraDesktopUIResolver()] })]
})
```

## 样式路径与 condition

Resolver 返回 `@veltra/desktop/components/<dir>/style`（无扩展名）：

| 环境 | condition | 解析目标 |
| ---- | --------- | -------- |
| dev | `veltra-dev` | `src/components/<dir>/style.ts` |
| build | `import` | `dist/components/<dir>/style.js` |

共目录组件（如 `button-group` → `button`）见 `resolver.ts` 内 `SHARED_STYLE_DIR`。

## 依赖

- **devDependencies**：`@veltra/desktop`（本地开发）
- **peer**：`@veltra/desktop`、`unplugin-vue-components`

宿主项目将 `@veltra/vite` 放在 **devDependencies**。

## 验证

```bash
bun run lint
vp pack -F @veltra/vite
cd playgrounds/desktop && vp build
```
