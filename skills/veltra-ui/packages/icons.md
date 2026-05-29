# @veltra/icons

## 导入规则

```ts
// 单色图标（受 CSS color 影响）
import { Search, Close, Plus, Edit } from '@veltra/icons/normal'

// 多色图标（保留原 SVG 颜色）
import { Logo } from '@veltra/icons/colorful'
```

`@veltra/icons` 根入口不导出图标组件，**必须**通过 `/normal` 或 `/colorful` 子路径导入。Vite 自动导入插件**不**处理图标，图标始终需要手动 import。

## 用法

图标是标准 Vue SFC 组件。直接渲染或包裹在 `<u-icon>` 内统一控制尺寸/颜色：

```vue
<Search style="color: #1890ff; font-size: 20px" />

<u-icon :size="16" color="primary"><Search /></u-icon>
```

在组件 props 中接收图标组件用 `Component` 类型，模板用 `<component :is="icon">`：

```ts
import type { Component } from 'vue'
interface Props {
  icon?: Component
}
```

```vue
<u-icon v-if="icon" :size="iconSize"><component :is="icon" /></u-icon>
```

## normal 图标

### 表单控件图标

用于表单设计器或低代码平台中，代表各个控件本身的图标。

`Form` `Input` `Textarea` `PasswordInput` `NumberInput` `NumberRangeInput` `Select` `MultiSelect` `Cascader` `TreeSelect` `MultiTreeSelect` `DatePicker` `DateRangePicker` `Slider` `Switch` `Checkbox` `Radio` `Table` `AutoComplete` `FilePicker`

### 方向与导航

各种方向指示、箭头、排序、拉伸及位置对齐图标。

`ArrowUp` `ArrowDown` `ArrowLeft` `ArrowRight` `ArrowUpdown` `CaretTop` `CaretBottom` `CaretLeft` `CaretRight` `DArrowLeft` `DArrowRight` `Left` `Right` `Bottom` `Backtop` `PageFirst` `PageLast` `Sort` `SortLeft` `SortRight` `Rollback` `Rollfront` `Move` `MoveHorizontal` `Rotation` `RotateLeft` `RotateRight` `AlignTop` `AlignBottom` `AlignCenter` `VerticalAlignCenter` `VerticalAlignLeft` `VerticalAlignRight`

### 常规操作与状态

按钮、对话框、提示信息等常用的交互反馈及业务操作图标。

`Search` `Clear` `Close` `Plus` `Minus` `Check` `Remove` `Delete` `Edit` `EditPen` `Save` `Copy` `Download` `Upload` `CloudDownload` `History` `Refresh` `Loading` `ZoomIn` `ZoomOut` `Enter` `Lock` `Unlock` `Login` `Logout` `Poweroff` `Secured` `View` `Hide` `AddChild` `CircleCheck` `CircleCheckFilled` `CircleClose` `CirclePlus` `InfoCircle` `InfoFilled` `Warning` `WarningFilled` `TriangleAlert` `QuestionFilled` `Help` `Dot` `MoreFilled` `MoreVertical`

### 实体与数据

数据库、多媒体、金融、系统组件、文件管理等数据类型图标。

`Database` `Server` `Variable` `Setting` `Tools` `Monitor` `Mobile` `PictureRounded` `Wallet` `CreditCard` `Discount` `MoneyCircle` `QrCode` `Scan` `ChartPie` `Layers` `Books` `Calendar` `Time` `Folder` `FolderAdd` `FolderOpened` `FileAdd` `Attach` `Link` `Unlink` `List` `Queue` `Printer` `Location` `Empty`

### 社交与通讯

用户管理、通讯、群组、天气、星级等社交属性图标。

`User` `UserAdd` `UserClear` `UserCircle` `UserGroup` `UserGroupAdd` `UserGroupClear` `Bell` `BellFilled` `Message` `Horn` `Service` `Share` `Call` `Internet` `DeepThinking` `Flag` `Star` `StarFilled` `Sun` `Moon` `Cloudy` `MostlyCloudy`

## 多色图标

```ts
import { Logo } from '@veltra/icons/colorful'
```

多色图标保留原始 SVG 颜色，不受外部 CSS `color` 影响，通过 `style` 控制尺寸。

## Vite 自动导入

`@veltra/vite` 的 resolver 只处理 `@veltra/desktop` 的 `U*` 组件，图标需要手动 import。
