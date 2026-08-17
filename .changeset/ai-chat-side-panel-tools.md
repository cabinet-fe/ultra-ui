---
'@veltra/ai': minor
'@veltra/desktop': minor
---

UAiChat 工具渲染新增 `renderTo: 'panel'`：工具的 `render` 组件可展示在对话区右侧的侧边面板中（新调用自动打开聚焦，工具卡片仅留「查看面板」入口可切回历史调用），适合后台页面、表单、图表、列表等大交互区工具；`ChatTool.panelWidth` 可指定该工具面板的默认宽度（缺省 420px）。面板与会话区布局基于 `ULayout` 分列，宽度支持拖拽调节。

`ULayout` 新增 `colMinSizes` 属性（按列约束 resizable 拖拽的最小宽度）与 `resize-start` / `resize-end` 事件；程序化变更 `cols` 时拖拽手柄位置同步更新。
