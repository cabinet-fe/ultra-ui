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

## 覆盖范围

一个 resolver 同时覆盖三个包，按组件名自动选择来源：

| 包                | 组件                   |
| ----------------- | ---------------------- |
| `@veltra/desktop` | `UButton` 等 90 个组件 |
| `@veltra/ai`      | `UAiChat`、`UAiOrb`    |
| `@veltra/sheet`   | `USheet`               |

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
