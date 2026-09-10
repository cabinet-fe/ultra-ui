# @veltra/icons

Vue 图标，每一个都是一个 SFC 组件。

## 快速开始

### 导入

推荐按集合子路径按需导入；根入口会同时 re-export normal + colorful（体积更大），但两个集合重名的 `FontColor` 被 `export *` 丢弃，必须从子路径导入。

```ts
import { Search, Close, Plus, Edit } from '@veltra/icons/normal'
import { Excel, Pdf, FontColor } from '@veltra/icons/colorful'
// 或
import { Search, Excel } from '@veltra/icons'
```

### 使用

配合 `u-icon` 组件使用：图标组件**无 props**，尺寸写在 `u-icon` 上，颜色由父级 `color` 经 `currentColor` 继承。

```vue
<script setup lang="ts">
import { Search } from '@veltra/icons/normal'
import { UIcon } from '@veltra/desktop'

// 动态渲染：图标组件本身可当变量传给 :is
const icon = Search
</script>

<template>
  <!-- 正确：:size 给 u-icon；u-icon 没有 color 属性，颜色靠父级 color 继承 -->
  <div style="color: var(--u-color-primary)">
    <u-icon :size="18"><Search /></u-icon>
  </div>

  <!-- 动态渲染 -->
  <u-icon :size="18"><component :is="icon" /></u-icon>
</template>
```

图标组件没有 props：`:size` 必须给 `u-icon`（`<u-icon :size="18"><User /></u-icon>`）。直接写 `<User :size="18" />` 无效且不报错——属性透传到根 `<svg>` 后被浏览器忽略；不用 `u-icon` 时必须自带尺寸样式：`<User style="width: 18px; height: 18px" />`。

## 可用图标

清单以 `packages/icons/src/normal.ts` / `colorful.ts` 的导出为准（新增图标后在 `packages/icons` 目录运行 `bun run icons:gen` 重新生成）。下列为常用分类摘要；名字必须按 barrel 导出逐字核对，`SwitchButton`、`Forward`、`Switch` 等常见误写名不存在（开关控件图标是 `FormSwitch`），完整清单见 `agent-docs/icons.md` 的「完整导出清单」。图标名**无 `Icon` 后缀**（写 `Plus`，不是 `PlusIcon`）。

### 表单控件图标

用于表单设计器或低代码平台中，代表各个控件本身的图标。包括：

`FormContainer`、`FormInput`、`FormTextarea`、`FormPasswordInput`、`FormNumberInput`、`FormNumberRangeInput`、`FormSelect`、`FormMultiSelect`、`FormCascader`、`FormTreeSelect`、`FormMultiTreeSelect`、`FormDatePicker`、`FormDateRangePicker`、`FormSlider`、`FormSwitch`、`FormCheckbox`、`FormRadio`、`FormTable`、`FormAutoComplete`、`FormFilePicker`

### 方向与导航

各种方向指示、箭头、排序、拉伸及位置对齐图标。包括：

`ArrowUp`、`ArrowDown`、`ArrowLeft`、`ArrowRight`、`ArrowUpdown`、`CaretTop`、`CaretBottom`、`CaretLeft`、`CaretRight`、`DArrowLeft`、`DArrowRight`、`Left`、`Right`、`Up`、`Down`、`Backtop`、`PageFirst`、`PageLast`、`Sort`、`SortLeft`、`SortRight`、`SortUp`、`SortDown`、`Rollback`、`Rollfront`、`Move`、`MoveHorizontal`、`Rotation`、`RotateLeft`、`RotateRight`、`AlignTop`、`AlignBottom`、`AlignCenter`、`VerticalAlignCenter`、`VerticalAlignLeft`、`VerticalAlignRight`、`InsertToNext`、`InsertToPrev`、`Maximum`、`House`、`HouseFilled`

### 常规操作与状态

按钮、对话框、提示信息等常用的交互反馈及业务操作图标。包括：

`Search`、`Clear`、`Close`、`Plus`、`Minus`、`Check`、`CheckRectangleFilled`、`Remove`、`RemoveFilled`、`RemoveRectangle`、`Delete`、`Edit`、`EditPen`、`Save`、`Copy`、`Download`、`Upload`、`CloudDownload`、`History`、`Refresh`、`Recover`、`Loading`、`ZoomIn`、`ZoomOut`、`Enter`、`Lock`、`Unlock`、`Login`、`Logout`、`Poweroff`、`Secured`、`View`、`Hide`、`AddChild`、`CircleCheck`、`CircleCheckFilled`、`CircleClose`、`CirclePlus`、`InfoCircle`、`InfoFilled`、`Warning`、`WarningFilled`、`TriangleAlert`、`QuestionFilled`、`Help`、`Tips`、`Dot`、`MoreFilled`、`MoreVertical`、`Filter`、`Pin`、`PinFilled`、`Send`、`Fork`、`Relativity`

### 实体与数据

数据库、多媒体、金融、系统组件、文件管理等数据类型图标。包括：

`Database`、`Server`、`Variable`、`Setting`、`Tools`、`Monitor`、`Mobile`、`PictureRounded`、`Wallet`、`CreditCard`、`Discount`、`MoneyCircle`、`QrCode`、`Scan`、`ChartPie`、`Layers`、`Books`、`Calendar`、`Time`、`Hourglass`、`Folder`、`FolderAdd`、`FolderOpened`、`FileAdd`、`Attach`、`Link`、`Unlink`、`List`、`Queue`、`Printer`、`Location`、`Empty`、`Camera`、`Cart`、`VideoPlay`、`VideoPause`、`ViewModule`、`Process`、`Code`、`GitBranch`、`Key`、`Terminal`、`Token`、`Build`、`Checklist`、`Role`

### AI

智能体、技能、模型、提示词等 AI 相关图标。包括：

`Agent`、`Skill`、`Sparkles`、`AiChat`、`Model`、`Prompt`、`Brain`、`DeepThinking`

### 社交与通讯

用户管理、通讯、群组、天气、星级等社交属性图标。包括：

`User`、`UserAdd`、`UserClear`、`UserCircle`、`UserGroup`、`UserGroupAdd`、`UserGroupClear`、`Male`、`Female`、`Bell`、`BellFilled`、`Message`、`Horn`、`Service`、`Share`、`Call`、`Internet`、`Flag`、`Star`、`StarFilled`、`Sun`、`Moon`、`Cloudy`、`MostlyCloudy`

### 彩色图标

多色 SVG 保留源文件配色，不受父级 CSS `color` 影响。从 `@veltra/icons/colorful` 导入。包括：

`Archive`、`Excel`、`Fold`、`FontColor`、`Image`、`MiddleGround`、`Pdf`、`PowerPoint`、`Title`、`Txt`、`UnknownFile`、`Video`、`Word`
