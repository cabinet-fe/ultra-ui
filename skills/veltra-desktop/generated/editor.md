# 编辑器

## code-editor (UCodeEditor)

### 类型定义

```typescript
// 来源: packages/desktop/src/types/code-editor.ts
import type { DeconstructValue, FormComponentProps } from '@veltra/utils'

export type CodeEditorLang = 'js' | 'sql' | 'java' | 'json'

/** 代码编辑器组件属性 */
export interface CodeEditorProps extends FormComponentProps {
  modelValue?: string
  /** 定义语言 */
  language?: CodeEditorLang
}

/** 代码编辑器组件定义的事件 */
export interface CodeEditorEmits {
  (e: 'update:modelValue', value: string): void
}

/** 代码编辑器组件暴露的属性和方法(组件内部使用) */
export interface _CodeEditorExposed {}

/** 代码编辑器组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type CodeEditorExposed = DeconstructValue<_CodeEditorExposed>
```

### 使用示例

```vue
<!-- 来源: playgrounds/desktop/src/code-editor/index.vue -->
<template>
  <div>
    <div>
      <u-radio-group
        v-model="language"
        :items="[
          { value: 'js', label: 'js' },
          { value: 'sql', label: 'sql' },
          { value: 'java', label: 'java' },
          { value: 'json', label: 'json' }
        ]"
      ></u-radio-group>

      <u-checkbox v-model="disabled">禁用</u-checkbox>
      <u-checkbox v-model="readonly">只读</u-checkbox>
    </div>

    <u-form :model="model" :disabled="disabled" :readonly="readonly">
      <u-code-editor field="code" :language="language" label="代码"></u-code-editor>
    </u-form>

    <pre>{{ model.data.code }}</pre>
  </div>
</template>

<script lang="ts" setup>
import { FormModel } from '@veltra/desktop'
import { ref } from 'vue'

const model = new FormModel({
  code: { required: true }
})

const disabled = ref(false)

const readonly = ref(false)

const language = ref<'js' | 'sql' | 'java' | 'json'>('js')
</script>
```

## rich-text-editor (URichTextEditor)

### 类型定义

```typescript
// 来源: packages/desktop/src/types/rich-text-editor.ts
import type { DeconstructValue, FormComponentProps } from '@veltra/utils'

/** 富文本数据格式 */
export type RichTextFormat = 'html' | 'json'

/** 工具栏项 */
export type ToolbarItem =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strikethrough'
  | 'code'
  | 'heading'
  | 'bullet-list'
  | 'ordered-list'
  | 'blockquote'
  | 'code-block'
  | 'link'
  | 'undo'
  | 'redo'
  | '|'

/** 富文本编辑器组件属性 */
export interface RichTextEditorProps extends FormComponentProps {
  modelValue?: string
  /** 数据格式：html 或 json */
  format?: RichTextFormat
  /** 工具栏配置 */
  toolbar?: ToolbarItem[]
  /** 占位文本 */
  placeholder?: string
}

/** 富文本编辑器组件定义的事件 */
export interface RichTextEditorEmits {
  (e: 'update:modelValue', value: string): void
}

/** 富文本编辑器组件暴露的属性和方法(组件内部使用) */
export interface _RichTextEditorExposed {}

/** 富文本编辑器组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type RichTextEditorExposed = DeconstructValue<_RichTextEditorExposed>
```

### 使用示例

```vue
<!-- 来源: playgrounds/desktop/src/text-editor/index.vue -->
<template>
  <div>
    <div>
      <u-button @click="setValue">设置初始值</u-button>
    </div>

    <URichTextEditor v-model="modelValue" />

    <URichTextEditor v-model="modelValue" disabled />

    <URichTextEditor v-model="modelValue" readonly />
  </div>
</template>
<script lang="ts" setup>
import { shallowRef } from 'vue'

const modelValue = shallowRef()

function setValue() {
  modelValue.value = '<p>你好</p><p>世界</p>'
}
</script>
```

## expression-editor (UExpressionEditor)

### 类型定义

