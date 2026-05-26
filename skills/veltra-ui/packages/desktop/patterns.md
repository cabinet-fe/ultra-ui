# Desktop — 通用 Props/Emits/Slots/Exposed

所有 Veltra 组件遵循的统一约定。具体组件文档只列与本文不同的项。

## 公共 Props 接口

```ts
interface ComponentProps {
  size?: 'small' | 'default' | 'large'
}

interface FormComponentProps extends ComponentProps {
  label?: string
  field?: string
  tips?: string
  disabled?: boolean
  readonly?: boolean
  span?:
    | number
    | 'full'
    | ({ [k in BreakpointName]?: number | 'full' } & { default: number | 'full' })
}
```

回退链：`组件 props → Form 上下文（仅 FormComponentProps）→ useConfig 全局 → 默认值`。

## 颜色类型

```ts
type ColorType = 'primary' | 'info' | 'success' | 'warning' | 'danger'
```

## 双向绑定

| 写法                            | 含义                                     |
| ------------------------------- | ---------------------------------------- |
| `v-model="x"`                   | `modelValue` / `update:modelValue`       |
| `v-model:visible="x"`           | 命名 v-model（Dialog / Drawer 等浮层）   |
| `v-model:checked="x"`           | 表格多选                                 |
| `v-model:selected="x"`          | 表格单选                                 |
| `v-model:current="x"`           | 表格当前行                               |

注意：`UDialog` 使用 `v-model`（非 `v-model:visible`），见 `gotchas.md`。

## Emits 命名

| 事件                       | 场景                              |
| -------------------------- | --------------------------------- |
| `click(e: MouseEvent)`     | 按钮、可点击元素                  |
| `change(value)`            | 失焦/回车/选中变更                |
| `update:modelValue(value)` | v-model 实时更新                  |
| `update:{name}(value)`     | 命名 v-model                      |
| `close` / `closed`         | 关闭触发 / 关闭动画结束           |
| `focus` / `blur`           | 表单组件焦点                      |
| `prefix:click` / `suffix:click` | 输入框前/后缀点击           |

## Slots 命名

| slot      | 出现组件                  | 说明                                           |
| --------- | ------------------------- | ---------------------------------------------- |
| `default` | 所有                      | 主要内容                                       |
| `prefix`  | Input / Select / 输入类   | 前缀（与 prop 同时渲染）                       |
| `suffix`  | Input / Select / 输入类   | 后缀（与 prop 同时渲染）                       |
| `icon`    | Button / Action 等        | 前置图标                                       |
| `header`  | Card / Dialog             | 头部                                           |
| `footer`  | Dialog / Drawer / Card    | 底部，常带作用域 `{ close }`                   |
| `empty`   | Table / List / Tree       | 空状态                                         |
| `trigger` | Dialog / Dropdown / Tip   | 替代 v-model 的触发节点                        |

## Exposed 类型约定

组件通过 `defineExpose` 暴露根元素与命令式方法。导出类型解构 ref：

```ts
import type { ButtonExposed } from '@veltra/desktop'
import { useTemplateRef } from 'vue'

const btnRef = useTemplateRef<ButtonExposed>('btn')
btnRef.value?.el?.focus()  // 大部分组件暴露 el
```

常见 Exposed.el 类型：

| 组件   | el 类型             |
| ------ | ------------------- |
| Button | `HTMLButtonElement` |
| Input  | `HTMLInputElement`  |
| Form   | `HTMLFormElement`   |
| 其他   | `HTMLElement`       |

Dialog / Drawer 额外暴露 `close()`，Table 额外暴露 `clearChecked()` / `clearSelected()` / `getRowByData()` / `getSummaryRow()`。

## 表单上下文自动继承

```
UForm（provide formProps）
  └── UInput / USelect / UDatePicker ...
       inject formProps → 自动继承 size / disabled / readonly
```

子组件**只要嵌套在 UForm 内**就自动继承，无需手动传 props。详见 `components/form.md`。

## 命名约定

| 约定           | 示例                                       |
| -------------- | ------------------------------------------ |
| 组件名         | `U` + PascalCase（`UButton`）              |
| 类型导出       | `<Name>Props` / `<Name>Emits` / `<Name>Exposed` |
| 内部 Exposed   | `_<Name>Exposed`（带 ShallowRef）          |
| CSS 类         | `u-` + BEM（`u-button__icon--left`）       |
