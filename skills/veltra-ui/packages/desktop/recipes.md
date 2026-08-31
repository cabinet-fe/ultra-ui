# 常见页面/弹窗配方（@veltra/desktop）

组合多个组件完成常见界面时的标准做法。复制后按业务改字段即可。**共同前提**：入口已 `loadTheme()`，组件已注册（见 `installation.md`）。

通用原则：

- 弹窗外壳（标题栏、关闭按钮、遮罩）由 `u-dialog` 提供，**不要自己画窗口标题栏/关闭按钮**。
- 弹窗的操作按钮（取消/确定）放 `#footer` 插槽，靠右排列由组件负责；不要把按钮放在内容区右上角。
- 列表区域用 `u-scroll` 提供滚动；无数据用 `u-empty`，加载中用 `v-loading`，请求失败用 `message.error()` 提示并给重试按钮，**不要用裸红字文本**。
- 需要颜色/间距时用主题 token（`styles/tokens.md`），不写硬编码色值。

## 记录选择弹窗（搜索 + 主从预览）

「选择数据集/选择成员/选择商品」类场景：左侧可搜索列表，右侧预览，底部取消/确定。

```vue
<script setup lang="ts">
import { computed, ref, shallowRef } from 'vue'
import { message } from '@veltra/desktop'

interface Dataset {
  id: number
  name: string
  code: string
}

const emit = defineEmits<{ select: [dataset: Dataset] }>()

const visible = ref(false)
const keyword = ref('')
const loading = ref(false)
const list = shallowRef<Dataset[]>([])
const selected = shallowRef<Dataset>()

const columns = [
  { key: 'name', name: '名称' },
  { key: 'code', name: '编码' }
]

const filtered = computed(() => {
  const kw = keyword.value.trim()
  return kw ? list.value.filter((d) => d.name.includes(kw) || d.code.includes(kw)) : list.value
})

async function open() {
  visible.value = true
  loading.value = true
  try {
    list.value = await fetchDatasets() // 替换为真实请求
  } catch {
    message.error('数据集加载失败，请重试')
  } finally {
    loading.value = false
  }
}

function confirm(close: () => void) {
  if (!selected.value) return
  emit('select', selected.value)
  close()
}

// 替换为真实请求
async function fetchDatasets(): Promise<Dataset[]> {
  return [
    { id: 1, name: '销售明细', code: 'DS_SALE' },
    { id: 2, name: '库存快照', code: 'DS_STOCK' }
  ]
}
</script>

<template>
  <u-button type="primary" @click="open">选择数据集</u-button>

  <u-dialog v-model="visible" title="选择数据集" style="width: 720px">
    <div style="display: flex; gap: 16px; height: 360px">
      <div style="flex: 1; display: flex; flex-direction: column; gap: 8px; min-width: 0">
        <u-input v-model="keyword" placeholder="搜索数据集名称 / 编码" clearable />
        <u-scroll v-loading="loading" style="flex: 1">
          <u-table
            v-model:selected="selected"
            :data="filtered"
            :columns="columns"
            row-key="id"
            selectable
            highlight-current
          />
        </u-scroll>
      </div>
      <div style="flex: 1; border-left: 1px solid var(--u-border-color); padding-left: 16px">
        <template v-if="selected">
          <h4>{{ selected.name }}</h4>
          <p>编码：{{ selected.code }}</p>
        </template>
        <u-empty v-else text="点击左侧数据集查看预览" />
      </div>
    </div>

    <template #footer="{ close }">
      <u-button text @click="close()">取消</u-button>
      <u-button type="primary" :disabled="!selected" @click="confirm(close)">
        添加所选
      </u-button>
    </template>
  </u-dialog>
</template>
```

## 搜索筛选 + 表格 + 分页页

列表页标准结构：筛选区（表单外控件自行 `v-model`）+ `u-table` + 底部 `u-paginator`。

```vue
<script setup lang="ts">
import { ref, shallowRef } from 'vue'

const keyword = ref('')
const status = ref('')
const pageNumber = ref(1)
const pageSize = ref(20)
const total = ref(0)
const rows = shallowRef<Record<string, any>[]>([])
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
    // 替换为真实请求；分页参数走 pageNumber/pageSize
    const res = await fetchRows({ keyword: keyword.value, status: status.value, pageNumber: pageNumber.value, pageSize: pageSize.value })
    rows.value = res.list
    total.value = res.total
  } finally {
    loading.value = false
  }
}

// 替换为真实请求
async function fetchRows(_params: Record<string, any>) {
  return { list: [] as Record<string, any>[], total: 0 }
}
</script>

<template>
  <div style="display: flex; gap: 8px; margin-bottom: 12px">
    <u-input v-model="keyword" placeholder="名称 / 编码" clearable style="width: 220px" />
    <u-select v-model="status" :options="statusOptions" style="width: 140px" />
    <u-button type="primary" @click="pageNumber = 1; query()">查询</u-button>
  </div>

  <u-table v-loading="loading" :data="rows" :columns="columns" border />

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

## 加载失败与空态

```vue
<script setup lang="ts">
import { ref, shallowRef } from 'vue'

const loading = ref(false)
const failed = ref(false)
const rows = shallowRef<Record<string, any>[]>([])

async function load() {
  loading.value = true
  failed.value = false
  try {
    rows.value = [] // 替换为真实请求
  } catch {
    failed.value = true
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <u-scroll v-loading="loading" height="320px">
    <u-table v-if="rows.length" :data="rows" :columns="[{ key: 'name', name: '名称' }]" />
    <div v-else-if="failed" style="text-align: center">
      <u-empty text="加载失败" />
      <u-button text type="primary" @click="load">重试</u-button>
    </div>
    <u-empty v-else text="暂无数据" style="text-align: center" />
  </u-scroll>
</template>
```