```typescript
// 来源: packages/desktop/src/types/expression-editor.ts
import type { DeconstructValue, FormComponentProps } from '@veltra/utils'

export interface VariableItem {
  label: string
  value: string
  /** 可选类型标识（如 string、number） */
  type?: string
  /** 子级变量（支持树形结构） */
  children?: VariableItem[]
}

/** 表达式编辑器组件属性 */
export interface ExpressionEditorProps extends FormComponentProps {
  modelValue?: string
  placeholder?: string
  /** 变量列表 */
  variables?: VariableItem[]
}

/** 表达式编辑器组件定义的事件 */
export interface ExpressionEditorEmits {
  (e: 'update:modelValue', value: string): void
}

/** 表达式编辑器组件暴露的属性和方法(组件内部使用) */
export interface _ExpressionEditorExposed {}

/** 表达式编辑器组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type ExpressionEditorExposed = DeconstructValue<_ExpressionEditorExposed>
```

### 使用示例

```vue
<!-- 来源: playgrounds/desktop/src/expression-editor/index.vue -->
<template>
  <div>
    <h3>表达式编辑器示例</h3>
    <p>
      输入 @ 可以触发变量选择器。键盘操作：<br />
      • <strong>上下键</strong>：在列表中导航<br />
      • <strong>空格键</strong>：进入下一级（仅对有子项的变量有效）<br />
      • <strong>回车键</strong>：选择变量（仅对最末级变量有效）<br />
      • <strong>左键/退格</strong>：返回上一级<br />
      • <strong>ESC</strong>：关闭面板
    </p>

    <h4>拖拽行为矩阵（实现为真源）</h4>
    <ul>
      <li>合法拖拽源：仅支持变量节点（{variable}）直接拖拽，普通文本与空白不是拖拽源。</li>
      <li>合法目标粒度：按变量插槽计算，hover 到纯文本区域时自动 snap 到最近合法插入位。</li>
      <li>
        非法 drop：外部数据源、跨表达式区域或无效 payload 会 silent revert（仅清理反馈，不改内容）。
      </li>
      <li>drop 后焦点：焦点回到被移动变量，便于连续重排。</li>
      <li>桌面优先：优先使用原生 DnD；原生不可用时显示变量“上移/下移”作为等价交互。</li>
      <li>边界规则：首项禁上移、末项禁下移；readonly/disabled 下不触发重排。</li>
    </ul>

    <div style="margin-bottom: 20px">
      <u-expression-editor
        v-model="expression"
        :variables="variables"
        placeholder="请输入表达式，输入@可插入变量"
      />
    </div>

    <div style="margin-bottom: 20px">
      <h4>表达式：</h4>
      <pre>{{ expression }}</pre>
    </div>

    <div style="margin-bottom: 20px">
      <h4>值替换：</h4>
      <pre>{{ value }}</pre>
    </div>

    <div style="margin-bottom: 20px">
      <h4>变量列表（树形结构）：</h4>
      <pre>{{ JSON.stringify(variables, null, 2) }}</pre>
    </div>

    <div style="margin-bottom: 20px">
      <h4>禁用状态：</h4>
      <u-expression-editor v-model="value" :variables="variables" disabled />
    </div>

    <div style="margin-bottom: 20px">
      <h4>只读状态：</h4>
      <u-expression-editor v-model="value" :variables="variables" readonly />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { o } from '@cat-kit/core'
import { computed } from 'vue'
import { shallowRef } from 'vue'

const expression = shallowRef(
  '你好{form.user.name}, 欢迎来到{form.company.name}，入职{form.department.name}为{form.position}职位'
)

// 更丰富的树形变量结构
const variables = [
  {
    label: '表单数据',
    value: 'form',
    children: [
      {
        label: '用户信息',
        value: 'form.user',
        children: [
          { label: '姓名', value: 'form.user.name' },
          { label: '年龄', value: 'form.user.age' },
          { label: '邮箱', value: 'form.user.email' }
        ]
      },
      {
        label: '公司信息',
        value: 'form.company',
        children: [
          { label: '公司名称', value: 'form.company.name' },
          { label: '公司地址', value: 'form.company.address' },
          { label: '公司电话', value: 'form.company.phone' }
        ]
      },
      {
        label: '部门信息',
        value: 'form.department',
        children: [
          { label: '部门名称', value: 'form.department.name' },
          { label: '部门编号', value: 'form.department.code' }
        ]
      },
      { label: '职位', value: 'form.position' },
      { label: '入职日期', value: 'form.date' }
    ]
  },
  {
    label: '系统变量',
    value: 'system',
    children: [
      { label: '当前时间', value: 'system.currentTime' },
      { label: '当前用户', value: 'system.currentUser' },
      { label: '系统版本', value: 'system.version' }
    ]
  }
]

const data = {
  form: {
    user: {
      name: '张三',
      age: 28,
      email: 'zhangsan@example.com'
    },
    company: {
      name: 'bilibili',
      address: '上海市杨浦区',
      phone: '021-12345678'
    },
    department: {
      name: '研发部',
      code: 'DEV001'
    },
    position: '前端工程师',
    date: '2025-01-01'
  },
  system: {
    currentTime: '2025-11-22 10:30:00',
    currentUser: 'admin',
    version: 'v2.0.0'
  }
}

function getValue(expression: string, data: any) {
  return expression.replace(/\{([^}]+)\}/g, (match, key) => {
    return o(data).get(key)
  })
}

const value = computed(() => {
  return getValue(expression.value, data)
})
</script>
```

