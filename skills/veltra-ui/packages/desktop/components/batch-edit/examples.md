# UBatchEdit 示例

## 基础用法

```vue
<script setup lang="ts">
import { defineTableColumns } from '@veltra/desktop'
import { reactive, ref } from 'vue'

const columns = defineTableColumns([
  { name: '姓名', key: 'name', width: 120 },
  { name: '年龄', key: 'age', width: 80 }
])

const data = ref([
  { name: '张三', age: 28 },
  { name: '李四', age: 32 }
])

const model = reactive({ name: '', age: undefined as number | undefined })
</script>

<template>
  <u-batch-edit v-model:data="data" :columns="columns" :model="model">
    <template #form>
      <u-input field="name" label="姓名" :rules="{ required: true }" />
      <u-number-input field="age" label="年龄" :min="0" :max="120" />
    </template>
  </u-batch-edit>
</template>
```

## 带校验规则

```vue
<script setup lang="ts">
import { defineTableColumns } from '@veltra/desktop'
import { reactive, ref } from 'vue'

const columns = defineTableColumns([
  { name: '名称', key: 'name', width: 120 },
  { name: '数量', key: 'count', width: 80 }
])

const data = ref([{ name: '项目 A', count: 1 }])

const model = reactive({ name: '', count: 0 })
</script>

<template>
  <u-batch-edit v-model:data="data" :columns="columns" :model="model">
    <template #form>
      <u-input field="name" label="名称" :rules="{ required: true }" />
      <u-number-input field="count" label="数量" :rules="{ min: 0 }" />
    </template>
  </u-batch-edit>
</template>
```

## 快速编辑

开启 `quick-edit` 后，编辑行时表单会实时写回 `row.data`（经 `model` 中转），且不调用 `saveMethod`；新增仍走保存流程。

```vue
<script setup lang="ts">
import { defineTableColumns } from '@veltra/desktop'
import { reactive, ref } from 'vue'

const columns = defineTableColumns([
  { name: '姓名', key: 'name', width: 120 },
  { name: '年龄', key: 'age', width: 80 }
])

const data = ref([{ name: '张三', age: 28 }])
const model = reactive({ name: '', age: undefined as number | undefined })
</script>

<template>
  <u-batch-edit v-model:data="data" :columns="columns" :model="model" quick-edit>
    <template #form="{ row }">
      <u-input field="name" label="姓名" />
      <u-number-input field="age" label="年龄" :min="0" />
    </template>
  </u-batch-edit>
</template>
```

## 树形新增子级（写入 parentCode）

`#form` 的 `parentRow` 与 `@create-child` 均可拿到父级行；另有 `create` / `create-prev` / `create-next`。

```vue
<script setup lang="ts">
import { defineTableColumns } from '@veltra/desktop'
import type { TableRow } from '@veltra/desktop'
import { reactive, ref } from 'vue'

const columns = defineTableColumns([
  { name: '编码', key: 'code', width: 120 },
  { name: '名称', key: 'name', width: 160 },
  { name: '父级编码', key: 'parentCode', width: 120 }
])

const data = ref([
  { code: 'A', name: '根节点', parentCode: '' },
  { code: 'A-1', name: '子节点', parentCode: 'A' }
])

const model = reactive({ code: '', name: '', parentCode: '' })

function onCreateChild(row: TableRow) {
  model.parentCode = row.data.code
}
</script>

<template>
  <u-batch-edit
    v-model:data="data"
    :columns="columns"
    :model="model"
    tree
    @create-child="onCreateChild"
  >
    <template #form="{ parentRow, formActionType }">
      <u-input field="code" label="编码" :rules="{ required: true }" />
      <u-input field="name" label="名称" />
      <u-input field="parentCode" label="父级编码" readonly />
      <!-- parentRow / formActionType 可用于条件渲染或初始化 -->
      <span v-if="formActionType === 'createChild'">父级：{{ parentRow?.data.name }}</span>
    </template>
  </u-batch-edit>
</template>
```

## 删除方法返回 false 阻止删除

`deleteMethod` 返回 `false` 时不删除行。

```vue
<script setup lang="ts">
import { defineTableColumns } from '@veltra/desktop'
import { reactive, ref } from 'vue'

const columns = defineTableColumns([{ name: '姓名', key: 'name', width: 120 }])
const data = ref([{ name: '张三' }, { name: '系统项' }])
const model = reactive({ name: '' })

async function deleteMethod(rows: Record<string, any>[]) {
  if (rows.some((row) => row.name === '系统项')) return false
}
</script>

<template>
  <u-batch-edit
    v-model:data="data"
    :columns="columns"
    :model="model"
    :delete-method="deleteMethod"
  >
    <template #form>
      <u-input field="name" label="姓名" />
    </template>
  </u-batch-edit>
</template>
```

## 功能限制

通过 `features` 控制可用操作；支持数组或对象（`false` / 函数动态禁用）。

```vue
<script setup lang="ts">
import { defineTableColumns } from '@veltra/desktop'
import type { BatchEditFeature } from '@veltra/desktop'
import { reactive, ref } from 'vue'

const columns = defineTableColumns([
  { name: '姓名', key: 'name', width: 120 },
  { name: '年龄', key: 'age', width: 80 }
])

const data = ref([{ name: '张三', age: 28 }])
const model = reactive({ name: '', age: undefined as number | undefined })

const features: BatchEditFeature[] = ['create', 'update']
</script>

<template>
  <u-batch-edit
    v-model:data="data"
    :columns="columns"
    :model="model"
    :features="features"
    :actions-props="{ delete: { needConfirm: true } }"
  >
    <template #form>
      <u-input field="name" label="姓名" />
      <u-number-input field="age" label="年龄" :min="0" />
    </template>
  </u-batch-edit>
</template>
```
