<template>
  <u-card>
    <u-card-content>
      <u-tabs v-model="activeTab" :items="tabItems" keep-alive>
        <template #basic>
          <u-form :model="model" label-width="100px" style="margin-top: 16px">
            <u-input label="用户名" field="account.username" placeholder="请输入用户名" />
            <u-password-input label="密码" field="account.password" placeholder="请输入密码" />
            <u-textarea label="简介" field="description" :rows="3" placeholder="请输入简介" />
            <u-select
              label="年级"
              field="grade"
              :options="gradeList"
              clearable
              placeholder="请选择年级"
            />
            <u-auto-complete
              label="城市"
              field="city"
              :suggestions="citySuggestions"
              clearable
              placeholder="请输入城市"
            />
            <u-number-input label="年龄" field="age" :min="0" :max="150" :step="1" />
            <u-slider label="进度" field="progress" />
            <u-switch label="启用" field="active" active-text="开" inactive-text="关" />
            <u-checkbox label="同意协议" field="agree" />
            <u-date-picker label="生日" field="birthday" clearable placeholder="请选择日期" />
            <u-palette label="颜色" field="color" />
          </u-form>
        </template>

        <template #advanced>
          <u-form :model="model" label-width="120px" style="margin-top: 16px">
            <u-checkbox-group label="爱好" field="hobbies" :items="hobbyList" />
            <u-radio-group label="性别" field="gender" :items="genderList" />
            <u-multi-select
              label="选修课程"
              field="courses"
              :options="courseList"
              clearable
              filterable
              placeholder="请选择课程"
            />
            <u-date-range-picker
              label="假期"
              field="vacation"
              clearable
              :placeholder="['开始日期', '结束日期']"
            />
            <u-number-range-input
              label="分数区间"
              field="scoreRange"
              :min="0"
              :max="100"
              start-placeholder="最低分"
              end-placeholder="最高分"
            />
            <u-tree-select
              label="地区"
              field="region"
              :data="regionTree"
              clearable
              placeholder="请选择地区"
            />
            <u-multi-tree-select
              label="多选地区"
              field="regionsMulti"
              :data="regionTree"
              clearable
              placeholder="请选择多个地区"
            />
            <u-cascade
              label="地址"
              field="address"
              :data="addressTree"
              clearable
              placeholder="请选择地址"
            />

            <u-rich-text-editor label="内容" field="content" placeholder="请输入富文本内容" />
            <u-code-editor label="代码" field="code" language="js" :default-lines="6" />
            <u-expression-editor
              label="表达式"
              field="expression"
              :variables="exprVariables"
              placeholder="请输入表达式，@ 可插入变量"
            />
            <u-group-input label="联系人" field="contacts" :max="5" creatable>
              <template #default="{ item }">
                <span style="display: flex; gap: 8px; align-items: center">
                  <u-input v-model="item.name" placeholder="姓名" style="flex: 1" />
                  <u-input v-model="item.phone" placeholder="电话" style="flex: 1" />
                </span>
              </template>
            </u-group-input>
          </u-form>
        </template>

        <template #display>
          <div style="margin-top: 16px">
            <div style="margin-bottom: 16px">
              <strong>表单数据</strong>
              <pre
                style="
                  background: #f5f5f5;
                  padding: 12px;
                  border-radius: 4px;
                  font-size: 13px;
                  overflow: auto;
                "
                >{{ JSON.stringify(dataDisplay, null, 2) }}</pre
              >
            </div>

            <div style="margin-bottom: 16px">
              <strong>校验错误</strong>
              <pre
                style="
                  background: #f5f5f5;
                  padding: 12px;
                  border-radius: 4px;
                  font-size: 13px;
                  overflow: auto;
                "
                >{{ errorsDisplay.length ? JSON.stringify(errorsDisplay, null, 2) : '无' }}</pre
              >
            </div>

            <div style="display: flex; gap: 12px; flex-wrap: wrap">
              <u-button type="primary" @click="handleValidate">校验表单</u-button>
              <u-button @click="handleReset">重置表单</u-button>
              <u-button @click="handleClearValidate">清除校验</u-button>
              <u-pop-confirm title="确定要清空所有数据吗？" @confirm="handleClearData">
                <template #reference>
                  <u-button type="danger">清空数据</u-button>
                </template>
              </u-pop-confirm>
              <u-pop-confirm title="确定要恢复初始数据吗？" @confirm="handleLoadInitialData">
                <template #reference>
                  <u-button>加载示例数据</u-button>
                </template>
              </u-pop-confirm>
            </div>
          </div>
        </template>
      </u-tabs>
    </u-card-content>
  </u-card>
</template>

<script lang="ts" setup>
import { o } from '@cat-kit/core'
import { FormModel, nestField } from '@veltra/desktop'
import { computed, shallowRef } from 'vue'

// --------------- Tab ---------------

const activeTab = shallowRef('basic')
const tabItems = [
  { key: 'basic', name: '基础控件' },
  { key: 'advanced', name: '高级控件' },
  { key: 'display', name: '展示数据' }
]

// --------------- 独立 Tree 选中（不通过 form field 绑定） ---------------

const treeSelected = shallowRef()

// --------------- 模型定义 ---------------

