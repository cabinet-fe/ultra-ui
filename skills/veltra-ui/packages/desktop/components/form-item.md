# UFormItem — 表单项

> `import type { FormItemProps } from '@veltra/desktop'`

## 何时使用

**大多数情况下不需要手动使用 FormItem。** 当表单输入组件设置了 `field` 属性时，`<u-form>` 会自动包裹 FormItem。

只有以下场景需要手动使用：
- 一个表单项内包含多个输入组件的组合
- 需要自定义 label 插槽内容
- 其他无法通过单个 `field` 属性表达的复杂布局

## Import

```ts
import { UFormItem } from '@veltra/desktop'
```

## Props

| prop | type | default | 说明 |
|------|------|---------|------|
| `label` | `string` | — | 标签文字 |
| `field` | `string` | — | 关联的字段名（用于显示校验错误和必填标记） |
| `labelWidth` | `string \| number` | — | 标签宽度（覆盖 Form 的统一设置） |
| `tips` | `string` | — | 提示信息（显示为 tooltip） |
| `span` | `number \| 'full' \| ({ [key in BreakpointName]?: number \| 'full' } & { default: number \| 'full' })` | — | 所占栅格列数，支持响应式对象 |
| `readonly` | `boolean` | — | 是否只读 |

## Slots

| slot | 说明 |
|------|------|
| `default` | 表单控件内容 |
| `label` | 自定义标签内容 |

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

### 对比：不需要 FormItem 的场景

```vue
<!-- ✅ 正确：直接用 field，Form 自动处理 -->
<u-form :model="model">
  <u-input field="name" label="姓名" />
  <u-select field="city" label="城市" :options="cities" />
</u-form>

<!-- ❌ 错误：不需要手动包裹 FormItem -->
<u-form :model="model">
  <u-form-item label="姓名" field="name">
    <u-input v-model="model.data.name" />
  </u-form-item>
</u-form>
```
