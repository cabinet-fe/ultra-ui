# Playground

这份说明描述的是参考仓库自带的 `playgrounds/desktop`。如果消费项目没有这套 playground，就把它当成“原作者如何组织 demo 与按需引样式”的样本，而不是硬性前提。

## 结构

桌面端 playground 位于 `playgrounds/desktop/`。

关键文件：

- `App.vue`
- `main.ts`
- `router.ts`
- `vite.config.ts`
- `src/<demo>/index.vue`

## 路由生成方式

`router.ts` 使用：

```ts
import.meta.glob('./src/**/index.vue')
```

含义：

- 在 `src/` 下新增 `<name>/index.vue` 就会自动生成路由
- 不需要手写路由表
- 默认根路径会重定向到第一个 demo

## `App.vue` 提供的真实环境

`App.vue` 不是简单壳子，它还提供：

- 左侧 menu 导航
- 全局 `size` 切换
- light / dark / auto 主题切换
- `u-theme` 抽屉

因此如果某个组件依赖全局 config 或 theme，playground 能直接复现实战场景。

## 按需引样式链路

`playgrounds/desktop/vite.config.ts` 用 `unplugin-vue-components` 自动把 `U*` 组件解析到 `@veltra/desktop`，并通过 `resolveStyleSideEffects()` 追溯到对应 `components/<name>/style.ts`。

这意味着：

- demo 中只写 `<u-button />` 也会自动补样式
- 若组件缺 `style.ts`，playground 里的自动按需样式链就会断掉

## Sass 配置

Vite 使用：

- `sass-embedded`
- `NodePackageImporter(repoRoot)`
- `api: 'modern-compiler'`

这与 packages 的构建配置保持一致，是 `pkg:@veltra/styles/...` 能工作的前提。