const model = new FormModel({
  account: nestField({ username: { value: '' }, password: { value: '' } }),
  description: { value: '' },
  grade: { value: '' },
  city: { value: '' },
  age: { value: 18 },
  progress: { value: 50 },
  active: { value: true },
  agree: { value: false },
  birthday: { value: '' },
  color: { value: '#1890ff' },

  hobbies: { value: [] as string[] },
  gender: { value: '' },
  courses: { value: [] as string[] },
  vacation: { value: undefined as [string, string] | undefined },
  scoreRange: { value: [0, 100] as [number | undefined, number | undefined] },
  region: { value: '' },
  regionsMulti: { value: [] as string[] },
  address: { value: [] as string[] },
  content: { value: '' },
  code: { value: 'console.log("Hello Ultra UI")' },
  expression: { value: '' },
  contacts: { value: [] as Record<string, any>[] }
})

// --------------- 静态数据 ---------------

const gradeList = [
  { label: '一年级', value: '1' },
  { label: '二年级', value: '2' },
  { label: '三年级', value: '3' },
  { label: '四年级', value: '4' },
  { label: '五年级', value: '5' },
  { label: '六年级', value: '6' }
]

const citySuggestions = [
  '北京',
  '上海',
  '广州',
  '深圳',
  '杭州',
  '成都',
  '武汉',
  '南京',
  '西安',
  '重庆'
]

const hobbyList = [
  { label: '阅读', value: 'reading' },
  { label: '运动', value: 'sports' },
  { label: '音乐', value: 'music' },
  { label: '旅行', value: 'travel' },
  { label: '编程', value: 'coding' }
]

const genderList = [
  { label: '男', value: 'male' },
  { label: '女', value: 'female' },
  { label: '保密', value: 'unknown' }
]

const courseList = [
  { label: '语文', value: 'chinese' },
  { label: '数学', value: 'math' },
  { label: '英语', value: 'english' },
  { label: '物理', value: 'physics' },
  { label: '化学', value: 'chemistry' },
  { label: '生物', value: 'biology' }
]

const regionTree = [
  {
    label: '中国',
    value: 'china',
    children: [
      {
        label: '广东',
        value: 'guangdong',
        children: [
          { label: '广州', value: 'guangzhou' },
          { label: '深圳', value: 'shenzhen' },
          { label: '东莞', value: 'dongguan' }
        ]
      },
      {
        label: '浙江',
        value: 'zhejiang',
        children: [
          { label: '杭州', value: 'hangzhou' },
          { label: '宁波', value: 'ningbo' }
        ]
      }
    ]
  },
  {
    label: '美国',
    value: 'usa',
    children: [
      { label: '加利福尼亚', value: 'california' },
      { label: '纽约', value: 'newyork' }
    ]
  }
]

const addressTree = [
  {
    label: '广东省',
    value: 'guangdong',
    children: [
      {
        label: '深圳市',
        value: 'shenzhen',
        children: [
          { label: '南山区', value: 'nanshan' },
          { label: '福田区', value: 'futian' },
          { label: '宝安区', value: 'baoan' }
        ]
      },
      {
        label: '广州市',
        value: 'guangzhou',
        children: [
          { label: '天河区', value: 'tianhe' },
          { label: '越秀区', value: 'yuexiu' }
        ]
      }
    ]
  },
  {
    label: '浙江省',
    value: 'zhejiang',
    children: [
      {
        label: '杭州市',
        value: 'hangzhou',
        children: [
          { label: '西湖区', value: 'xihu' },
          { label: '余杭区', value: 'yuhang' }
        ]
      }
    ]
  }
]

const exprVariables = [
  { label: '用户名', value: 'user.name' },
  { label: '年龄', value: 'user.age' },
  { label: '邮箱', value: 'user.email' }
]

// --------------- 数据展示 ---------------

const dataDisplay = computed(() => {
  const d: Record<string, any> = {}
  model.allKeys.forEach((key) => {
    d[key] = (model.data as Record<string, any>)[key]
  })
  return d
})

const errorsDisplay = computed(() => {
  const errs: Record<string, any> = {}
  model.errors.forEach((val, key) => {
    errs[key] = val
  })
  return errs
})

// --------------- 操作 ---------------

async function handleValidate() {
  try {
    await model.validate()
    console.log('校验通过')
  } catch {
    console.log('校验失败', [...model.errors.entries()])
  }
}

function handleReset() {
  model.resetData()
  model.clearValidate()
}

function handleClearValidate() {
  model.clearValidate()
}

function handleClearData() {
  model.allKeys.forEach((key) => {
    o(model.data).set(key, undefined)
  })
}

function handleLoadInitialData() {
  model.setData({
    account: { username: '张三', password: 'abc123' },
    description: '这是一段简介文字',
    grade: '3',
    city: '杭州',
    age: 25,
    progress: 75,
    active: false,
    agree: true,
    birthday: '2000-01-01',
    color: '#f5222d',
    hobbies: ['reading', 'coding'],
    gender: 'male',
    courses: ['math', 'physics'],
    vacation: ['2026-06-01', '2026-06-07'],
    scoreRange: [60, 90],
    region: 'shenzhen',
    regionsMulti: ['guangzhou', 'shenzhen'],
    address: ['guangdong', 'shenzhen', 'nanshan'],
    code: 'const sum = (a, b) => a + b',
    contacts: [
      { name: '联系人一', phone: '13800138000' },
      { name: '联系人二', phone: '13900139000' }
    ]
  })
}
</script>
