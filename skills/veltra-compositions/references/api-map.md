# API Map

## 模块总览

当前 `@veltra/compositions` 聚合导出这些模块：

- `use-component-props`
- `use-config`
- `use-drag`
- `use-fallback-props`
- `use-focus`
- `use-form-component`
- `use-lock`
- `use-model`
- `use-pop`
- `use-reactive-size`
- `use-resize-observer`
- `use-transition`
- `use-virtual`

## 高频模块摘要

### `useConfig`

源码：`packages/compositions/src/use-config/index.ts`

能力：

- 持有全局 `animation`、`size`、`form.labelWidth`、`paginator.pageSize`
- `setConfig()` 深合并配置
- 自动把 `config.size` 同步为 `document.documentElement` class

### `useModel`

源码：`packages/compositions/src/use-model/index.ts`

能力：

- 支持 `local` 模式
  内部持有可写副本，同时 emit `update:*`
- 支持 `proxy` 模式
  完全受控，不保留本地状态
- 可选 `shallow` 与 `defaultValue`

### `useFormComponent`

源码：`packages/compositions/src/use-form-component/index.ts`

能力：

- 在表单容器中 `provide(formProps)`
- 在子组件中 `inject` 出 `formProps` 与 `inForm`

### `useFormFallbackProps`

源码：`packages/compositions/src/use-fallback-props/index.ts`

能力：

- 从右到左按优先级回退 props
- 缺省顺序：组件 props -> 表单 props -> 全局 config -> 默认值
- 内建表单字段：`size`、`disabled`、`readonly`

### `usePop`

源码：`packages/compositions/src/use-pop/index.ts`

能力：

- 基于 `@floating-ui/dom` 计算浮层位置
- 支持方向、对齐、箭头、滚动父级监听、resize 监听
- 自动维护 `#pop-container`

### `useVirtual`

源码：`packages/compositions/src/use-virtual/index.ts`

能力：

- 基于 `@tanstack/vue-virtual`
- 返回 `virtualList`、`totalHeight`、`measureElement()`、`scrollTo()`
- 由 `virtualThreshold` 控制启用条件

### `useTransition`

源码：`packages/compositions/src/use-transition/index.ts`

能力：

- `'css'` 模式走类名过渡
- `'style'` 模式走内联 style 过渡

## 主要消费者

`@veltra/desktop` 的表单控件、dropdown/select、table/tree、popup、virtual list 等组件广泛依赖这里。
