# AGENTS.md — @veltra/vite

宿主 Vite 辅助：`unplugin-vue-components` 的 `VeltraUIResolver`，覆盖 `@veltra/desktop`、`@veltra/ai`、`@veltra/sheet` 三个包的组件。

## 导出

| 导出                      | 说明                                           |
| ------------------------- | ---------------------------------------------- |
| `VeltraUIResolver`        | 组件 + 样式副作用 resolver                     |
| `VeltraUIResolverOptions` | resolver 选项（仅 `importStyle`，默认 `true`） |

## 用法

```ts
import { VeltraUIResolver } from '@veltra/vite'
import Components from 'unplugin-vue-components/vite'

export default defineConfig({ plugins: [Components({ resolvers: [VeltraUIResolver()] })] })
```

## 组件表由脚本生成

`src/components.gen.ts` 是**生成产物，禁止手改**。desktop / ai / sheet 增删组件后在仓库根运行：

```bash
bun run resolver:gen            # 重新生成组件表
bun run resolver:gen -- --check # 校验是否为最新，过期则报错退出（已接入 ci:verify，校验结束后还原文件）
```

生成器 `scripts/gen-vite-resolver.ts` 的判定规则：扫描下表「扫描根」的**直接子目录**，取同时含
`index.ts` 与 `style.ts` 者，把其 `index.ts` 导出的 `U*` 值登记为组件，样式副作用指向同目录 `style.ts`。
因此**只有真正从包主入口导出的组件才会进表**——组件内部私有子组件（如 `group-nav-item.vue`）不会被误登记。

| 包                | 扫描根           | 样式子路径示例                    |
| ----------------- | ---------------- | --------------------------------- |
| `@veltra/desktop` | `src/components` | `components/button/style`         |
| `@veltra/ai`      | `src/components` | `components/ai-chat/style`        |
| `@veltra/sheet`   | `src/components` | `components/sheet/style`         |

同目录多组件（`UButton` / `UButtonGroup`）自动共用父目录样式，无需再维护映射表。
跨包重名会让生成器直接报错。

## 样式路径与 condition

Resolver 返回 `<包名>/<样式子路径>`（无扩展名）：

| 环境  | condition    | 解析目标              |
| ----- | ------------ | --------------------- |
| dev   | `veltra-dev` | `src/<dir>/style.ts`  |
| build | `import`     | `dist/<dir>/style.js` |

## 依赖

- **devDependencies**：`@veltra/desktop`（本地开发）
- **peer**：`@veltra/desktop`、`unplugin-vue-components`；`@veltra/ai`、`@veltra/sheet` 为**可选 peer**（宿主未装则模板中不会用到对应组件）

宿主项目将 `@veltra/vite` 放在 **devDependencies**。

## 验证

```bash
bun run resolver:gen -- --check
bun run lint
vp pack -F @veltra/vite
cd playground && vp build
```
