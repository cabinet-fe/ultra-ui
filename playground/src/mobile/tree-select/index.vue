<template>
  <div class="demo">
    <section>
      <h3>基础用法（组织树，value-key=id / label-key=name）</h3>
      <UTreeSelect
        v-model="single"
        :data="orgData"
        value-key="id"
        label-key="name"
        :disabled-node="disabledNode"
        placeholder="请选择单位"
        @change="onChange"
      />
      <p class="tip">当前值：{{ single || '未选择' }}；lockFlag 非 0 的节点置灰不可选</p>
    </section>

    <section>
      <h3>可搜索（本地过滤）</h3>
      <UTreeSelect v-model="searched" :data="orgData" value-key="id" label-key="name" filterable />
    </section>

    <section>
      <h3>默认展开全部</h3>
      <UTreeSelect v-model="expanded" :data="orgData" value-key="id" label-key="name" expand-all />
    </section>

    <section>
      <h3>远程搜索（data 为函数）</h3>
      <UTreeSelect v-model="remote" :data="remoteSearch" value-key="id" label-key="name" />
      <p class="tip">面板展开后按查询词过滤返回，初始以空串加载一次</p>
    </section>

    <section>
      <h3>禁用 / 只读</h3>
      <UTreeSelect v-model="single" :data="orgData" value-key="id" label-key="name" disabled />
      <UTreeSelect v-model="single" :data="orgData" value-key="id" label-key="name" readonly />
    </section>

    <section>
      <h3>表单行式（嵌入 UFormItem）</h3>
      <UFormItem label="所属单位">
        <UTreeSelect v-model="form" :data="orgData" value-key="id" label-key="name" />
      </UFormItem>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { UFormItem, UTreeSelect } from '@veltra/mobile'
import { shallowRef } from 'vue'
import '@veltra/mobile/components/tree-select/style'
import '@veltra/mobile/components/form-item/style'

// 组织树：与业务接口一致的数据结构（id / parentId / name / children）
interface OrgNode {
  id: string
  parentId: string
  name: string
  orgCode?: string
  lockFlag?: number
  children?: OrgNode[]
}

const orgData: OrgNode[] = [
  {
    id: '2060172129365254144',
    parentId: '0',
    name: '长江镇人民政府',
    orgCode: '039001',
    children: [
      { id: '2063915647715893248', parentId: '2060172129365254144', name: '长江镇人民政府' },
      {
        id: '2070074525868482560',
        parentId: '2060172129365254144',
        name: '财政工作办公室',
        lockFlag: 1
      },
      { id: '2085270551529119744', parentId: '2060172129365254144', name: '综合办' }
    ]
  },
  { id: '10000', parentId: '0', name: '系统级组织', orgCode: 'system', lockFlag: 1 },
  {
    id: '2058730089075040256',
    parentId: '0',
    name: '政府',
    orgCode: '001',
    children: [
      { id: '2058730185032327168', parentId: '2058730089075040256', name: '财政办' },
      { id: '2058730281736200192', parentId: '2058730089075040256', name: '综合办' }
    ]
  },
  {
    id: '1680768776556634112',
    parentId: '0',
    name: '测试测试',
    orgCode: '654321',
    children: [
      {
        id: '2100157263673487361',
        parentId: '1680768776556634112',
        name: '测试单位1',
        children: [
          { id: '2100157468351328258', parentId: '2100157263673487361', name: '测试部门1' },
          { id: '2100157618134118402', parentId: '2100157263673487361', name: '测试部门2' }
        ]
      },
      { id: '2100157368799522818', parentId: '1680768776556634112', name: '测试单位2' }
    ]
  },
  {
    id: '2060246746100523008',
    parentId: '0',
    name: '如皋港工业园区',
    orgCode: '039004',
    children: [
      { id: '2083078255916212224', parentId: '2060246746100523008', name: '宣传' },
      { id: '2083078438339076096', parentId: '2060246746100523008', name: '创建' },
      { id: '2083078621839876096', parentId: '2060246746100523008', name: '统战' },
      { id: '2083078894033428480', parentId: '2060246746100523008', name: '民政办公室' },
      { id: '2083079003819335680', parentId: '2060246746100523008', name: '文化站' }
    ]
  },
  { id: '2100844790025744385', parentId: '0', name: '南通科技职业技术学院', orgCode: '654322' }
]

const single = shallowRef<string | number>()
const searched = shallowRef<string | number>('2085270551529119744')
const expanded = shallowRef<string | number>()
const remote = shallowRef<string | number>()
const form = shallowRef<string | number>()

// 模拟远程搜索：按查询词过滤组织树
function remoteSearch(qs: string): Promise<OrgNode[]> {
  const keyword = qs.trim().toLowerCase()
  const filterTree = (nodes: OrgNode[]): OrgNode[] =>
    nodes.flatMap((node) => {
      const children = filterTree(node.children ?? [])
      const matched = !keyword || node.name.toLowerCase().includes(keyword)
      return matched || children.length ? [{ ...node, children }] : []
    })
  return new Promise((resolve) => {
    setTimeout(() => resolve(filterTree(orgData)), 300)
  })
}

// 用户侧自定义禁用判定：lockFlag 非 0 的节点禁用
function disabledNode(node: Record<string, any>) {
  return node.lockFlag === 1
}

function onChange(node?: Record<string, any>) {
  console.log('change', node)
}
</script>

<style lang="scss" scoped>
.demo {
  display: flex;
  flex-direction: column;
  gap: 20px;

  h3 {
    margin: 0 0 8px;
    font-size: 13px;
    font-weight: 600;
    color: var(--u-text-color-title);
  }

  section {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
}

.tip {
  margin: 0;
  font-size: 12px;
  color: var(--u-text-color-second);
}
</style>
