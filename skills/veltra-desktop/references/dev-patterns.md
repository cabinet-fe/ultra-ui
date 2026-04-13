# 组件使用模式

面向页面开发的常见场景与模式，示例基于 playground 真实代码。

## 表单场景

### FormModel 创建与字段校验

```typescript
import { FormModel } from '@veltra/desktop'

const model = new FormModel({
  // required: 必填
  name: { required: true, value: '' },
  // min/max: 数值范围
  age: { min: 0, max: 150 },
  // match: 正则 + 错误消息
  email: { match: [/^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*/, '邮箱格式不正确'] },
  // validator: 自定义校验函数，返回空字符串表示通过
  phone: {
    validator(value) {
      if (!value) return ''
      return /^1\d{10}$/.test(value) ? '' : '手机号格式不正确'
    }
  },
  // value 为函数时取其返回值作为初始值（响应式）
  price: { required: true, value: () => someRef.value }
})
```

### 表单提交与重置

```typescript
async function handleSubmit() {
  const valid = await model.validate()
  if (!valid) return
  // model.data 包含所有字段当前值
  await api.save(model.data)
}

// 重置到初始值
model.resetData()
// 重置指定字段
model.resetData('name')

// 设置数据（可触发校验）
model.setData({ name: '张三', age: 20 })
// 设置数据不触发校验
model.setData({ name: '张三' }, { validate: false })

// 清除校验状态
model.clearValidate()
```

### 嵌套字段

`field` 支持点语法表示嵌套路径：

```vue
<u-input field="nest.name" label="嵌套名称" />
<u-number-input field="nest.price" label="嵌套价格" />
```

对应 FormModel 定义：

```typescript
const model = new FormModel({
  'nest.name': { required: true, value: 'default' },
  'nest.price': { required: true }
})
```

### 表单内组件绑定

表单内组件通过 `field` 属性自动绑定值和校验，无需手写 `v-model`：

```vue
<u-form :model="model" label-width="100px" :disabled="disabled" :readonly="readonly">
  <u-input field="name" label="姓名" />
  <u-number-input field="age" label="年龄" suffix="岁" />
  <u-select field="unit" label="单位" :options="units" />
  <u-multi-select field="interest" label="兴趣" :options="interestList" />
  <u-date-picker field="date" label="日期" />
  <u-textarea field="remarks" label="备注" span="full" />
  <u-switch field="enabled" label="启用" />
</u-form>
```

### 表单作用域插槽

通过默认插槽可获取响应式 `data` 对象，用于条件渲染：

```vue
<u-form :model="model">
  <template #default="{ data }">
    <u-radio-group field="type" label="类型" :items="typeOptions" />
    <u-input v-if="data.type === 'custom'" field="customValue" label="自定义值" />
  </template>
</u-form>
```

## 表格场景

### defineTableColumns 列定义

```typescript
import { defineTableColumns } from '@veltra/desktop'

const columns = defineTableColumns([
  { key: 'name', name: '姓名' },
  { key: 'age', name: '年龄', align: 'center' },
  { key: 'grade', name: '年级', align: 'center' },
  { key: 'action', name: '操作', align: 'center' }
])
```

### 行操作与可勾选

```vue
<u-table :data="students" :columns="columns" v-model:checked="checked" show-index checkable>
  <template #column:action>
    <u-action-group :max="4">
      <u-action>编辑</u-action>
      <u-action need-confirm type="danger">删除</u-action>
    </u-action-group>
  </template>
</u-table>
```

`v-model:checked` 绑定已勾选行数组，`show-index` 显示行号列，`checkable` 启用复选列。

### 单元格合并与行展开

参阅 playground `table/merge-cell.vue`（合并）和 `table/expand.vue`（展开）的完整示例，
对应类型定义见 [data-display.md](../generated/data-display.md) 中 `TableProps` 的 `mergeCell` 和 `expandable` 属性。

## 树组件场景

### 基础配置

```vue
<u-tree
  :data="treeData"
  label-key="name"
  value-key="id"
  height="200px"
  v-model:checked="checked"
  @update:selected="handleSelect"
/>
```

`label-key` / `value-key` 指定数据字段映射，`height` 启用虚拟滚动。

### 多选与单选

```vue
<!-- 多选（勾选框） -->
<u-tree :data="data" checkable v-model:checked="checkedIds" />

<!-- 单选（点击高亮） -->
<u-tree :data="data" selectable @update:selected="onSelect" />

<!-- 严格选择：父子节点独立勾选 -->
<u-tree :data="data" checkable check-strictly v-model:checked="checkedIds" />
```

`checkable` 和 `selectable` 互斥——同时启用时仅 `checkable` 生效。

### 节点过滤与禁用

```typescript
const treeRef = shallowRef<TreeExposed>()

// 过滤
watch(keyword, (val) => {
  treeRef.value?.filter(val)
})

// 禁用特定节点
function disabledNode(node: any) {
  return node.id === 'locked-id'
}
```

```vue
<u-tree ref="treeRef" :data="data" :disabled-node="disabledNode" />
```

### 自定义节点内容

```vue
<u-tree :data="data" label-key="name" value-key="id" expand-all>
  <template #default="{ data }">
    {{ data.name }} — {{ data.id }}
  </template>
</u-tree>
```

## 对话框/抽屉

### 声明式调用（v-model）

```vue
<u-button @click="visible = true">打开</u-button>
<u-dialog v-model="visible" title="对话框标题" style="width: 80%">
  <p>内容区域</p>
  <template #footer>
    <u-button @click="visible = false">取消</u-button>
    <u-button type="primary" @click="handleConfirm">确认</u-button>
  </template>
</u-dialog>
```

### trigger 插槽（简化用法）

无需手动管理 `visible` 状态：

```vue
<u-dialog title="表单" style="width: 900px" @closed="model.resetData()">
  <template #trigger>
    <u-button type="primary">打开弹框</u-button>
  </template>
  <!-- 对话框内容 -->
  <template #footer>
    <u-button type="primary" @click="handleSubmit">提交</u-button>
  </template>
</u-dialog>
```

`@closed` 在对话框关闭动画完成后触发，适合重置表单数据。

### 确认弹出（pop-confirm）

```vue
<u-pop-confirm title="确认删除吗？" @confirm="handleDelete">
  <template #reference>
    <u-button type="danger">删除</u-button>
  </template>
</u-pop-confirm>
```

### 抽屉（Drawer）

API 与 Dialog 类似，方向通过 `placement` 控制（`left` | `right` | `top` | `bottom`）。

## 消息/通知

### 函数式调用

```typescript
import { message } from '@veltra/desktop'

message({ message: '操作成功', type: 'success' })
message({ message: '操作失败', type: 'error', duration: 5000 })
message({ message: '提示信息', closable: true, onClosed() { console.log('已关闭') } })

// 关闭所有消息
message.closeAll()
```

### 消息类型

`type` 可选值：`'default'` | `'info'` | `'success'` | `'warn'` | `'error'`

### Notification（通知）

通知组件用法类似 message，适用于需要更多内容展示的场景。
详见 [feedback.md](../generated/feedback.md) 中 `NotificationProps` 类型定义。
