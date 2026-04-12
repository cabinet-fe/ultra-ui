# Integration

## Sass 编译配置

`@veltra/styles` 的 `pkg:` 引用依赖 `NodePackageImporter`。项目内现有配置可直接参考：

- `packages/styles/tsdown.config.ts`
- `packages/directives/tsdown.config.ts`
- `packages/desktop/tsdown.config.ts`
- `playgrounds/desktop/vite.config.ts`

示例：

```ts
import { NodePackageImporter } from 'sass-embedded'

scss: {
  api: 'modern-compiler',
  importers: [new NodePackageImporter(repoRoot)]
}
```

## TypeScript 侧 import 规则

这些是合法的：

```ts
import '@veltra/styles'
import '@veltra/styles/normalize'
import '@veltra/styles/anime/fade.scss'
import { UITheme, loadTheme } from '@veltra/styles/theme'
```

这些不是合法替代：

- 不能在 TS 里写 `pkg:@veltra/styles/...`
- 不能把 Sass partial 当作运行时模块处理

## sideEffects 与入口

`package.json` 当前把这些视为副作用入口：

- `*.scss`
- `src/index.ts`
- `src/load-theme.ts`
- `src/theme/index.ts`

这意味着：

- 全量样式入口 `@veltra/styles` 适合应用级一次性引入
- 组件内按需样式仍应走各组件自己的 `style.ts`

## 循环依赖边界

当前事实：

- `@veltra/styles/theme` 依赖 `@veltra/compositions/useConfig`
- `@veltra/compositions` 不得再导出 theme

改动 theme runtime 时先检查是否引入了反向包依赖。
