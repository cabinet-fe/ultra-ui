# @veltra/icons

Vue 图标，每一个都是一个 SFC 组件。

## 快速开始

### 导入

推荐按集合子路径按需导入；根入口会同时 re-export normal + colorful（体积更大）。

```ts
import { Search, Close, Plus, Edit } from '@veltra/icons/normal'
import { Excel, Pdf } from '@veltra/icons/colorful'
// 或
import { Search, Excel } from '@veltra/icons'
```

### 使用

一般配合 `u-icon` 组件使用

```vue
<u-icon :size="16" color="primary"><Search /></u-icon>

<!-- 动态渲染 -->
<u-icon><component :is="icon" /></u-icon>
```

## 可用图标

清单以 `packages/icons` 生成结果为准（`bun run icons:gen` / 包入口）。下列为常用分类摘要。

### 表单控件图标

用于表单设计器或低代码平台中，代表各个控件本身的图标。包括：

`FormContainer`、`FormInput`、`FormTextarea`、`FormPasswordInput`、`FormNumberInput`、`FormNumberRangeInput`、`FormSelect`、`FormMultiSelect`、`FormCascader`、`FormTreeSelect`、`FormMultiTreeSelect`、`FormDatePicker`、`FormDateRangePicker`、`FormSlider`、`FormSwitch`、`FormCheckbox`、`FormRadio`、`FormTable`、`FormAutoComplete`、`FormFilePicker`

### 方向与导航

各种方向指示、箭头、排序、拉伸及位置对齐图标。包括：

`ArrowUp`、`ArrowDown`、`ArrowLeft`、`ArrowRight`、`ArrowUpdown`、`CaretTop`、`CaretBottom`、`CaretLeft`、`CaretRight`、`DArrowLeft`、`DArrowRight`、`Left`、`Right`、`Bottom`、`Backtop`、`PageFirst`、`PageLast`、`Sort`、`SortLeft`、`SortRight`、`Rollback`、`Rollfront`、`Move`、`MoveHorizontal`、`Rotation`、`RotateLeft`、`RotateRight`、`AlignTop`、`AlignBottom`、`AlignCenter`、`VerticalAlignCenter`、`VerticalAlignLeft`、`VerticalAlignRight`、`InsertToNext`、`InsertToPrev`、`Maximum`、`House`、`HouseFilled`

### 常规操作与状态

按钮、对话框、提示信息等常用的交互反馈及业务操作图标。包括：

`Search`、`Clear`、`Close`、`Plus`、`Minus`、`Check`、`CheckRectangleFilled`、`Remove`、`RemoveFilled`、`RemoveRectangle`、`Delete`、`Edit`、`EditPen`、`Save`、`Copy`、`Download`、`Upload`、`CloudDownload`、`History`、`Refresh`、`Recover`、`Loading`、`ZoomIn`、`ZoomOut`、`Enter`、`Lock`、`Unlock`、`Login`、`Logout`、`Poweroff`、`Secured`、`View`、`Hide`、`AddChild`、`CircleCheck`、`CircleCheckFilled`、`CircleClose`、`CirclePlus`、`InfoCircle`、`InfoFilled`、`Warning`、`WarningFilled`、`TriangleAlert`、`QuestionFilled`、`Help`、`Tips`、`Dot`、`MoreFilled`、`MoreVertical`、`Filter`、`Pin`、`PinFilled`、`Send`、`Fork`、`Relativity`

### 实体与数据

数据库、多媒体、金融、系统组件、文件管理等数据类型图标。包括：

`Database`、`Server`、`Variable`、`Setting`、`Tools`、`Monitor`、`Mobile`、`PictureRounded`、`Wallet`、`CreditCard`、`Discount`、`MoneyCircle`、`QrCode`、`Scan`、`ChartPie`、`Layers`、`Books`、`Calendar`、`Time`、`Hourglass`、`Folder`、`FolderAdd`、`FolderOpened`、`FileAdd`、`Attach`、`Link`、`Unlink`、`List`、`Queue`、`Printer`、`Location`、`Empty`、`Camera`、`Cart`、`VideoPlay`、`VideoPause`、`ViewModule`

### 社交与通讯

用户管理、通讯、群组、天气、星级等社交属性图标。包括：

`User`、`UserAdd`、`UserClear`、`UserCircle`、`UserGroup`、`UserGroupAdd`、`UserGroupClear`、`Male`、`Female`、`Bell`、`BellFilled`、`Message`、`Horn`、`Service`、`Share`、`Call`、`Internet`、`DeepThinking`、`Flag`、`Star`、`StarFilled`、`Sun`、`Moon`、`Cloudy`、`MostlyCloudy`

### 彩色图标

多色 SVG 保留源文件配色，不受 `u-icon` 的 `color` 或外部 CSS `color` 影响。从 `@veltra/icons/colorful` 导入。包括：

`Archive`、`Excel`、`Fold`、`Image`、`MiddleGround`、`Pdf`、`PowerPoint`、`Title`、`Txt`、`UnknownFile`、`Video`、`Word`
