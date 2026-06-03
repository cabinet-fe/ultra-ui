# UFormItem 示例

## 多组件组合

```vue
<u-form :model="model">
  <u-form-item label="日期范围" field="dateRange">
    <u-date-picker v-model="model.data.startDate" />
    <span> 至 </span>
    <u-date-picker v-model="model.data.endDate" />
  </u-form-item>
</u-form>
```

## 自定义 label

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

## 覆盖标签宽度与添加提示

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

## 响应式栅格布局

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
