---
title: 'pages - 常见页面拼装：中后台典型布局、弹窗表单与搜索列表页实践'
description: '基于 Ultra UI 官方组件拼装中后台管理系统典型业务页面：ULayout 与 UDualNav 经典左右/顶部侧栏布局、UDialog 配合 UForm 弹窗编辑表单、UTable 组合筛选查询与分页的列表搜索页标准模板与最佳实践'
keywords: ['pages', '@veltra/desktop', '常见页面拼装：中后台典型布局', '弹窗表单与搜索列表页实践']
aliases: ['pages']
---

组合 `@veltra/desktop` 公开组件做常见界面。前提：入口已 `loadTheme()`，组件已注册。弹窗外壳、空态、滚动条、按钮都用库组件，不要手搓窗口标题栏或空态插画。

## 后台布局

`ULayout` 分栏，`UDualNav` 做侧栏。导航项 `title` / `path` 必填，`icon` 用 `@veltra/icons/normal` 的组件。

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { DualNavRootItem, NavItem } from '@veltra/desktop'
import { HouseFilled, Setting, User } from '@veltra/icons/normal'

const currentPath = ref('/home')

const menus: DualNavRootItem[] = [
  { title: '工作台', icon: HouseFilled, path: '/home' },
  {
    title: '系统',
    icon: Setting,
    path: '/system',
    children: [
      { title: '用户', icon: User, path: '/system/users' },
      { title: '设置', icon: Setting, path: '/system/settings' }
    ]
  }
]

function onItemClick(item: NavItem) {
  currentPath.value = item.path
}
</script>

<template>
  <u-layout cols="auto 1fr" style="height: 100vh">
    <u-dual-nav :menus="menus" :current-path="currentPath" @item-click="onItemClick" />
    <u-scroll>
      <!-- 当前页面 -->
    </u-scroll>
  </u-layout>
</template>
```

`UDualNav` 用 `current-path` + `item-click` 受控，没有 `v-model:current-path`。左轨可用 `rail-variant="labeled"` 显示名称。需要可拖拽分栏时给 `ULayout` 加 `resizable` 与 `col-min-sizes`。

## 弹窗表单

标题栏和关闭按钮由 `UDialog` 提供；操作按钮放 `#footer`（插槽参数含 `close`）。表单控件走 `field`，不要写 `v-model`。

```vue
<script setup lang="ts">
import { reactive, ref, useTemplateRef } from 'vue'

const visible = ref(false)
const formRef = useTemplateRef('form')
const form = reactive({ name: '', role: '' })

const roleOptions = [
  { label: '管理员', value: 'admin' },
  { label: '成员', value: 'member' }
]

async function confirm(close: () => void) {
  const valid = await formRef.value?.validate()
  if (!valid) return
  close()
}
</script>

<template>
  <u-button type="primary" @click="visible = true">新建用户</u-button>

  <u-dialog v-model="visible" title="新建用户">
    <u-form ref="form" :model="form" label-width="80px" :cols="1">
      <u-input label="姓名" field="name" :rules="{ required: true }" />
      <u-select label="角色" field="role" :options="roleOptions" :rules="{ required: true }" />
    </u-form>

    <template #footer="{ close }">
      <u-button text @click="close()">取消</u-button>
      <u-button type="primary" @click="confirm(close)">确定</u-button>
    </template>
  </u-dialog>
</template>
```

## 搜索表格页

筛选区在 `u-form` **之外**，控件自行 `v-model`。列表用 `UTable`，分页用 `UPaginator`，加载用 `vLoading`，无数据用 `UEmpty`，失败用 `message.error`。

```vue
<script setup lang="ts">
import { ref, shallowRef } from 'vue'
import { message, vLoading } from '@veltra/desktop'

const keyword = ref('')
const status = ref('')
const pageNumber = ref(1)
const pageSize = ref(20)
const total = ref(0)
const rows = shallowRef<Record<string, unknown>[]>([])
const loading = ref(false)

const statusOptions = [
  { label: '全部', value: '' },
  { label: '启用', value: 'enabled' },
  { label: '停用', value: 'disabled' }
]

const columns = [
  { key: 'name', name: '名称' },
  { key: 'code', name: '编码' },
  { key: 'status', name: '状态' }
]

async function query() {
  loading.value = true
  try {
    const res = await fetchRows({
      keyword: keyword.value,
      status: status.value,
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

async function fetchRows(_params: Record<string, unknown>) {
  return { list: [] as Record<string, unknown>[], total: 0 }
}
</script>

<template>
  <div style="display: flex; gap: 8px; margin-bottom: 12px">
    <u-input v-model="keyword" placeholder="名称 / 编码" clearable style="width: 220px" />
    <u-select v-model="status" :options="statusOptions" style="width: 140px" />
    <u-button
      type="primary"
      @click="
        pageNumber = 1
        query()
      "
    >
      查询
    </u-button>
  </div>

  <u-scroll v-loading="loading" height="360px">
    <u-table v-if="rows.length" :data="rows" :columns="columns" border />
    <u-empty v-else text="暂无数据" />
  </u-scroll>

  <div style="display: flex; justify-content: flex-end; margin-top: 12px">
    <u-paginator
      v-model:page-number="pageNumber"
      v-model:page-size="pageSize"
      :total="total"
      @change:page-number="query"
      @change:page-size="query"
    />
  </div>
</template>
```

未走 `app.use(UltraUI)` 时，`vLoading` 必须从 `@veltra/desktop` 手动导入（resolver 不处理指令）。
