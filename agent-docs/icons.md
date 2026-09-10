---
title: "@veltra/icons 图标库"
description: "Vue 3 SVG 图标库：@veltra/icons/normal 导出 205 个单色图标组件、@veltra/icons/colorful 导出 13 个多色图标组件，从子路径按名称导入后放进 UIcon（@veltra/desktop）默认插槽渲染；图标组件无 props，颜色经 currentColor 继承父级，viewBox 逐图标来自源文件。"
aliases: ["icons", "veltra-icons", "@veltra/icons", "UIcon", "Icon", "图标库", "图标", "SVG 图标"]
keywords: ["@veltra/icons", "@veltra/icons/normal", "@veltra/icons/colorful", "UIcon", "packageName", "currentColor", "viewBox", "PascalCase", "USearch", "FormSwitch", "SwitchButton", "Failed to resolve component", "无 props", "按需导入", "图标命名", "单色图标", "多色图标", "图标清单", "图标检索"]
---

# @veltra/icons 图标库

`@veltra/icons` 把 SVG 源文件编译成可 tree-shake 的 Vue SFC 图标组件：`@veltra/icons/normal` 导出 205 个单色图标，`@veltra/icons/colorful` 导出 13 个多色图标，每条导出都是一个无 props 的组件，按名称导入后放进 `UIcon`（`@veltra/desktop`）的默认插槽渲染；根入口 `@veltra/icons` 额外导出 `packageName` 常量，并把两个集合重名的 `FontColor` 从 `export *` 中丢弃。

## 快速上手

```vue
<script setup lang="ts">
// 图标从集合子路径按名称具名导入；导出名是 PascalCase，没有 Icon 后缀
import { Search, Plus } from '@veltra/icons/normal'
import { Excel } from '@veltra/icons/colorful'
import { UIcon } from '@veltra/desktop'
</script>

<template>
  <!-- 推荐：尺寸写在 UIcon 上（UIcon 只有 size 一个 prop，没有 color 属性） -->
  <u-icon :size="18"><Search /></u-icon>

  <!-- 彩色图标：保留源文件配色，不随父级 color 变化 -->
  <u-icon :size="20"><Excel /></u-icon>

  <!-- 单色图标的颜色来自 currentColor：给父级元素设 color -->
  <span style="color: var(--u-color-primary)">
    <u-icon :size="18"><Plus /></u-icon>
  </span>

  <!-- 不套 UIcon 时必须自带尺寸样式，否则 <svg> 没有宽高、被容器拉满 -->
  <Plus style="width: 18px; height: 18px" />
</template>
```

视觉初始化前提：应用入口必须 `import '@veltra/styles/normalize'` 并调用 `@veltra/styles/theme` 的 `loadTheme()`，否则 `--u-*` token 为空，`color: var(--u-color-primary)` 取不到值。

## API 签名

每个图标在集合 barrel 里是一条具名导出（由 `bun run icons:gen` 生成，禁止手改）：

```ts
// @veltra/icons/normal（205 条导出，此处节选 2 条）
export { default as Search } from './vue/normal/search.vue'
export { default as FormSwitch } from './vue/normal/form-switch.vue'

// @veltra/icons/colorful（13 条导出，此处节选 2 条）
export { default as Excel } from './vue/colorful/excel.vue'
export { default as FontColor } from './vue/colorful/font-color.vue'

// 根入口 @veltra/icons（src/index.ts）
export const packageName = '@veltra/icons' as const
export * from './normal'
export * from './colorful'
```

图标 SFC 本体是无 props 的模板组件：`<script setup>` 里只有 `defineOptions({ name })`，`<template>` 是单个 `<svg>` 根，根 `<svg>` 没有 `width`/`height` 属性。着色与视口逐图标来自源 SVG，生成脚本 `packages/icons/scripts/gen-vue-icons.ts` 对单色集合只做一处改写：把纯黑 `fill`/`stroke`（`#000000`、`#000`、`black`、`rgb(0,0,0)`）替换为 `currentColor`，其余取值原样保留；彩色集合（`packages/icons/src/svg/colorful/`）完全不改写。

因此单色图标按源 SVG 分为两类，着色属性都归一为 `currentColor`：

- 填充型：不含任何 `stroke` 属性（205 个单色图标中 144 个）。
- 描边型：含 `stroke="currentColor"`（61 个），根 `<svg>` 常见形态是 `fill="none" stroke="currentColor" stroke-width="2"`。

`viewBox` 不按集合统一，逐图标由源文件决定：`normal` 的 205 个中 166 个是 `0 0 16 16`、36 个是 `0 0 24 24`、3 个是 `0 0 1024 1024`（`AddChild`、`DeepThinking`、`Variable`）；`colorful` 的 13 个全部是 `0 0 16 16`。