## condition-editor (UConditionEditor)

### 类型定义

```typescript
// 来源: packages/desktop/src/types/condition-editor.ts
import type { DeconstructValue } from '@veltra/utils'

/** 条件编辑器组件属性 */
export interface ConditionEditorProps {
  modelValue?: string
}

/** 条件编辑器组件定义的事件 */
export interface ConditionEditorEmits {
  (e: 'update:modelValue', value: string): void
}

/** 条件编辑器组件暴露的属性和方法(组件内部使用) */
export interface _ConditionEditorExposed {}

/** 条件编辑器组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type ConditionEditorExposed = DeconstructValue<_ConditionEditorExposed>
```

### 使用示例

暂无示例

## table-editor (UTableEditor)

### 类型定义

```typescript
// 来源: packages/desktop/src/types/table-editor.ts
import type { DeconstructValue } from '@veltra/utils'

import type { TableProps } from './table'

/** 表格型编辑器组件属性 */
export interface TableEditorProps extends Omit<TableProps, 'data'> {
  /** 表格数据 */
  modelValue?: any[]
}

/** 表格型编辑器组件定义的事件 */
export interface TableEditorEmits {
  (e: 'update:modelValue', value: any[]): void
}

/** 表格型编辑器组件暴露的属性和方法(组件内部使用) */
export interface _TableEditorExposed {}

/** 表格型编辑器组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type TableEditorExposed = DeconstructValue<_TableEditorExposed>
```

### 使用示例

```vue
<!-- 来源: playgrounds/desktop/src/table-editor/index.vue -->
<template>
  <div>
    <u-table-editor :columns="columns" v-model="data">
      <template #column:name="{ model }">
        <u-textarea v-bind="model" />
      </template>
      <template #column:age="{ model }">
        <u-number-input v-bind="model" />
      </template>
    </u-table-editor>

    <u-tip>
      <u-button>查看数据</u-button>

      <template #content>
        <div v-for="item of data">
          {{ item }}
        </div>
      </template>
    </u-tip>
  </div>
</template>

<script lang="ts" setup>
import { defineTableColumns } from '@veltra/desktop'
import { shallowRef } from 'vue'

const columns = defineTableColumns([
  { key: 'name', name: '姓名' },
  { key: 'age', name: '年龄' }
])

const data = shallowRef([])
</script>
```

## batch-edit (UBatchEdit)

### 类型定义

