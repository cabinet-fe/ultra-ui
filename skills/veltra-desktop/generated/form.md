# 表单

## form (UForm, FormModel, DynamicFormModel)

### 类型定义

```typescript
// 来源: packages/desktop/src/types/form.ts
import type { ComponentProps, DeconstructValue, ValidateRule } from '@veltra/utils'
import type { ShallowRef } from 'vue'

export interface FormModelItem<Val = any> extends ValidateRule {
  /** 模型值 */
  value?: Val
}

export type ModelData<Fields extends Record<string, FormModelItem>> = {
  [key in keyof Fields]: Fields[key]['value'] extends () => infer T ? T : Fields[key]['value']
}

export type ModelRules<Fields extends Record<string, FormModelItem>> = {
  [key in keyof Fields]: Omit<Fields[key], 'value'>
}

export interface DataSettingConfig {
  /**
   * 是否校验
   * @default true
   */
  validate?: boolean
}

export type IFormModel<
  Fields extends Record<string, FormModelItem> = Record<string, FormModelItem>
> = {
  /** 表单数据 */
  readonly data: ModelData<Fields>
  /** 字段校验规则 */
  readonly fields: Fields
  /**
   * 字段键
   */
  readonly allKeys: string[]
  /** 需要校验的key */
  formKeys: Map<number, (keyof Fields)[]>
  /** 错误 */
  readonly errors: Map<keyof Fields, string[] | undefined>
  /**
   * 字段校验
   * @param fields 字段， 如果不传入时将会使用keyFields来进行校验
   */
  validate: (fields?: keyof Fields | (keyof Fields)[]) => Promise<boolean>
  /** 重置数据 */
  resetData(fields?: keyof Fields | (keyof Fields)[]): void

  /**
   * 设置数据
   * @param formData 表单值
   * @param options 配置
   */
  setData(formData: Partial<ModelData<Fields>>, config?: DataSettingConfig): void
  /** 清除校验 */
  clearValidate(): void
  /** 监听值变更 */
  onChange(cb: (field: keyof Fields, val: any) => void): void
  /** 关闭监听值变更 */
  offChange(cb: (field: keyof Fields, val: any) => void): void
}

/** 表单组件属性 */
export interface FormProps<Model extends IFormModel = IFormModel> extends ComponentProps {
  /**
   * 自定义表单列数
   * - 默认根据尺寸断点自动排列
   */
  cols?: number
  /** 是否显示初始数据 */
  showInitialData?: boolean
  /** 表单数据模型 */
  model: Model
  /** 表单项label宽度 */
  labelWidth?: string | number
  /** 是否不显示tips */
  noTips?: boolean
  /** 是否只读 */
  readonly?: boolean
  /** 是否禁用 */
  disabled?: boolean
}

export interface _FormExposed {
  el: ShallowRef<HTMLElement | null | undefined>
}

export type FormExposed = DeconstructValue<_FormExposed>
```

### 使用示例

```vue
<!-- 来源: playgrounds/desktop/src/form/change-proxy-data.vue -->
<template>
  <u-form :model="model">
    <u-input field="a" label="a"></u-input>
    <u-input field="b" label="b"></u-input>
    <u-input field="nest.a" label="嵌套" readonly></u-input>
  </u-form>

  <u-button @click="changeModelData">变更模型数据</u-button>
</template>

<script lang="ts" setup>
import { FormModel } from '@veltra/desktop'
import { reactive } from 'vue'

const model = new FormModel({
  a: { required: true },
  b: {},
  'nest.a': { required: true, value: '1' }
})

const newModelData = reactive({
  a: '6',
  b: '3',
  nest: { a: '1' }
})

function changeModelData() {
  model.setProxyData(newModelData as any)
}
</script>

<style lang="scss" scoped></style>
```

```vue
<!-- 来源: playgrounds/desktop/src/form/full.vue -->
<template>
  <div>
    <u-checkbox v-model="disabled"> 禁用 </u-checkbox>
    <u-checkbox v-model="readonly"> 只读 </u-checkbox>
    <u-checkbox v-model="ageRules.required"> 年龄必填 </u-checkbox>
    <u-number-input style="width: 100px" v-model="num">
      <template #prefix> 单价： </template>
    </u-number-input>
  </div>

  <u-dialog title="表单" style="width: 900px; height: 500px" @closed="model.resetData()">
    <template #trigger>
      <u-button type="primary">打开弹框</u-button>
    </template>

    <template #footer>
      <u-button type="primary" @click="handleSetData">设置值</u-button>
      <u-button type="primary" @click="handleValidate">校验</u-button>
      <u-button @click="model.resetData()">重置数据</u-button>
      <u-button type="success" @click="model.clearValidate()"> 清除校验 </u-button>
    </template>

    <u-form
      :disabled="disabled"
      :readonly="readonly"
      :model="model"
      label-width="200px"
      ref="formRef"
    >
      <template #default="{ data }">
        <u-radio-group
          :items="[
            { label: '男', value: 'male' },
            { label: '女', value: 'female' }
          ]"
          label="性别"
          field="sex"
        />

        <u-input
          field="name"
          v-if="data.sex === 'female'"
          label="姓名"
          key="name"
          tips="四个字以内爱就是一段结婚登记喝点水数据库会收到回复就肯定是即所得"
        />

        <u-input
          key="nest.name"
          field="nest.name"
          tips="氨基酸的话啥叫客户当今时代是稍等和反抗精神的发货就开始的话飞机喀什的"
          label="嵌套名称"
        />
        <u-number-input field="nest.price" label="嵌套价格" currency suffix="元" />

        <u-password-input field="pwd" label="密码" />
        <u-number-input field="age" label="年龄" suffix="岁" />
        <u-number-input field="debt" currency label="借款" :step="10" suffix="元"> </u-number-input>
        <u-input :prefix="'333'" field="phone" label="手机" />
        <u-input field="email" label="邮箱" />
        <u-select field="unit" label="单位" :options="units" />
        <u-multi-select field="interest" label="兴趣" :options="interestList" />

        <u-date-picker field="date" label="日期" />
        <u-cascade field="cascade" label="单选级联选择器" :data="cascadeData" />
      </template>
    </u-form>

    <br />

    <u-form :disabled="disabled" :readonly="readonly" :model="model" label-width="200px">
      <u-checkbox field="freeze" label="是否冻结" />
      <u-switch field="freeze" label="是否冻结" active-text="是" inactive-text="否" />
      <u-textarea field="remarks" label="备注" span="full" />
      <u-slider field="slider" label="滑块" />
      <u-tree-select
        field="treeSelect"
        label="树形下拉"
        label-key="name"
        value-key="id"
        :data="treeData"
        filterable
      />
      <u-multi-tree-select
        field="treeChecked"
        label="树形多选"
        label-key="name"
        value-key="id"
        :data="treeData"
        filterable
      />

      <u-auto-complete
        field="complete1"
        label="complete1"
        :suggestions="interestList.map((item) => item.label)"
        label-key="label"
      />

      <!-- <u-auto-complete
        field="complete2"
        label="complete2"
        :suggestions="interestList.map(item => item.label)"
        label-key="label"
        multiple
      /> -->

      <!-- <u-text-editor label="内容" height="80px" field="tex" /> -->

      <u-group-input field="group" label="分组输入" v-slot="{ item }">
        <u-input v-model="item.value1" />
        <u-input v-model="item.value2" />
      </u-group-input>
    </u-form>
  </u-dialog>
</template>

<script lang="ts" setup>
import { date } from '@cat-kit/core'
import { FormModel } from '@veltra/desktop'
import { shallowReactive, shallowRef } from 'vue'

import CustomCard from '../card/custom-card.vue'
import { CascadeData, TreeData } from './data'

const readonly = shallowRef(false)
const disabled = shallowRef(false)
const ageRules = shallowReactive({ required: true, value: 20 })

const num = shallowRef(1099)

const model = new FormModel({
  age: ageRules,
  'nest.name': { required: true, value: 'aa' },
  'nest.price': {
    required: true,

    value: () => num.value
  },
  phone: {
    validator(value) {
      if (!value) return ''
      if (/^1[1-9]{10}$/.test(value)) return ''
      return '你得输入一个手机号'
    }
  },
  abc: { required: true },
  freeze: {},
  sex: { value: 'female', required: true },
  pwd: { value: '', required: true },
  debt: { min: 10, value: 66666 },
  email: {
    match: [/^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*/, '这个时候你得输入一个邮箱']
  },
  unit: { required: true },
  interest: { required: true },
  remarks: { required: true },
  slider: {},
  date: { required: true, value: date().format() },
  guide: {
    value: [{ attributes: { bold: true }, insert: '22eee' }],
    required: true
  },
  treeChecked: { required: true, value: () => ['4-11'] },
  treeSelect: { required: true, value: () => 11 },
  complete1: { value: 'test', required: true },
  complete2: { value: () => ['张三', '李四'], required: true },
  group: { required: true },
  cascade: { required: true },
  tex: { required: true }
})

const units = [
  { label: '单位1', value: '1' },
  { label: '单位2', value: '2' },
  { label: '单位3', value: '3' }
]

const interestList = [
  { label: '电影', value: '1' },
  { label: '健身', value: '2' },
  { label: '读书', value: '3' },
  { label: '游戏', value: '4' },
  { label: '科技', value: '5' },
  { label: '音乐', value: '6' }
]

function handleSetData() {
  model.setData({
    name: null,
    unit: null,
    interest: ['1', '2', '3']
  })
}

const treeData = shallowRef<any[]>([])

setTimeout(() => {
  treeData.value = TreeData
}, 1000)

const cascadeData = shallowRef<any[]>([])

setTimeout(() => {
  cascadeData.value = CascadeData
}, 1000)

async function handleValidate() {
  await model.validate()
}
</script>
```

