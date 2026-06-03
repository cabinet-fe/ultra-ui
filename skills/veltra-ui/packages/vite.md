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
import { VeltraDesktopUIResolver } from '@veltra/vite'

export default defineConfig({
  // ...其它配置
  plugins: [Components({ resolvers: [VeltraDesktopUIResolver()] })]
})
```

模板中 `<UButton>` 或 `<u-button>` 均会被解析。指令、图标不在解析范围内，需手动 import。

## 配置项

```ts
import type { VeltraDesktopUIResolverOptions } from '@veltra/vite'

interface VeltraDesktopUIResolverOptions {
  exclude?: string[] // 排除组件目录名，如 ['file-viewer', 'gantt-chart']
  include?: string[] // 仅包含组件目录名
  importStyle?: boolean // 默认 true，自动加载样式副作用
}
```

```ts
// 排除大体积组件
VeltraDesktopUIResolver({ exclude: ['file-viewer', 'gantt-chart'] })

// 仅包含部分组件
VeltraDesktopUIResolver({ include: ['button', 'input', 'select', 'dialog', 'form'] })

// 关闭样式自动加载（应用入口手动 import '@veltra/desktop/style'）
VeltraDesktopUIResolver({ importStyle: false })
```

## 注意事项

- 仅解析 `@veltra/desktop` 真实导出的 `U*` 组件；`UAvatar` 等不存在的名字不会处理
- `defineAsyncComponent` 包装的异步组件需手动 import
- 指令（`v-ripple` 等）需手动引入使用
