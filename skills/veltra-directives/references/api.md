# API

## `vFocus`

源码：`packages/directives/src/focus/index.ts`

行为：

- `mounted` 时执行
- 若宿主本身是 `INPUT`，直接 `focus()`
- 否则在宿主内 `querySelector('input')`
- 找不到 input 时输出 warning

适合：

- 下拉过滤器输入框
- 简单表单控件自动聚焦

## `vClickOutside`

源码：`packages/directives/src/click-outside/index.ts`

行为：

- 通过 `createIncrease(1000)` 生成元素 id
- 用 `targets: Map<string, { handler, el }>` 维护所有活跃实例
- document 级同时监听 `mousedown` 与 `click`
- 只有按下和点击目标一致时才继续触发 outside 判定
- `binding.value` 为空时会注销目标

适合：

- dropdown、menu、context-menu 关闭行为

注意：

- 该实现依赖浏览器 document
- 更新 binding 时要允许 handler 热更新

## `vRipple`

源码：

- `packages/directives/src/ripple/index.ts`
- `packages/directives/src/ripple/ripple.ts`

行为：

- 仅响应左键 `mousedown`
- `binding.value === false` 时禁用
- `binding.value` 可作为自定义 ripple class
- `binding.arg` 作为 duration
- 每个容器通过 `WeakMap<HTMLElement, Ripple>` 复用 `Ripple` 实例
- `mouseleave` / `mouseup` 负责移除

注意：

- 纯指令本身不会自动引入样式，消费方需要引入 `@veltra/directives/ripple/style`
- `Ripple` 会临时修改容器 `position` 与 `overflow`，最后尽量恢复
