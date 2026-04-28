# @veltra/vite

Vite 辅助插件 — `unplugin-vue-components` 组件名解析器。

## 安装

```bash
bun add @veltra/vite unplugin-vue-components -D
```

## 导出

```ts
import { VeltraDesktopUIResolver } from '@veltra/vite'
import type { VeltraDesktopUIResolverOptions } from '@veltra/vite'
```

## 基本配置

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import { VeltraDesktopUIResolver } from '@veltra/vite'

export default defineConfig({
  plugins: [
    vue(),
    Components({
      resolvers: [
        VeltraDesktopUIResolver()
      ]
    })
  ]
})
```

## 配置项

```ts
interface VeltraDesktopUIResolverOptions {
  /**
   * 排除特定组件样式目录名
   * @example ['button', 'loading']
   */
  exclude?: string[]

  /**
   * 仅包含特定组件样式目录名
   * @example ['button', 'input', 'dialog']
   */
  include?: string[]

  /**
   * 是否自动导入组件样式副作用
   * @default true
   */
  importStyle?: boolean
}
```

### 排除组件示例

```ts
VeltraDesktopUIResolver({
  exclude: ['file-viewer', 'file-picker', 'gantt-chart']
})
```

### 仅引入部分组件

```ts
VeltraDesktopUIResolver({
  include: ['button', 'input', 'select', 'dialog', 'form']
})
```

## 工作原理

1. 模板中出现 `<UButton>` 时，解析器自动生成：
   - `import { UButton } from '@veltra/desktop'`
   - 自动加载对应的 `style.ts` 副作用入口

2. 解析器只处理 `@veltra/desktop` 真实导出的 `U*` 组件；不存在的组件名（如 `UAvatar`）不会被解析。

3. 开发模式 vs 生产模式：
   - **开发模式**：解析源码中的 `style.ts`（包含完整 SCSS）
   - **生产模式**：解析预编译的 `dist/style.js`

4. 共享样式目录映射：
   - 某些组件共享父组件的样式目录（如 `button-group` → 指向 `button` 目录）
   - 解析器内置了 `SHARED_STYLE_DIR` 映射表处理这种情况

## 完整配置示例

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import { VeltraDesktopUIResolver } from '@veltra/vite'

export default defineConfig({
  plugins: [
    vue(),
    Components({
      // 只自动导入 Veltra 组件，排除大文件组件
      resolvers: [
        VeltraDesktopUIResolver({
          exclude: ['file-viewer', 'gantt-chart']
        })
      ],
      // 生成 dts 文件，获得类型提示
      dts: 'src/components.d.ts',
      // 指定组件目录
      dirs: ['src/components']
    })
  ]
})
```

配置完成后，`.d.ts` 文件会自动生成全局组件类型声明，在模板中获得完整的类型提示。

## SCSS 配置

使用 Vite 时，需要在 `vite.config.ts` 中配置 `NodePackageImporter` 以支持 `pkg:` 协议：

```ts
import { NodePackageImporter } from 'sass-embedded'

export default defineConfig({
  css: {
    preprocessorOptions: {
      scss: {
        importers: [new NodePackageImporter()]
      }
    }
  }
})
```

## 注意事项

- 模板中组件名支持 `PascalCase`（`<UButton>`）和 `kebab-case`（`<u-button>`）两种写法
- 异步组件（`defineAsyncComponent`）需要手动导入，不在解析器范围内
- 指令（`v-ripple` 等）需要手动全局注册、按需导入，或通过 `@veltra/desktop/install` 注册

---

## 相关文档

- ../quick-start.md — 完整的项目初始化配置
- icons.md — 图标组件导入
