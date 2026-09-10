---
title: "Ultra UI 常见报错排障"
description: "Ultra UI 全库高频构建期与运行时报错的修复手册：主题未初始化与显式 import 导致的裸样式、SCSS pkg: 与 NodePackageImporter entryPointDirectory 解析规则、缺 @vitejs/plugin-vue-jsx 时 react/jsx-runtime 解析失败、渲染函数里的 ReferenceError: UTag is not defined、函数式 API 缺样式、UForm 的 field 与 v-model 冲突、VeltraUIResolver 未生效、sheet-core 子路径导入、v-focus 警告、USelect 回显失败、图标包体积与 Workbook/AI 传输层真实报错。"
aliases: [FAQ, 排错, troubleshooting, 常见问题, 报错, 常见错误]
keywords: [loadTheme, 主题未初始化, NodePackageImporter, entryPointDirectory, sass-embedded, "pkg:", "Can't find stylesheet to import", VeltraUIResolver, "react/jsx-dev-runtime", "react/jsx-runtime", "@vitejs/plugin-vue-jsx", "UTag is not defined", ReferenceError, 裸样式, components/tag/style, field, v-model, SheetGrid, 回显失败, messageConfirm]
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

## 症状：显式 import 的组件结构正确但呈裸样式（无颜色、无布局）

原因：`VeltraUIResolver` 只重写 SFC 编译产物里的 `_resolveComponent("<组件名>")` 调用。模板标签在 `<script setup>` 里有同名 import 绑定时，编译产物直接引用该绑定（`_unref(ULayout)`），不再产生 `_resolveComponent`，`unplugin-vue-components` 既不注入组件 import 也不注入样式副作用。组件样式是独立入口（`packages/desktop/src/components/<目录>/style.ts` → `style.scss`），组件 SFC 内没有 `<style>` 块，`index.ts` 也不引样式。修复：显式 import 后按目录名补样式子路径，目录名查 `packages/vite/src/components.gen.ts`：

```vue
<!-- src/views/TagList.vue -->
<script setup lang="ts">
import { UTag } from '@veltra/desktop'
import '@veltra/desktop/components/tag/style' // 显式 import 的组件必须自己补样式副作用
</script>

<template>
  <u-tag type="primary">已完成</u-tag>
</template>
```

常用对应关系：`UTag` → `components/tag/style`，`UAction` / `UActionGroup` → `components/action/style`，`UMessage` → `components/message/style`。需要全部组件样式时在入口显式引一次 `import '@veltra/desktop/style'`，不再逐个补。

DevTools 判定：选中组件根元素，class 在（如 `u-tag`）但 Styles 面板搜不到 `.u-tag` 规则 → 样式入口未加载（本节）；class 与 `.u-tag` 规则都在、`--u-*` 值为空 → 主题未初始化。详见 `agent-docs/vite/veltra-ui-resolver.md`。

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

`NodePackageImporter(entryPointDirectory)` 的解析规则按 `pkg:` 的来源分两种：

- `pkg:` 写在磁盘上的 `.scss` 文件里（本库组件样式，如 `packages/desktop/src/components/button/style.scss`）：sass 从该文件所在目录逐级向上找 `node_modules`，与 `entryPointDirectory` 无关。编译该文件时 `new NodePackageImporter()`、传仓库根、传其他目录都解析成功——这类场景省略参数即可。
- `pkg:` 出现在非磁盘来源（`css.preprocessorOptions.scss.additionalData` 注入的字符串、把样式内容以字符串交给 sass 的插件）：`entryPointDirectory` 生效；省略参数时该目录取 Node 入口（dev 下的 vite 可执行文件）所在目录。要显式传时必须传「其 `node_modules`（或其祖先）里能解析到 `@veltra/styles` 的目录」，传一个不含该链接的目录仍报 `Can't find stylesheet to import`。

本仓库根目录没有 `node_modules/@veltra`（bun 把链接放在 `packages/<包>/node_modules/@veltra/` 与 `test/node_modules/@veltra/`），所以传仓库根只对磁盘文件成立；`test/vite.config.ts`、`playground/vite.config.ts` 传 `new NodePackageImporter(resolve(import.meta.dirname, '..'))` 是仓库自身写法。构建链用 `sass-embedded`（仓库锁 `1.104.0`），`NodePackageImporter` 从 `sass-embedded` 导入。详见 `guide/scss.md`。

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

## 构建报错 `Failed to resolve import "react/jsx-runtime"` / `react/jsx-dev-runtime`（缺 @vitejs/plugin-vue-jsx）

dev 启动日志（报错来自 `<script lang="tsx">` 的 SFC）：

```text
Failed to run dependency scan. Skipping dependency pre-bundling. Error: The following dependencies are imported but could not be resolved:

  react/jsx-dev-runtime (imported by /<项目绝对路径>/src/App.vue?id=0)

Are they installed?
```

`vite build`：

```text
[vite]: Rolldown failed to resolve import "react/jsx-runtime" from "/<项目绝对路径>/src/App.vue?vue&type=script&lang.tsx".
```

