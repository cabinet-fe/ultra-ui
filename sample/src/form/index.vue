<template>
  <div>
    <u-checkbox v-model="disabled"> 禁用 </u-checkbox>

    <u-checkbox v-model="readonly"> 只读 </u-checkbox>

    <CustomCard title="表单">
      <u-button @click="open">打开</u-button>
      <u-dialog v-model="visible" style="width: 900px">
        <u-form
          :disabled="disabled"
          :readonly="readonly"
          :model="model"
          label-width="100px"
        >
          <u-input field="name" label="姓名" tips="四个字以内" />
          <span field="aaa" label="aaa">1111</span>
          <u-password-input field="pwd" label="密码" v-if="false" />
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
          <u-radio-group
            :items="[
              { label: '男', value: 'male' },
              { label: '女', value: 'female' }
            ]"
            label="性别"
            field="sex"
          />
          <u-date-picker field="date" label="日期" />
          <u-checkbox field="freeze" label="是否冻结" />
          <u-textarea field="remarks" label="备注" />
          <u-slider field="slider" label="滑块" />
          <u-text-editor field="guide" label="指南" />
          <u-tree-select
            field="treeSelect"
            label="权限管理"
            label-key="name"
            value-key="id"
            :data="data"
            filterable
            multiple
          />
        </u-form>

        <template #footer>
          <u-button @click="model.validate()">校验</u-button>
          <u-button @click="model.clearValidate()">重置</u-button>
        </template>
      </u-dialog>
    </CustomCard>

    {{ model.data }}
  </div>
</template>

<script lang="ts" setup>
import { formField, FormModel } from 'ultra-ui'
import { shallowRef, watch } from 'vue'
import CustomCard from '../card/custom-card.vue'

const readonly = shallowRef(false)
const disabled = shallowRef(false)

const model = new FormModel({
  name: { maxLen: 4, required: true },
  age: formField<string>({ required: '年龄是必填的' }),
  aa: { required: true },
  phone: {
    validator(value) {
      if (!value) return ''
      if (/^1[1-9]{10}$/.test(value)) return ''
      return '你得输入一个手机号'
    }
  },
  freeze: {},
  sex: { value: '' },
  pwd: {},
  debt: { min: 10 },
  email: {
    match: [
      /^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*/,
      '这个时候你得输入一个邮箱'
    ]
  },
  unit: { required: true, value: '1' },
  interest: { required: true, value: () => ['1', '2', '3'] },
  remarks: { required: true },
  slider: {},
  date: { required: true },
  guide: { required: true },
  treeSelect: { required: true, value: () => [5, 6, 7] }
})

// const sortRef = shallowRef()
// const list = shallowRef(Array.from({ length: 10 }).map(() => Math.random()))

const units = [
  { label: '单位1', value: '1' },
  { label: '单位2', value: '2' },
  { label: '单位3', value: '3' }
]

const visible = shallowRef(false)

watch(visible, v => {
  if (v) {
    // model.data.treeSelect = [1]
    // setTimeout(() => {
    //   model.setData({ treeSelect: [1] })
    // }, 3000)
  } else {
    model.resetData()
  }
})

const interestList = [
  { label: '电影', value: '1' },
  { label: '健身', value: '2' },
  { label: '读书', value: '3' },
  { label: '游戏', value: '4' },
  { label: '科技', value: '5' },
  { label: '音乐', value: '6' }
]

const data = [
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
  model.setData(
    {
      name: 'aaaaaa'
    },
    { validate: true }
  )
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
