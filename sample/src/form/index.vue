<template>
  <div>
    <u-checkbox v-model="disabled"> 禁用 </u-checkbox>
    <u-checkbox v-model="readonly"> 只读 </u-checkbox>

    <u-checkbox v-model="ageRules.required"> 年龄必填 </u-checkbox>

    <u-button @click="visible = true">打开</u-button>

    <u-number-input v-model="num"></u-number-input>

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
          <u-input :prefix="'333'" field="phone" label="手机" />
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
        <u-tree-select
          field="treeSelect"
          label="树形下拉"
          label-key="name"
          value-key="id"
          :data="treeData"
          text="666666"
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

        <!-- <u-text-editor label="内容" height="80px" field="tex" /> -->

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

    <CustomCard title="变更模型数据">
      <u-form :model="model2">
        <u-input field="a" label="a"></u-input>
        <u-input field="b" label="b"></u-input>
      </u-form>

      <u-button @click="changeModelData">变更模型数据</u-button>
    </CustomCard>
  </div>
</template>

<script lang="ts" setup>
import { formField, FormModel } from 'ultra-ui'
import { shallowReactive, shallowRef, watch } from 'vue'
import CustomCard from '../card/custom-card.vue'
import { date } from 'cat-kit/fe'
import { CascadeData, TreeData } from './data'

const readonly = shallowRef(false)
const disabled = shallowRef(false)

const ageRules = shallowReactive(formField<number>({ required: true }))

const num = shallowRef(1)

const model = new FormModel({
  age: ageRules,
  'nest.name': { required: true, value: 'aa' },
  'nest.price': {
    required: true,
    value: () => (num.value < 10 ? 20 : 10)
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
  treeChecked: { required: true, value: () => [] },
  treeSelect: { required: true, value: () => 11 },
  complete1: { value: 'test', required: true },
  complete2: { value: () => ['张三', '李四'], required: true },
  group: { required: true },
  cascade: { required: true },
  tex: { required: true }
})

const model2 = new FormModel({
  a: { required: true },
  b: {}
})

function changeModelData() {
  model2.setProxyData({
    a: '6',
    b: '3'
  })
}

// setTimeout(() => {
//   model.setData({ cascade: ['guide'] })
// }, 2000)

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

const treeData = shallowRef<any[]>([])

setTimeout(() => {
  treeData.value = TreeData
}, 1000)

const cascadeData = shallowRef<any[]>([])

setTimeout(() => {
  cascadeData.value = CascadeData
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
