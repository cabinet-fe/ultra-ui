---
title: Ultra UI 列表页与详情页场景
description: 端到端拼装中后台列表页与详情页：ULayout + UDualNav 后台布局、UCard 划分页面区块、UTable（defineTableColumns）+ UPaginator 服务端分页、messageConfirm 增删二次确认、UDrawer 详情与 UDialog 弹窗表单；模板组件交给 VeltraUIResolver 按需引入并注入样式，渲染函数与函数式 API 显式 import 并补样式子路径。
aliases: [列表页, 详情页, 中后台页面, CRUD 页面, 管理后台]
keywords: [VeltraUIResolver, defineTableColumns, UTable, UPaginator, ULayout, UCard, UCardHeader, UCardContent, UDualNav, UDialog, UDrawer, messageConfirm, onClosed, rowKey, vLoading, components/action/style, 渲染函数, 裸样式, 列表分页, 删除确认, 二次确认, 详情抽屉, 搜索列表, 页面区块, 面板, 卡片, 空态]
---

# Ultra UI 列表页与详情页场景

Ultra UI（`@veltra/*`）的中后台典型页面方案：`ULayout` + `UDualNav` 做后台布局，`UTable`（`defineTableColumns`）+ `UPaginator` 做服务端分页列表，`messageConfirm` 做增删二次确认，`UDrawer` 做详情，`UDialog` 做弹窗表单。模板里的 `u-*` 组件由 `VeltraUIResolver` 自动引入并注入样式，禁止在 `<script setup>` 里再 import 同名组件；`h()` 渲染函数里的 `UAction` / `UActionGroup` 与函数式 API `message` / `messageConfirm` / `vLoading` 必须显式 import，并补 `@veltra/desktop/components/<目录>/style` 样式子路径。

## 场景

- 何时用本方案：从零拼一个「侧栏布局 + 搜索 + 表格 + 分页 + 弹窗编辑 + 抽屉详情」的用户管理类页面。
- 何时不用：单表单页（改用 `recipes/form.md`）；数据全在前端内存、无需服务端分页时直接对数组分片，不引入 `UPaginator`。

## 完整示例

构建配置、入口与页面：

```ts
// vite.config.ts —— 模板里的 u-* 组件由 VeltraUIResolver 自动引入并注入样式副作用
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import { defineConfig } from 'vite'
import { VeltraUIResolver } from '@veltra/vite'

export default defineConfig({
  plugins: [vue(), Components({ resolvers: [VeltraUIResolver()] })]
})
```

```ts
// src/main.ts —— 主题必须初始化，否则组件无颜色
import { createApp } from 'vue'
import App from './App.vue'
import '@veltra/styles/normalize'
import { loadTheme } from '@veltra/styles/theme'

loadTheme()

createApp(App).mount('#app')
```