```typescript
// 来源: packages/desktop/src/types/batch-edit.ts
import type { DeconstructValue } from '@veltra/utils'

import type { ActionProps } from './action'
import type { IFormModel } from './form'
import type { TableColumn, TableEmits, TableProps, TableRow } from './table'

/** 批量编辑列 */
export interface BatchEditColumn extends TableColumn {
  // /**
  //  * 是否在列中显示
  //  * @default true
  //  */
  // visible?: boolean
  // /** 校验规则 */
  // rules?: ValidateRule
  // /** 默认值 */
  // defaultValue?: any | (() => any)
}

export type BatchEditFeature = 'create' | 'update' | 'copy' | 'delete' | 'view' | 'createChild'

/** 批量编辑组件属性 */
export interface BatchEditProps<Model extends IFormModel = IFormModel> extends TableProps {
  /**
   * 表单模型
   * @description 该模型优先级要大于列配置
   */
  model?: Model
  /** 表格标题 */
  title?: string
  /**
   * 列的宽度定义
   */
  cols?: string | [string, string]
  /** 只读模式 */
  readonly?: boolean
  /** label的宽度 */
  labelWidth?: string | number
  /** 删除方法 */
  deleteMethod?: (data: Record<string, any>[]) => Promise<any> | any
  /**
   * 保存方法
   * @description 这个方法旨在快编时生效
   * @returns 如果返回一个值，那么这个值会被插入，否则插入的为表单值
   */
  saveMethod?: (
    /** 表单数据 */
    data: Record<string, any>,
    /** 操作类型 */
    actionType: 'create' | 'update',
    /** 父级数据 */
    parentData?: Record<string, any>
  ) => Promise<any> | any

  /**
   * 可用功能，不穿则对功能没有任何限制
   *
   * ## 用法
   * ```ts
   * // 只允许新增和更新
   * const features = ['create', 'update']
   * // 不允许新增，并且只有当行深度小于2时才允许新增子级，对其他功能不做限制
   * const features = {
   *   create: false,
   *   createChild: row => row.depth < 2
   * }
   * ```
   */
  features?:
    | Array<BatchEditFeature>
    | {
        [key in BatchEditFeature]?: boolean | ((row: TableRow) => boolean)
      }

  /**
   * 操作按钮的属性配置, 可以是action组件的任意属性
   * @example
   * ```ts
   * const actionsProps = {
   *   delete: {
   *     needConfirm: true,
   *     circle: false
   *   }
   * }
   * ```
   */
  actionsProps?: Partial<Record<BatchEditFeature, ActionProps>>
}

/** 批量编辑组件定义的事件 */
export interface BatchEditEmits extends TableEmits {
  /** 更新数据 */
  (e: 'update:data', value: Record<string, any>[]): void
}

/** 批量编辑组件暴露的属性和方法(组件内部使用) */
export interface _BatchEditExposed {}

/** 批量编辑组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type BatchEditExposed = DeconstructValue<_BatchEditExposed>
```

### 使用示例