内部组件名由 `packages/icons/scripts/icon-naming.ts` 的 `resolveDefineOptionsName()` 决定：导出名属于 `{Code, Filter, Image, Link, Search, Time, Title, Video, View}` 时 `defineOptions({ name })` 加 `U` 前缀（`Search` → `USearch`），其余图标内部名与导出名相同（`Plus` → `Plus`）。具名导出名永不变。该规则在两个集合分别生效，例如 `colorful` 的 `Image`、`Title`、`Video` 内部名同样是 `UImage`、`UTitle`、`UVideo`。

## 参数说明

图标组件没有 props、事件与暴露方法，用法由导入名与容器决定：

| 用法 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| 导入路径 | `'@veltra/icons/normal'` \| `'@veltra/icons/colorful'` \| `'@veltra/icons'` | — | 是 | 单色图标从 `normal` 导入，多色图标从 `colorful` 导入；根入口覆盖两者但不含 `FontColor`，按需场景优先用子路径 |
| 导出名 | PascalCase 具名导出 | — | 是 | 由 kebab 文件名按 `-` 分段、每段首字母大写推导（`circle-check-filled` → `CircleCheckFilled`）；无 `Icon` 后缀；必须与「完整导出清单」逐字一致 |
| 尺寸 | `UIcon` 的 `size`，或图标自身 `style` 的 `width`/`height` | `1em × 1em`（`UIcon` 内） | 否 | `<svg>` 无宽高；放进 `UIcon` 由 `size` 决定，脱离 `UIcon` 必须自带尺寸样式 |
| 颜色 | CSS `currentColor` | 继承父级 `color` | 否 | `normal` 集合跟随父级 `color`；`colorful` 集合用源文件固定配色，忽略 `currentColor` |
| 透传属性（如 `size`） | 任意 | — | 否 | 图标无 props，未知属性作为透传属性落到根 `<svg>` 上被浏览器忽略：不报错、不生效 |

### 完整导出清单

下列名字逐字来自 `packages/icons/src/normal.ts` 与 `packages/icons/src/colorful.ts`（由 `bun run icons:gen` 生成，禁止手改），用于检索与核对名字是否存在。写图标名前先在本节核对。

```text
@veltra/icons/normal —— 205 个导出名

  AddChild, Agent, AiChat, AlignBottom, AlignCenter, AlignTop, ArrowDown,
  ArrowLeft, ArrowRight, ArrowUp, ArrowUpdown, Attach, Backtop, Bell,
  BellFilled, Bold, Books, Border, Brain, Build, Calendar, Call, Camera,
  CaretBottom, CaretLeft, CaretRight, CaretTop, Cart, ChartPie, Check,
  Checklist, CheckRectangleFilled, CircleCheck, CircleCheckFilled,
  CircleClose, CirclePlus, Clear, Close, CloudDownload, Cloudy, Code, Copy,
  CreditCard, DArrowLeft, DArrowRight, Database, DeepThinking, Delete,
  Discount, Dot, Down, Download, Edit, EditPen, Empty, Enter, Female,
  FileAdd, Fill, Filter, Flag, Folder, FolderAdd, FolderOpened, FontColor,
  FontSize, Fork, FormAutoComplete, FormCascader, FormCheckbox,
  FormContainer, FormDatePicker, FormDateRangePicker, FormFilePicker,
  FormInput, FormMultiSelect, FormMultiTreeSelect, FormNumberInput,
  FormNumberRangeInput, FormPasswordInput, FormRadio, FormSelect, FormSlider,
  FormSwitch, FormTable, FormTextarea, FormTreeSelect, GitBranch, Help, Hide,
  History, Horn, Hourglass, House, HouseFilled, InfoCircle, InfoFilled,
  InsertToNext, InsertToPrev, Internet, Italic, Key, Layers, Left, Link,
  List, Loading, Location, Lock, Login, Logout, Male, Maximum, MergeCells,
  Message, Minus, Mobile, Model, MoneyCircle, Monitor, Moon, MoreFilled,
  MoreVertical, MostlyCloudy, Move, MoveHorizontal, PageFirst, PageLast,
  PictureRounded, Pin, PinFilled, Plus, Poweroff, Printer, Process, Prompt,
  QrCode, QuestionFilled, Queue, Recover, Refresh, Relativity, Remove,
  RemoveFilled, RemoveRectangle, Right, Role, Rollback, Rollfront,
  RotateLeft, RotateRight, Rotation, Save, Scan, Search, Secured, Send,
  Server, Service, Setting, Share, Skill, Sort, SortDown, SortLeft,
  SortRight, SortUp, Sparkles, Star, StarFilled, Strikethrough, Sun,
  Terminal, Time, Tips, Token, Tools, TriangleAlert, Underline, Unlink,
  Unlock, UnmergeCells, Up, Upload, User, UserAdd, UserCircle, UserClear,
  UserGroup, UserGroupAdd, UserGroupClear, Variable, VerticalAlignCenter,
  VerticalAlignLeft, VerticalAlignRight, VideoPause, VideoPlay, View,
  ViewModule, Wallet, Warning, WarningFilled, Wrap, ZoomIn, ZoomOut
```