```vue
<!-- src/views/UserPage.vue —— 布局 + 搜索 + 表格 + 分页 + 确认 + 抽屉详情 + 弹窗表单 -->
<script setup lang="ts">
// 模板组件（u-layout / u-dual-nav / u-scroll / u-card / u-input / u-button / u-table /
// u-empty / u-paginator / u-drawer / u-dialog / u-form）交给 VeltraUIResolver 自动引入并注入样式，
// 禁止在这里 import 同名组件：显式 import 会让模板改用该绑定，resolver 不再注入样式副作用。
import { h, reactive, ref, shallowRef } from 'vue'
// h() / render 里的组件与函数式 API 不经过模板编译，resolver 不会解析，必须显式 import
import {
  UAction,
  UActionGroup,
  defineTableColumns,
  message,
  messageConfirm,
  vLoading
} from '@veltra/desktop'
// 显式 import 的组件与函数式 API 必须自己补样式子路径；同目录多组件共用一条
import '@veltra/desktop/components/action/style'
import '@veltra/desktop/components/loading/style'
import '@veltra/desktop/components/message/style'
import '@veltra/desktop/components/message-confirm/style'
import type { DualNavRootItem, FormExposed, NavItem } from '@veltra/desktop'
import { HouseFilled, Setting, User } from '@veltra/icons/normal'

// ---- 侧栏导航 ----
const currentPath = ref('/users')
const menus: DualNavRootItem[] = [
  { title: '工作台', icon: HouseFilled, path: '/home' },
  {
    title: '系统',
    icon: Setting,
    path: '/system',
    children: [{ title: '用户', icon: User, path: '/users' }]
  }
]
function onNavClick(item: NavItem) {
  currentPath.value = item.path
}

// ---- 搜索与分页 ----
const keyword = ref('')
const pageNumber = ref(1)
const pageSize = ref(20)
const total = ref(0)
const rows = shallowRef<Record<string, unknown>[]>([])
const loading = ref(false)

async function query() {
  loading.value = true
  try {
    const res = await fetchRows({
      keyword: keyword.value,
      pageNumber: pageNumber.value,
      pageSize: pageSize.value
    })
    rows.value = res.list
    total.value = res.total
  } catch {
    message.error('加载失败，请重试')
  } finally {
    loading.value = false
  }
}

async function fetchRows(params: Record<string, unknown>) {
  // 替换为真实接口：<你的列表接口>
  const res = await fetch('/api/users?' + new URLSearchParams(params as Record<string, string>))
  if (!res.ok) throw new Error(String(res.status))
  return (await res.json()) as { list: Record<string, unknown>[]; total: number }
}

// ---- 表格列 ----
const columns = defineTableColumns([
  { key: 'name', name: '姓名' },
  { key: 'status', name: '状态', align: 'center' },
  {
    key: 'actions',
    name: '操作',
    // render 用 h() 返回 VNode；UAction 的事件是 run（不是 click）
    render: ({ rowData }) =>
      h(UActionGroup, { max: 4 }, () => [
        h(UAction, { onRun: () => openDetail(rowData) }, () => '详情'),
        h(UAction, { onRun: () => openEdit(rowData) }, () => '编辑'),
        h(UAction, { needConfirm: true, type: 'danger' as const, onRun: () => removeRow(rowData) }, () => '删除')
      ])
  }
])

// ---- 删除：messageConfirm 二次确认 ----
async function removeRow(rowData: Record<string, unknown>) {
  const action = await messageConfirm({
    title: '删除确认',
    message: `确认删除「${rowData['name']}」吗？删除后不可恢复。`,
    confirmButtonType: 'danger',
    cancelButtonText: '取消'
  }).onClosed // => 'confirm' 或 'cancel'
  if (action !== 'confirm') return
  await fetch(`/api/users/${rowData['id']}`, { method: 'DELETE' })
  message.success('已删除')
  query()
}

// ---- 详情抽屉 ----
const detailVisible = ref(false)
const detail = shallowRef<Record<string, unknown>>({})
function openDetail(rowData: Record<string, unknown>) {
  detail.value = rowData
  detailVisible.value = true
}

// ---- 弹窗表单（新建 / 编辑共用）----
const dialogVisible = ref(false)
const dialogTitle = ref('新建用户')
const formRef = shallowRef<FormExposed>()
const form = reactive({ id: undefined as number | undefined, name: '', status: '' })

function openEdit(rowData: Record<string, unknown>) {
  dialogTitle.value = '编辑用户'
  Object.assign(form, { id: rowData['id'], name: rowData['name'], status: rowData['status'] })
  dialogVisible.value = true
}

async function submitDialog(close: () => void) {
  const valid = await formRef.value?.validate()
  if (!valid) return
  await fetch('/api/users', { method: 'POST', body: JSON.stringify(form) })
  message.success('已保存')
  close()
  query()
}

query()
</script>

<template>
  <u-layout cols="auto 1fr" style="height: 100vh">
    <u-dual-nav :menus="menus" :current-path="currentPath" @item-click="onNavClick" />

    <u-scroll>
      <!-- 搜索条与表格：外层用 u-card 划分页面区块，不要自己写 div + --u-* 手搓面板 -->
      <u-card style="margin: 12px">
        <u-card-content>
          <!-- 搜索条：不在 u-form 内，控件用 v-model -->
          <div style="display: flex; gap: 8px">
            <u-input v-model="keyword" placeholder="姓名" clearable style="width: 220px" />
            <u-button
              type="primary"
              @click="
                pageNumber = 1;
                query()
              "
            >
              查询
            </u-button>
            <u-button
              @click="
                Object.assign(form, { id: undefined, name: '', status: '' });
                dialogTitle = '新建用户';
                dialogVisible = true
              "
            >
              新建
            </u-button>
          </div>
        </u-card-content>
      </u-card>

      <!-- 表格 + 分页 -->
      <u-card style="margin: 0 12px">
        <u-card-content>
          <div v-loading="loading">
            <u-table :data="rows" :columns="columns" row-key="id" border>
              <!-- 空态由 UTable 内置，文案用 #empty 覆盖；不要用 v-if 整表切换 -->
              <template #empty>
                <u-empty text="暂无数据" />
              </template>
            </u-table>
          </div>
        </u-card-content>
      </u-card>
      <div style="display: flex; justify-content: flex-end; margin: 12px">
        <!-- UPaginator 自带「共 N 条」文案与每页条数选择器，不要另写条数统计 -->
        <u-paginator
          v-model:page-number="pageNumber"
          v-model:page-size="pageSize"
          :total="total"
          @change:page-number="query"
          @change:page-size="query"
        />
      </div>

      <!-- 详情抽屉 -->
      <u-drawer v-model="detailVisible" show-close>
        <u-card integrate>
          <u-card-header>用户详情</u-card-header>
          <u-card-content>
            <div class="detail-row"><span>姓名</span><span>{{ detail['name'] }}</span></div>
            <div class="detail-row"><span>状态</span><span>{{ detail['status'] }}</span></div>
          </u-card-content>
        </u-card>
      </u-drawer>

      <!-- 弹窗表单 -->
      <u-dialog v-model="dialogVisible" :title="dialogTitle">
        <u-form ref="formRef" :model="form" label-width="80px" :cols="1">
          <u-input label="姓名" field="name" :rules="{ required: '姓名不能为空' }" />
          <u-input label="状态" field="status" />
        </u-form>
        <template #footer="{ close }">
          <u-button text @click="close()">取消</u-button>
          <u-button type="primary" @click="submitDialog(close)">确定</u-button>
        </template>
      </u-dialog>
    </u-scroll>
  </u-layout>
</template>

<style scoped>
.detail-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 6px 0;
}
</style>
```

