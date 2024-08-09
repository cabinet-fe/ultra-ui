<template>
  <div>
    <u-checkbox v-model="disabled"> 禁用 </u-checkbox>
    <u-checkbox v-model="readonly"> 只读 </u-checkbox>

    <u-checkbox v-model="ageRules.required"> 年龄必填 </u-checkbox>

    <u-button @click="visible = true">打开</u-button>

    <CustomCard title="表单">
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
          <u-number-input field="nest.price" label="嵌套价格" />

          <u-password-input field="pwd" label="密码" />
          <u-number-input field="age" label="年龄" />
          <u-number-input field="debt" currency label="借款" :step="1" />
          <u-input field="phone" label="手机" />
          <u-input field="email" label="邮箱" />
          <u-select field="unit" label="单位" :options="units" />
          <u-multi-select
            field="interest"
            label="兴趣"
            :options="interestList"
          />

          <u-date-picker field="date" label="日期" />
          <u-cascade
            field="cascade"
            label="单选级联选择器"
            :options="cascadeData"
          />
        </template>
      </u-form>

      <br />

      <u-form
        :disabled="disabled"
        :readonly="readonly"
        :model="model"
        label-width="200px"
      >
        <u-checkbox field="freeze" label="是否冻结" />
        <u-textarea field="remarks" label="备注" span="full" />
        <!-- <u-slider field="slider" label="滑块" /> -->
        <u-multi-tree-select
          field="treeChecked"
          label="1"
          label-key="name"
          value-key="id"
          :data="treeData"
          filterable
        />
        <u-tree-select
          field="treeSelect"
          label="1"
          label-key="name"
          value-key="id"
          :data="treeData"
          filterable
        />
        <u-auto-complete
          field="complete1"
          label="complete1"
          :suggestions="interestList.map(item => item.label)"
          label-key="label"
        />
        <!-- <u-auto-complete
          field="complete2"
          label="complete2"
          :suggestions="interestList.map(item => item.label)"
          label-key="label"
          multiple
        /> -->

        <u-text-editor label="内容" height="80px" field="tex" />

        <u-group-input field="group" label="分组输入" v-slot="{ item }">
          <u-input v-model="item.value1" />
          <u-input v-model="item.value2" />
        </u-group-input>
      </u-form>

      <div style="display: flex; justify-content: flex-end; gap: 8px">
        <u-button type="primary" @click="handleSetData">设置值</u-button>
        <u-button type="primary" @click="handleValidate">校验</u-button>
        <u-button @click="model.resetData()">重置数据</u-button>
        <u-button type="success" @click="model.clearValidate()">
          清除校验
        </u-button>
      </div>
    </CustomCard>

    {{ model.data }}
  </div>
</template>

<script lang="ts" setup>
import { DynamicFormModel, formField } from 'ultra-ui'
import { shallowReactive, shallowRef, watch } from 'vue'
import CustomCard from '../card/custom-card.vue'
import { date } from 'cat-kit/fe'

const readonly = shallowRef(false)
const disabled = shallowRef(false)

const ageRules = shallowReactive(formField<number>({ required: true }))

const model = new DynamicFormModel({
  age: ageRules,
  'nest.name': { required: true, value: 'aa' },
  'nest.price': { required: true },
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
    match: [
      /^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*/,
      '这个时候你得输入一个邮箱'
    ]
  },
  unit: { required: true },
  interest: { required: true },
  remarks: { required: true, value: '备注默认值\n换行\n换行' },
  slider: {},
  date: { required: true, value: date().format() },
  guide: {
    value: [{ attributes: { bold: true }, insert: '22eee' }],
    required: true
  },
  treeChecked: { required: true },
  treeSelect: { required: true, value: () => 11 },
  complete1: { value: 'test', required: true },
  complete2: { value: () => ['张三', '李四'], required: true },
  group: { required: true },
  cascade: { required: true },
  tex: { required: true }
})

setTimeout(() => {
  model.setData({ cascade: ['guide'] })

  model.add('name', {
    maxLen: 4,
    required: true,
    value: ''
  })
}, 2000)
// const sortRef = shallowRef()
// const list = shallowRef(Array.from({ length: 10 }).map(() => Math.random()))

const units = [
  { label: '单位1', value: '1' },
  { label: '单位2', value: '2' },
  { label: '单位3', value: '3' }
]

const visible = shallowRef(false)

watch(visible, v => {
  !v && model.resetData()
})

