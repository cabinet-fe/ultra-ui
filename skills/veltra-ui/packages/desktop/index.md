# 组件文档（@veltra/desktop）

## 安装与通用模式

| 文档 | 内容 |
|------|------|
| installation.md | 安装、注册、按需引入 |
| patterns.md | Props/Emits/Slots/Exposed 通用约定 |

## 导出事实

- `@veltra/desktop` 根入口只导出组件、函数和类型；全局 plugin 从 `@veltra/desktop/install` 引入。
- 当前组件目录为 70+，`U*` 组件导出为 80+；以本页列表和 `packages/desktop/src/components/index.ts` 为准。
- 当前没有 `UAvatar` / `avatar` 组件导出。

## 所有组件

| 组件 | 文档 |
|------|------|
| **UAction** / UActionGroup | components/action.md |
| **UAutoComplete** | components/auto-complete.md |
| **UBadge** | components/badge.md |
| **UBatchEdit** | components/batch-edit.md |
| **UBreadcrumb** | components/breadcrumb.md |
| **UButton** / UButtonGroup | components/button.md |
| **UCalendar** | components/calendar.md |
| **UCard** / UCardHeader / UCardCover / UCardContent / UCardAction | components/card.md |
| **UCascade** | components/cascade.md |
| **UCheckTag** | components/check-tag.md |
| **UCheckbox** / UCheckboxButton | components/checkbox.md |
| **UCheckboxGroup** | components/checkbox-group.md |
| **UCodeEditor** | components/code-editor.md |
| **UCollapse** / UCollapseItem | components/collapse.md |
| **UConditionEditor** | components/condition-editor.md |
| **UContextMenu** (contextmenu API) | components/context-menu.md |
| **UDatePanel** | components/date-panel.md |
| **UDatePicker** | components/date-picker.md |
| **UDateRangePicker** | components/date-range-picker.md |
| **UDialog** | components/dialog.md |
| **UDrawer** | components/drawer.md |
| **UDropdown** | components/dropdown.md |
| **UEmpty** | components/empty.md |
| **UExpressionEditor** | components/expression-editor.md |
| **UFilePicker** | components/file-picker.md |
| **UFileViewer** | components/file-viewer.md |
| **UFloatButton** | components/float-button.md |
| **UForm** (FormModel / DynamicFormModel) | components/form.md |
| **UFormItem** | components/form-item.md |
| **UGanttChart** | components/gantt-chart.md |
| **UGrid** / UGridItem | components/grid.md |
| **UGridInput** | components/grid-input.md |
| **UGroupInput** | components/group-input.md |
| **UIcon** | components/icon.md |
| **UInput** | components/input.md |
| **ULayout** | components/layout.md |
| **UList** / UListItem | components/list.md |
| **ULoading** (v-loading 指令) | components/loading.md |
| **UMenu** / UMenuSub / UMenuItem | components/menu.md |
| **UMessage** (message API) | components/message.md |
| **UMessageConfirm** (MessageConfirm API) | components/message-confirm.md |
| **UMultiSelect** | components/multi-select.md |
| **UMultiTreeSelect** | components/multi-tree-select.md |
| **UNodeRender** | components/node-render.md |
| **UNotification** (Notification API) | components/notification.md |
| **UNumber** | components/number.md |
| **UNumberInput** | components/number-input.md |
| **UNumberRangeInput** | components/number-range-input.md |
| **UPaginator** | components/paginator.md |
| **UPalette** | components/palette.md |
| **UPasswordInput** | components/password-input.md |
| **UPopConfirm** | components/pop-confirm.md |
| **UProgress** | components/progress.md |
| **UProgressNodes** | components/progress-nodes.md |
| **URadio** | components/radio.md |
| **URadioGroup** | components/radio-group.md |
| **URichTextEditor** | components/rich-text-editor.md |
| **UScroll** | components/scroll.md |
| **USelect** | components/select.md |
| **USlider** | components/slider.md |
| **USteps** | components/steps.md |
| **USwitch** | components/switch.md |
| **UTable** (defineTableColumns) | components/table.md |
| **UTableEditor** | components/table-editor.md |
| **UTabs** / UTabsHorizontal / UTabsVertical | components/tabs.md |
| **UTag** | components/tag.md |
| **UText** | components/text.md |
| **UTextarea** | components/textarea.md |
| **UTheme** | components/theme.md |
| **UTip** | components/tip.md |
| **UTree** | components/tree.md |
| **UTreeSelect** | components/tree-select.md |
| **UWatermark** | components/watermark.md |