```vue
<!-- 来源: playgrounds/desktop/src/form/index.vue -->
<template>
  <div>
    <CustomCard title="设置新的模型数据"> <ChangeProxyData /> </CustomCard>
    <CustomCard title="完整表单"> <FullForm /> </CustomCard>
    <CustomCard title="可查看初始数据"> <InitData /> </CustomCard>
  </div>
</template>

<script lang="ts" setup>
import CustomCard from '../card/custom-card.vue'
import ChangeProxyData from './change-proxy-data.vue'
import FullForm from './full.vue'
import InitData from './init-data.vue'
</script>

<style scoped lang="scss">
.list {
  border: 1px solid #eee;
  margin-top: 100px;
  &-item {
    height: 32px;
    line-height: 32px;
    padding: 0 8px;
    border-bottom: 1px solid #eee;
    cursor: default;
    background-color: #fff;
    user-select: none;
    transition: transform 0.25s;

    &:last-child {
      border: none;
    }
  }
}
</style>
```

```vue
<!-- 来源: playgrounds/desktop/src/form/init-data.vue -->
<template>
  <u-form :model="model" show-initial-data>
    <u-input label="姓名" field="name" readonly />
    <u-select label="年级" field="grade" :options="gradeList" />
    <u-checkbox label="是否在校" field="isInSchool" />
  </u-form>
</template>

<script lang="ts" setup>
import { FormModel } from '@veltra/desktop'

const model = new FormModel({
  name: {},
  grade: {},
  isInSchool: { value: false }
})

const gradeList = [
  { label: '一年级', value: '1' },
  { label: '二年级', value: '2' },
  { label: '三年级', value: '3' },
  { label: '四年级', value: '4' },
  { label: '五年级', value: '5' },
  { label: '六年级', value: '6' }
]

setTimeout(() => {
  // 变更前数据
  const data = {
    name: '张三',
    grade: '1',
    isInSchool: true
  }

  // 当前数据
  const newData = {
    name: '李四',
    grade: '2',
    isInSchool: false
  }

  model.setInitialData(data).setData(newData)
}, 1000)
</script>
```

## form-item (UFormItem)

### 类型定义

```typescript
// 来源: packages/desktop/src/types/form-item.ts
import type { FormComponentProps } from '@veltra/utils'

/** 组件项组件属性 */
export interface FormItemProps extends FormComponentProps {
  /** 标签宽度 */
  labelWidth?: string | number
}

/** 组件项组件定义的事件 */
export interface FormItemEmits {}

/** 组件项组件暴露的属性和方法 */
export interface FormItemExposed {}
```

### 使用示例

暂无示例

## input (UInput)

### 类型定义

```typescript
// 来源: packages/desktop/src/types/input.ts
import type { DeconstructValue, FormComponentProps } from '@veltra/utils'
import type { ShallowRef } from 'vue'

/** 输入框组件属性 */
export interface InputProps extends FormComponentProps {
  /** modelValue */
  modelValue?: string
  /** 占位符 */
  placeholder?: string
  /** 前缀 */
  prefix?: string
  /** 后缀 */
  suffix?: string
  /** 是否可清除 */
  clearable?: boolean
  /** 原生只读 */
  nativeReadonly?: boolean
  /**
   * 模式
   * @description 如果指定请保证有一个符合模式的默认值
   */
  pattern?: RegExp
}

export interface InputEmits {
  /** 输入时持续更新 */
  (e: 'update:modelValue', value: string): void
  /** 在输入框失焦时触发更新 */
  (e: 'change', value: string): void
  /** 后缀点击事件 */
  (e: 'suffix:click', value?: string): void
  /** 前缀点击事件 */
  (e: 'prefix:click', value?: string): void
  /** 聚焦事件 */
  (e: 'focus', value?: string): void
  /** 清除事件 */
  (e: 'clear'): void
  /** 失焦事件 */
  (e: 'blur', value?: string): void
  /** 原生输入事件 */
  (e: 'native:input', ev: Event): void
}

export interface _InputExposed {
  el: ShallowRef<HTMLInputElement | undefined>
}

export type InputExposed = DeconstructValue<_InputExposed>
```

### 使用示例

```vue
<!-- 来源: playgrounds/desktop/src/input/index.vue -->
<template>
  <div>
    <div>普通: <u-input v-model="value" /></div>
    <div>
      前缀和后缀以及可清空:
      <u-input v-model="value" @suffix:click="console.log" prefix="前缀" clearable>
        <template #suffix>
          <u-icon :size="14"><Search /></u-icon>
        </template>
      </u-input>
    </div>
    <div>
      <u-input v-model="value" :pattern="/^abc/"></u-input>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { Search } from '@veltra/icons/normal'
import { shallowRef } from 'vue'

import CustomCard from '../card/custom-card.vue'

const value = shallowRef('abc')

const number = shallowRef(0)

setTimeout(() => {
  number.value = 10000
}, 200)
</script>
```

## textarea (UTextarea)

### 类型定义

```typescript
// 来源: packages/desktop/src/types/textarea.ts
import type { DeconstructValue, FormComponentProps } from '@veltra/utils'

/** textarea组件属性 */
export interface TextareaProps extends FormComponentProps {
  /**
   * 文本域的值
   */
  modelValue?: string
  /**
   * 文本域的高度
   */
  height?: string
  /**
   * 文本域的占位符
   */
  placeholder?: string
  /**
   * 文本域是否禁用
   */
  disabled?: boolean
  /**
   * 文本域是否只读
   */
  readonly?: boolean

  /**
   * 是否能被缩放
   */
  resize?: boolean
  /**
   * 文本域的行数
   */
  rows?: number
  /**
   * 文本域的列数
   */
  cols?: number
  /**
   * 文本域的最大字数
   */
  maxlength?: number
  /**
   * 是否显示字符数
   */
  showCount?: boolean
  /**
   * 清空
   */
  clearable?: boolean

  /** 原生只读 */
  nativeReadonly?: boolean

  /**是否自适应大小 */
  autosize?: boolean
}

/** textarea组件定义的事件 */
export interface TextareaEmits {
  /**modelValue值改变时触发 */
  (e: 'update:modelValue', value: string): void
  /**当 modelValue 改变时，并且文本框失去焦点或用户按Enter时触发 */
  (e: 'change', value: string): void
  /**文本框获取焦点时触发 */
  (e: 'focus'): void
  /**文本框失去焦点时触发 */
  (e: 'blur'): void
  /**清空按钮时触发 */
  (e: 'clear'): void
}

/** textarea组件暴露的属性和方法(组件内部使用) */
export interface _TextareaExposed {}

/** textarea组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type TextareaExposed = DeconstructValue<_TextareaExposed>
```

### 使用示例