期望结果：左侧双栏导航，右侧「搜索 + 表格」与分页各占一张 `UCard` 区块；点「详情」右侧滑出抽屉；点「删除」弹出红色确认框，确认后行数据从接口删除并刷新列表；点「新建 / 编辑」弹出表单弹窗，校验不通过不关闭。

## 要点说明

- `defineTableColumns`：列定义辅助函数，提供类型推导；列用 `{ key, name }` 描述，`key` 对应 `rowData[key]` 取值，`render` 自定义单元格（优先级高于 `#column:{key}` 插槽）。
- `UTable` 的 `row-key`：未设置时内部用自增 uid 标识行；用受控选中或多选时必须设置。`UTable` 不内置分页与排序：分页配合 `UPaginator`，排序自行对 `data` 排序后传入。
- `UTable` 空态：`data` 为空数组或 `undefined` 时组件在 tbody 内渲染默认空态，文案用 `#empty` 插槽覆盖——禁止用 `v-if="rows.length"` 把整张表换成 `UEmpty`，那样会连表头一起消失。
- `UCard` 划分页面区块：搜索条、表格、详情内容各放一张 `UCard`，标题走 `UCardHeader`、正文走 `UCardContent`。禁止用裸 `div` 加 `background: var(--u-bg-color-top)`、`border`、`border-radius`、`padding: 16px` 手搓等价面板——那种写法不跟随 `loadTheme()` 的深浅色主题，且每个页面重复一遍。抽屉内没有页面底色，用 `integrate` 去掉卡片阴影与边框。
- `UPaginator`：`v-model:page-number` / `v-model:page-size` 双向绑定，`total` 计算总页数；重新拉数据监听 `@change:page-number` 与 `@change:page-size` 两个事件——改每页条数会把页码重置为 1 且只触发 `change:pageSize`。
- `messageConfirm(...).onClosed`：Promise 兑现 `'confirm' | 'cancel'`，含关闭动画结束后兑现、从不 reject；删除类确认用 `confirmButtonType: 'danger'`，取消按钮必须传 `cancelButtonText`（默认 `''` 时不渲染）。
- `UDrawer`：`v-model` 控制显隐，默认从右侧滑出，宽 `320px`；没有 `size` / `width` prop，自定义尺寸须覆盖 `.u-drawer` 样式类。
- `UDialog`：标题栏与关闭按钮由组件提供；操作按钮放 `#footer`，插槽参数含 `close()`，保存成功后调 `close()` 关闭。
- `UDualNav`：`current-path` + `@item-click` 受控，没有 `v-model:current-path`；不内置 vue-router，跳转在 `item-click` 回调里自己做。
- `vLoading` 指令：未走 `app.use(UltraUI)` 全量注册时必须从 `@veltra/desktop` 显式导入（`VeltraUIResolver` 不处理指令），并补 `import '@veltra/desktop/components/loading/style'`。
- 空态用 `UEmpty`（模板组件，走 resolver，不写 import）；请求失败用 `message.error`（显式 import，配 `import '@veltra/desktop/components/message/style'`）。
- 样式副作用与显式 import 成对出现：`VeltraUIResolver` 只重写模板里没有 `<script setup>` 绑定的 `_resolveComponent(...)` 调用，显式 import 的组件不再产生该调用，resolver 既不注入组件 import 也不注入样式。本页显式 import 的组件与函数式 API 必须各补一条样式子路径：

  ```ts
  import '@veltra/desktop/components/action/style' // UAction、UActionGroup 共用
  import '@veltra/desktop/components/loading/style' // vLoading 指令
  import '@veltra/desktop/components/message/style' // message
  import '@veltra/desktop/components/message-confirm/style' // messageConfirm
  ```

  同目录多组件共用一条路径（`UAction`、`UActionGroup` 都是 `components/action/style`），样式路径的最后一段就是组件所在目录名；拿不准时改用入口全量样式 `import '@veltra/desktop/style'`。漏写时页面结构与 class 都正确，但 DevTools 的 Styles 面板里搜不到 `.u-action` / `.u-message` 规则，呈现裸样式。`h()` / `render` / JSX 里的组件不经过模板编译，resolver 永不解析：本页 `h(UActionGroup, ...)` / `h(UAction, ...)` 必须显式 import，漏写时运行时报 `ReferenceError: UAction is not defined`。