```text
@veltra/icons/colorful —— 13 个导出名

  Archive, Excel, Fold, FontColor, Image, MiddleGround, Pdf, PowerPoint,
  Title, Txt, UnknownFile, Video, Word
```

两个集合合计 217 个不同图标名（205 + 13，`FontColor` 在两边都有、只算一个）。根入口 `@veltra/icons` 的 `export *` 丢弃冲突的 `FontColor`，因此从根入口实际可导入其余 216 个图标名与 `packageName` 常量；`FontColor` 必须从子路径导入。

## 典型示例

### 配合 UIcon 与颜色继承

```vue
<script setup lang="ts">
import { UIcon } from '@veltra/desktop'
import { Search, Loading } from '@veltra/icons/normal'
</script>

<template>
  <!-- 单色图标颜色跟随父级 color（currentColor 机制）；UIcon 没有 color 属性 -->
  <div style="color: var(--u-color-primary)">
    <u-icon :size="18"><Search /></u-icon>
  </div>

  <!-- 加载动画：给 UIcon 加 is-loading 类（.u-icon.is-loading 旋转） -->
  <u-icon :size="18" class="is-loading"><Loading /></u-icon>
</template>
```

### 图标清单检索与动态渲染

下游禁止扫本地 SVG 文件，按导出名或 kebab 名检索。TypeScript 自动补全：在 `import { } from '@veltra/icons/normal'` 中输入前缀（`Search`、`Arrow`、`Form`）枚举候选；程序化检索用命名空间导入：

```vue
<script setup lang="ts">
import { computed } from 'vue'
import type { Component } from 'vue'
import * as NormalIcons from '@veltra/icons/normal'
import { UIcon } from '@veltra/desktop'

const query = 'arrow'

// PascalCase 转回 kebab 再匹配（与 playground 图标库同一套算法）
function pascalToKebab(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase()
}

const matched = computed(() =>
  (Object.entries(NormalIcons) as [string, Component][])
    .filter(([key, value]) => typeof value === 'object' && value !== null)
    .filter(([key]) => pascalToKebab(key).includes(query))
    .map(([name, component]) => ({ name, component })),
)

// query = 'arrow' 时 => [{ name: 'ArrowDown', component: ... }, { name: 'ArrowLeft', component: ... }, ...]
</script>

<template>
  <u-icon v-for="item in matched" :key="item.name" :size="18">
    <component :is="item.component" />
  </u-icon>
</template>
```

检索关键词用英文语义（`search`、`arrow-left`、`excel`）；新增或删除图标后必须重跑 `bun run icons:gen` 重新生成 barrel，禁止手改导出清单。

## 注意事项

> [!WARNING]
> - 禁止写 `<User :size="18" />`：图标组件没有 props，`:size` 只作为透传属性落到根 `<svg>` 上被浏览器忽略，不报错也不生效。正确写法是 `<u-icon :size="18"><User /></u-icon>`；不用 `UIcon` 时必须自带尺寸样式 `<User style="width: 18px; height: 18px" />`。
> - 图标名必须以「完整导出清单」与 barrel（`packages/icons/src/normal.ts`、`colorful.ts`）为准，禁止凭 Element Plus / Ant Design 等开源库的记忆写名字：那些名字在本库大多不存在，本库没有 `SwitchButton`、`Forward`、`Switch`。
> - 导出名没有 `Icon` 后缀：写 `Search`，不是 `SearchIcon`；也没有字符串名用法（本库没有 `<u-icon name="search">`，图标组件必须导入后放进 `UIcon` 默认插槽）。
> - `input`、`select`、`table`、`switch` 等与 HTML 标签或关键字同名的表单控件图标统一改为 `Form*` 前缀：`FormInput`、`FormSelect`、`FormTable`、`FormSwitch`，根表单容器图标是 `FormContainer`；不要猜 HTML 标签同名导出。
> - `FontColor` 在 `normal` 与 `colorful` 两个集合各有一个；根入口 `export *` 丢弃同名冲突导出，`@veltra/icons` 不导出 `FontColor`，导入它必须写子路径。
> - `colorful` 图标不受 `UIcon` 或父级 `color` 影响，固定源文件配色；需要跟随主题色时改用 `normal` 集合。
> - 禁止 `import * as Icons from '@veltra/icons'` 后全量注册：根入口覆盖两个集合，按需场景必须从子路径按名称导入。
> - `UIcon` 只有 `size` 一个 prop，没有 `color` 属性；给 `u-icon` 写 `color` 不会生效，着色靠父级 CSS `color`。

