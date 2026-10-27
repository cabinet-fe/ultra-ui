# @veltra/mobile

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
