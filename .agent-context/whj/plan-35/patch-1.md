# 移除失败的层级虚线连接线，回归简洁的缩进布局

## 补丁内容

原计划步骤 7/8 引入的"层级连接线（showLine 风格，默认开启）"在 playground 实测视觉效果极差，与"恢复层级感、现代观感"的目标背道而驰。具体问题：

1. **断裂的悬浮竖线**：根节点 `depth=0` 不渲染 `u-tree__indent`，没有竖线延伸到自身下方；而它的子节点从自身节点顶部开始独立渲染竖线。结果是父节点与子节点之间视觉上**完全断开**，像"悬浮的两截虚线"而非一棵树。
2. **根节点误绘水平分支**：`.u-tree__expand-icon::before` 无条件给每个非叶子节点画一段指向展开图标的水平虚线，导致 `手抓饼1/2/3` 这类**根节点**左侧也出现一段短横虚线，但这些节点没有父节点，该分支在语义上是错的。
3. **`is-last` 截断错位**：规范的 showLine 需要按"祖先链中该级祖先是否是其父的最后一个"逐列决定是否绘线——这需要在模板层把整条祖先链的 `isLast` 状态传递给每个 `u-tree__indent`。计划里草率地用 `node === parent.children[last]` + `.u-tree__indent:last-of-type::before` 的半高切断做近似，对 `depth ≥ 2` 的嵌套会产生明显错位。即便当前 playground 仅 `depth=0/1`，也已呈现上述断裂感。

真正正确的 showLine 实现工作量与风险都远超计划估计，而 antd/element-plus 等主流 Tree 组件默认也不画这种连接线、并把它作为单独 `showLine` prop 提供（且 API 复杂）。在本轮计划"零破坏对外 API、不新增 prop"的约束下，**保留该功能得不偿失**。

本补丁撤回虚线连接线视觉系统，保留所有已验证有效的正向样式与性能改动：

- 左侧 3px 色带 + `color.primary.light-9` 淡背景构成的选中态（不再使用 `!important`）
- hover 背景 `bg-color.hover`、禁用态取消 hover 反馈
- Ripple `color.primary.light-5 / opacity 0.25`
- 节点 `min-height` 与 `size`（28 / 32 / 40px）联动
- 非虚拟模式通过相邻兄弟 `margin-top: 2px` 提供间距
- 虚拟模式的 `estimateSize` 与 `size` 联动（32 / 36 / 44px）
- `useTreeNodes` / `useCheck` 的性能重构（单次 DFS 扁平化、差集化 watch）

浏览器实测：1000 × 2 节点数据展开、过滤（`手抓饼99` 命中 `手抓饼99`/`990`-`994` 等）均表现正常，节点缩进清晰（父节点贴边、叶子子节点缩进 1 级约 40px），视觉干净。

### 关键改动

1. **`packages/desktop/src/components/tree/style.scss`**
   - `.u-tree__indent`：移除 `position: relative`、`align-self: stretch` 及 `::before` 虚线绘制；仅保留 `flex-shrink: 0; width: 20px` 作为纯缩进占位。`.u-tree__indent--leaf` 只保留宽度差，去掉 `::after` 水平分支。
   - `.u-tree__expand-icon`：删除 `::before` 水平分支绘制；`position: relative` 不再需要。其余（圆形、hover 背景、旋转动效）维持不变。
   - `.u-tree__node` 的 `is(last)` 分支连同最后一列半高切断逻辑整体移除。

2. **`packages/desktop/src/components/tree/tree-node.vue`**
   - 删除 `isLast` computed 及其 `computed` 导入。
   - 根元素 class 列表移除 `bem.is('last', isLast)`。
   - `u-tree__indent` / `u-tree__indent--leaf` 占位 span/i 保留，作为纯缩进空隙（DOM 结构与 `measureElement` 交互不变）。

### 相对原计划的偏差声明

- **计划目标第一条**中"引入层级连接线（showLine 风格，默认开启）"一项**撤回**。该目标的实现在 playground 实测下反而**加剧**了"视觉突兀、层级混乱"的问题，与计划初衷矛盾，故不再追求。其余目标（消除圆环占位、选中态去 `!important`、hover/ripple 对比、虚拟与非虚拟间距一致）全部保留并达成。
- 原计划"步骤 7/8" 中所有与虚线连接线、水平分支、`is-last` 收尾相关的描述**视为作废**；这两个步骤中其余仍有效的条目（删除 padding-left 内联 + 圆环占位、`u-tree__indent` 作为缩进占位、节点 min-height、兄弟间距、选中色带、hover/ripple 色值、禁用态 hover 处理、Empty 样式）在本补丁后仍生效。

## 影响范围

- 修改文件: `packages/desktop/src/components/tree/style.scss`
- 修改文件: `packages/desktop/src/components/tree/tree-node.vue`