```vue
<!-- 来源: playgrounds/desktop/src/textarea/index.vue -->
<template>
  <div>
    <u-textarea v-model="textareaValue1" :rows="6" :autosize="true" />
    <u-textarea v-model="textareaValue2" disabled />
    <u-textarea v-model="textareaValue3" readonly />
    <u-textarea v-model="textareaValue4" :resize="false" />
    <u-textarea v-model="textareaValue5" :maxlength="maxlength" show-count />
    <u-textarea v-model="textareaValue6" clearable :maxlength="maxlength" show-count />
    <u-button @click="btn()">获取</u-button>
    <u-button @click="maxlength += 10">改变maxlength</u-button>
    {{ maxlength }}
  </div>
</template>

<script setup lang="ts">
import { shallowRef } from 'vue'
import { ref } from 'vue'

let textareaValue1 = ref('自适应文本域')
let textareaValue2 = ref('回显')
let textareaValue3 = ref('只读')
let textareaValue4 = ref('禁止拖拽')
let textareaValue5 = ref('输入长度限制')
let textareaValue6 = ref('可清空可清空可清空可清空可清空可清空可清空可清空可清空可清空')
let maxlength = shallowRef(100)
const btn = () => {
  let str = `
  textareaValue1: ${textareaValue1.value}
  textareaValue2: ${textareaValue2.value}
  textareaValue3: ${textareaValue3.value}
  textareaValue4: ${textareaValue4.value}
  textareaValue5: ${textareaValue5.value}
  textareaValue6: ${textareaValue6.value}
  `
  alert(str)
}
</script>

<style lang="" scoped></style>
```

## password-input (UPasswordInput)

### 类型定义

```typescript
// 来源: packages/desktop/src/types/password-input.ts
import type { DeconstructValue } from '@veltra/utils'

import type { InputProps } from './input'

/** 密码输入组件属性 */
export interface PasswordInputProps extends InputProps {
  modelValue?: string
}

/** 密码输入组件定义的事件 */
export interface PasswordInputEmits {
  (e: 'update:modelValue', value: string): void
}

/** 密码输入组件暴露的属性和方法(组件内部使用) */
export interface _PasswordInputExposed {}

/** 密码输入组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type PasswordInputExposed = DeconstructValue<_PasswordInputExposed>
```

### 使用示例

暂无示例

## number-input (UNumberInput)

### 类型定义

```typescript
// 来源: packages/desktop/src/types/number-input.ts
import type { InputProps } from './input'

/** 数字输入组件属性 */
export interface NumberInputProps extends Omit<InputProps, 'modelValue'> {
  modelValue?: number
  /** 是否为货币模式 */
  currency?: boolean
  /** 精度 */
  precision?: number
  /** 最小精度 */
  minPrecision?: number
  /** 最大精度 */
  maxPrecision?: number
  /** 步进, 指定为数字时开启累加按钮并将该值作为累加的步长, 为true则步长默认为1 */
  step?: boolean | number
  /** 最大值 */
  max?: number
  /** 最小值 */
  min?: number
  /** 倍数 */
  multiple?: number
}

/** 数字输入组件定义的事件 */
export interface NumberInputEmits {
  (event: 'update:modelValue', value?: number): void
  (event: 'change', value?: number): void
}

/** 数字输入组件暴露的属性和方法 */
export interface NumberInputExposed {}
```

### 使用示例

```vue
<!-- 来源: playgrounds/desktop/src/number-input/index.vue -->
<template>
  <div>
    <div>值: {{ number }}</div>
    <u-checkbox v-model="currency">货币</u-checkbox>
    <div>
      普通
      <u-number-input disabled v-model="number" :currency="currency" :precision="2" />
    </div>

    <div>
      货币
      <u-number-input v-model="number" :currency="currency" :max-precision="2" />
    </div>

    <div>
      步进
      <u-number-input v-model="number" :currency="currency" :step="100.89" clearable />
    </div>

    <div>
      最小值0, 最大值1000
      <u-number-input v-model="number" :currency="currency" :step="100" :min="0" :max="1000" />
    </div>

    <div>
      倍数:
      <u-number-input v-model="number2" :multiple="10000" format="currency" suffix="万元" />

      {{ number2 }}
    </div>
  </div>
</template>

<script lang="ts" setup>
import { shallowRef } from 'vue'

const number = shallowRef(2.999)
const currency = shallowRef(false)

const number2 = shallowRef(10000)
</script>
```

## number-range-input (UNumberRangeInput)

### 类型定义

```typescript
// 来源: packages/desktop/src/types/number-range-input.ts
import type { NumberInputProps } from './number-input'

/** 数字范围 [起始, 结束] */
export type NumberRangeTuple = [number | undefined, number | undefined]

/** 数字范围输入组件属性 */
export interface NumberRangeInputProps extends Omit<
  NumberInputProps,
  'modelValue' | 'placeholder'
> {
  modelValue?: NumberRangeTuple
  /** 与 `modelValue[0]` 同步，可用 `v-model:start` */
  start?: number
  /** 与 `modelValue[1]` 同步，可用 `v-model:end` */
  end?: number
  /** 左侧占位 */
  startPlaceholder?: string
  /** 右侧占位 */
  endPlaceholder?: string
  /** 中间分隔文案 */
  separator?: string
}

/** 数字范围输入组件事件 */
export interface NumberRangeInputEmits {
  (event: 'update:modelValue', value: NumberRangeTuple): void
  (event: 'update:start', value: number | undefined): void
  (event: 'update:end', value: number | undefined): void
  (event: 'change', value: NumberRangeTuple): void
}

/** 数字范围输入组件暴露 */
export interface NumberRangeInputExposed {}
```

### 使用示例

```vue
<!-- 来源: playgrounds/desktop/src/number-range-input/index.vue -->
<template>
  <div class="sample">
    <section>
      <h3>基础</h3>
      <p>v-model: {{ range }}</p>
      <u-number-range-input v-model="range" />
    </section>

    <section>
      <h3>min / max / step</h3>
      <u-number-range-input
        v-model="bounded"
        :min="0"
        :max="100"
        :step="5"
        start-placeholder="最小"
        end-placeholder="最大"
        separator="至"
      />
      <p>{{ bounded }}</p>
    </section>

    <section>
      <h3>禁用</h3>
      <u-number-range-input v-model="range" disabled />
    </section>

    <section>
      <h3>只读</h3>
      <u-number-range-input v-model="bounded" readonly />
    </section>

    <section>
      <h3>v-model:start / v-model:end</h3>
      <p>start: {{ splitStart }}，end: {{ splitEnd }}</p>
      <u-number-range-input
        v-model:start="splitStart"
        v-model:end="splitEnd"
        :min="0"
        :max="50"
        separator="至"
      />
    </section>
  </div>
</template>

<script lang="ts" setup>
import type { NumberRangeTuple } from '@veltra/desktop'
import { ref } from 'vue'

const range = ref<NumberRangeTuple>([undefined, undefined])
const bounded = ref<NumberRangeTuple>([10, 80])
const splitStart = ref<number | undefined>(5)
const splitEnd = ref<number | undefined>(20)
</script>

<style scoped>
.sample {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

section h3 {
  margin: 0 0 8px;
  font-size: 14px;
}

section p {
  margin: 8px 0 0;
  font-size: 12px;
  color: var(--u-text-color-secondary, #888);
}
</style>
```

## select (USelect)

### 类型定义

```typescript
// 来源: packages/desktop/src/types/select.ts
import type { DeconstructValue, FormComponentProps } from '@veltra/utils'
import type { CSSProperties, ShallowRef } from 'vue'

/** 选择器组件属性 */
export interface SelectProps extends FormComponentProps {
  /** 绑定值 */
  modelValue?: any
  /** 文本内容 */
  text?: string
  /**
   * 列表选项
   * @description 如果传入一个函数，那么filterable会被强制启用
   */
  options?:
    | Record<string, any>[]
    | ((qs: string) => Promise<Record<string, any>[]> | Record<string, any>[])
  /** 值字段 */
  valueKey?: string
  /** 标签字段 */
  labelKey?: string
  /** 是否可清除 */
  clearable?: boolean
  /** 占位符 */
  placeholder?: string
  /** 是否启用搜索功能 */
  filterable?: boolean
  /** 内容容器样式 */
  contentStyle?: CSSProperties | string
  /** 内容容器类名 */
  contentClass?: unknown
  /** 弹框最小宽度 */
  minWidth?: string
  /**
   * 弹框宽度
   * @default 跟随触发元素的宽度
   */
  width?: string
  /** 是否允许创建新的选项 */
  creatable?: boolean

  /**
   * 配置网格布局
   *
   * - 开启网格布局将会导致虚拟滚动失效，因此网格布局不适合大量数据
   * @example
   * ```ts
   * const grid = true
   * // 或者
   * const grid = {
   *   cols: 12,
   *   gap: 10
   * }
   */
  grid?: { cols: number; gap?: number }
}