原因：`plugins` 里没有注册 `vueJsx()`，Vite 用 esbuild 默认 JSX 运行时（`react`），TSX 编译成 `react/jsx-dev-runtime`（dev）/ `react/jsx-runtime`（build）导入，而这两个包不在依赖里。修复：安装 `@vitejs/plugin-vue-jsx`（本仓库锁 `^5.1.6`）并在 `plugins` 里注册：

```bash
bun add -D @vitejs/plugin-vue-jsx
```

```ts
// vite.config.ts
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import Components from 'unplugin-vue-components/vite'
import { defineConfig } from 'vite'
import { VeltraUIResolver } from '@veltra/vite'

export default defineConfig({
  plugins: [
    vue(),
    vueJsx(), // <script lang="tsx"> 与 .tsx 必须注册，否则 JSX 落到 react 运行时
    Components({ resolvers: [VeltraUIResolver()] }),
  ],
})
```

类型检查需 tsconfig.json 开 `"jsx": "preserve"`（本仓库 `test/tsconfig.json` 即此配置）：

```json
// tsconfig.json
{
  "compilerOptions": {
    "jsx": "preserve"
  }
}
```

TSX 里用到的组件必须显式 import 并补样式子路径——JSX 不经过模板编译，resolver 既不注入组件 import 也不注入样式副作用：

```tsx
// src/TagList.tsx
import { defineComponent } from 'vue'
import { UTag } from '@veltra/desktop'
import '@veltra/desktop/components/tag/style'

export default defineComponent({
  name: 'TagList',
  setup() {
    return () => <UTag type="primary">已完成</UTag>
  },
})
```

验证：重启 dev server 后启动日志不再出现 `Failed to run dependency scan`；`vite build` 不再报 `react/jsx-runtime`。详见 `agent-docs/vite/veltra-ui-resolver.md`。

## 报错 `ReferenceError: UTag is not defined`（渲染函数 / JSX 里的组件未 import）

原因：`h()` / `render` / JSX 里的组件完全不经过模板编译，`VeltraUIResolver` 永不解析——它只重写模板编译产物里的 `_resolveComponent(...)`。`@veltra/desktop` 主入口只导出组件对象，不注册全局名，所以浏览器控制台抛 `Uncaught ReferenceError: UTag is not defined`，不是 `Failed to resolve component: UTag` 警告。修复：显式 import 组件并补样式子路径：

```ts
// src/columns.ts
import { h } from 'vue'
import { UAction, UActionGroup, UTag } from '@veltra/desktop'
import '@veltra/desktop/components/action/style' // 渲染函数里的组件同样不自动注入样式
import '@veltra/desktop/components/tag/style'

export const statusColumn = {
  key: 'status',
  name: '状态',
  render: ({ rowData }: { rowData: Record<string, unknown> }) =>
    h(UTag, { type: 'success' }, () => String(rowData['status'])),
}

export const actionColumn = {
  key: 'actions',
  name: '操作',
  render: () => h(UActionGroup, {}, () => [h(UAction, { onRun: () => {} }, () => '详情')]),
}
```

`app.use(UltraUI)`（`@veltra/desktop/install`）只注册运行时全局组件名并注入全量样式，不定义 `UTag` 这个 JS 标识符——`h(UTag)` 仍必须先 import。排查时把 `h(...)` / JSX 里的每个 `U*` 与文件顶部 import 列表逐个对照。详见 `agent-docs/vite/veltra-ui-resolver.md`。

## 症状：message / messageConfirm / notification 弹出但无样式

原因：`message`、`messageConfirm`、`notification` 是函数式 API（内部 `h()` + `render()` 挂到 `document.body`），不经过模板编译，resolver 不解析；三者样式在各自的独立入口，`import { message } from '@veltra/desktop'` 不带样式副作用。修复：按用到的 API 补样式子路径，或全量引 `import '@veltra/desktop/style'`：

```ts
// src/main.ts
import '@veltra/desktop/components/message/style' // message(...)
import '@veltra/desktop/components/message-confirm/style' // messageConfirm(...)
import '@veltra/desktop/components/notification/style' // notification(...)

import { message, messageConfirm, notification } from '@veltra/desktop'

message.success('保存成功')
messageConfirm.warning('删除后不可恢复，确认删除？')
notification.success('同步完成')
```

目录名以 `packages/vite/src/components.gen.ts` 为准：`UMessage` → `components/message/style`，`UMessageConfirm` → `components/message-confirm/style`，`UNotification` → `components/notification/style`。DevTools 判定：弹层 DOM 已插入、class 前缀在（`u-message` / `u-message-confirm` / `u-notification`），但 Styles 面板没有对应规则。详见 `agent-docs/vite/veltra-ui-resolver.md`。

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

原因：`@veltra/icons` 两个集合合计 217 个不同图标名（`normal` 205 + `colorful` 13，重名 `FontColor` 只算一个）。根入口 `export *` 对同名冲突是两边都不导出，因此根入口实际可导入其余 216 个图标名与 `packageName` 常量；全量导入时集合内全部图标 SFC 进入产物。修复：按集合子路径按名称导入：

```ts
// 错误：import { Search, Excel } from '@veltra/icons'
import { Search } from '@veltra/icons/normal' // 单色图标
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