## 注意事项

> [!WARNING]
> - 页面区块、面板、详情抽屉内容一律用 `UCard`（`UCardHeader` / `UCardContent` / `UCardAction`），禁止自己写 `div` + `--u-*` 手搓「白底 + 边框 + 圆角 + 内边距」的面板；抽屉内用 `integrate` 去掉阴影与边框。
> - `UTable` 的空态由组件内置，文案走 `#empty` 插槽；用 `v-if` 切换整张表会让表头一起消失。
> - 显式 import 的组件必须补 `import '@veltra/desktop/components/<目录>/style'`：resolver 只处理模板里没有同名绑定的组件，写了 `import { UAction } from '@veltra/desktop'` 就必须写 `import '@veltra/desktop/components/action/style'`，否则结构正确但裸样式。`h()` / `render` 里的组件永不被 resolver 解析，必须显式 import，漏写报 `ReferenceError: UTag is not defined`。
> - 本库事件名是 `change:pageNumber` / `change:pageSize`，不是 Element Plus 的 `current-change` / `size-change`；`UPaginator` 是两个独立 `v-model`，不是 `current-page` 单向 prop。
> - `UDualNav` 用 `currentPath` 受控，没有 `v-model:current-path`；菜单项 `title` / `path` 必填。
> - `messageConfirm` 是函数式 API，直接在 `document.body` 渲染，不需要挂到组件树；`instance.close()` 缺省 action 按 `'cancel'` 处理。
> - `UTable` 没有内置分页、排序、远端数据加载；`data` 就是当前页数据，不要传全量数据指望它分页。
> - 抽屉尺寸固定：左右方向宽 `320px`、上下方向高 `320px`；本库没有 `size` / `width` prop。
> - 弹窗表单内的控件必须写 `field` 且禁止再写 `v-model`（详见 `recipes/form.md`）；搜索条等表单外的控件才用 `v-model`。