export interface SelectEmits {
  /** 触发更新label事件 */
  (e: 'update:label', label?: string): void
  (e: 'update:modelValue', modelValue?: any): void
  (e: 'change', option?: Record<string, any>): void
}

export interface _SelectExposed {
  /** 信息文本 */
  infoText: ShallowRef<string | number>
}

export type SelectExposed = DeconstructValue<_SelectExposed>
```

### 使用示例

```vue
<!-- 来源: playgrounds/desktop/src/select/index.vue -->
<template>
  <div>
    <CustomCard width="400px" title="使用">
      <div style="margin-bottom: 8px">
        <div style="font-size: 12px; color: #666; margin-bottom: 4px">
          键盘导航: ↑↓ 选择选项，Enter 确认，Esc 关闭
        </div>
        <u-checkbox v-model="filterable">过滤</u-checkbox>
        <u-checkbox v-model="creatable">允许创建</u-checkbox>
      </div>
      <u-select v-model="selected" :filterable :creatable :options="options" />
    </CustomCard>

    <!-- <CustomCard width="400px" title="函数选项">
      <div>自动启用filter属性</div>

      <u-select v-model="selected" :options="optionsGetter" />
    </CustomCard>

    <CustomCard width="400px" title="网格布局">
      <u-select v-model="selected" :options="options" filterable value-key="value" :grid="{ cols: 4, gap: 10 }"
        v-slot="{ option }">
        <div style="height: 80px; text-align: center">
          <div>
            <u-icon :size="30">
              <Monitor />
            </u-icon>
          </div>
          {{ option?.label }}
        </div>
      </u-select>
    </CustomCard>

    <u-form :model="model">
      <u-input label="选项" field="options"></u-input>
      <u-select label="选择" field="select" value-key="value" :clearable="false" :options="options1" />
    </u-form> -->
  </div>
</template>

<script lang="ts" setup>
import { sleep } from '@cat-kit/core'
import { FormModel } from '@veltra/desktop'
import { Monitor } from '@veltra/icons/normal'
import { shallowRef, watchEffect } from 'vue'

import CustomCard from '../card/custom-card.vue'

const options = shallowRef<any[]>([])

const count = shallowRef(80)

watchEffect(() => {
  options.value = Array.from({ length: count.value }).map((_, i) => ({
    label: `选项${i}`,
    value: i + ''
  }))
})

const model = new FormModel({
  select: { value: 12 },
  options: {
    value: '40,100',
    validator(value, data) {
      if (value.includes('，')) {
        return '请使用英文标点分隔'
      }
      return ''
    }
  }
})

const options1 = shallowRef(
  model.data.options
    ?.split(',')
    .map((i) => {
      const n = +i
      return { label: i, value: n }
    })
    .filter((i) => !isNaN(i.value))
)

model.onChange((field, val) => {
  field === 'select' && console.log(field, val)
})

setTimeout(() => {
  model.setData({ options: '10', select: 10 })
  options1.value = [{ value: 10, label: '10' }]
}, 500)

const selected = shallowRef()

setTimeout(() => {
  selected.value = '1'
})

const filterable = shallowRef(true)
const creatable = shallowRef(true)

const optionsGetter = async (qs: string) => {
  if (!qs) return []
  await sleep(200)
  return options.value.filter((o) => o.label.includes(qs))
}
</script>
```

## multi-select (UMultiSelect)

### 类型定义

```typescript
// 来源: packages/desktop/src/types/multi-select.ts
import type { DeconstructValue, FormComponentProps } from '@veltra/utils'
import type { CSSProperties } from 'vue'

/** multi-select组件属性 */
export interface MultiSelectProps extends FormComponentProps {
  /** 绑定值 */
  modelValue?: Array<any>
  /** 列表选项 */
  options?:
    | Record<string, any>[]
    | ((qs: string) => Promise<Record<string, any>[]> | Record<string, any>[])
  /** 值字段 */
  valueKey?: string
  /** 标签字段 */
  labelKey?: string
  /** 是否可清除 */
  clearable?: boolean
  /** 占位符 */
  placeholder?: string
  /** 是否启用搜索功能 */
  filterable?: boolean
  /** 最大展示数量 */
  visibilityLimit?: number
  /** 最大可选数量 */
  max?: number
  /** 内容容器样式 */
  contentStyle?: CSSProperties | string
  /** 内容容器类名 */
  contentClass?: unknown
  /** 弹框最小宽度 */
  minWidth?: string
  /**
   * 弹框宽度
   * @default '220px'
   */
  width?: string
  /** 是否允许创建新选项 */
  creatable?: boolean
}

/** multi-select组件定义的事件 */
export interface MultiSelectEmits {
  (e: 'update:modelValue', value: Array<any>): void
  (e: 'change', options: Record<string, any>[]): void
}

/** multi-select组件暴露的属性和方法(组件内部使用) */
export interface _MultiSelectExposed {}

/** multi-select组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type MultiSelectExposed = DeconstructValue<_MultiSelectExposed>
```

### 使用示例

```vue
<!-- 来源: playgrounds/desktop/src/multi-select/index.vue -->
<template>
  <div>
    <CustomCard title="使用">
      <u-multi-select
        :max="4"
        :visibility-limit="20"
        filterable
        creatable
        v-model="checked"
        :options="options"
        @update:model-value="console.log"
      />

      {{ checked }}
    </CustomCard>
  </div>
</template>

<script lang="ts" setup>
import { shallowRef } from 'vue'

import CustomCard from '../card/custom-card.vue'

const options = Array.from({ length: 60 }).map((_, i) => ({ label: `选项${i}`, value: i }))

const checked = shallowRef([1, 2, 3])

setTimeout(() => {
  checked.value = [4, 5, 6]
}, 2000)
</script>

<style lang="scss" scoped></style>
```

## cascade (UCascade)

### 类型定义

```typescript
// 来源: packages/desktop/src/types/cascade.ts
import type { ITreeNode } from '@cat-kit/core'
import type { DeconstructValue, FormComponentProps } from '@veltra/utils'

export interface CascadeNode extends ITreeNode<Record<string, any>, CascadeNode> {
  children?: CascadeNode[]
  visible: boolean
  value: string
  label: string
}

/** 级联选择器组件属性 */
export interface CascadeProps extends FormComponentProps {
  /**
   * 分隔符
   * @default '/'
   */
  separator?: string
  /** 数据值 */
  modelValue?: string[] | string
  /** 级联数据项的标签字段 */
  labelKey?: string
  /** 级联数据项的值字段 */
  valueKey?: string
  /** 占位符 */
  placeholder?: string
  /** 是否可清除 */
  clearable?: boolean
  /** 子级字段 */
  childrenKey?: string
  /** 严格模式 */
  strict?: boolean
  /**
   * 数据项
   */
  data?: Record<string, any>[]

  /**
   * 禁用项
   */
  disabledNode?: (item: Record<string, any>) => boolean
  /**
   * 多选
   */
  multiple?: boolean
  /**
   * 搜索
   */
  filterable?: boolean
  visibilityLimit?: number
}

export interface PanelItem {
  key: number
  nodes: CascadeNode[]
}

/** 级联选择器组件定义的事件 */
export interface CascadeEmits {
  (e: 'update:modelValue', value?: string | string[]): void
  (e: 'change', value: string[], label: string[], data: Record<string, any>[]): void
  (e: 'change', value?: string, label?: string, item?: Record<string, any>): void
  (e: 'clear'): void
}

/** 级联选择器组件暴露的属性和方法(组件内部使用) */
export interface _CascadeExposed {}

