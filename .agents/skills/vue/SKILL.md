---
name: vue
description: Vue 3 开发实践。按项目 Vue minor（优先 3.4 / 3.5）选用该版本 API。在编辑 .vue、Vue TSX/JSX 组件或编写组合式函数时使用。
---

# Vue 3

默认 `<script setup>` + Composition API。Vue 以外的栈（构建工具、CSS、状态库、TS 版本）跟项目走，不要在本技能里指定。

禁止凭训练数据写 API。先定 minor，再读对应 reference。

## 定版本

1. 读已安装的 `vue` 版本。
2. 取 **minor**（`3.4.x` → `3.4`），打开下表文件，按该文件写代码。

| minor | 文件                                   |
| ----- | -------------------------------------- |
| 3.4   | [references/3.4.md](references/3.4.md) |
| 3.5   | [references/3.5.md](references/3.5.md) |

未列出的更新 minor：以已覆盖的最高 minor 为底，再查官方该 minor 的 changelog / docs。更旧的 minor：不要使用本技能里的新 API。

## 选响应式 API

不要 `ref` 一把梭。按是否整体替换、是否就地改字段、要不要深层追踪来选。

| API               | 用在                                                                     |
| ----------------- | ------------------------------------------------------------------------ |
| `ref`             | 会被**整体替换**的值：原始类型、开关、当前 id、整份替换的对象            |
| `reactive`        | **就地改字段**的结构，尤其表单、草稿、一组相关字段                       |
| `shallowRef`      | 只关心 `.value` 替换：大列表、第三方实例、不可变快照。内部字段变更不通知 |
| `shallowReactive` | 只关心根属性；嵌套当不可变                                               |
| `markRaw`         | 永不追踪                                                                 |
| `triggerRef`      | 改了 `shallowRef` 内部后又必须通知时（优先考虑直接替换 `.value`）        |
| `customRef`       | 自己控制 track/trigger（如防抖）                                         |
| `computed`        | 见下一节，**默认不用**                                                   |
| 普通变量          | 不驱动视图、不参与派生                                                   |

`ref(obj)` 内部同样深层代理，只是多一层 `.value`。表单用 `reactive`，不要 `ref({ name, email })`。

列表要追踪元素字段用 `ref([])`；只在替换整表时更新，用 `shallowRef`。

## computed

结构固定、只嵌一段响应式（如配置里的 `props`）→ 对象字面量传引用，不要包 `computed`。否则依赖订在外层，一改外层整页重渲染。

```ts
const field = { component: Input, label: "姓名", props: form };
```

不要 `{ ...form }`。只有过滤/排序后的新列表、或昂贵且多处复用的派生，才用 computed。

## 组件与数据流

- 单文件不要涨到巨型（约 500 行）；编排放路由/入口，UI 块和 `useXxx` 拆出去。
- props 向下、事件向上。跨层：`provide`/`inject` 或项目已有 store。
- 响应式对象在组件间**直传**。不要拷贝后再自己同步；需要重置时另存一份初始快照。
- 子组件 `v-model` 用 `defineModel`，不要手写 `modelValue` + `update:modelValue`：

```ts
const model = defineModel<string>({ required: true });
const title = defineModel<string>("title");
const [value, modifiers] = defineModel({ set: (v) => (modifiers.trim ? v.trim() : v) });
```

- 同名绑定用简写：`<img :id :src :alt>`。
- `defineOptions` / `defineSlots` / `<script setup generic="T">` 直接用。
- composable 入参用 `MaybeRefOrGetter`，内部 `toValue()`。副作用清在 `onScopeDispose`（不要只写 `onUnmounted`）。

## 更新成本

- 列表 `:key` 用稳定 id。
- 传给列表项的 props 尽量稳定：算好 `active` 再传，不要每个 item 都收会变的 `activeId`。
- 重、少用、折页下的组件：`defineAsyncComponent`（SSR 水合策略见 3.5）。
- 拖拽 / `mousemove` / 滚动：热状态隔离到小子组件或 `shallowRef`，不要让整页模板重跑。
