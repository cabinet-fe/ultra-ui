---
'@veltra/ai': patch
'@veltra/desktop': patch
---

- 新增 UKanban 看板组件：列内卡片拖拽排序与跨列转移，v-model:columns 写回，支持 card / header / empty 插槽
- URichTextEditor 支持图片：工具栏插入、粘贴与拖拽导入，新增 uploadImages 方法供外部上传后回写地址
- 修复 UFormItem 错误态未压制表达式/代码/富文本编辑器描边的问题
- 修复条件/表达式编辑器 disabled、readonly 归一成 false 后挡住 UForm 透传的问题
- 修复表达式编辑器 IME 合成期间占位符不消失的问题
- UAiChat 过程块改为本轮落定后才折叠，流式输出期间可继续回看工具调用