/** 级联选择器组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type CascadeExposed = DeconstructValue<_CascadeExposed>
```

### 使用示例

```vue
<!-- 来源: playgrounds/desktop/src/cascade/index.vue -->
<template>
  <div>
    <CustomCard title="完全演示">
      {{ propsModel.data }}
      <u-form style="display: flex; gap: 12px" :model="propsModel">
        <u-checkbox label="多选" field="multiple" @change="value = undefined" />
        <u-checkbox label="严格模式" field="strict" />
        <u-checkbox label="过滤" field="filterable" />
        <u-checkbox label="只读" field="readonly" />
        <u-checkbox label="禁用" field="disabled" />
        <u-input
          label="分隔符"
          field="separator"
          style="width: 200px"
          @native:input="value = undefined"
        />
      </u-form>

      <u-cascade
        v-model="value"
        v-bind="propsModel.data"
        :data="data"
        label-key="name"
        value-key="code"
      />

      <div>值：{{ value }}</div>

      <u-button type="primary" @click="handleClick">获取默认值</u-button>
    </CustomCard>
  </div>
</template>
<script lang="ts" setup>
import { FormModel } from '@veltra/desktop'
import { shallowRef } from 'vue'

import CustomCard from '../card/custom-card.vue'
import { area } from './area.js'

const value = shallowRef()

const propsModel = new FormModel({
  multiple: { value: false },
  strict: { value: false },
  filterable: { value: false },
  separator: { value: '/' },
  readonly: { value: false },
  disabled: { value: false }
})

const data = shallowRef<any[]>([])

const disabledNode = (data) => {
  return data.code % 2 === 0
}

// 模拟回显
setTimeout(() => {}, 300)

setTimeout(() => {
  data.value = area
}, 500)

function handleClick() {
  if (propsModel.data.multiple) {
    value.value = [
      '11',
      '1101',
      '110101',
      '110102',
      '110105',
      '110106',
      '110107',
      '110108',
      '110109',
      '110111',
      '110112',
      '110113',
      '110114',
      '110115',
      '110116',
      '110117',
      '110118',
      '110119',
      '110120',
      '110156',
      '130203',
      '130204',
      '120102',
      '120103',
      '120104',
      '120105'
    ]
  } else {
    value.value = '22'
  }
}
</script>
```

## multi-tree-select (UMultiTreeSelect)

### 类型定义

```typescript
// 来源: packages/desktop/src/types/multi-tree-select.ts
import type { DeconstructValue, FormComponentProps } from '@veltra/utils'
import type { CSSProperties } from 'vue'

import type { TreeProps } from './tree'
/** 树形多选组件组件属性 */
export interface MultiTreeSelectProps
  extends FormComponentProps, Omit<TreeProps, 'selected' | 'checked' | 'selectable' | 'checkable'> {
  modelValue?: (string | number)[]

  /**自定义占位文字 */
  placeholder?: string
  /**
   * 是否可清空
   */
  clearable?: boolean
  /**
   * 是否可搜索
   */
  filterable?: boolean
  /**
   * 可见的节点数量限制 默认3
   */
  visibilityLimit?: number

  /**
   * 弹框最小宽度
   * @default '280px'
   */
  minWidth?: string
  /**
   * 弹框宽度
   * @default 跟随触发元素的宽度
   */
  width?: string
  /** 内容容器样式 */
  contentStyle?: CSSProperties | string
  /** 内容容器类名 */
  contentClass?: unknown
}

/** 树形多选组件组件定义的事件 */
export interface MultiTreeSelectEmits {
  (e: 'clear'): void
  (e: 'update:modelValue', value: any[]): void
  (e: 'change', checked: Record<string, any>[]): void
}

/** 树形多选组件组件暴露的属性和方法(组件内部使用) */
export interface _MultiTreeSelectExposed {}

/** 树形多选组件组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type MultiTreeSelectExposed = DeconstructValue<_MultiTreeSelectExposed>
```

### 使用示例

```vue
<!-- 来源: playgrounds/desktop/src/multi-tree-select/index.vue -->
<template>
  <div>
    <CustomCard title="菜单选择器多选、禁用某项、过滤" style="width: 200px">
      多选{{ treeCheckable }}
      <u-multi-tree-select
        v-model="treeCheckable"
        :data="data"
        label-key="name"
        value-key="id"
        children-key="children"
        checkable
        :disabledNode="disabledNode"
        filterable
        @change="handleChange"
      ></u-multi-tree-select>
    </CustomCard>
  </div>
</template>

<script setup lang="ts">
import { shallowRef } from 'vue'

import CustomCard from '../card/custom-card.vue'
import { TreeData } from '../form/data'

const treeCheckable = shallowRef(['8', '9'])

const disabledNode = (data) => {
  return data.id % 4 === 0
}
const data = shallowRef<any[]>([])

setTimeout(() => {
  data.value = TreeData
}, 2000)

const handleChange = (value) => {}
</script>
```

## tree-select (UTreeSelect)

### 类型定义

```typescript
// 来源: packages/desktop/src/types/tree-select.ts
import type { FormComponentProps, DeconstructValue } from '@veltra/utils'
import type { CSSProperties } from 'vue'

import type { TreeProps } from './tree'

/** 树形选择器组件属性 */
export interface TreeSelectProps
  extends FormComponentProps, Omit<TreeProps, 'selected' | 'checked' | 'selectable' | 'checkable'> {
  modelValue?: string | number

  /** 自定义占位文字 */
  placeholder?: string
  /**
   * 是否可清空
   */
  clearable?: boolean
  /**
   * 是否可搜索
   */
  filterable?: boolean
  /**
   * 最小宽度
   * @default '280px'
   */
  minWidth?: string
  /**
   * 弹框宽度
   * @default 跟随触发元素的宽度
   */
  width?: string

  /** 显示文本 */
  text?: string

  /** 内容容器样式 */
  contentStyle?: CSSProperties | string

  /** 内容容器类名 */
  contentClass?: unknown
}

/** 树形选择器组件定义的事件 */
export interface TreeSelectEmits {
  (e: 'clear'): void
  (e: 'change', value?: string | number, selectedData?: Record<string, any>): void
  (e: 'update:text', text?: string): void
}

/** 树形选择器组件暴露的属性和方法(组件内部使用) */
export interface _TreeSelectExposed {}

/** 树形选择器组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type TreeSelectExposed = DeconstructValue<_TreeSelectExposed>
```

### 使用示例

```vue
<!-- 来源: playgrounds/desktop/src/tree-select/index.vue -->
<template>
  <div>
    <CustomCard title="菜单选择器单选、禁用某项、过滤、选择完选项值自动关闭弹窗">
      {{ { treeSelect } }}
      <u-tree-select
        v-model="treeSelect"
        :data="data"
        label-key="name"
        value-key="id"
        expand-all
        :disabledNode="disabledNode"
        filterable
        @change="handleChange"
        v-slot="{ data }"
      >
        {{ data.name }} {{ data.id }}
      </u-tree-select>

      <u-card-action>
        <u-button @click="handleChangeSelect">改值</u-button>
      </u-card-action>
    </CustomCard>

    <CustomCard title="菜单选择器自定义回显内容">
      <u-tree-select
        v-model="treeSelect"
        style="width: 240px"
        :data="data"
        label-key="name"
        value-key="id"
        expand-all
        :disabledNode="disabledNode"
        filterable
        closeOnSelect
        min-width="400px"
        @change="handleChange"
      ></u-tree-select>

      <u-card-action>
        <u-button @click="handleChangeSelect">改值</u-button>
      </u-card-action>
    </CustomCard>
  </div>
</template>

<script setup lang="ts">
import { shallowRef } from 'vue'

import CustomCard from '../card/custom-card.vue'

const treeSelect = shallowRef()

const disabledNode = (data) => {
  return data.id % 4 === 0
}

const data = shallowRef<any[]>([
  { name: '烤冷面', id: 1 },
  {
    name: '手抓饼',
    id: 2,
    children: [
      {
        name: '鱼香肉丝鱼香肉丝鱼香肉丝鱼香肉丝鱼香肉丝鱼香肉丝鱼香肉丝鱼香肉丝鱼香肉丝鱼香肉丝鱼香肉丝鱼香肉丝鱼香肉丝鱼香肉丝鱼香肉丝鱼香肉丝鱼香肉丝鱼香肉丝',
        id: 3,
        children: [
          {
            name: '烤苞米',
            id: 4,
            children: [
              { name: '苞米例', id: 5 },
              { name: '吃', id: 6 },
              { name: 'h', id: 7 }
            ]
          }
        ]
      },
      {
        name: 'fggg',
        id: 8,
        children: [
          { name: '苞米例2', id: 9 },
          { name: '吃2', id: 10 },
          { name: 'h2', id: 11 }
        ]
      }
    ]
  },
  { name: '烤冷面12', id: 12 },
  { name: '烤冷面13', id: 13 },
  { name: '烤冷面14', id: 14 }
])

setTimeout(() => {
  data.value = Array.from({ length: 3000 }, (_, index) => ({
    name: `烤冷面${index}`,
    id: index
  }))
}, 1000)

const handleChange = (val, selected) => {
  console.log(val, selected)
}

function handleChangeSelect() {
  treeSelect.value = 2
}
</script>
```

## auto-complete (UAutoComplete)

### 类型定义

```typescript
// 来源: packages/desktop/src/types/auto-complete.ts
import type { FormComponentProps, DeconstructValue } from '@veltra/utils'

/** 自动补全组件组件属性 */
export interface AutoCompleteProps extends FormComponentProps {
  modelValue?: string
  /** 占位符 */
  placeholder?: string
  /** 建议 */
  suggestions?: string[] | (() => Promise<string[]> | string[])
  /** 是否可清空 */
  clearable?: boolean
}

