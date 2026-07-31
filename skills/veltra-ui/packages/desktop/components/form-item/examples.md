# UFormItem 示例

> **优先**把控件直接放在 `u-form` 下用 `field`（见 `form/examples.md`），一般不必手写 `UFormItem`。
>
> 仅在多控件组合、自定义 label 插槽等场景显式使用：`field` / `label` / `rules` 写在 `UFormItem` 上（**Item 也必须有 `field`，否则 label/校验不挂表单**）；内部控件自行 `v-model` 绑 `model` 路径，控件上不要再写 `field`。

## 多组件组合

```vue
<script setup lang="ts">
import { reactive } from 'vue'

const formData = reactive({ dateRange: { startDate: '', endDate: '' } })
</script>

<template>
  <u-form :model="formData">
    <u-form-item label="日期范围" field="dateRange">
      <u-date-picker v-model="formData.dateRange.startDate" />
      <span> 至 </span>
      <u-date-picker v-model="formData.dateRange.endDate" />
    </u-form-item>
  </u-form>
</template>
```

## 自定义 label

```vue
<script setup lang="ts">
import { reactive } from 'vue'

const formData = reactive({ agree: false })
</script>

<template>
  <u-form :model="formData">
    <u-form-item field="agree">
      <template #label>
        <span>我已阅读并同意 <a href="/terms">条款</a>:</span>
      </template>
      <u-checkbox v-model="formData.agree" />
    </u-form-item>
  </u-form>
</template>
```

## 覆盖标签宽度与添加提示

```vue
<script setup lang="ts">
import { reactive } from 'vue'

const formData = reactive({ short: '', long: '' })
</script>

<template>
  <u-form :model="formData">
    <u-form-item label="短标签" field="short" :label-width="120" tips="这里是说明文字">
      <u-input v-model="formData.short" />
    </u-form-item>

    <u-form-item label="长标签" field="long" :label-width="200">
      <u-input v-model="formData.long" />
    </u-form-item>
  </u-form>
</template>
```

## 响应式栅格布局

```vue
<script setup lang="ts">
import { reactive } from 'vue'

const formData = reactive({ name: '', age: 18 })
</script>

<template>
  <u-form :model="formData">
    <!-- 默认占满行，md+ 占 6 列 -->
    <u-form-item label="姓名" field="name" :span="{ default: 'full', md: 6 }">
      <u-input v-model="formData.name" />
    </u-form-item>

    <!-- 默认占满行，md+ 占 6 列 -->
    <u-form-item label="年龄" field="age" :span="{ default: 'full', md: 6 }">
      <u-number-input v-model="formData.age" />
    </u-form-item>
  </u-form>
</template>
```
