# @veltra/mobile

## 1.1.0

### Minor Changes

- 1e13ae3: 变更进出场动效，高频控件不再从零放大，共享过渡去掉过冲。
  
  - 复选框、单选框、输入框、多行文本和各类选择器的勾选或弹出不再使用 `zoom-in`。
  - `UTag` 出现时从 `scale(0.96)` 淡入，不再从 0 放大。
  - `fade-scale` 进入从 `scale 0.96`、离开到 `scale 0.98`，时长 200ms / 160ms，曲线改为 `cubic-bezier(0.23, 1, 0.32, 1)`。`slide-down` / `slide-up` 与 `zoom-in` 系列使用同一条曲线。主题 `easeOut` 同步为这条曲线。
  - `UDialog` 最大化改为 transform，不再动画宽高。`UDrawer` 离开使用同一条 ease-out。
  - `USegment` 选中滑块跟随选项滑动。`UTabs` 指示条跟随当前标签，标签内容不再交叉淡入淡出。
  - 导航子菜单展开可被中途打断。滚动条只动画 `transform` 与 `opacity`。表单错误提示不再回弹。`UTip` 从触发点缩放出现。
  - `prefers-reduced-motion: reduce` 时，`fade-scale`、`slide`、`zoom-in`、消息、通知和 AI 对话只保留透明度。