/** 自动补全组件组件定义的事件 */
export interface AutoCompleteEmits {
  (e: 'update:modelValue', value: string): void
  (e: 'select', value: string): void
}

/** 自动补全组件组件暴露的属性和方法(组件内部使用) */
export interface _AutoCompleteExposed {}

/** 自动补全组件组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type AutoCompleteExposed = DeconstructValue<_AutoCompleteExposed>
```

### 使用示例

```vue
<!-- 来源: playgrounds/desktop/src/auto-complete/index.vue -->
<template>
  <div>
    <CustomCard title="基础使用">
      <u-auto-complete :suggestions="suggestions" v-model="value" />
    </CustomCard>

    <CustomCard title="函数动态获取">
      <u-auto-complete :suggestions="suggestionsGetter" v-model="value" />
    </CustomCard>

    <div>
      {{ value }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { shallowRef } from 'vue'

import CustomCard from '../card/custom-card.vue'

const suggestions = Array.from({ length: 100 }, (v, i) => {
  return `label${i + 1}`
})

const value = shallowRef('')

const suggestionsGetter = (modelValue?: string) => {
  if (!modelValue) return suggestions

  return suggestions.filter((s) => s === modelValue)
}
</script>
```

## checkbox (UCheckbox, UCheckboxButton)

### 类型定义

```typescript
// 来源: packages/desktop/src/types/checkbox.ts
import type { ColorType, FormComponentProps } from '@veltra/utils'

/** 复选框组件属性 */
export interface CheckboxProps extends FormComponentProps {
  /** 部分选中 */
  indeterminate?: boolean
  /** 是否选中  */
  modelValue?: boolean
}

export interface CheckboxButtonProps extends FormComponentProps {
  /** 是否选中  */
  modelValue?: boolean
  /** 是否圆角 */
  round?: boolean
  /** 类型 */
  type?: ColorType
}

export interface CheckboxEmits {
  (name: 'update:modelValue', checked: boolean): void
  (name: 'change', checked: boolean, e: MouseEvent): void
}

export interface CheckboxButtonEmits {
  (name: 'update:modelValue', checked: boolean): void
  (name: 'change', checked: boolean): void
}

/** 复选框暴露的属性和方法 */
export interface CheckboxExposed {}
```

### 使用示例

```vue
<!-- 来源: playgrounds/desktop/src/checkbox/index.vue -->
<template>
  <div>
    <CustomCard title="单个">
      <u-checkbox v-model="check"> 是否 </u-checkbox>
    </CustomCard>

    <CustomCard title="复选按钮">
      <u-checkbox-button v-model="check" type="success"> 深度思考(R1) </u-checkbox-button>
    </CustomCard>

    <CustomCard title="中间状态">
      <u-checkbox v-model="check" indeterminate> 是否 </u-checkbox>
    </CustomCard>

    <CustomCard title="复选框组">
      <div>多个 {{ checked }}</div>
      <u-checkbox-group :items="data" v-model="checked" value-key="id" label-key="name" />
    </CustomCard>
    <CustomCard title="复选框组block显示">
      <u-checkbox-group :items="data" block v-model="checked" value-key="id" label-key="name" />
    </CustomCard>

    <CustomCard title="禁用">
      <u-checkbox-group :items="data" v-model="checked" value-key="id" label-key="name" disabled />
    </CustomCard>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

import CustomCard from '../card/custom-card.vue'

const check = ref(false)

const data = [
  { name: '张三', id: 1 },
  { name: '李四', id: 2 }
]

const checked = ref<number[]>([])
</script>
```

## checkbox-group (UCheckboxGroup)

### 类型定义

```typescript
// 来源: packages/desktop/src/types/checkbox-group.ts
import type { FormComponentProps } from '@veltra/utils'

/** 复选框组, 用来选择一组数据组件属性 */
export interface CheckboxGroupProps extends FormComponentProps {
  /** 值 */
  modelValue?: Array<any>
  /** 复选框项 */
  items: Array<Record<string, any>>
  /** 标签文本的key */
  labelKey?: string
  /** 值的key */
  valueKey?: string
  /** 块级显示 */
  block?: boolean
}

/** 复选框组, 用来选择一组数据组件属性 */
export interface CheckboxGroupEmits {
  (e: 'update:modelValue', value: Array<any>): void
}

/** 复选框组, 用来选择一组数据暴露的属性和方法 */
export interface CheckboxGroupExposed {}
```

### 使用示例

暂无示例

## radio (URadio)

### 类型定义

```typescript
// 来源: packages/desktop/src/types/radio.ts
import type { DeconstructValue, FormComponentProps } from '@veltra/utils'
/** 单选框组件属性 */
export interface RadioProps extends FormComponentProps {
  /** 单选框值 */
  value?: any
  /** 文本 */
  label?: string
  /**全部禁用 */
  disabled?: boolean
  /** 绑定值 */
  modelValue?: any
}

/** 单选框组件定义的事件 */
export interface RadioEmits {
  (e: 'update:modelValue', value: any): void
}

/** 单选框组件暴露的属性和方法(组件内部使用) */
export interface _RadioExposed {
  change: (isChecked: boolean) => void
}

/** 单选框组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type RadioExposed = DeconstructValue<_RadioExposed>
```

### 使用示例

```vue
<!-- 来源: playgrounds/desktop/src/radio/index.vue -->
<template>
  <div class="box">
    <CustomCard title="禁用">
      <u-radio
        v-for="{ label, value } of items"
        v-model="radio1"
        :value="value"
        :disabled="value === '3'"
      >
        {{ label }}
      </u-radio>
    </CustomCard>

    <CustomCard title="单选框组">
      <u-radio-group :items="items" v-model="radio1" />
    </CustomCard>
    <CustomCard title="单选框组block模式">
      <u-radio-group :items="items" v-model="radio1" block />
    </CustomCard>

    <CustomCard title="单选框组某项禁用">
      <u-radio-group
        :items="items"
        v-model="radio1"
        :disabled-item="(item) => item.value === '1'"
      />
    </CustomCard>
  </div>
</template>

<script setup lang="ts">
import { shallowRef } from 'vue'

import CustomCard from '../card/custom-card.vue'

const radio1 = shallowRef('1')

const items = [
  { label: '选项一', value: '1' },
  { label: '选项二', value: '2' },
  { label: '选项三', value: '3' }
]
</script>
```

## radio-group (URadioGroup)

### 类型定义

```typescript
// 来源: packages/desktop/src/types/radio-group.ts
import type { DeconstructValue, FormComponentProps } from '@veltra/utils'
/** 单选框默认父组件组件属性 */
export interface RadioGroupProps extends FormComponentProps {
  /** 值 */
  modelValue?: any
  /** 单选框项 */
  items: Record<string, any>[]
  /**
   * 选项值key
   * @default 'value'
   */
  valueKey?: string
  /**
   * 标签文本key
   * @default 'label'
   */
  labelKey?: string
  /** 禁用 */
  disabled?: boolean
  /** 禁用的选项 */
  disabledItem?: (item: Record<string, any>) => boolean
  /** 块级布局 */
  block?: boolean
}

/** 单选框默认父组件组件定义的事件 */
export interface RadioGroupEmits {
  /** 值更新 */
  (e: 'update:modelValue', modelValue: any): void
  /** 选项更新事件 */
  (e: 'change', item: Record<string, any>): void
}

