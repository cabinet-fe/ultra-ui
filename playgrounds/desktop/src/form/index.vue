<template>
  <u-card>
    <u-card-header>表单综合示例</u-card-header>

    <u-card-content>
      <u-form ref="formRef" :model="formData" label-width="110px">
        <div class="form-section">账号信息</div>
        <u-input
          label="用户名"
          field="account.username"
          :rules="{ required: true, minLen: [2, '至少 2 个字符'] }"
          placeholder="请输入用户名"
        />

        <u-form-item label="密码" field="account.password" :rules="{ required: true, minLen: 6 }">
          <u-password-input v-model="formData.account.password" placeholder="请输入密码" />
        </u-form-item>

        <div class="form-section">基础输入</div>
        <u-textarea
          label="简介"
          field="description"
          :rows="3"
          span="full"
          placeholder="请输入简介"
        />
        <u-select
          label="年级"
          field="grade"
          :options="gradeList"
          :rules="{ required: true }"
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
        <u-number-input
          label="年龄"
          field="age"
          :min="0"
          :max="150"
          :step="1"
          :rules="{ min: 0, max: 150 }"
        />

        <div class="form-section">选择与开关</div>
        <u-slider label="进度" field="progress" :min="0" :max="100" />
        <u-switch label="启用" field="active" active-text="开" inactive-text="关" />
        <u-checkbox
          label="同意协议"
          field="agree"
          :rules="{ validator: (val) => (!val ? '请先同意协议' : '') }"
        />
        <u-palette label="主题色" field="color" />

        <div class="form-section">日期</div>
        <u-date-picker
          label="生日"
          field="birthday"
          :rules="{ required: true }"
          clearable
          placeholder="请选择日期"
        />
        <u-date-range-picker
          label="假期"
          field="vacation"
          clearable
          :placeholder="['开始日期', '结束日期']"
        />

        <div class="form-section">多选与单选</div>
        <u-checkbox-group
          label="爱好"
          field="hobbies"
          :items="hobbyList"
          :rules="{ required: true }"
          span="full"
        />
        <u-radio-group
          label="性别"
          field="gender"
          :items="genderList"
          :rules="{ required: true }"
        />
        <u-multi-select
          label="选修课程"
          field="courses"
          :options="courseList"
          clearable
          filterable
          placeholder="请选择课程"
        />

        <div class="form-section">树形与级联</div>
        <u-tree-select
          label="地区"
          field="region"
          :data="regionTree"
          :rules="{ required: true }"
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
          :rules="{ required: true }"
          clearable
          placeholder="请选择地址"
        />

        <div class="form-section">数值区间</div>
        <u-number-range-input
          label="分数区间"
          field="scoreRange"
          :min="0"
          :max="100"
          :rules="{ validator: validateScoreRange }"
          start-placeholder="最低分"
          end-placeholder="最高分"
        />

        <div class="form-section">高级编辑</div>
        <u-rich-text-editor
          label="富文本"
          field="content"
          span="full"
          placeholder="请输入富文本内容"
        />
        <u-code-editor
          label="代码"
          field="code"
          language="js"
          span="full"
          :default-lines="6"
          :rules="{ required: true }"
        />
        <u-expression-editor
          label="表达式"
          field="expression"
          span="full"
          :variables="exprVariables"
          placeholder="请输入表达式，@ 可插入变量"
        />
        <u-group-input label="联系人" field="contacts" :max="5" creatable span="full">
          <template #default="{ item }">
            <span class="contact-row">
              <u-input v-model="item.name" placeholder="姓名" />
              <u-input v-model="item.phone" placeholder="电话" />
            </span>
          </template>
        </u-group-input>
      </u-form>

      <!-- 实时数据预览 -->
      <div class="form-preview">
        <strong>表单数据</strong>
        <pre>{{ JSON.stringify(formData, null, 2) }}</pre>
      </div>
    </u-card-content>

    <u-card-content>
      <!-- 操作按钮 -->
      <div class="form-actions">
        <u-button type="primary" @click="handleValidate">验证</u-button>
        <u-button @click="handleClearValidate">清空验证</u-button>
        <u-button @click="handleReset">重置</u-button>
        <u-button @click="handleFillSample">填充示例</u-button>
      </div>
    </u-card-content>
  </u-card>
</template>

<script lang="ts" setup>
import type { FormExposed } from '@veltra/desktop'
import { reactive, shallowRef } from 'vue'

const formRef = shallowRef<FormExposed>()

const formData = reactive({
  account: { username: '', password: '' },
  description: '',
  grade: '',
  city: '',
  age: 18,
  progress: 50,
  active: true,
  agree: false,
  birthday: '',
  color: '#1890ff',
  hobbies: [] as string[],
  gender: '',
  courses: [] as string[],
  vacation: undefined as [string, string] | undefined,
  scoreRange: [0, 100] as [number, number],
  region: '',
  regionsMulti: [] as string[],
  address: [] as string[],
  content: '',
  code: 'console.log("Hello Ultra UI")',
  expression: '',
  contacts: [] as Record<string, any>[]
})

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

/** 分数区间自定义校验：最低分不能高于最高分 */
function validateScoreRange(val: [number, number] | undefined) {
  if (!val?.length) return ''
  const [min, max] = val
  if (min != null && max != null && min > max) return '最低分不能高于最高分'
  return ''
}

async function handleValidate() {
  const valid = await formRef.value?.validate()
  console.log(valid ? '校验通过' : '校验失败', formData)
}

function handleReset() {
  formRef.value?.reset()
}

function handleClearValidate() {
  formRef.value?.clearValidate()
}

/** 填充示例数据，便于快速体验校验与展示 */
function handleFillSample() {
  Object.assign(formData, {
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
    content: '<p>示例富文本</p>',
    code: 'const sum = (a, b) => a + b',
    expression: '@user.name',
    contacts: [
      { name: '联系人一', phone: '13800138000' },
      { name: '联系人二', phone: '13900139000' }
    ]
  })
  formRef.value?.clearValidate()
}
</script>

<style scoped>
.form-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.form-section {
  grid-column: 1 / -1;
  margin: 8px 0 4px;
  padding-bottom: 4px;
  font-size: 14px;
  font-weight: 600;
  color: var(--u-text-color-secondary, #666);
  border-bottom: 1px solid var(--u-border-color, #eee);
}

.form-section:first-child {
  margin-top: 0;
}

.form-preview {
  margin-top: 24px;
}

.form-preview pre {
  margin-top: 8px;
  padding: 12px;
  background: var(--u-bg-color-hover, #f5f5f5);
  border-radius: 4px;
  font-size: 13px;
  overflow: auto;
}

.contact-row {
  display: flex;
  gap: 8px;
  align-items: center;
  width: 100%;
}

.contact-row > :deep(.u-input) {
  flex: 1;
}
</style>
