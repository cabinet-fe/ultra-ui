# 步进点击与 blur 顺序修复

## 补丁内容

- 步进区域根节点增加 `@mousedown.capture.prevent`，在默认失焦顺序之前拦截，避免点击上下箭头时输入框先 `blur`、后执行 `click`：`handleBlur` 内 `model.value = props.modelValue` 若仍为上一次的 v-model，会在 `increase`/`decrease` 之前把值写回旧数，与动画叠加后表现为可反复步进、绕过 min/max 的观感。
- `handleBlur` 在 `steppingTweening` 为真时跳过 props 回写，避免动画帧期间与父级受控值短暂不同步时把已提交步进覆盖掉。

## 影响范围

- 修改文件: `ui/components/number-input/number-input.vue`