/** 单选框默认父组件组件暴露的属性和方法(组件内部使用) */
export interface _RadioGroupExposed {}

/** 单选框默认父组件组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type RadioGroupExposed = DeconstructValue<_RadioGroupExposed>
```

### 使用示例

暂无示例

## switch (USwitch)

### 类型定义

```typescript
// 来源: packages/desktop/src/types/switch.ts
import type { DeconstructValue, FormComponentProps } from '@veltra/utils'

/** 开关组件属性 */
export interface SwitchProps extends FormComponentProps {
  /** 开关状态 */
  modelValue?: boolean
  /** 打开时显示的文字 */
  activeText?: string
  /** 关闭时显示的文字 */
  inactiveText?: string
}

/** 开关组件定义的事件 */
export interface SwitchEmits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'change', value: boolean): void
}

/** 开关组件暴露的属性和方法(组件内部使用) */
export interface _SwitchExposed {}

/** 开关组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type SwitchExposed = DeconstructValue<_SwitchExposed>
```

### 使用示例

```vue
<!-- 来源: playgrounds/desktop/src/switch/index.vue -->
<template>
  <div>
    <CustomCard title="基础使用">
      <div>开关状态: {{ basicSwitch }}</div>
      <u-switch v-model="basicSwitch" />
    </CustomCard>

    <CustomCard title="带文字描述">
      <div>开关状态: {{ textSwitch }}</div>
      <u-switch v-model="textSwitch" show-text active-text="开启" inactive-text="关闭" />
    </CustomCard>

    <CustomCard title="不同尺寸">
      <div style="display: flex; gap: 16px; align-items: center">
        <u-switch v-model="basicSwitch" size="small" />
        <u-switch v-model="basicSwitch" size="default" />
        <u-switch v-model="basicSwitch" size="large" />
      </div>
    </CustomCard>

    <CustomCard title="禁用状态">
      <div style="display: flex; gap: 16px; align-items: center">
        <u-switch v-model="basicSwitch" disabled />
        <u-switch v-model="trueSwitch" disabled />
      </div>
    </CustomCard>

    <CustomCard title="只读状态">
      <div style="display: flex; gap: 16px; align-items: center">
        <u-switch v-model="basicSwitch" readonly />
        <u-switch v-model="trueSwitch" readonly />
      </div>
    </CustomCard>

    <CustomCard title="在表单中使用">
      <u-form :model="formModel">
        <u-switch
          field="enabled"
          label="启用状态"
          show-text
          active-text="启用"
          inactive-text="禁用"
        />
        <u-switch field="notification" label="推送通知" />
      </u-form>
      <div style="margin-top: 16px">表单数据: {{ formModel.data }}</div>
    </CustomCard>
  </div>
</template>

<script lang="ts" setup>
import { FormModel } from '@veltra/desktop'
import { ref } from 'vue'

import CustomCard from '../card/custom-card.vue'

const basicSwitch = ref(false)
const textSwitch = ref(true)
const trueSwitch = ref(true)

const formModel = new FormModel({
  enabled: { value: true },
  notification: { value: false }
})
</script>
```

## slider (USlider)

### 类型定义

```typescript
// 来源: packages/desktop/src/types/slider.ts
import type { DeconstructValue, FormComponentProps } from '@veltra/utils'

/** 滑块组件属性 */
export interface SliderProps<T extends number | [number, number]> extends FormComponentProps {
  modelValue?: T
  /**
   * 最小值
   * @default 0
   */
  min?: number
  /**
   * 最大值
   * @default 100
   */
  max?: number
  /**
   * 步长
   * - 如果设置步长, 则滑块会按照步长进行滑动
   * - 同时，滑块上将会显示步长刻度
   */
  step?: number
  /** 是否是范围滑块 */
  range?: boolean
  /** 是否是垂直模式 */
  vertical?: boolean
}

/** 滑块组件定义的事件 */
export interface SliderEmits<T extends number | [number, number]> {
  (e: 'update:modelValue', value: T): void
}

/** 滑块组件暴露的属性和方法(组件内部使用) */
export interface _SliderExposed {}

/** 滑块组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type SliderExposed = DeconstructValue<_SliderExposed>
```

### 使用示例

```vue
<!-- 来源: playgrounds/desktop/src/slider/index.vue -->
<template>
  <div>
    <!-- 配置面板 -->
    <u-card class="mb-2">
      <u-card-header> 配置选项 </u-card-header>

      <u-card-content>
        <u-form :model="config" no-tips :cols="7">
          <u-number-input
            field="min"
            :min="0"
            :max="config.data.max"
            :step="10"
            label="最小值"
            :clearable="false"
            placeholder="设置最小值"
          />
          <u-number-input
            field="max"
            :min="config.data.min"
            label="最大值"
            :step="10"
            :clearable="false"
            placeholder="设置最大值"
          />
          <u-number-input
            field="step"
            label="步长"
            :min="0"
            :max="config.data.max"
            :step="5"
            :clearable="false"
            placeholder="设置步长"
          />
          <u-checkbox field="vertical" label="垂直模式" />
          <u-checkbox field="range" label="范围选择" />
          <u-checkbox field="disabled" label="禁用状态" />
          <u-checkbox field="readonly" label="只读模式" />
        </u-form>
      </u-card-content>
    </u-card>

    <!-- 演示区域 -->
    <u-card>
      <u-card-header> 滑块演示 </u-card-header>

      <u-card-content>
        <u-slider
          v-model="sliderValue"
          v-bind="config.data"
          :style="{ height: config.data.vertical ? '300px' : undefined }"
        />

        {{ sliderValue }}
      </u-card-content>
    </u-card>
  </div>
</template>

<script lang="tsx" setup>
import { FormModel } from '@veltra/desktop'
import { ref } from 'vue'

const config = new FormModel({
  min: { value: 0 },
  max: { value: 100 },
  step: { value: 0 },
  vertical: { value: false },
  range: { value: false },
  disabled: { value: false },
  readonly: { value: false }
})

const sliderValue = ref(20)
</script>
```

## date-picker (UDatePicker)

### 类型定义

```typescript
// 来源: packages/desktop/src/types/date-picker.ts
import type { Dater } from '@cat-kit/core'
import type { DeconstructValue, FormComponentProps } from '@veltra/utils'

/** date-picker组件属性 */
export interface DatePickerProps extends FormComponentProps {
  modelValue?: string
  /** 占位 */
  placeholder?: string
  /** 日期类型 */
  type?: 'date' | 'month' | 'year'
  /** 日期格式化 */
  format?: string
  /** 日期值格式化, 当没有指定时默认使用format属性，仅当值和显示的内容不一致时才需要使用到该属性 */
  valueFormat?: string
  /** 最小可选日期 */
  disabledDate?: (date: Dater) => boolean
  /** 是否显示清除按钮 */
  clearable?: boolean
}

/** date-picker组件定义的事件 */
export interface DatePickerEmits {
  (e: 'update:modelValue', value?: string): void
}

/** date-picker组件暴露的属性和方法(组件内部使用) */
export interface _DatePickerExposed {}

/** date-picker组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type DatePickerExposed = DeconstructValue<_DatePickerExposed>
```

### 使用示例

```vue
<!-- 来源: playgrounds/desktop/src/date-picker/index.vue -->
<template>
  <div>
    <CustomCard title="基本使用">
      <u-radio-group v-model="type" :items="items">选择类型</u-radio-group>
      <u-date-picker v-model="d" :type="type" style="width: 200px" :disabled-date="disabledDate" />
      {{ d }}
    </CustomCard>
  </div>
</template>

<script lang="ts" setup>
import { date } from '@cat-kit/core'
import { shallowRef } from 'vue'

import CustomCard from '../card/custom-card.vue'

const d = shallowRef(date().format('yyyy-MM-dd HH:mm:ss'))

function disabledDate(d) {
  return d.timestamp <= Date.now()
}

const type = shallowRef<'date' | 'month' | 'year'>('date')

const items = shallowRef([
  { label: '日期', value: 'date' },
  { label: '月份', value: 'month' },
  { label: '年份', value: 'year' }
])
</script>
```

## date-range-picker (UDateRangePicker)

### 类型定义

```typescript
// 来源: packages/desktop/src/types/date-range-picker.ts
import type { Dater } from '@cat-kit/core'
import type { DeconstructValue, FormComponentProps } from '@veltra/utils'

/** date-range-picker组件属性 */
export interface DateRangePickerProps extends FormComponentProps {
  modelValue?: [string, string]
  /** 占位 */
  placeholder?: [string, string]
  /** 日期类型 */
  type?: 'date' | 'month' | 'year'
  /** 日期格式化 */
  format?: string
  /** 日期值格式化, 当没有指定时默认使用format属性，仅当值和显示的内容不一致时才需要使用到该属性 */
  valueFormat?: string
  /** 最小可选日期 */
  disabledDate?: (date: Dater) => boolean
  /** 是否显示清除按钮 */
  clearable?: boolean
}

