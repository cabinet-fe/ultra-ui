Status: done

# 08 — 数据源中心重构（drawer 形态）

**What to build:**
将 `dataset-dialog.vue`（530 行弹框）重构为右侧 drawer（约 80% 宽）的「数据源中心」：

- 左列：连接 → 数据集树；连接支持新建/编辑/删除/测试连接（完整表单流程，mock 执行）
- 右列：选中数据集的编辑器——上部 `UCodeEditor`（sql 高亮）编辑 SQL 并实时 `describe`；中部参数表（`${param}` 自动提取的参数列表，可改 label/类型/默认值/选项）；下部 tabs（字段 schema 表 / 数据预览 `UTable`）
- 字段中文名编辑保留（字段 schema tab 内）；**去掉「选用数据集 selected」概念**——数据集建好即可用，字段面板显示全部数据集
- SQL 解析错误在编辑器下方即时提示
- 新增设计态顶栏「筛选参数」按钮：drawer 汇总当前模板实际绑定数据集的参数并集，可改 label/默认值/控件类型（第二入口，解决"找不到过滤条件配置"）

**Blocked by:** 07 — 数据连接与 SQL 数据集模型（报表的数据基座）.

- [x] 新建 `dataset-center.vue`（drawer）替代 `dataset-dialog.vue`
- [x] 连接管理：列表/表单/删除/测试连接动效
- [x] 数据集编辑：SQL 编辑器 + 参数表 + 字段 schema / 数据预览 tabs
- [x] 设计态顶栏「筛选参数」汇总 drawer（第二入口）
- [x] 原生 `<table>`/`<button>` 全部替换为 desktop 组件