function handleSetData() {
  model.setData({
    // nest: { name: '测试名称', price: 10 },
    age: null,
    name: null,
    unit: null,
    interest: ['1', '2', '3']
  })
}

async function handleValidate() {
  const valid = await model.validate()
}

const interestList = [
  { label: '电影', value: '1' },
  { label: '健身', value: '2' },
  { label: '读书', value: '3' },
  { label: '游戏', value: '4' },
  { label: '科技', value: '5' },
  { label: '音乐', value: '6' }
]

const treeData = [
  { name: '烤冷面', id: 1 },
  {
    name: '手抓饼',
    id: 2,
    children: [
      {
        name: '鱼香肉丝',
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
  }
]
const cascadeData = shallowRef<any[]>([])

setTimeout(() => {
  cascadeData.value = [
    {
      value: 'guide',
      label: 'Guide'
    },
    {
      value: 'component',
      label: 'Component',
      children: [
        {
          value: 'basic',
          label: 'Basic',
          children: [
            {
              value: 'layout',
              label: 'Layout'
            },
            {
              value: 'color',
              label: 'Color'
            },
            {
              value: 'typography',
              label: 'Typography'
            },
            {
              value: 'icon',
              label: 'Icon'
            },
            {
              value: 'button',
              label: 'Button'
            }
          ]
        },
        {
          value: 'form',
          label: 'Form',
          children: [
            {
              value: 'radio',
              label: 'Radio'
            },
            {
              value: 'checkbox',
              label: 'Checkbox'
            },
            {
              value: 'input',
              label: 'Input'
            },
            {
              value: 'input-number',
              label: 'InputNumber'
            },
            {
              value: 'select',
              label: 'Select'
            },
            {
              value: 'cascader',
              label: 'Cascader'
            },
            {
              value: 'switch',
              label: 'Switch'
            },
            {
              value: 'slider',
              label: 'Slider'
            },
            {
              value: 'time-picker',
              label: 'TimePicker'
            },
            {
              value: 'date-picker',
              label: 'DatePicker'
            },
            {
              value: 'datetime-picker',
              label: 'DateTimePicker'
            },
            {
              value: 'upload',
              label: 'Upload'
            },
            {
              value: 'rate',
              label: 'Rate'
            }
          ]
        },
        {
          value: 'data',
          label: 'Data',
          children: [
            {
              value: 'table',
              label: 'Table'
            },
            {
              value: 'tag',
              label: 'Tag'
            },
            {
              value: 'progress',
              label: 'Progress'
            },
            {
              value: 'tree',
              label: 'Tree'
            },
            {
              value: 'pagination',
              label: 'Pagination'
            },
            {
              value: 'badge',
              label: 'Badge'
            }
          ]
        },
        {
          value: 'notice',
          label: 'Notice',
          children: [
            {
              value: 'alert',
              label: 'Alert'
            },
            {
              value: 'loading',
              label: 'Loading'
            },
            {
              value: 'message',
              label: 'Message'
            },
            {
              value: 'message-box',
              label: 'MessageBox'
            },
            {
              value: 'notification',
              label: 'Notification'
            }
          ]
        },
        {
          value: 'navigation',
          label: 'Navigation',
          children: [
            {
              value: 'menu',
              label: 'Menu'
            },
            {
              value: 'tabs',
              label: 'Tabs'
            },
            {
              value: 'breadcrumb',
              label: 'Breadcrumb'
            },
            {
              value: 'dropdown',
              label: 'Dropdown'
            },
            {
              value: 'steps',
              label: 'Steps'
            }
          ]
        },
        {
          value: 'others',
          label: 'Others',
          children: [
            {
              value: 'dialog',
              label: 'Dialog'
            },
            {
              value: 'tooltip',
              label: 'Tooltip'
            },
            {
              value: 'popover',
              label: 'Popover'
            },
            {
              value: 'card',
              label: 'Card'
            },
            {
              value: 'carousel',
              label: 'Carousel'
            },
            {
              value: 'collapse',
              label: 'Collapse'
            }
          ]
        }
      ]
    },
    {
      value: 'resource',
      label: 'Resource',
      children: [
        {
          value: 'axure',
          label: 'Axure Components'
        },
        {
          value: 'sketch',
          label: 'Sketch Templates'
        },
        {
          value: 'docs',
          label: 'Design Documentation'
        }
      ]
    }
  ]
}, 2000)
const formRef = shallowRef()
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
