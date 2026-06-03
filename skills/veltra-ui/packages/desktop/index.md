# 组件文档（@veltra/desktop）

## 安装

| 文档            | 内容                 |
| --------------- | -------------------- |
| installation.md | 安装、注册、按需引入 |

组件 Props/Emits/Slots/Exposed 以 `generated/types/{组件名}.ts` 为准。

## 导出事实

- `@veltra/desktop` 根入口只导出组件、函数和类型；全局 plugin 从 `@veltra/desktop/install` 引入。
- 当前组件目录为 70+，`U*` 组件导出为 80+；以本页列表和 `packages/desktop/src/components/index.ts` 为准。
- 当前没有 `UAvatar` / `avatar` 组件导出。

## 所有组件

| 组件                                                              | 文档                             |
| ----------------------------------------------------------------- | -------------------------------- |
| **UAction** / UActionGroup                                        | components/action/api.md             |
| **UAutoComplete**                                                 | components/auto-complete/api.md      |
| **UBadge**                                                        | components/badge/api.md              |
| **UBatchEdit**                                                    | components/batch-edit/api.md         |
| **UBreadcrumb**                                                   | components/breadcrumb/api.md         |
| **UButton** / UButtonGroup                                        | components/button/api.md             |
| **UCalendar**                                                     | components/calendar/api.md           |
| **UCard** / UCardHeader / UCardCover / UCardContent / UCardAction | components/card/api.md               |
| **UCascade**                                                      | components/cascade/api.md            |
| **UCheckTag**                                                     | components/check-tag/api.md          |
| **UCheckbox** / UCheckboxButton                                   | components/checkbox/api.md           |
| **UCheckboxGroup**                                                | components/checkbox-group/api.md     |
| **UCodeEditor**                                                   | components/code-editor/api.md        |
| **UCollapse** / UCollapseItem                                     | components/collapse/api.md           |
| **UConditionEditor**                                              | components/condition-editor/api.md   |
| **UContextMenu** (contextmenu API)                                | components/context-menu/api.md       |
| **UDatePanel**                                                    | components/date-panel/api.md         |
| **UDatePicker**                                                   | components/date-picker/api.md        |
| **UDateRangePicker**                                              | components/date-range-picker/api.md  |
| **UDialog**                                                       | components/dialog/api.md             |
| **UDrawer**                                                       | components/drawer/api.md             |
| **UDropdown**                                                     | components/dropdown/api.md           |
| **UEmpty**                                                        | components/empty/api.md              |
| **UExpressionEditor**                                             | components/expression-editor/api.md  |
| **UFilePicker**                                                   | components/file-picker/api.md        |
| **UFileViewer**                                                   | components/file-viewer/api.md        |
| **UFloatButton**                                                  | components/float-button/api.md       |
| **UForm** (FormModel / DynamicFormModel)                          | components/form/api.md               |
| **UFormItem**                                                     | components/form-item/api.md          |
| **UGanttChart**                                                   | components/gantt-chart/api.md        |
| **UGrid** / UGridItem                                             | components/grid/api.md               |
| **UGridInput**                                                    | components/grid-input/api.md         |
| **UGroupInput**                                                   | components/group-input/api.md        |
| **UIcon**                                                         | components/icon/api.md               |
| **UInput**                                                        | components/input/api.md              |
| **ULayout**                                                       | components/layout/api.md             |
| **UList** / UListItem                                             | components/list/api.md               |
| **ULoading** (v-loading 指令)                                     | components/loading/api.md            |
| **UMenu** / UMenuSub / UMenuItem                                  | components/menu/api.md               |
| **UMessage** (message API)                                        | components/message/api.md            |
| **UMessageConfirm** (MessageConfirm API)                          | components/message-confirm/api.md    |
| **UMultiSelect**                                                  | components/multi-select/api.md       |
| **UMultiTreeSelect**                                              | components/multi-tree-select/api.md  |
| **UNodeRender**                                                   | components/node-render/api.md        |
| **UNotification** (Notification API)                              | components/notification/api.md       |
| **UNumber**                                                       | components/number/api.md             |
| **UNumberInput**                                                  | components/number-input/api.md       |
| **UNumberRangeInput**                                             | components/number-range-input/api.md |
| **UPaginator**                                                    | components/paginator/api.md          |
| **UPalette**                                                      | components/palette/api.md            |
| **UPasswordInput**                                                | components/password-input/api.md     |
| **UPopConfirm**                                                   | components/pop-confirm/api.md        |
| **UProgress**                                                     | components/progress/api.md           |
| **UProgressNodes**                                                | components/progress-nodes/api.md     |
| **URadio**                                                        | components/radio/api.md              |
| **URadioGroup**                                                   | components/radio-group/api.md        |
| **URichTextEditor**                                               | components/rich-text-editor/api.md   |
| **UScroll**                                                       | components/scroll/api.md             |
| **USelect**                                                       | components/select/api.md             |
| **USlider**                                                       | components/slider/api.md             |
| **USteps**                                                        | components/steps/api.md              |
| **USwitch**                                                       | components/switch/api.md             |
| **UTable** (defineTableColumns)                                   | components/table/api.md              |
| **UTableEditor**                                                  | components/table-editor/api.md       |
| **UTabs** / UTabsHorizontal / UTabsVertical                       | components/tabs/api.md               |
| **UTag**                                                          | components/tag/api.md                |
| **UText**                                                         | components/text/api.md               |
| **UTextarea**                                                     | components/textarea/api.md           |
| **UTheme**                                                        | components/theme/api.md              |
| **UTip**                                                          | components/tip/api.md                |
| **UTree**                                                         | components/tree/api.md               |
| **UTreeSelect**                                                   | components/tree-select/api.md        |
| **UWatermark**                                                    | components/watermark/api.md          |
