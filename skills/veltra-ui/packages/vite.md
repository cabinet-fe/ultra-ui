# @veltra/vite

Vite 辅助插件 — `unplugin-vue-components` 的解析器，自动从模板中的 `<UButton>` 等组件名注入 `import` 与样式副作用。

## 安装

```bash
bun add @veltra/vite unplugin-vue-components -D
```

## 用法

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import Components from 'unplugin-vue-components/vite'
import { VeltraUIResolver } from '@veltra/vite'

export default defineConfig({
  // ...其它配置
  plugins: [Components({ resolvers: [VeltraUIResolver()] })]
})
```

模板中 `<UButton>` 或 `<u-button>` 均会被解析。指令、图标不在解析范围内，需手动 import。

解析只发生在 SFC 编译产物的 `_resolveComponent("<组件名>")` 上：模板标签在 `<script setup>` 中没有同名 import 时才会生成该调用。

## 覆盖范围

一个 resolver 同时覆盖三个包，按组件名自动选择来源：

| 包                | 组件                    |
| ----------------- | ----------------------- |
| `@veltra/desktop` | `UButton` 等 92 个组件  |
| `@veltra/ai`      | `UAiChat`、`UAiOrb`     |
| `@veltra/sheet`   | `USheet`                |

`@veltra/ai`、`@veltra/sheet` 是可选 peer：未安装时模板里本就不会出现对应标签，无需额外配置。

## 配置项

```ts
import type { VeltraUIResolverOptions } from '@veltra/vite'

interface VeltraUIResolverOptions {
  importStyle?: boolean // 默认 true，自动加载样式副作用
}
```

```ts
// 关闭样式自动加载（应用入口手动 import '@veltra/desktop/style'）
VeltraUIResolver({ importStyle: false })
```

## 注意事项

- 仅解析各包真实导出的 `U*` 组件；`UAvatar` 等不存在的名字不会处理
- `defineAsyncComponent` 包装的异步组件需手动 import
- 指令（`v-ripple` 等）需手动引入使用
- **模板组件禁止在 `<script setup>` 里再 import 同名组件**：显式 import 后模板改用该绑定、不再产生 `_resolveComponent` 调用，resolver 不注入组件 import，也不注入样式副作用（症状：结构正确但没有样式）。凡显式 import 的组件必须自己补 `import '@veltra/desktop/components/<目录>/style'`
- `h()` / `render` 函数 / JSX 里的组件不会被解析：必须显式 import 并补样式，漏写报 `ReferenceError: UTag is not defined`
- 函数式 API `message` / `messageConfirm` / `notification` 的样式不随函数 import 注入，需 `import '@veltra/desktop/components/message/style'` 等
- 写 `<script lang="tsx">` / `.tsx` 必须注册 `@vitejs/plugin-vue-jsx`，缺它时报 `Failed to resolve import "react/jsx-dev-runtime"`（build 为 `react/jsx-runtime`）
