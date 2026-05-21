# 易错点（Gotchas）

代理在使用 Veltra UI 时最常犯的错误。**写代码前必须检查此清单。**

## 0. 自动导入下不要 import 组件

项目配置了 `VeltraDesktopUIResolver` 后，组件在模板中直接使用，**不需要 import**：

```vue
<!-- ❌ 错误：多余的 import -->
<script setup>
import { UButton, UInput, UDialog } from '@veltra/desktop'
</script>

<!-- ✅ 正确：直接用，resolver 自动处理 -->
<script setup>
// 只 import 函数、类型、图标
import { message, FormModel, formField } from '@veltra/desktop'
import { Search } from '@veltra/icons/normal'
import type { ButtonProps } from '@veltra/desktop'
</script>

<template>
  <u-button type="primary">按钮</u-button>
  <u-input v-model="text" />
</template>
```

**判断规则：模板标签不 import，script 中调用的函数/类型/图标才 import。**

## 1. Dialog 使用 v-model 而非 v-model:visible

```vue
<!-- ❌ 错误 -->
<u-dialog v-model:visible="show" />

<!-- ✅ 正确 -->
<u-dialog v-model="show" title="标题" />
```

## 2. FormModel 配合 field prop，不用 v-model

在 `UForm` 内部，表单控件通过 `field` prop 自动绑定 FormModel 中的字段，**不需要** `v-model`：

```vue
<!-- ❌ 错误：在 UForm 内用 v-model -->
<u-form :model="model">
  <u-input v-model="model.data.name" label="姓名" />
</u-form>

<!-- ✅ 正确：用 field prop 自动单向/双向值读取与更新 -->
<u-form :model="model">
  <u-input label="姓名" field="name" />
</u-form>

<!-- ✅ 正确：支持深层嵌套对象属性绑定（支持以 lodash 风格 path 如 "profile.name" 绑定） -->
<u-form :model="model">
  <u-input label="姓名" field="profile.name" />
</u-form>
```

`field` 的值对应 `FormModel` 构造时的 key，或者其内部的深层嵌套属性路径。嵌套属性绑定时，`FormModel` 在初始初始化时必须定义完整的结构（如 `{ profile: { name: '' } }`），组件内部底层会自动进行安全读写解析，严禁手动编写复杂的更新监听器。

## 3. 图标从 @veltra/icons/normal 导入

```ts
// ❌ 错误
import { Search } from '@veltra/icons'

// ✅ 正确
import { Search } from '@veltra/icons/normal'
```

`@veltra/icons` 根入口不直接导出图标组件，图标按分类子路径导出。

### 图标在组件属性（Props）中的声明与渲染范式

- **Props 声明类型**：推荐使用 Vue 导出的 `Component` 类型（或更具体的 `FunctionalComponent`）：

  ```ts
  import type { Component } from 'vue'

  export interface ComponentProps {
    icon?: Component
  }
  ```

- **Vue 模板动态渲染**：使用 `<component :is="icon" />` 包裹在 `<u-icon>` 组件中以保留统一的尺寸与颜色层叠性：
  ```vue
  <template>
    <u-icon v-if="icon" :size="iconSize">
      <component :is="icon" />
    </u-icon>
  </template>
  ```

## 4. USelect 的 options 必须是对象数组

```ts
// ❌ 错误：字符串数组
const options = ['北京', '上海', '广州']

// ✅ 正确：对象数组，包含 label 和 value
const options = [
  { label: '北京', value: 'beijing' },
  { label: '上海', value: 'shanghai' },
  { label: '广州', value: 'guangzhou' }
]
```

可通过 `valueKey` / `labelKey` 自定义字段名。

## 5. 全局注册从 @veltra/desktop/install 导入

```ts
// ❌ 错误
import UltraUI from '@veltra/desktop'

// ✅ 正确
import UltraUI from '@veltra/desktop/install'
```

`@veltra/desktop` 根入口只导出组件和类型，不提供 plugin。

## 6. 不存在的组件

