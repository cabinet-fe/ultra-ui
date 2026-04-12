# Patterns

## 表单组件模式

这是桌面端表单控件最稳定的组合方式：

```ts
const { formProps } = useFormComponent()
const { size, disabled, readonly } = useFormFallbackProps([formProps ?? {}, props])
```

含义：

- 外层 `UForm` 用 `useFormComponent(props)` 提供上下文
- 内层控件自动继承 form 与全局 config
- 组件自身显式传入的 props 优先级最高

## `useModel` 的选择规则

选择 `local: true`：

- 组件希望在用户输入后立即更新视图
- 外部是半受控或异步回写

选择 `local: false`：

- 组件希望完全受控
- 数据源必须始终来自 props

## 浮层组件模式

对 dropdown、tip、select、context-menu 之类组件：

1. 提供 `triggerRef` 与 `contentRef`
2. 可选 `arrowRef`
3. 在 visible 变化后调用 `update()`
4. 需要跟随滚动和 resize 时使用 `onTriggerPositionChange`

## 虚拟列表模式

对 select、table 之类组件：

1. 让 `count` 和 `scrollEl` 保持响应式
2. 给出稳定的 `estimateSize`
3. 在渲染项上绑定 `measureElement`
4. 同时保留非 virtual 分支，避免小数据集过度复杂化

## 新增 composition 时的约束

- 优先做无样式、可复用、无组件名绑定的逻辑
- 让输入输出保持 typed，避免返回匿名大对象且缺类型
- 如需触发浏览器副作用，明确清理时机
- 如已存在上层业务 helper，不要轻易下沉，除非已经出现稳定复用
