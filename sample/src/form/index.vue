<template>
  <div>
    <u-checkbox v-model="disabled"> 禁用 </u-checkbox>
    <u-checkbox v-model="readonly"> 只读 </u-checkbox>

    <CustomCard title="表单">
      <!-- <u-button @click="open">打开</u-button> -->
      <!-- <u-dialog v-model="visible" style="width: 900px"> -->
      <u-form :disabled="disabled" :readonly="readonly" :model="model" label-width="100px">
        <template #default="{ data }">
          <u-radio-group
            :items="[
              { label: '男', value: 'male' },
              { label: '女', value: 'female' }
            ]"
            label="性别"
            field="sex"
          />
          <u-input field="name" v-if="data.sex === 'female'" label="姓名" tips="四个字以内" />

          <u-input field="nest.name" label="嵌套名称" />
          <u-number-input field="nest.price" label="嵌套价格" />

          <u-password-input field="pwd" label="密码" />
          <u-number-input field="age" label="年龄" />
          <u-number-input field="debt" currency label="借款" :step="1" />
          <u-input field="phone" label="手机" />
          <u-input field="email" label="邮箱" />
          <u-select field="unit" label="单位" :options="units" />
          <u-multi-select field="interest" label="兴趣" :options="interestList" />

          <u-date-picker field="date" label="日期" />
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
            :suggestions="interestList"
            label-key="label"
          />
          <u-auto-complete
            field="complete2"
            label="complete2"
            :suggestions="interestList"
            label-key="label"
            multiple
          />
        </template>
      </u-form>

      <template #footer>
        <u-button @click="model.validate()">校验</u-button>
        <u-button @click="model.clearValidate()">重置</u-button>
      </template>
      <!-- </u-dialog> -->

      <div style="display: flex; justify-content: flex-end; gap: 8px">
        <u-button type="primary" @click="handleSetData">设置值</u-button>
        <u-button type="primary" @click="handleValidate">校验</u-button>
        <u-button @click="model.resetData()">重置数据</u-button>
        <u-button type="success" @click="model.clearValidate()">清除校验</u-button>
      </div>
    </CustomCard>

    {{ model.data }}
  </div>
</template>

<script lang="ts" setup>
import { formField, FormModel } from 'ultra-ui'
import { shallowRef, watch } from 'vue'
import CustomCard from '../card/custom-card.vue'
import { date } from 'cat-kit/fe'

const readonly = shallowRef(false)
const disabled = shallowRef(false)

const model = new FormModel({
  name: { maxLen: 4, required: true, value: '' },
  age: formField<number>({ required: '年龄是必填的' }),
  'nest.name': { required: true, value: 'aa' },
  'nest.price': { required: true },
  phone: {
    validator(value) {
      if (!value) return ''
      if (/^1[1-9]{10}$/.test(value)) return ''
      return '你得输入一个手机号'
    }
  },
  freeze: {},
  sex: { value: 'male', required: true },
  pwd: { value: '', required: true },
  debt: { min: 10, value: 66666 },
  email: {
    value: '',
    match: [/^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*/, '这个时候你得输入一个邮箱']
  },
  unit: { required: true, value: '1' },
  interest: { required: true, value: () => ['1', '2', '3'] },
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
  complete2: { value: ['张三', '李四'], required: true }
})

// const sortRef = shallowRef()
// const list = shallowRef(Array.from({ length: 10 }).map(() => Math.random()))

const units = [
  { label: '单位1', value: '1' },
  { label: '单位2', value: '2' },
  { label: '单位3', value: '3' }
]

const visible = shallowRef(false)

watch(visible, (v) => {
  !v && model.resetData()
})

function handleSetData() {
  model.setData({ nest: { name: '测试名称', price: 10 } })
}

async function handleValidate() {
  const valid = await model.validate()
  console.log(valid)
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

function open() {
  visible.value = true
  // model.setData(
  //   {
  //     name: 'aaaaaa'
  //   },
  //   { validate: true }
  // )
}
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

    &:last-child {
      border: none;
    }

    transition: transform 0.25s;
  }
}
</style>
