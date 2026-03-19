# 菜单项与子菜单增加固定 2px 间距

## 补丁内容

在菜单样式中为相邻的 `menu-item` / `menu-sub` 节点补充固定的 2px 上间距规则，使同级菜单节点之间的垂直间隔稳定，不再依赖节点内部 margin 的视觉效果。

## 影响范围

- 修改文件: `ui/components/menu/style.scss`
