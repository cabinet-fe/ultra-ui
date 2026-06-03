# UForm - 表单容器

## 类型文件

见 `./types.d.ts`

## 示例

见 `./examples.md`

## 辅助工具

本组件通常配合以下工具来使用。

### FormModel

静态字段表单：构造时定义全部字段；`model.data` 与带 `field` 的子组件自动双向绑定（勿手写 v-model / u-form-item）。

使用示例:

```ts
import { FormModel, formField, nestField } from '@veltra/desktop'
```

### DynamicFormModel

运行时 `add` / `delete` 增删字段；`data` 可替换为外部 reactive 对象。

使用示例:

```ts
import { DynamicFormModel } from '@veltra/desktop'
```

### formField

字段无 `value` 初始值或需显式泛型时包装表单项定义。

使用示例:

```ts
import { formField } from '@veltra/desktop'
```

### nestField

嵌套对象字段（如 `profile.name`）必须用其包裹子字段。

使用示例:

```ts
import { nestField } from '@veltra/desktop'
```