```vue
<!-- 来源: playgrounds/desktop/src/batch-edit/index.vue -->
<template>
  <div>
    <div>
      <div class="flex gap-4">
        <u-checkbox v-model="readonly">只读</u-checkbox>
        <u-checkbox v-model="tree">树形</u-checkbox>
        <u-checkbox v-model="asynchronous">模拟异步</u-checkbox>
      </div>

      <u-checkbox-group :items="items" v-model="features"></u-checkbox-group>
    </div>

    <div>
      <u-button @click="dialogVisible = !dialogVisible">打开编辑</u-button>
    </div>

    <u-batch-edit
      :columns="columns"
      :readonly="readonly"
      :resizable="resizable"
      v-model:data="data"
      v-model:checked="checked"
      checkable
      :model="model"
      :actions-props="{ delete: { needConfirm: true, circle: false } }"
      :features="dynamicFeatures"
      :tree="tree"
      style="max-height: 500px"
      :delete-method="asynchronous ? deleteMethod : undefined"
      :save-method="asynchronous ? saveMethod : undefined"
      @created="model.setData({ age: 666 })"
    >
      <template #column:name="{ row }">
        <span :style="`padding-left: ${row.depth * 20}px;`">
          {{ row.depth }} {{ row.data.name }}
        </span>
      </template>
      <template #form="{ data, depth }">
        {{ depth }}
        <!-- 基础信息 -->
        <u-input field="name" label="姓名" placeholder="请输入姓名" />
        <u-number-input field="age" label="年龄" :min="0" :max="120" />
        <u-input field="email" label="邮箱" placeholder="请输入邮箱地址" />
        <u-input field="phone" label="电话" placeholder="请输入电话号码" />

        <!-- 选择器类型 -->
        <u-select
          field="gender"
          label="性别"
          :options="genderOptions"
          label-key="label"
          value-key="value"
          placeholder="请选择性别"
        />
        <u-select
          field="department"
          label="部门"
          :options="departmentOptions"
          label-key="label"
          value-key="value"
          placeholder="请选择部门"
        />
        <u-select
          field="position"
          label="职位"
          :options="positionOptions"
          label-key="label"
          value-key="value"
          placeholder="请选择职位"
        />
        <u-select
          field="unit"
          label="单位"
          :options="units"
          label-key="label"
          value-key="value"
          placeholder="请选择单位"
        />

        <!-- 日期时间 -->
        <u-date-picker field="birthday" label="生日" placeholder="请选择生日" />
        <u-date-picker field="joinDate" label="入职日期" placeholder="请选择入职日期" />

        <!-- 数值输入 -->
        <u-number-input field="salary" label="薪资" :min="0" :step="100" />
        <u-number-input field="score" label="评分" :min="0" :max="100" :step="0.1" />

        <!-- 多行文本 -->
        <u-textarea field="address" label="地址" placeholder="请输入详细地址" span="full" />
        <u-textarea field="description" label="个人描述" placeholder="请输入个人描述" span="full" />

        <!-- 复选框和单选框 -->
        <u-checkbox-group field="skills" label="技能" :items="skillOptions" span="full" />
        <u-radio-group field="workType" label="工作类型" :items="workTypeOptions" />

        <!-- 高级组件 -->
        <u-code-editor field="code" label="代码片段" language="json" span="full" />
        <u-slider field="experience" label="工作经验(年)" :min="0" :max="20" />

        <!-- 条件显示字段 -->
        <u-input v-if="!data.age || data.age < 25" field="emergencyContact" label="紧急联系人" />
        <u-input
          v-if="data.department === 'tech'"
          field="programmingLanguage"
          label="主要编程语言"
        />

        <!-- 嵌套字段 -->
        <u-input field="props.label" label="标签" />
        <u-input field="props.field" label="字段" />
        <u-input field="contact.qq" label="QQ号码" />
        <u-input field="contact.wechat" label="微信号" />

        <!-- <u-cascade
            field="cascade"
            label="单选级联选择器"
            :options="area.area"
            label-key="name"
            value-key="code"
            filterable
          /> -->
      </template>
    </u-batch-edit>

    <u-dialog v-model="dialogVisible" style="width: 1000px"> </u-dialog>
  </div>
</template>

<script lang="ts" setup>
import { date, sleep } from '@cat-kit/core'
import { FormModel, defineTableColumns, message } from '@veltra/desktop'
import type { BatchEditFeature } from '@veltra/desktop'
import { computed, shallowRef } from 'vue'

const readonly = shallowRef(false)
const tree = shallowRef(false)
const resizable = shallowRef(true)
const dialogVisible = shallowRef(false)

const columns = defineTableColumns([
  { name: '姓名', key: 'name', rules: { required: true }, width: 120 },
  { name: '年龄', key: 'age', rules: { max: 120 }, width: 80 },
  { name: '性别', key: 'gender', width: 80 },
  { name: '部门', key: 'department', width: 120 },
  { name: '职位', key: 'position', width: 120 },
  { name: '邮箱', key: 'email', width: 180 },
  { name: '电话', key: 'phone', width: 120 },
  { name: '薪资', key: 'salary', width: 100 },
  { name: '评分', key: 'score', width: 80 },
  { name: '工作类型', key: 'workType', width: 100 },
  { name: '入职日期', key: 'joinDate', width: 120 },
  { name: '单选级联选择器', key: 'cascade', width: 150 }
])

const data = shallowRef()
const checked = shallowRef([])

setTimeout(() => {
  const names = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十']
  const departments = ['tech', 'marketing', 'sales', 'hr', 'finance']
  const positions = ['engineer', 'manager', 'director', 'specialist', 'analyst']
  const genders = ['male', 'female']
  const workTypes = ['fulltime', 'parttime', 'contract']

  data.value = Array.from({ length: 8 }).map((_, i) => ({
    name: names[i] || `员工${i}`,
    age: Math.ceil(Math.random() * 40) + 20,
    gender: genders[Math.floor(Math.random() * genders.length)],
    department: departments[Math.floor(Math.random() * departments.length)],
    position: positions[Math.floor(Math.random() * positions.length)],
    email: `user${i}@company.com`,
    phone: `138${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
    salary: (Math.floor(Math.random() * 20) + 5) * 1000,
    score: Math.floor(Math.random() * 100),
    workType: workTypes[Math.floor(Math.random() * workTypes.length)],
    joinDate: new Date(
      2020 + Math.floor(Math.random() * 4),
      Math.floor(Math.random() * 12),
      Math.floor(Math.random() * 28) + 1
    )
      .toISOString()
      .split('T')[0],
    birthday: new Date(
      1980 + Math.floor(Math.random() * 30),
      Math.floor(Math.random() * 12),
      Math.floor(Math.random() * 28) + 1
    )
      .toISOString()
      .split('T')[0],
    address: `北京市朝阳区某街道${i + 1}号`,
    description: `这是员工${i + 1}的个人描述`,
    skills: ['javascript', 'vue'].slice(0, Math.floor(Math.random() * 3) + 1),
    experience: Math.floor(Math.random() * 15),
    props: { label: `标签${i}`, field: `field${i}` },
    contact: { qq: `12345678${i}`, wechat: `wx_user${i}` },
    id: Math.random()
  }))
}, 500)

