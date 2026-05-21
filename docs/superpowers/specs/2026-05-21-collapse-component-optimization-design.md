# Collapse 组件样式与 API 优化设计规约

## 1. 目标描述

针对 `UCollapse` 和 `UCollapseItem` 组件进行样式与 API 的优化，从而提高界面元素密度，精简历史遗留的不必要 API 功能（移除左侧图标位置支持、移除隐藏图标功能），使得代码结构更纯粹、体积更小、更易于维护。

## 2. 详细设计

### 2.1 样式优化（提高密度，减少 Padding）
选择**方案 A（标准紧凑型）**，对 `style.scss` 中的各尺寸水平/垂直内边距变量进行如下缩减：

| 尺寸 (Size) | 属性 | 调整前 (Old) | 调整后 (New) |
| :--- | :--- | :--- | :--- |
| **small** | `padding-x` (水平内边距)<br>`padding-y` (垂直内边距) | `12px`<br>`10px` | **`10px`**<br>**`6px`** |
| **default** | `padding-x` (水平内边距)<br>`padding-y` (垂直内边距) | `16px`<br>`14px` | **`12px`**<br>**`10px`** |
| **large** | `padding-x` (水平内边距)<br>`padding-y` (垂直内边距) | `20px`<br>`18px` | **`16px`**<br>**`14px`** |

### 2.2 移除左侧图标支持
- 移除 `CollapseProps` (位于 `packages/desktop/src/types/collapse.ts`) 中的 `iconPosition` 属性及 `CollapseIconPosition` 类型。
- 移除 `collapse.vue` 中对 `iconPosition` 的 computed 计算、注入 (provide) 和 template 类名绑定。
- 移除 `di.ts` 中的 `iconPosition` 依赖类型和 context 定义。
- 移除 `collapse-item.vue` 对左侧图标的条件判断与 template 节点 `<span v-if="showLeftIcon" :class="cls.e('icon')">...</span>`，展开图标固定在标题右侧。

### 2.3 移除隐藏图标支持
- 移除 `CollapseItemProps` 中的 `hideIcon` 属性。
- 移除 `collapse-item.vue` 中的 `showRightIcon` 的条件判断，右侧展开图标总是被渲染。

### 2.4 演示页面 (Playground) 调整
- 修改 `playgrounds/desktop/src/collapse/index.vue`：
  - 移除“图标位置” Demo 配置（可以将该卡片转为演示嵌套或默认行为，或者直接移除）。
  - 移除“禁用与隐藏图标” Demo 中的第三项（隐藏图标项），卡片改名为“禁用状态”。
  - 移除“嵌套使用” Demo 中子 Collapse 的 `icon-position="left"` 属性。

## 3. 破坏性变更影响
这是一个破坏性变更 (Breaking Change)，不再进行向后兼容。对于以前传入 `icon-position` 或 `hide-icon` 的用户，在新版本中这两个属性将被废弃，且不再起作用。

## 4. 验证计划
- **代码构建校验**：运行 `bun run build` 确保各 package 构建顺利且无 TS 错误。
- **类型系统校验**：运行 `bun run check-types` 确保全局无任何由于 API 移除导致的类型冲突。
- **视觉效果与交互校验**：启动 Playground (`cd playgrounds/desktop && bun dev`) 并在浏览器中验证 Collapse 的全新紧凑样式，确保其右侧箭头组件定位、旋转动画、边框模式和 Ghost 模式下的视觉呈现均完全符合预期。
