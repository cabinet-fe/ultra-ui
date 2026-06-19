<template>
  <div>
    <u-card>
      <u-card-header>基础表格</u-card-header>
      <u-card-content>
        <u-table
          style="height: 500px"
          :data="students"
          :columns="columns"
          v-model:checked="checked"
        >
          <template #column:action>
            <u-action-group :max="4">
              <u-action need-confirm type="danger">删除</u-action>
            </u-action-group>
          </template>
        </u-table>
      </u-card-content>
    </u-card>

    <u-card style="margin-top: 24px">
      <u-card-header>树形表格</u-card-header>
      <u-card-content>
        <u-table
          style="height: 500px"
          :data="orgData"
          :columns="treeColumns"
          tree
          default-expand-all
          v-model:checked="treeChecked"
        />
      </u-card-content>
    </u-card>
  </div>
</template>

<script lang="ts" setup>
import { defineTableColumns } from '@veltra/desktop'
import { shallowRef } from 'vue'

const seeds = [
  { name: '张三', age: 15, grade: '高一', class: '1班', score: 95 },
  { name: '李四', age: 16, grade: '高二', class: '2班', score: 88 },
  { name: '王五', age: 17, grade: '高三', class: '3班', score: 92 }
]

// 扩展至 200 行以覆盖 u-table 默认 virtualThreshold=80 的虚拟分支，
// 同时保持原有列的展示含义，便于手动回归。
const students = Array.from({ length: 10 }).map((_, i) => {
  const seed = seeds[i % seeds.length]!
  return Object.assign({ id: i + 1 }, seed, { name: `${seed.name}-${i}` })
})

const checked = shallowRef([])

const columns = defineTableColumns([
  { key: 'name', name: '姓名', width: 60, fixed: 'left' },
  { key: 'age', name: '年龄', align: 'center' },
  { key: 'grade', name: '年级', align: 'center' },
  { key: 'class', name: '班级', align: 'center' },
  { key: 'score', name: '分数', align: 'center' },
  { key: 'action', name: '操作', align: 'center' }
])

// ── 树形数据 ──

interface OrgNode {
  id: number
  name: string
  role: string
  headcount: number
  children?: OrgNode[]
}

const orgData: OrgNode[] = [
  {
    id: 1,
    name: '技术部',
    role: '部门',
    headcount: 45,
    children: [
      {
        id: 11,
        name: '前端组',
        role: '团队',
        headcount: 15,
        children: [
          { id: 111, name: '张三', role: '高级工程师', headcount: 1 },
          { id: 112, name: '李四', role: '工程师', headcount: 1 },
          { id: 113, name: '王五', role: '实习生', headcount: 1 }
        ]
      },
      {
        id: 12,
        name: '后端组',
        role: '团队',
        headcount: 20,
        children: [
          { id: 121, name: '赵六', role: '高级工程师', headcount: 1 },
          { id: 122, name: '钱七', role: '工程师', headcount: 1 }
        ]
      },
      {
        id: 13,
        name: '测试组',
        role: '团队',
        headcount: 10,
        children: [{ id: 131, name: '孙八', role: '高级测试工程师', headcount: 1 }]
      }
    ]
  },
  {
    id: 2,
    name: '产品部',
    role: '部门',
    headcount: 20,
    children: [
      {
        id: 21,
        name: '产品一组',
        role: '团队',
        headcount: 8,
        children: [
          { id: 211, name: '周九', role: '产品经理', headcount: 1 },
          { id: 212, name: '吴十', role: '助理产品经理', headcount: 1 }
        ]
      },
      {
        id: 22,
        name: '产品二组',
        role: '团队',
        headcount: 12,
        children: [{ id: 221, name: '郑十一', role: '产品总监', headcount: 1 }]
      }
    ]
  },
  {
    id: 3,
    name: '设计部',
    role: '部门',
    headcount: 12,
    children: [
      {
        id: 31,
        name: 'UI 设计组',
        role: '团队',
        headcount: 6,
        children: [
          { id: 311, name: '冯十二', role: '高级设计师', headcount: 1 },
          { id: 312, name: '陈十三', role: '设计师', headcount: 1 }
        ]
      },
      {
        id: 32,
        name: '交互设计组',
        role: '团队',
        headcount: 6,
        children: [{ id: 321, name: '褚十四', role: '交互设计师', headcount: 1 }]
      }
    ]
  }
]

const treeChecked = shallowRef([])

const treeColumns = defineTableColumns([
  { key: 'name', name: '名称', width: 200, fixed: 'left' },
  { key: 'role', name: '角色', align: 'center' },
  { key: 'headcount', name: '人数', align: 'center' }
])
</script>
