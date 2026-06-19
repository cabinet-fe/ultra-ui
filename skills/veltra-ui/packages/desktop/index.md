# 组件文档（@veltra/desktop）

## 安装

参考 `./installation.md`

## 可用组件列表

- `Message - 消息提示`。用于命令式显示全局短消息反馈。
- `MessageConfirm - 消息确认`。用于命令式弹出需要用户确认的消息框。
- `UAction / UActionGroup - 操作按钮`。用于在列表、表格或详情区展示单个或成组操作按钮。
- `UAutoComplete - 自动补全`。用于输入时按关键字提供候选项并回填选中值。
- `UBadge - 徽标`。用于在元素旁显示数量、状态点或简短标记。
- `UBatchEdit - 批量编辑`。用于左侧选择记录、右侧表单批量编辑字段的场景。
- `UBreadcrumb - 面包屑`。用于展示页面层级路径并支持逐级返回。
- `UButton / UButtonGroup - 按钮`。用于触发普通、主要、危险等用户操作，可组合成按钮组。
- `UCalendar - 日历`。用于按月展示日期网格并承载日期相关内容。
- `UCard - 卡片`。用于将标题、封面、内容和操作收束为独立信息块。
- `UCascade - 级联选择器`。用于从多级联动选项中选择一个路径值。
- `UCheckbox - 复选框`。用于表示单个布尔选择，也可作为复选组里的选项。
- `UCheckboxGroup - 复选框组`。用于在一组复选项中选择多个值。
- `UCheckTag - 可选标签`。用于以标签形态切换单个可选状态。
- `UCodeEditor - 代码编辑器`。用于编辑代码或结构化文本内容。
- `UCollapse / UCollapseItem - 折叠面板`。用于将多段内容折叠展开，减少页面纵向占用。
- `UConditionEditor - 条件编辑器`。用于可视化编辑条件分组和条件表达式。
- `UContextmenu - 右键菜单`。用于在右键或指定位置弹出操作菜单。
- `UDatePanel - 日期面板`。用于直接嵌入日期选择面板，不提供输入框外壳。
- `UDatePicker - 日期选择器`。用于通过输入框和弹层选择单个日期。
- `UDateRangePicker - 日期范围选择器`。用于通过输入框和弹层选择开始、结束日期。
- `UDialog - 对话框`。用于需要用户聚焦处理的模态对话框。
- `UDrawer - 抽屉`。用于从屏幕边缘滑出补充内容或操作表单。
- `UDropdown - 下拉菜单`。用于在触发元素旁展开简短菜单或浮层内容。
- `UEmpty - 空状态`。用于展示列表、表格或区域没有数据时的占位状态。
- `UExpressionEditor - 表达式编辑器`。用于编辑变量、运算符和值组成的表达式。
- `UFilePicker - 文件选择器`。用于选择或上传本地文件并展示文件列表。
- `UFileViewer - 文件查看器`。用于预览图片、PDF、视频等文件内容。
- `UFloatButton - 浮动按钮`。用于在页面固定位置提供高频快捷操作。
- `UForm - 表单容器`。传入 `model`（reactive 数据对象），带 `field` 的控件自动双向绑定；校验通过 `rules` 声明，调用 `formRef.validate()` 或 `formRef.validate(['field'])` 触发；`reset()` 恢复 model 初始快照。
- `UFormItem - 表单项`。用于在表单中单独控制字段标签、校验和反馈。
- `UGanttChart - 甘特图`。用于以时间轴形式展示任务跨度和进度。
- `UGrid - 栅格布局`。用于按列数和间距组织响应式栅格布局。
- `UGridInput - 网格输入框`。用于输入固定长度的分格验证码或短码。
- `UGroupInput - 分组输入`。用于把多段输入组合成一个逻辑字段。
- `UIcon - 图标容器`。用于统一渲染 @veltra/icons 或自定义图标组件。
- `UInput - 输入框`。用于输入单行文本或可清空的字符串值。
- `ULayout - 栅格布局`。用于通过 CSS grid 的 rows、cols 和 gap 创建可调整区域布局。
- `UList - 列表`。用于按统一尺寸渲染一组数据列表项。
- `ULoading - 加载`。用于组件或区域处于异步处理中时显示加载状态或遮罩。
- `UNav - 导航`。用于展示侧边导航、子导航和导航项。
- `UDualNav - 双栏导航`。左栏根级应用图标，右栏复用 UNav 渲染选中应用的子导航。
- `UMultiSelect - 多选选择器`。用于从下拉选项中选择多个值。
- `UMultiTreeSelect - 多选树形选择器`。用于从树形数据中选择多个节点值。
- `UNodeRender - 节点渲染`。用于把 render 函数或 VNode 渲染进模板占位。
- `UNotification - 通知`。用于命令式显示全局通知条。
- `UNumber - 数字展示`。用于格式化展示数字、金额或精度控制后的数值。
- `UNumberInput - 数字输入框`。用于输入可增减、可限制范围的数字值。
- `UNumberRangeInput - 数字范围输入框`。用于输入一组数字区间的最小值和最大值。
- `UPaginator - 分页器`。用于分页切换页码、页容量和总量展示。
- `UPalette - 调色板`。用于选择或展示一组颜色值。
- `UPasswordInput - 密码输入框`。用于输入密码、验证码等可隐藏内容。
- `UPopConfirm - 气泡确认框`。用于在触发元素旁展示轻量确认弹层。
- `UProgress - 进度条`。用于展示任务完成比例或加载进度。
- `UProgressNodes - 进度节点`。用于按节点展示流程进度或状态。
- `URadio - 单选框`。用于表示单个互斥选项，通常配合单选组使用。
- `URadioGroup - 单选框组`。用于在一组选项中选择单个值。
- `URichTextEditor - 富文本编辑器`。用于编辑富文本内容并输出结构化文本。
- `UScroll - 滚动容器`。用于提供自定义滚动容器和滚动行为控制。
- `USelect - 单选选择器`。用于从下拉选项中选择单个值。
- `USlider - 滑块`。用于通过滑动条选择连续或离散数值。
- `USteps - 步骤条`。用于展示分步骤流程及当前步骤状态。
- `USwitch - 开关`。用于切换开启/关闭类布尔状态。
- `UTable - 表格`。用于展示结构化数据、列配置和表格交互。
- `UTableEditor - 表格编辑器`。用于在表格中直接编辑行列数据。
- `UTabs / UTabsHorizontal / UTabsVertical - 标签页`。用于在同一区域切换多个并列内容面板。
- `UTag - 标签`。用于展示分类、状态或可关闭的短标签。
- `UText - 文本`。用于展示带省略、复制或状态样式的文本。
- `UTextarea - 文本域`。用于输入多行文本内容。
- `UTheme - 主题编辑器`。用于预览和编辑组件库主题配置。
- `UTip - 提示`。用于在触发元素旁显示提示、说明或气泡内容。
- `UTree - 树形控件`。用于展示层级数据并支持展开、选择等树操作。
- `UTreeSelect - 树形选择器`。用于从树形数据中选择单个节点值。
- `UWatermark - 水印`。用于给页面或区域叠加文本或图片水印。

详细的组件属性类型及用法示例，请自行在 `components/<component-name>` 目录下查阅 `api.md`。
