# Menu 组件动画优化与样式美化

> 状态: 未执行

## 目标

在不引入额外运行时依赖的前提下，优化 Menu 子菜单展开/收起的时序与视觉反馈，并增强激活态层级表达。

### 验收标准

- 在 `sample` 中连续快速展开/收起子菜单时，无明显跳动、闪烁或内容错位。
- 展开与收起动画时长/曲线在代码中可明确区分（enter 与 leave 非同一组过渡参数）。
- 激活态左侧指示条和子列表边线在亮色/暗色主题下均能正确取色（使用现有主题变量体系）。
- 折叠菜单（`collapsed-menu`）场景下，子菜单弹层样式不出现回归。

## 内容

### 1. 优化展开/收起动画 (`use-menu-transition.ts`)

**问题**：当前同时动画 `height + padding-top + opacity + transform` 四个属性，且 enter/leave 共用同一 transition 字符串，导致时序表达不清晰。`translateY(-2px)` 视觉收益低。

**修改方案**：
- 去掉 `transform` 动画，仅保留 `height + opacity` 为核心过渡属性。
- 将 transition 拆分为 enter / leave 两组参数，不再复用单一常量：
  - enter：`height 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.18s cubic-bezier(0.4, 0, 0.2, 1)`
  - leave：`height 0.2s cubic-bezier(0.4, 0, 1, 1), opacity 0.12s cubic-bezier(0.4, 0, 1, 1)`
- `padding-top` 处理策略：默认不作为独立动画属性；若实测出现收起末端跳变，则回退为与 `height` 同步过渡（不单独设新曲线）。
- 保留 `will-change` 仅覆盖实际动画属性，避免冗余声明。

### 2. 优化子菜单箭头动画 (`style.scss`)

**修改方案**：
- 箭头旋转 transition 与子菜单时序对齐：
  - 展开使用与 enter 一致的曲线/时长（`0.25s`）。
  - 收起使用与 leave 一致的曲线/时长（`0.2s`）。
- 避免“面板已收起但箭头仍在旋转”的延迟感。

### 3. 美化菜单项样式 (`style.scss`)

**问题**：item 之间间距过小（1-2px），激活态仅有淡背景色变化，子菜单缩进区域的左侧边线存在但层级感不强。

**修改方案**：
- 激活态菜单项左侧增加 `3px` 主色竖条，不改变布局；颜色使用主题变量体系（SCSS 中通过 `fn.use-var(color, primary)` 对应 token），不直接写未定义变量名。
- 子菜单列表（`sub-list`）左侧竖线默认加深为 `border-color` 的半透明版本；当存在激活子项时高亮为主色。优先使用 `:has()` 选择器实现，并在不支持 `:has()` 的环境降级为“仅默认加深，不跟随高亮”。
- 相邻菜单项/子菜单块间距从 `2px` 调整为 `3px`，并检查是否需要同步微调 `item-content` / `sub-content` 的 `margin: 1px 0`（本次默认保持不变，避免过度改动）。

## 影响范围

- `ui/components/menu/use-menu-transition.ts`：过渡参数拆分、动画属性收敛、`padding-top` 策略调整。
- `ui/components/menu/style.scss`：箭头 transition、激活指示条、`sub-list` 边线与间距规则。
- （按需）`ui/components/menu/menu-sub.vue`：若 `:has()` 无法满足语义时，补充最小 class 标记以支持边线高亮。
- 验证范围：普通菜单与 `collapsed-menu` 两种模式；亮色/暗色主题切换。
## 历史补丁
