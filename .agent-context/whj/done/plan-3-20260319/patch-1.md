# 优化 menu-item 高亮与收起动画

## 补丁内容

收敛 `menu-item` 当前高亮的视觉权重，将原本偏硬的整块底色与描边调整为更轻的激活底色、左侧强调条和更弱的阴影层次，让当前项更清晰但不突兀。

同时修复子菜单收起动画末段的顿挫感：此前 `sub-list` 自身保留了顶部内边距，但过渡只在处理 `height`，导致收起到最后会残留一小段空白再突然消失。本次将 `padding-top` 纳入过渡，并同步调整透明度与位移时序，消除末段卡顿。

## 影响范围

- 修改文件: `ui/components/menu/style.scss`
- 修改文件: `ui/components/menu/use-menu-transition.ts`
- 修改文件: `ui/styles/theme/light.ts`
- 修改文件: `ui/styles/theme/dark.ts`
