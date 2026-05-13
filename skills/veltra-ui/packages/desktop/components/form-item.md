# UFormItem — 表单项

> `import type { FormItemProps, FormItemEmits, FormItemExposed } from '@veltra/desktop'`

表单控件容器组件，提供统一的标签、提示信息、字段校验错误展示和响应式栅格布局。

**大多数情况下不需要手动使用。** 当表单输入组件设置了 `field` 属性时，`<u-form>` 会自动包裹 `FormItem`。只在以下场景需要手动使用：
- 一个表单项内包含多个输入组件的组合
- 需要自定义 `label` 插槽内容
- 其他无法通过单个 `field` 属性表达的复杂布局

## Import

```ts
// UFormItem 由 Vite 自动导入，无需手动 import
```

## Props

| prop | type | default | 说明 |
|------|------|---------|------|
| `label` | `string` | — | 标签文字 |
| `field` | `string` | — | 关联的字段名，用于显示校验错误和必填标记 |
| `labelWidth` | `string \| number` | — | 标签宽度，覆盖 Form 的统一设置 |
| `tips` | `string` | — | 标签旁的提示信息（悬浮 tooltip 展示） |
| `span` | `number \| 'full' \| { default: number \| 'full'; xs?: number \| 'full'; sm?: number \| 'full'; md?: number \| 'full'; lg?: number \| 'full'; xl?: number \| 'full' }` | — | 所占栅格列数，支持响应式对象 |
| `size` | `ComponentSize` | — | 组件尺寸（`'small'` \| `'default'` \| `'large'`），继承自 `ComponentProps` |
| `disabled` | `boolean` | — | 是否禁用，继承自 `FormComponentProps` |
| `readonly` | `boolean` | — | 是否只读，继承自 `FormComponentProps` |

> `size`、`disabled`、`readonly` 在 `UForm` 上下文中自动继承，运行时 fallback 分别为 `'default'`、`false`、`false`。`readonly` 为 `true` 时不显示必填标记和校验错误。

## Emits

无事件。

## Slots

| slot | 作用域 | 说明 |
|------|--------|------|
| `default` | — | 表单控件内容 |
| `label` | — | 自定义标签内容，替换 `label` prop 的文本渲染 |

## Exposed

```ts
interface FormItemExposed {}
```

## Examples

### 多组件组合

```vue
<u-form :model="model">
  <u-form-item label="日期范围" field="dateRange">
    <u-date-picker v-model="model.data.startDate" />
    <span> 至 </span>
    <u-date-picker v-model="model.data.endDate" />
  </u-form-item>
</u-form>
```

### 自定义 label

```vue
<u-form :model="model">
  <u-form-item field="agree">
    <template #label>
      <span>我已阅读并同意 <a href="/terms">条款</a>:</span>
    </template>
    <u-checkbox v-model="model.data.agree" />
  </u-form-item>
</u-form>
```

### 覆盖标签宽度与添加提示

```vue
<u-form :model="model">
  <u-form-item label="短标签" field="short" :label-width="120" tips="这里是说明文字">
    <u-input v-model="model.data.short" />
  </u-form-item>

  <u-form-item label="长标签" field="long" :label-width="200">
    <u-input v-model="model.data.long" />
  </u-form-item>
</u-form>
```

### 响应式栅格布局

```vue
<u-form :model="model">
  <!-- 默认占满行，md+ 占 6 列 -->
  <u-form-item label="姓名" field="name" :span="{ default: 'full', md: 6 }">
    <u-input v-model="model.data.name" />
  </u-form-item>

  <!-- 默认占满行，md+ 占 6 列 -->
  <u-form-item label="年龄" field="age" :span="{ default: 'full', md: 6 }">
    <u-number-input v-model="model.data.age" />
  </u-form-item>
</u-form>
```
