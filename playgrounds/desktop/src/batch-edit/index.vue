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
      :actions-props="{ delete: { needConfirm: true } }"
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

  data.value = Array.from({ length: 2 }).map((_, i) => ({
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
