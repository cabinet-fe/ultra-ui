# 步进动画期间锁定与边界校验

## 补丁内容

- `number-input` 在步进数字动画未结束时通过 `steppingTweening` 忽略新的增/减操作，避免与 `Tween` 打断逻辑叠加后出现可多次步进、绕过 min/max 感知的问题。
- `increase` / `decrease` 在 `disabled` 之外同步校验 `increasable` / `reducible`，与按钮禁用态一致，避免仅样式禁用仍响应点击或键盘。
- `multiple` 分支下将 `tween.state.n` 从当前原始值播放到目标原始值（此前误设为终点，动画起点与模型不一致）。

## 影响范围

- 修改文件: `ui/components/number-input/number-input.vue`
