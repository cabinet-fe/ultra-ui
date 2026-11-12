# @veltra/mobile

## 1.1.7

### Patch Changes

- d6ba097: 修复 `UForm` 行式表单（label 左置）中文本域行的对齐：label 改为与文本域首行文本（含 placeholder）顶对齐，占位符不再相对 label 视觉上浮；`label-position="top"` 形态不受影响。
- Updated dependencies [bf4bcdd]
  - @veltra/styles@2.0.0
  - @veltra/compositions@2.0.0
  - @veltra/utils@2.0.0

## 1.1.6

### Patch Changes

- 78b3ea6: 修复各组件尺寸档视觉尺寸被触控热区或下限抹平的问题。此前 15 个组件用 `min-height: max(高度档, 44px)` 兜底热区，small / default 两档高度都被抬到 44px；现改为视觉尺寸按档生效，不足 44px 的点击命中区域由伪元素上下外扩补足（触发器类用 `::before`，不拦截清除 / 箭头等内部按钮）。受影响组件：select、multi-select、cascade、date-picker、time-picker、input、textarea、checkbox、checkbox-group、radio、switch、tabs、segment、list。连带修正：input / textarea 移除根元素 `overflow: hidden` 并补根元素点击聚焦；行内清除与前后缀按钮改用垂直居中的 44px 命中层；radio / checkbox 指示器与 steps 圆圈去掉 20px / 40px 下限，small 与 default 不再等大。
- 78b3ea6: `UProgress` 的 `type` 改为可选并默认 `primary`。此前为必填，且组件颜色完全依赖 type 修饰类，不传时条形与圆环没有颜色；现与 badge / button / message / tag 的可选惯例一致，无 type 用法直接可用。

## 1.1.5

### Patch Changes

- 16bbe77: 修复 `UButton` 小 / 中按钮渲染高度相同：此前触控热区兜底把两档高度都抬到 44px，三档尺寸只剩 large 有区分。现在小 / 中 / 大按钮分别按 32 / 40 / 48px 生效，点击命中区域仍不小于 44×44。

## 1.1.4

### Patch Changes

- d641043: 放缓入场缓动曲线，恢复 150ms 级微交互的可感知过程。
  
  - 主题 `transition.easeOut` 由 `cubic-bezier(0.23, 1, 0.32, 1)` 改为 `cubic-bezier(0.33, 1, 0.68, 1)`。原曲线在 15ms 就走完 40%、75ms 走完 97%，150ms 级的过渡几乎是一帧闪出；新曲线前段仍快，但整个过程可见。
  - `fade-scale`、`slide-down` / `slide-up`、`zoom-in` 系列、`UTag`、`UMTag`、`UTip`、AI 对话面板与 `UDialog` 最大化翻转里写死的同一条曲线同步替换，避免主题 token 与局部硬编码分叉。
  - `UScroll` 滚动条出现/隐藏时长由 `fast`（0.15s）改为 `normal`（0.25s）；悬停变宽保持 `fast`，但曲线随主题更新，不再瞬移。

## 1.1.3

### Patch Changes

- 修复 `UButton` 加载状态图标旋转动画不生效：模板上的 `is-loading` 修饰类与样式选择器不匹配，改为 `m.bem($root-name, icon)` 生成 `.um-button__icon` 后动画与尺寸规则恢复；同时将日期选择器翻页箭头调整为主题主色加粗。

## 1.1.2

### Patch Changes

- 690cce4: 修复 `UDescriptions` 用 `v-for` 渲染 `UDescriptionsItem` 时子项全部丢失的问题，`<template>` 包裹与成组条件渲染同样恢复可用。

## 1.1.1

### Patch Changes

- 251c518: 重发 1.1.0 的修复版：此前发布流程跳过了 mobile 构建，发布产物缺少 `dist` 导致宿主 import 无法解析；本版本起 tarball 恢复携带 `dist`。

## 1.1.0

### Minor Changes

- c4f39bb: 新增 `UUploader` 上传组件，支持 `v-model` 文件列表、`accept` 类型过滤、`maxCount` / `maxSize` 数量与大小限制、自定义 `upload` 上传函数及内置图片预览。
- 4b2cc00: 新增级联选择器 `UCascade`，多选时已选标签按宽度折叠为 +N。
- 1e13ae3: 变更进出场动效，高频控件不再从零放大，共享过渡去掉过冲。
  - 复选框、单选框、输入框与多行文本的勾选不再使用 `zoom-in`。
  - `UTag` 出现时从 `scale(0.96)` 淡入，不再从 0 放大。
  - 共享过渡 `fade-scale` 进入从 `scale 0.96`、离开到 `scale 0.98`，时长 200ms / 160ms，曲线改为 `cubic-bezier(0.23, 1, 0.32, 1)`；`slide` 与 `zoom-in` 系列使用同一条曲线，主题 `easeOut` 同步为这条曲线。
  - `UDrawer` 离开使用同一条 ease-out。
  - `USegment` 选中滑块跟随选项滑动；`UTabs` 指示条跟随当前标签，内容不再交叉淡入淡出。
  - `prefers-reduced-motion: reduce` 时，`fade-scale`、`slide`、`zoom-in` 与消息、确认弹窗只保留透明度过渡。

### Patch Changes

- f3b6037: 修复 `USegment` 滑块在 transform 缩放的祖先元素内定位偏移。
- ce71084: 修复 `UMultiSelect` 已选标签在表单内被挤压换行，现按宽度折叠。
- 816d4dd: 修复 `UBadge` 显隐切换后角标偏离宿主右上角。
- b9558f6: 修复 `UTimeline` 自定义节点与竖线未同心对齐。
- 01a1ec7: 修复 `UTimePicker` 滚轮数字被高亮带遮挡。
- af06422: 修复 `UDialog` / `UDrawer` 遮罩透明不可见，改用 rgba 背景。
- 40ef1d5: 修复 `UMessageConfirm` 遮罩透明不可见，操作按钮区改为贴底。
- 4132931: 变更 `UCollapse` 为填充式灰卡层次，按压反馈对齐移动端惯例。
- f1732fc: 修复 `UDescriptions` 边框模式单元格留白丢失与 `vertical` 布局灰底不生效。
- a5480e2: 修复底部弹层标题未水平居中。
- 91cb560: 收紧 `UCheckboxGroup` 行距，按尺寸收敛。
- 7d188cc: 裸表单控件支持将 `label-position` / `label-width` 透传给 `UFormItem`。
- 24c2c95: 修复表单内嵌 `UTextarea` 带边框顶贴分割线，现去边框。
- 974c555: 修复 `UBadge` 个位数角标呈竖椭圆，现呈正圆。
- 88078a8: 修复 `UDialog` 全屏模式未铺满屏幕边缘。
