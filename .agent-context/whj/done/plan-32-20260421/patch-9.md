# 修复水平 tabs 激活项上下阴影被 viewport 裁切

## 补丁内容

用户反馈水平 `u-tabs` / `u-tabs-horizontal` 的激活 `__item` 丢失上下方向的 `box-shadow` 视觉。定位到根因在 `.u-tabs-bar__viewport` 的 `overflow-x: auto; overflow-y: hidden` 组合：CSS 规范下 `overflow-x: auto` 会强制非 `visible` 的另一轴也按 `hidden`/`auto` 实际裁切，导致激活 `__item` 的 `$active-shadow`（`0 1px 2px ...` + `0 1px 3px ...`，垂直方向延展 -2px~4px）被视口上下边缘切掉。

修复思路：将 `.u-tabs-bar` 根节点的上下 `padding` 下放给 `.u-tabs-bar__viewport`，利用「`overflow` 裁切发生在 padding-box 外沿」的规则，为阴影保留 4px 的安全渲染区。具体改动：

- `.u-tabs-bar`：`padding: $list-padding` → `padding: 0 $list-padding`（仅保留左右方向）。
- `.u-tabs-bar__viewport`：新增 `padding: $list-padding 0`，与 `overflow-x: auto; overflow-y: hidden` 配合，上下 4px 作为阴影 bleed 区。

几何验证：
- bar 高度仍为 `item-height + 8`（viewport cross-axis 因新增上下 padding 增 8px，正好抵消 bar 不再提供的上下 padding）。
- 水平方向 `clientWidth` / `scrollWidth` 不变，溢出检测与水平滚动逻辑不受影响。
- nav 按钮（非 viewport 子元素）仍借由 bar 的 `align-items: center` 垂直居中，hover 时的 `$active-shadow` 渲染在 bar 的 cross-axis 空间内，不被任何 overflow 裁切。
- 垂直布局（`u-tabs-vertical`）无 `__viewport`，不受影响。

## 影响范围

- 修改文件: `/Users/whj/codes/ultra-ui/packages/desktop/src/components/tabs/style.scss`