## 常见问题

### 写了不存在的图标名（如 `SwitchButton`）导致页面崩溃

原因：`SwitchButton`、`Forward`、`Switch` 在本库都不存在。图标是 Vue 组件而不是字符串名称，写错名字的报错分三种：

- 在 `h()` / `render` 函数里用：运行时抛 `ReferenceError: SwitchButton is not defined`，首屏渲染即中断（页面白屏）。
- 在模板里写未导入的 `<SwitchButton />`：Vue 告警 `Failed to resolve component: SwitchButton`，并按未知标签渲染。
- 具名导入不存在的名字：构建/链接期报 `does not provide an export named 'SwitchButton'`。

修复：先按语义找实际存在的名字，再写导入。

```vue
<script setup lang="ts">
// 开关控件图标是 FormSwitch（不是 Switch / SwitchButton）
import { FormSwitch, ArrowRight, DArrowRight, PageLast, InsertToNext } from '@veltra/icons/normal'
import { UIcon } from '@veltra/desktop'
</script>

<template>
  <u-icon :size="18"><FormSwitch /></u-icon>

  <!-- 「前进」语义用这几个：ArrowRight、DArrowRight、PageLast、InsertToNext -->
  <u-icon :size="18"><ArrowRight /></u-icon>
</template>
```

规则：写任何图标名前，先在 `## 参数说明` 的「完整导出清单」里检索名字；清单里没有的名字一律按不存在处理。

### 给图标组件传 `:size` 没有效果

原因：图标 SFC 没有 props，`:size="18"` 作为透传属性写到根 `<svg>` 上，`size` 不是合法 SVG 属性，被浏览器忽略，Vue 也不会报错。修复：把 `:size` 写给 `UIcon`，或不用 `UIcon` 时自带尺寸样式：

```vue
<script setup lang="ts">
import { User } from '@veltra/icons/normal'
import { UIcon } from '@veltra/desktop'
</script>

<template>
  <!-- 正确：:size 给 UIcon -->
  <u-icon :size="18"><User /></u-icon>

  <!-- 正确：不用 UIcon 时自带尺寸样式 -->
  <User style="width: 18px; height: 18px" />
</template>
```

### 导出 `FontColor` 报错 `does not provide an export named 'FontColor'`

原因：`FontColor` 在两个集合中重名，根入口 `@veltra/icons` 的 `export *` 丢弃了冲突导出，根入口根本没有这条导出。修复：从子路径导入并指明集合：

```ts
// 根入口没有 FontColor，下面这行会报 does not provide an export named 'FontColor'
// import { FontColor } from '@veltra/icons'
import { FontColor } from '@veltra/icons/normal' // 单色版
import { FontColor as ColorfulFontColor } from '@veltra/icons/colorful' // 多色版
```

### 想找某个图标但不确定导出名

命名规则：kebab 文件名按 `-` 分段、每段首字母大写。常用推导示例：

| kebab 文件名 | 导出名 | 集合 |
| --- | --- | --- |
| `circle-check-filled` | `CircleCheckFilled` | `normal` |
| `d-arrow-left` | `DArrowLeft` | `normal` |
| `form-switch` | `FormSwitch` | `normal` |
| `unknown-file` | `UnknownFile` | `colorful` |

完整清单见 `## 参数说明` 的「完整导出清单」；编辑器里在 `import { } from '@veltra/icons/normal'` 花括号内输入前缀可枚举候选；程序化检索用「图标清单检索与动态渲染」示例。

### 图标不显示颜色

单色图标颜色来自 CSS `currentColor`：必须给 `UIcon` 的父元素设置 `color`（`UIcon` 本身没有 `color` 属性）。修复：

```vue
<script setup lang="ts">
import { UIcon } from '@veltra/desktop'
import { Star } from '@veltra/icons/normal'
</script>

<template>
  <!-- 正确：父级设置 color -->
  <div style="color: var(--u-color-primary)">
    <u-icon :size="18"><Star /></u-icon>
  </div>
</template>
```

`colorful` 图标不适用本条；页面整体无颜色时先检查应用入口是否调用了 `loadTheme()`（见 `agent-docs/styles/theme.md`）。