/** date-range-picker组件定义的事件 */
export interface DateRangePickerEmits {
  (e: 'update:modelValue', value?: [string, string]): void
}

/** date-range-picker组件暴露的属性和方法(组件内部使用) */
export interface _DateRangePickerExposed {}

/** date-range-picker组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type DateRangePickerExposed = DeconstructValue<_DateRangePickerExposed>
```

### 使用示例

```vue
<!-- 来源: playgrounds/desktop/src/date-range-picker/index.vue -->
<template>
  <div>
    <u-date-range-picker v-model="value" style="width: 240px" />
    {{ value }}
  </div>
</template>

<script lang="ts" setup>
import { date } from '@cat-kit/core'
import { ref } from 'vue'
const value = ref<[string, string]>(['2025-03-01', date().format()])
</script>
```

## date-panel (UDatePanel)

### 类型定义

```typescript
// 来源: packages/desktop/src/types/date-panel.ts
import type { Dater } from '@cat-kit/core'
import type { FormComponentProps } from '@veltra/utils'

export type PanelType = 'day' | 'month' | 'year'

export interface DatePanelProps {
  date?: Dater
  rangeDate?: [Dater, Dater]
  range?: boolean
  disabledDate?: (date: Dater) => boolean
  type?: 'date' | 'month' | 'year'
  size?: FormComponentProps['size']
}

export interface DatePanelEmits {
  (e: 'select:date', date: Dater): void
  (e: 'select:range-date', rangeDate?: [Dater, Dater]): void
}
```

### 使用示例

暂无示例

## file-picker (UFilePicker)

### 类型定义

```typescript
// 来源: packages/desktop/src/types/file-picker.ts
import type { DeconstructValue, FormComponentProps } from '@veltra/utils'

/** 文件上传器组件属性 */
export interface UploaderProps extends FormComponentProps {
  /** 渲染标签 */
  tag?: string
  /** 允许上传的文件类型 */
  accept?: string
  /** 是否允许多选 */
  multiple?: boolean
}

/** 文件上传器组件定义的事件 */
export interface UploaderEmits {
  /** 拾取 */
  (e: 'pick', files: File[]): void
}

/** 文件上传器组件暴露的属性和方法(组件内部使用) */
export interface _UploaderExposed {}

/** 文件上传器组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type UploaderExposed = DeconstructValue<_UploaderExposed>
```

### 使用示例

```vue
<!-- 来源: playgrounds/desktop/src/file-picker/index.vue -->
<template>
  <div>
    <CustomCard title="基础上传">
      <u-file-picker @pick="files = [...files, ...$event]">
        <u-button>上传文件</u-button>
      </u-file-picker>
      <ul>
        <li v-for="file of files">{{ file.name }} {{ file.size }}</li>
      </ul>
    </CustomCard>

    <CustomCard title="多文件上传">
      <u-file-picker multiple @pick="files = [...files, ...$event]">
        <u-button>上传文件</u-button>
      </u-file-picker>
      <ul>
        <li v-for="file of files">{{ file.name }} {{ file.size }}</li>
      </ul>
    </CustomCard>

    <CustomCard title="图片上传">
      <u-file-picker accept="image/*" @pick="files = [...files, ...$event]">
        <u-button>上传文件</u-button>
      </u-file-picker>
    </CustomCard>

    <CustomCard title="拖拽上传">
      <u-file-picker
        v-slot="{ isDragover }"
        class="upload-dragger"
        @pick="files = [...files, ...$event]"
      >
        <div class="upload-content" :class="{ 'is-dragover': isDragover }">
          <div class="icon">
            <u-icon><Upload /></u-icon>
          </div>
          <div class="text">
            <span v-if="isDragover">释放以上传文件</span>
            <span v-else>将文件拖到此处，或<em>点击上传</em></span>
          </div>
        </div>
      </u-file-picker>
    </CustomCard>
  </div>
</template>

<script lang="ts" setup>
import { Upload } from '@veltra/icons/normal'
import { shallowRef } from 'vue'

import CustomCard from '../card/custom-card.vue'

const files = shallowRef<File[]>([])
</script>

<style scoped>
.upload-dragger {
  display: block;
  width: 100%;
}

.upload-content {
  background-color: #fafafa;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  box-sizing: border-box;
  text-align: center;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  padding: 40px 0;
  transition:
    border-color 0.3s,
    background-color 0.3s;
}

.upload-content:hover,
.upload-content.is-dragover {
  border-color: var(--u-primary-color, #409eff);
  background-color: var(--u-primary-color-light, rgba(64, 158, 255, 0.05));
}

.icon {
  font-size: 48px;
  color: #8c939d;
  margin-bottom: 16px;
  line-height: 1;
}

.text {
  color: #606266;
  font-size: 14px;
}

.text em {
  color: var(--u-primary-color, #409eff);
  font-style: normal;
  font-weight: 500;
}
</style>
```

## grid-input (UGridInput)

### 类型定义

```typescript
// 来源: packages/desktop/src/types/grid-input.ts
import type { DeconstructValue } from '@veltra/utils'

/** 密码输入框组件组件属性 */
export interface GridInputProps {
  modelValue?: string
  length?: number
  zero?: false
  separator?: string
}

/** 密码输入框组件组件定义的事件 */
export interface GridInputEmits {
  (e: 'update:modelValue', value: string): void
  (e: 'input', value: string): void
}

/** 密码输入框组件组件暴露的属性和方法(组件内部使用) */
export interface _GridInputExposed {
  clear: () => void
}

/** 密码输入框组件组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type GridInputExposed = DeconstructValue<_GridInputExposed>
```

### 使用示例

```vue
<!-- 来源: playgrounds/desktop/src/grid-input/index.vue -->
<template>
  <div>
    <u-button @click="clear" type="primary">clear</u-button>
    <u-grid-input separator="" ref="inputRef" @input="change" />
  </div>
</template>

<script lang="ts" setup>
import type { GridInputExposed } from '@veltra/desktop'
import { shallowRef } from 'vue'

const inputRef = shallowRef<GridInputExposed>()

const clear = () => {
  inputRef.value?.clear()
}

const change = (val: string) => {
  console.log(val)
}
</script>
```

## group-input (UGroupInput)

### 类型定义

```typescript
// 来源: packages/desktop/src/types/group-input.ts
import type { DeconstructValue, FormComponentProps } from '@veltra/utils'
import type { StyleValue } from 'vue'

/** 分组输入组件属性 */
export interface GroupInputProps<
  GroupItem extends Record<string, any> = Record<string, any>
> extends FormComponentProps {
  modelValue?: GroupItem[]
  /** 最大数量 */
  max?: number
  /** 是否允许创建 */
  creatable?: boolean
  /** 默认值 */
  itemDefault?: Record<string, any>
  /** 输入项样式 */
  itemStyle?: StyleValue
}

/** 分组输入组件定义的事件 */
export interface GroupInputEmits<GroupItem extends Record<string, any> = Record<string, any>> {
  (e: 'update:modelValue', modelValue: GroupItem[]): void
}

/** 分组输入组件暴露的属性和方法(组件内部使用) */
export interface _GroupInputExposed {}

/** 分组输入组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type GroupInputExposed = DeconstructValue<_GroupInputExposed>
```

### 使用示例

```vue
<!-- 来源: playgrounds/desktop/src/group-input/index.vue -->
<template>
  <div>
    {{ items }}
    <u-group-input v-slot="{ item }" v-model="items">
      <u-input v-model="item.value1" />
      <u-input v-model="item.value2" />
      <u-input v-model="item.value3" />
    </u-group-input>
  </div>
</template>

<script lang="ts" setup>
import { shallowRef } from 'vue'

const items = shallowRef<any[]>([])

setTimeout(() => {
  items.value = [{ value1: '1', value2: '2', value3: '3' }]
}, 1000)
</script>
```
