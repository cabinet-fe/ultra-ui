# 修复 number-range-input 区间顺序校验时机

> 状态: 已执行

## 目标

将起始/结束数值的「顺序修正」从输入过程中的实时联动改为**焦点离开整个区间控件后**再执行，避免输入中途另一侧被改写导致难以录入目标范围；失焦后沿用既有 `normalizeFromSplit` 规则（两侧均有值且起始大于结束时，将结束抬到起始）并触发 `change`。

## 内容

1. 修改 `ui/components/number-range-input/number-range-input.vue`：`startModel` / `endModel` 的 setter 仅更新对应一侧，不在 setter 内比较并改写另一侧。
2. 在同一文件中扩展根节点 `focusout` 处理：在焦点未转移到控件内部子元素的前提下（与现有 `autoPair` 判断一致），在 `autoPair` 逻辑之后调用顺序归一化；`disabled` / `readonly` 下跳过。
3. 将 `v-model:start` / `v-model:end` 分支的 `watch([startRef, endRef], …)` 改为写入元组时不做 `normalizeFromSplit`，避免分绑定时仍实时钳制；`onMounted` 仅在有值的初始化路径保持原行为边界即可。
4. 运行 `bun vitest`（或针对相关用例）确认无回归。

## 影响范围

- `ui/components/number-input/number-input.vue`
- `ui/components/number-range-input/number-range-input.vue`

说明：`bun vitest run` 当前因 `expression-editor` 相关用例的 TSX 解析失败而整体退出（与本次文件无关），未作为本次回归通过依据。

## 历史补丁

- patch-1: focusout 合并 change 触发
- patch-2: 步进后区间顺序归一化
- patch-3: 步进动画期间锁定与边界校验
- patch-4: 步进点击与 blur 顺序修复
