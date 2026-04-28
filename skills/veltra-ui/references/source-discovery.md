# 源码定位指南

本技能面向使用 `@veltra/*` npm 包的消费侧项目。当文档不足以解答问题时，可在安装产物中查找精确的类型定义和 API。

## 安装产物定位

```bash
# 查看已安装的版本和入口
ls node_modules/@veltra/desktop/dist/
ls node_modules/@veltra/compositions/dist/
ls node_modules/@veltra/utils/dist/
ls node_modules/@veltra/styles/dist/
ls node_modules/@veltra/directives/dist/
ls node_modules/@veltra/icons/dist/
ls node_modules/@veltra/vite/dist/
```

## 各包产物结构

| 包 | 产物入口 | 类型声明入口 |
|---|---|---|
| `@veltra/desktop` | `dist/index.mjs` | `dist/index.d.mts` |
| `@veltra/compositions` | `dist/index.mjs` | `dist/index.d.mts` |
| `@veltra/utils` | `dist/index.mjs` | `dist/index.d.mts` |
| `@veltra/styles` | `dist/index.mjs`（副作用入口） | `dist/index.d.mts` |
| `@veltra/directives` | `dist/index.mjs` | `dist/index.d.mts` |
| `@veltra/icons` | `dist/index.mjs` | `dist/index.d.mts` |
| `@veltra/vite` | `dist/index.mjs` | `dist/index.d.mts` |

## 子路径导出

各包均支持子路径导出，可按需引入：

```ts
// 按需引入组件
import { UButton } from '@veltra/desktop'
import { UInput } from '@veltra/desktop'

// 按需引入指令
import { vRipple } from '@veltra/directives'

// 按需引入图标
import { Search } from '@veltra/icons/normal'

// SCSS 子路径
// pkg:@veltra/styles/mixins
// pkg:@veltra/styles/functions
// pkg:@veltra/styles/vars

// 主题运行时
import { loadTheme, setTheme } from '@veltra/styles/theme'
```

查看完整子路径：

```bash
jq '.exports' node_modules/@veltra/desktop/package.json
jq '.exports' node_modules/@veltra/compositions/package.json
```

## 类型定义

各组件的 Props/Emits/Exposed 类型均在对应包的声明文件中：

```bash
# 查看所有可用类型
cat node_modules/@veltra/desktop"export.*Props"
cat node_modules/@veltra/desktop"export.*Emits"
```

```ts
// 在代码中导入类型
import type { ButtonProps, InputProps, DialogProps } from '@veltra/desktop'
import type { ComponentSize, ColorType } from '@veltra/utils'
```

## SCSS 配置

如果项目需要自定义组件样式或引入 SCSS mixins：

```ts
// vite.config.ts — 需要 NodePackageImporter 支持 pkg: 协议
import { NodePackageImporter } from 'sass-embedded'

export default {
  css: {
    preprocessorOptions: {
      scss: {
        importers: [new NodePackageImporter()]
      }
    }
  }
}
```

