# Integration

## 最小依赖

消费项目至少需要：

- `@veltra/desktop`
- `@veltra/vite`
- `unplugin-vue-components`

如果项目直接消费 `@veltra/styles` 的 Sass `pkg:` 路径，还需要按 `veltra-styles` skill 配置 Sass `NodePackageImporter`。这不是 `@veltra/vite` 自己的前置要求，但经常和样式排错混在一起。

## 最小接入示例

```ts
import { VeltraDesktopUIResolver } from '@veltra/vite'
import Components from 'unplugin-vue-components/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    vue(),
    Components({
      resolvers: [VeltraDesktopUIResolver()]
    })
  ]
})
```

## 可选项

关闭自动样式副作用：

```ts
Components({
  resolvers: [VeltraDesktopUIResolver({ importStyle: false })]
})
```

这样只保留组件自动导入，不再自动附带 `style` 入口。

## 集成时优先检查的事实

- resolver 返回的组件来源固定是 `@veltra/desktop`
- 样式副作用路径固定是 `@veltra/desktop/components/<dir>/style`
- 这个路径不带扩展名，最终由 `@veltra/desktop` 的条件导出决定落到源码入口还是构建产物
- 如果消费项目已经手动 import 了同组件样式，先确认是否与 resolver 的 sideEffects 重复

## dev / build 边界

Resolver 本身不区分 `vite dev` 与 `vite build`。真正决定解析结果的是 `@veltra/desktop` 的 `exports`：

- `development` 条件通常指向 `src`
- `import` 条件通常指向 `dist`

因此：

- dev 样式异常时，先看当前安装的 `@veltra/desktop` 是否真的暴露了 `development`
- build 样式异常时，先看 `dist/**/style.js` 和对应 CSS 是否已被发布
