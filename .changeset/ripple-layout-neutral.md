---
'@veltra/directives': patch
---

修复 `vRipple` 按下时给宿主按钮内联 `overflow: hidden`、导致 flex/grid 工具栏中按钮被压缩、相邻图标瞬间位移的问题：波纹改为渲染在指令自建的 `u-ripple__layer` 内并由该层裁剪，宿主只在 `position: static` 时临时设置 `relative`（作为波纹层的定位包含块），不再修改 `overflow`，因此不再影响元素的自动最小尺寸与布局；连续快速按下时波纹层与宿主内联样式也能正确回收。