以下组件**不存在**，不要凭空使用：

- ~~UAvatar~~ — 没有头像组件
- ~~UTooltip~~ — 使用 `UTip` 代替
- ~~UPopover~~ — 使用 `UDropdown` 或 `UTip` 代替
- ~~UModal~~ — 使用 `UDialog` 代替
- ~~UMessageBox~~ — 使用 `MessageConfirm` 函数代替

## 7. message / Notification 是函数调用，不是组件

```ts
// ❌ 错误：当组件用
<u-message type="success">操作成功</u-message>

// ✅ 正确：函数调用
import { message, Notification } from '@veltra/desktop'

message.success('操作成功')
Notification.info({ title: '提示', content: '新消息' })
```

注意：`message` 小写，`Notification` 大写。

## 8. UTable 的列定义用 defineTableColumns

```ts
// ❌ 不推荐：手写列数组缺少类型提示
const columns = [{ key: 'name', name: '姓名' }]

// ✅ 推荐：使用 defineTableColumns 获得类型安全和默认值
import { defineTableColumns } from '@veltra/desktop'
const columns = defineTableColumns([{ key: 'name', name: '姓名', minWidth: 120 }], {
  align: 'center'
})
```

## 9. 主题加载必须在 app.mount 之前

```ts
// ✅ 正确顺序
import { loadTheme } from '@veltra/styles/theme'

loadTheme() // 先加载主题
app.use(UltraUI) // 再注册组件
app.mount('#app') // 最后挂载
```

## 10. SCSS 中用 pkg: 协议引用

```scss
// ❌ 错误：相对路径或 node_modules 路径
@use '~@veltra/styles/mixins' as m;
@use '../node_modules/@veltra/styles/mixins' as m;

// ✅ 正确：pkg: 协议（需配置 NodePackageImporter）
@use 'pkg:@veltra/styles/mixins' as m;
@use 'pkg:@veltra/styles/functions' as fn;
```

## 11. UMultiSelect 用于多选，不是 USelect + multiple

```vue
<!-- ❌ 错误：USelect 没有 multiple prop -->
<u-select v-model="selected" :options="opts" multiple />

<!-- ✅ 正确：多选用 UMultiSelect -->
<u-multi-select v-model="selected" :options="opts" />
```

## 12. 操作列用 UAction + UActionGroup

表格操作列不要用裸 `<a>` 或 `<u-button text>`，用专用组件：

```vue
<template #column:action>
  <u-action-group :max="4">
    <u-action @run="handleEdit">编辑</u-action>
    <u-action need-confirm type="danger" @run="handleDelete">删除</u-action>
  </u-action-group>
</template>
```

`need-confirm` 会自动弹出确认气泡。

## 13. UCollapse 实例方法已被移除，bordered 属性已废弃

从 `1.1.6` 开始，折叠面板进行了全面的项级独立胶囊卡片化重构。在此过程中，废弃并移除了 `CollapseExposed`（即不再暴露任何实例方法，如 `toggle`/`expand`/`collapse` 等）以及 `bordered` 属性。

```vue
<!-- ❌ 错误：使用已失效的 bordered 属性以及通过 ref 试图调用程序化方法 -->
<script setup>
const collapseRef = ref()
const expandFirst = () => {
  collapseRef.value?.expand('first') // 会抛出运行时异常：expand is not a function
}
</script>
<template>
  <u-collapse ref="collapseRef" :bordered="false" v-model="active">
    <u-collapse-item value="first" title="折叠项 A">内容</u-collapse-item>
  </u-collapse>
</template>

<!-- ✅ 正确：全部状态均采用声明式绑定，通过 v-model 驱动交互与折叠展开状态；
     若需要在无初始绑定值时控制默认全部折叠，请使用 default-collapse-all 属性 -->
<template>
  <u-collapse v-model="active" default-collapse-all>
    <u-collapse-item value="first" title="折叠项 A">内容</u-collapse-item>
  </u-collapse>
</template>
```
