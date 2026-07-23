# 组合式函数（@veltra/compositions）

Vue 3 组合式函数。前置依赖 `vue@^3.5`、`@floating-ui/dom`、`@formkit/drag-and-drop`、`@cat-kit/fe`、`@veltra/utils`。

```ts
import {
  useConfig,
  setDocumentSize,
  useFallbackProps,
  useFormFallbackProps,
  useModel,
  usePop,
  useDrag,
  useDnD,
  useFocus,
  useUserAction,
  useTransition,
  useResizeObserver,
  useObserverCallback,
  useReactiveSize,
  useVirtualizer,
  useComponentProps
} from '@veltra/compositions'
```

## 可用组合式函数

- `useConfig / setDocumentSize - 全局配置`。读写库级尺寸、动画、表单与分页默认值；`size` 变化同步 `<html>` 类名。
- `useFallbackProps / useFormFallbackProps - 多级属性回退`。按优先级从多组 props / 全局 config / 默认值解析最终属性。
- `useModel - 双向绑定`。封装 `v-model` 本地副本或纯代理模式。
- `usePop - 浮框定位`。基于 `@floating-ui/dom` 计算触发器相对位置，支持箭头与滚动跟随。
- `useDrag - 元素拖拽`。监听左键拖动，支持范围钳制与偏移更新。
- `useDnD - 列表拖拽排序`。基于 `@formkit/drag-and-drop` 封装；同包重导出其插件与类型。
- `useFocus - 焦点状态`。提供 `focus` 状态与 `@focus` / `@blur` 处理器。
- `useUserAction - 用户动作期阻断回流`。标记用户操作窗口，避免 emit → props 回灌循环。
- `useTransition - 命令式过渡`。支持 CSS 类名或内联 style 两种过渡。
- `useResizeObserver / useObserverCallback - 尺寸观察`。监听元素尺寸变化；后者按元素注册回调。
- `useReactiveSize - 响应式尺寸`。返回 reactive `{ width, height }`，可直接用于模板。
- `useVirtualizer - 虚拟滚动`。`@cat-kit/fe` Virtualizer 的 Vue 适配层。
- `useComponentProps - 通用属性合并`。生成把公共 props 合并到默认插槽子节点的组件。

详细签名与用法见各目录下的 `api.md`、`examples.md`。
