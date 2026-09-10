---
title: "Ultra UI 常见报错排障"
description: "Ultra UI 全库高频构建期与运行时报错的修复手册：主题未初始化、SCSS NodePackageImporter、UForm 的 field 与 v-model 冲突、VeltraUIResolver 未生效、sheet-core 子路径导入、v-focus 警告、USelect 回显失败、图标包体积与 Workbook/AI 传输层真实报错。"
aliases: [FAQ, 排错, troubleshooting, 常见问题, 报错, 常见错误]
keywords: [loadTheme, NodePackageImporter, sass-embedded, "pkg:", "Can't find stylesheet to import", field, v-model, VeltraUIResolver, importStyle, SheetGrid, "v-focus 指令需要一个 input 元素", valueKey, modelValue, beginBatch, endBatch, providers 不能为空, 未配置 models, 主题未初始化, 回显失败, 样式丢失]
---

# Ultra UI 常见报错排障

Ultra UI（`@veltra/*`）高频报错与症状的修复手册。每节一个独立问题，标题为报错原文或症状短语，按报错原文检索后直接取对应章节照修复代码执行。

## 症状：组件没有颜色，计算样式里 `--u-*` 变量为空

原因：应用入口未初始化主题。Ultra UI 全部组件颜色消费 `--u-*` CSS 变量，这些变量由 `loadTheme()` 在运行时写到 `html` 上；不调用时变量为空，组件回落到浏览器默认样式。修复：入口导入 normalize 并调用 `loadTheme()`：

```ts
// src/main.ts
import '@veltra/styles/normalize'
import { loadTheme } from '@veltra/styles/theme'

loadTheme() // 不传参时应用 lightTheme
```

验证：打开 DevTools 查看 `html` 元素，存在 `--u-*` 自定义属性即生效；`loadTheme` 是同步函数，重复调用以最后一次为准（热替换主题）。详见 `agent-docs/styles/theme.md`。

## 构建报错 `Can't find stylesheet to import`

原因：SCSS 里写了 `@use 'pkg:@veltra/styles/...'`，但 Vite 的 Sass 选项未注册 `NodePackageImporter`——`pkg:` 前缀只有它认识；或写了不带 `pkg:` 前缀的裸包路径，同样解析失败。修复两步：所有 `@veltra/styles` 的 SCSS 导入加 `pkg:` 前缀，并在配置里注册 importer：

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import { NodePackageImporter } from 'sass-embedded'