const model = new FormModel({
  name: { required: true, value: () => '张三' + Math.random().toFixed(2) },
  age: { max: 120, min: 0, value: () => Math.floor(Math.random() * 40) + 20 },
  email: {
    required: true,
    value: () => `user${Math.random().toFixed(2)}@company.com`,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, '请输入有效的邮箱地址']
  },
  phone: { match: [/^1[3-9]\d{9}$/, '请输入有效的手机号码'] },
  gender: { required: true, value: 'male' },
  department: { required: true, value: 'tech' },
  position: { required: true, value: 'engineer' },
  salary: { min: 0 },
  score: { min: 0, max: 100 },
  workType: { required: true, value: 'fulltime' },
  joinDate: { required: true, value: date().format() },
  birthday: {},
  address: {},
  description: {},
  skills: {},
  experience: { min: 0, max: 20 },
  emergencyContact: { required: true, value: 'asd' },
  programmingLanguage: {},
  'props.field': {},
  'props.label': {},
  'contact.qq': {},
  'contact.wechat': {},
  cascade: {},
  code: {},
  unit: {}
})

const featureList: BatchEditFeature[] = ['update', 'copy', 'delete', 'view'] as const

const features = shallowRef(featureList)

function canCreate() {
  return data.value?.length < 10
}

const dynamicFeatures = computed(() => {
  return {
    create: canCreate,
    ...Object.fromEntries(featureList.map((i) => [i, features.value.includes(i)]))
  }
})

const items = [
  { label: '更新', value: 'update' },
  { label: '复制', value: 'copy' },
  { label: '删除', value: 'delete' },
  { label: '查看', value: 'view' }
]

const asynchronous = shallowRef(false)

const deleteMethod = async (row) => {
  await sleep(2000)
  // message.success('删除成功')
  return Promise.reject('删除失败')
}

const saveMethod = async (data, type) => {
  await sleep(2000)
  message.success('保存成功')
}

// 选项数据
const units = [
  { label: '单位1', value: '1' },
  { label: '单位2', value: '2' },
  { label: '单位3', value: '3' }
]

const genderOptions = [
  { label: '男', value: 'male' },
  { label: '女', value: 'female' }
]

const departmentOptions = [
  { label: '技术部', value: 'tech' },
  { label: '市场部', value: 'marketing' },
  { label: '销售部', value: 'sales' },
  { label: '人事部', value: 'hr' },
  { label: '财务部', value: 'finance' }
]

const positionOptions = [
  { label: '工程师', value: 'engineer' },
  { label: '经理', value: 'manager' },
  { label: '总监', value: 'director' },
  { label: '专员', value: 'specialist' },
  { label: '分析师', value: 'analyst' }
]

const skillOptions = [
  { label: 'JavaScript', value: 'javascript' },
  { label: 'Vue.js', value: 'vue' },
  { label: 'React', value: 'react' },
  { label: 'Node.js', value: 'nodejs' },
  { label: 'Python', value: 'python' },
  { label: 'Java', value: 'java' }
]

const workTypeOptions = [
  { label: '全职', value: 'fulltime' },
  { label: '兼职', value: 'parttime' },
  { label: '合同工', value: 'contract' }
]

model.onChange((f) => {})
</script>

<style lang="scss" scoped></style>
```
