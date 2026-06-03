# UForm — 表单容器

> `import type { FormProps, FormExposed, FormModelItem, ModelData, ModelRules, IFormModel, DataSettingConfig } from '@veltra/desktop'`

> 类型：`../../../generated/types/form.ts`

配合 `FormModel` / `DynamicFormModel` 实现表单数据绑定、校验、`size`/`disabled`/`readonly` 上下文继承。

**核心机制**：UForm 自动检测 slot 子组件 — 凡设置了 `field` 属性且不是 `UFormItem` 的，会被自动用 `<u-form-item>` 包裹，`model.data[field]` 自动作为 `model-value` 双向绑定。**不要手写 `<u-form-item>`，不要写 `v-model`**。

```vue
<!-- ✅ 推荐：field 自动绑定 -->
<u-form :model="model">
  <u-input label="用户名" field="username" />
  <u-select label="角色" field="role" :options="roles" />
</u-form>

<!-- ⚠️ 独立使用（不在 Form 内）才写 v-model -->
<u-input v-model="keyword" placeholder="搜索" />
```

`field` 支持 lodash 风格嵌套路径（`profile.name`），但在 `FormModel` 中定义嵌套结构时，必须使用 `nestField` 包裹子字段，以便进行正确的类型推导和值映射。

只有「一个表单项内有多个组件」才需要手写 `<u-form-item>`：

```vue
<u-form :model="model" #default="{ data }">
    <u-form-item label="价格区间">
        <u-number-input v-model="data.minPrice" placeholder="最低" />
        <span> — </span>
        <u-number-input v-model="data.maxPrice" placeholder="最高" />
    </u-form-item>
</u-form>

```

## Import

```ts
// UForm、UFormItem 由 Vite 自动导入，无需手动 import
import { FormModel, DynamicFormModel, formField, nestField } from '@veltra/desktop'
```

## 关联类型

### `FormModel<Fields>` vs `DynamicFormModel`

| 特性               | `FormModel`                           | `DynamicFormModel`                                |
| ------------------ | ------------------------------------- | ------------------------------------------------- |
| 字段定义时机       | 构造时静态，不可增删                  | 运行时 `add()` / `delete()` 增删                  |
| 类型安全           | 泛型推导，`model.data.xxx` 有类型提示 | `Record<string, any>`，无字段级类型               |
| `data` 数据源      | 内部 reactive，不可替换               | 可 `model.data = externalReactive` 替换为外部对象 |
| `validate()` 失败  | `Promise.reject(false)`               | `Promise.resolve(false)`                          |
| `setData()`        | 返回 `this`（链式）                   | 返回 `void`                                       |
| `setInitialData()` | ✅ 提供                               | ❌ 直接操作 `model.initialData`                   |

选择：字段编码时已知 → `FormModel`；字段需运行时增删 → `DynamicFormModel`。

### 共同 API

```ts
class FormModel<Fields extends Record<string, FormModelItem>> {
  readonly data: ModelData<Fields>
  readonly fields: Fields
  readonly errors: Map<keyof Fields, string[] | undefined>
  initialData: ModelData<Fields>
  readonly allKeys: (keyof Fields)[]

  validate(fields?: (keyof Fields)[]): Promise<boolean>
  resetData(fields?: (keyof Fields)[]): void
  setData(data: Partial<ModelData<Fields>>, config?: { validate?: boolean }): this
  setInitialData(data: ModelData<Fields>): this
  clearValidate(): void
  onChange(cb: (field, value) => void): void
  offChange(cb): void
}

class DynamicFormModel {
  data: Record<string, any> // 支持 setter，可替换
  readonly fields: Record<string, FormModelItem>
  get allKeys(): string[]
  // 同上的 errors / initialData / clearValidate / onChange / offChange / resetData / setData

  add(field: string, item: FormModelItem): void
  delete(field: string): void
  append(fields: Record<string, FormModelItem>): void
  validate(fields?: string[]): Promise<boolean> // 失败 resolve(false)，不 reject
}
```

### `formField<Val>(item?: FormModelItem<Val>)`

类型辅助函数，定义字段值与校验规则。

> [!NOTE]
> 在大部分情况下，如果字段定义中包含了 `value` 初始值，TypeScript 可以通过泛型自动推导出 `model.data` 的字段类型，**不需要**使用 `formField` 包裹，直接使用字面量对象即可。只有在**没有指定 `value` 初始值**，或者需要显式通过泛型指定类型时，才必须使用 `formField<Type>` 包裹。

`FormModelItem` 继承 `ValidateRule`：

| 属性        | 类型                                               | 说明                                                 |
| ----------- | -------------------------------------------------- | ---------------------------------------------------- |
| `value`     | `any`                                              | 初始值                                               |
| `required`  | `boolean \| string`                                | 必填（string 为自定义错误提示）                      |
| `min`       | `number \| [number, string]`                       | 最小值                                               |
| `max`       | `number \| [number, string]`                       | 最大值                                               |
| `minLen`    | `number \| [number, string]`                       | 最小长度                                             |
| `maxLen`    | `number \| [number, string]`                       | 最大长度                                             |
| `length`    | `number \| [number, string]`                       | 精确长度                                             |
| `match`     | `RegExp \| [RegExp, string] \| string`             | 正则匹配                                             |
| `preset`    | `'email' \| 'phone' \| 'num' \| 'url' \| 'idCard'` | 预设规则                                             |
| `validator` | `(value, data) => Promise<string> \| string`       | 自定义校验，返回非空字符串=错误，空/`undefined`=通过 |

元组形式 `[规则值, 错误提示]` 用于自定义错误信息。

### `nestField<T>(fields: T)`

类型辅助函数，定义嵌套对象的表单字段。

当表单数据包含深层嵌套结构（如 `model.data.profile.name`）时，**必须**使用 `nestField` 来包裹嵌套的子字段。

> [!NOTE]
> 在嵌套的子字段内部，同样遵循类型推导规则：如果指定了 `value`，则**不需要**使用 `formField` 包裹，直接使用字面量对象定义子字段即可。

```ts
const model = new FormModel({
  name: { value: 'Alice' },
  contact: nestField({
    email: { value: 'alice@example.com' }, // 自动推导为 string
    phone: { value: '12345678901' }        // 自动推导为 string
  })
})
```

> 示例见 [examples.md](./examples.md)