export default defineConfig({
  css: { preprocessorOptions: { scss: { importers: [new NodePackageImporter()] } } },
})
```

```scss
// 组件样式里：路径必须以 pkg: 开头
@use 'pkg:@veltra/styles/mixins' as m;
@use 'pkg:@veltra/styles/functions' as fn;
```

monorepo 内引用 workspace 包时构造函数必须传仓库根：`new NodePackageImporter(repoRoot)`，否则解析不到 `@veltra/*`。构建链用 `sass-embedded`（仓库锁 `1.104.0`），`NodePackageImporter` 从 `sass-embedded` 导入。详见 `guide/scss.md`。

## 症状：UForm 内控件写了 `v-model` 与 `field` 并存，值不回显或写进两份状态

原因：控件放进 `<u-form>` 后状态由 `field` 接管（UForm 按 `field` 路径双向读写 `model`）；同时写 `v-model` 时取值来自 `v-model`，写入拆成两份状态，回显与校验都不可靠。修复：删除 `v-model`，仅保留 `field`：

```vue
<script setup lang="ts">
import { reactive } from 'vue'
import { UButton, UForm, UInput } from '@veltra/desktop'

const formData = reactive({ name: '', email: '' })

async function submit() {
  console.log(formData) // => { name: 'Alice', email: 'alice@example.com' }
}
</script>

<template>
  <!-- 错误：<u-input v-model="formData.name" label="姓名" field="name" /> -->
  <u-form :model="formData" @field:update="() => submit()">
    <u-input label="姓名" field="name" />
    <u-input label="邮箱" field="email" :rules="{ required: true, preset: 'email' }" />
    <u-button native-type="submit">提交</u-button>
  </u-form>
</template>
```

`label` / `rules` / `tips` / `span` 只有控件位于 `UForm` 内（或包在 `UFormItem` 中）才生效；控件脱离表单单独使用时才写 `v-model`。详见 `agent-docs/desktop/form.md`。

## 症状：VeltraUIResolver 未生效，组件未自动导入，报 `Failed to resolve component: u-button`

按顺序排查：

1. 配置缺 resolver。`vite.config.ts` 必须同时注册 `Components` 插件与 resolver：

```ts
// vite.config.ts
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import { defineConfig } from 'vite'
import { VeltraUIResolver } from '@veltra/vite'

export default defineConfig({
  plugins: [vue(), Components({ resolvers: [VeltraUIResolver()] })],
})
```

2. `unplugin-vue-components` 版本低于 32：`@veltra/vite` 的 peer 约束是 `>= 32.0.0`，升级后重试。
3. 改过 `vite.config.ts` 未重启 dev server：重启后生效。
4. 组件名不在表内：resolver 按 `UButton` 等名字精确匹配 `components.gen.ts` 静态表（95 个组件）；仓库内新组件未入表时在仓库根重跑 `bun run resolver:gen`，下游包缺组件时升级 `@veltra/desktop`。
5. resolver 只管 import 与样式；`loadTheme()` 等主题初始化仍需入口显式执行。详见 `agent-docs/vite/veltra-ui-resolver.md`。

## 报错 `Does not provide an export named 'SheetGrid'`（从 `@veltra/sheet-core` 主入口导入渲染层符号）

原因：`SheetGrid`、`CustomLayout` 及渲染 hook 类型刻意只从子路径 `@veltra/sheet-core/grid` 导出，主入口不 re-export——避免无头 API（`Workbook` / `Sheet`）把 `@visactor/vtable` 类型图拉进 TS 程序。修复：渲染层符号固定从子路径导入：

```ts
// 错误：import { SheetGrid, CustomLayout } from '@veltra/sheet-core'
import { SheetGrid, type SheetGridOptions } from '@veltra/sheet-core/grid'
import { Workbook } from '@veltra/sheet-core' // 模型/命令/IO 走主入口
```

子路径可用的符号：`SheetGrid`、`CustomLayout` 与类型 `SheetGridOptions` / `SheetGridContextMenuKind` / `SheetGridContextMenuInfo` / `ICustomLayoutObj` / `ResolveCellRenderer` / `ResolveDisplayValue` / `ResolveCellStyleHook`。详见 `agent-docs/sheet-core/sheet-grid.md`。

## 控制台警告 `v-focus 指令需要一个 input 元素`

原因：`v-focus` 绑定的元素不是 `<input>`，且 `el.querySelector('input')` 找不到任何 `<input>` 后代（容器里只有 `<textarea>`、`<button>` 等）。指令只匹配 `<input>` 标签。修复：把指令移到 `<input>` 本身，或放到确实包含 `<input>` 的容器上：

```vue
<script setup lang="ts">
import { vFocus } from '@veltra/directives'
</script>

<template>
  <!-- 错误：容器内没有 input，触发警告 -->
  <!-- <div v-focus><textarea></textarea></div> -->

  <!-- 正确：直接作用于 input -->
  <input v-focus placeholder="搜索" />
</template>
```

注意：`UInput` 的根元素是包含 `<input>` 的 `div`，`v-focus` 写在 `<UInput>` 上会聚焦其内部原生 `<input>`；但 `UInput` 传 `readonly` 时根元素不渲染，指令无效。详见 `agent-docs/directives/v-focus.md`。

## 症状：USelect 回显显示原始值而不是选项 label

原因：`modelValue` 与选项 `valueKey` 字段的值类型不一致，回显按 `===` 严格匹配，字符串 `'1'` 匹配不到数字 `1`。修复：保证初值类型与选项值类型一致：

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { USelect } from '@veltra/desktop'

const options = [
  { label: '一年级', value: 1 },
  { label: '二年级', value: 2 },
]

// 选项 value 是 number，初值必须也是 number
const grade = ref<number>(1)
// const grade = ref<string>('1') // 错误：显示 '1' 而不是 '一年级'
</script>

<template>
  <u-select v-model="grade" :options="options" value-key="value" />
</template>
```

接口返回的字符串 ID 常见此问题：赋值前用 `Number(id)` 转换，或让 `options` 的值字段直接输出字符串。详见 `agent-docs/desktop/select.md`。

## 症状：从根 `@veltra/icons` 全量导入导致包体积大，或 `FontColor` 导入得到 `undefined`

原因：根入口 `@veltra/icons` 再导出全部 218 个图标（normal 205 + colorful 13，其中 `FontColor` 重名冲突被丢弃）；全量导入时 218 个 SFC 全部进入产物。修复：按集合子路径按名称导入：

```ts
// 错误：import { Search, Excel } from '@veltra/icons'
import { Search } from '@veltra/icons/normal' // 单色线性图标
import { Excel } from '@veltra/icons/colorful' // 多色图标
```

`packageName` 常量仍从根入口取：`import { packageName } from '@veltra/icons'`。需要 `FontColor` 时必须从子路径导入（根入口因两个集合同名冲突没有该导出）。详见 `agent-docs/icons.md`。

## 报错 `Error: Workbook.endBatch：没有进行中的批量`

原因：`endBatch()` 与 `beginBatch()` 不配对——没调过 `beginBatch()`、`beginBatch()` 抛错后仍执行了 `endBatch()`，或同一批调用了多余的 `endBatch()`。修复：`try/finally` 保证配对：

```ts
import { Workbook } from '@veltra/sheet-core'

const wb = new Workbook()

// beginBatch 后 addSheet / removeSheet / renameSheet / activateSheet
// 的事件被抑制，endBatch 合并补发一次（导入多表时避免事件风暴）
wb.beginBatch()
try {
  wb.addSheet('Q1')
  wb.addSheet('Q2')
} finally {
  wb.endBatch() // 无论中间是否抛错都释放批量状态
}
```

`beginBatch()` 可嵌套（按深度计数），`endBatch` 只在深度归零时补发事件。

## 报错 `Error: [createOpenAITransport] providers 不能为空` 或 `[createOpenAITransport] Provider "<id>" 未配置 models`

原因：`createOpenAITransport` 的 `providers` 传了空数组，或某个 Provider 缺 `models` 字段——transport 构造时即校验并抛错。修复：至少一个 Provider，且每个 Provider 的 `models` 非空：

```ts
import { createOpenAITransport, useChat } from '@veltra/ai'

const transport = createOpenAITransport({
  providers: [
    {
      id: 'proxy',
      endpoint: 'https://<你的代理地址>/chat/completions',
      models: [{ id: '<模型id>' }], // 必填非空；模型 id 须跨 Provider 全局唯一
    },
  ],
})

const chat = useChat({ props: { transport } })
```

第三个同族报错 `[createOpenAITransport] 模型 id "<id>" 重复（跨 Provider 须全局唯一）`：多个 Provider 配置了相同模型 `id`，改掉重复 id。详见 `agent-docs/ai/use-chat.md`。

## 报错 `Error: useSheetGrid: grid 容器未挂载`

原因：`<USheet>` 的网格宿主 ref 尚未挂载（组件在 `v-if` 关闭、`display: none` 或父级未渲染时触发了建格），`useSheetGrid` 的 `createGrid` 拿不到容器直接抛错。修复：确保 `USheet` 挂载后再触发数据写入或 tab 切换：

```vue
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { USheet } from '@veltra/sheet'
import { Workbook } from '@veltra/sheet-core'

const ready = ref(false)
const workbook = new Workbook()

onMounted(() => {
  workbook.addSheet('Sheet1')
  ready.value = true // v-if 保证宿主容器已挂载
})
</script>

<template>
  <USheet v-if="ready" :workbook="workbook" />
</template>
```

`USheet` 首次渲染即自动建格；仅在用条件渲染控制宿主生命周期时才会命中该错误。

## 控制台警告 `GridItem组件仅能在Grid组件中使用`

原因：`<UGridItem>` 没有作为 `<UGrid>` 的后代渲染——它依赖从 `UGrid` inject 的响应式上下文，脱离后 `console.error` 并按 `span` 默认行为渲染（无断点响应）。修复：保证层级关系：

```vue
<script setup lang="ts">
import { UGrid, UGridItem } from '@veltra/desktop'
</script>

<template>
  <!-- 错误：<u-grid-item span="full" /> 单独出现 -->
  <u-grid :cols="3">
    <u-grid-item :span="2">A</u-grid-item>
    <u-grid-item>B</u-grid-item>
  </u-grid>
</template>
```

同类约束还有 Card 系列：`CardHeader` / `CardContent` / `CardCover` / `CardAction` 必须在 `<UCard>` 内使用（警告文案分别为 `CardHeader组件仅能在Card组件中使用` 等）。

## 控制台警告 `` extend['<key>']应该是一个对象 ``

原因：`useConfig().setConfig()` 给本应是对象的字段（`form`、`paginator`）传了非对象值，深合并跳过该键并告警。修复：对象字段必须传对象：

```ts
import { useConfig } from '@veltra/compositions'

const { setConfig } = useConfig()

// 错误：setConfig({ form: 100 } as any) → 警告 extend['form']应该是一个对象
setConfig({
  size: 'small',
  form: { labelWidth: 120 }, // form、paginator 是对象字段，必须传对象
  paginator: { pageSize: 100, pageSizeOptions: [100, 200] },
})
```

`config` 是只读快照，全局配置写入只能经 `setConfig`；未提到的键保持原值。
