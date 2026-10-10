---
'@veltra/sheet': major
'@veltra/desktop': minor
---

USheet 缺省滚动条切换为引擎原生模式，scrollbar 扩为全形态透传（infinitable ^0.1.4）

- @veltra/sheet：`SheetProps.scrollbar` 扩为 `boolean | ScrollbarOptions`（类型从 `infinitable/sheet` 导入）全形态透传；缺省从画布悬浮滚动条（true）改为原生档 `{ mode: 'native' }`——浏览器原生滚动条在独立 gutter 渲染（`scrollbar-gutter: stable`），不再遮挡最底行/最右列单元格；`scrollbar: false` 整体关闭语义不变（显式传 false 的宿主不受缺省切换影响）；`scrollbar: true` 与对象形态（`mode: 'canvas'` 回画布档，含 visibility / hideDelay / reserve 显示策略）按引擎语义透传。对象形态为构造期选项，引用更替触发网格重建（同 header / editors 的稳定引用约定，宿主勿在模板内联对象字面量）
- @veltra/desktop：file-viewer 的 Excel/CSV 预览（SheetGrid readonly 直连）随 `infinitable` 升至 ^0.1.4 一并声明（fixed 组口径）；预览未显式配置 scrollbar，引擎缺省画布档行为不变
- `infinitable` 依赖三处（@veltra/sheet / @veltra/desktop / playground）统一升至 ^0.1.4（原生滚动条模式所在版本线；版本号合入时序以上游 npm 发版为准）
