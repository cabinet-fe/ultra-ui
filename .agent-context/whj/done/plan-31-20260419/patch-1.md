# 为 UFileViewer 增加全屏模态模式并修复 UFilePicker 通配符匹配

## 补丁内容

用户反馈两个问题：

1. `UFileViewer` 以内嵌方式展示时不够聚焦，希望以全屏模态的方式打开预览。
2. Playground 的「加入预览」交互无效——`UFilePicker` 的 `accept="*"` 未能匹配任意文件，导致选择后不会触发 `@pick`。

### 1. 为 `UFileViewer` 增加模态模式（`v-model:open`）

在 `packages/desktop/src/types/file-viewer.ts` 中扩展：

- `FileViewerProps`：新增 `open?: boolean`、`closeOnClickBackdrop?: boolean`、`closeOnEsc?: boolean`。
  - `open === undefined`：保持内嵌模式（向后兼容）。
  - `open === true | false`：进入模态模式，由父组件通过 `v-model:open` 控制显隐。
- `FileViewerEmits`：新增 `(e: 'update:open', value: boolean): void`。

在 `packages/desktop/src/components/file-viewer/file-viewer.vue` 中：

- 引入 `defineModel<boolean | undefined>('open', { default: undefined })`，以 `isModal = computed(() => openModel.value !== undefined)` 判断模态态。
- 模板外层包裹 `<Teleport to="body" :disabled="!isModal">` + `<transition :name="isModal ? 'u-file-viewer-modal' : ''">`，模态模式下将组件渲染到 `body` 并叠加淡入动画。
- 新增 `__backdrop` 遮罩层；点击根元素自身（`@mousedown.self`）或遮罩层自身触发 `handleBackdropMousedown` 关闭。
- 在 stage 操作区右侧追加图标类关闭按钮（使用 `@veltra/icons/normal` 的 `Close`），仅模态模式下显示。
- `handleClose` 仅设置 `openModel.value = false`，由父组件的 `v-model:open` 驱动。
- 通过 `window.addEventListener('keydown', ..., true)` 注册捕获阶段的全局 ESC 监听；仅在模态模式且 `open === true` 时生效，组件卸载或模态关闭时卸载监听。
- 判断「是否允许关闭」改为 **显式 `=== false` 才禁用**：`props.closeOnEsc === false`、`props.closeOnClickBackdrop === false`。这样即便 Vue 的 TS Props 解析在某些情况下未正确注入 `withDefaults` 提供的默认值（导致运行时 props 为 `undefined`），默认行为仍然是"允许关闭"，与 API 语义一致。
- 模态态激活时通过 `document.body.style.overflow = 'hidden'` 锁定背景滚动，关闭或卸载后恢复原值，避免叠加弹层时滚动错乱。

在 `packages/desktop/src/components/file-viewer/style.scss` 中：

- 新增 `@include m.b(file-viewer)` 的基础定位（`position: relative`、`min-height: 480px`、边框与圆角等）。
- 新增 `@include m.is(modal)` 为全屏容器样式：`position: fixed; inset: 0; z-index: 2000;` 并使用 `padding: clamp(16px, 3vw, 48px)` 自适应留白。
- 新增后代覆盖 `&.is-modal &__backdrop`（半透明 + `backdrop-filter: blur(6px)`）、`&.is-modal &__inner`（白底、圆角、阴影）；内嵌模式下 `__inner` 使用 `display: contents` 避免嵌套 flex 干扰。
- 新增 `__action--icon` 修饰器，表现为 30×30 方形图标按钮，hover 为 danger 色。
- 新增 `u-file-viewer-modal` 过渡类：背景淡入淡出、内容带 `translateY(12px) scale(0.985)` 的细微位移缩放。

### 2. 修复 `UFilePicker` 的 `accept` 匹配

`packages/desktop/src/components/file-picker/helper.ts` 的 `matchAccept` 之前只按 MIME 分组匹配，导致：

- `accept="*"` / `accept="*/*"` 会被当作字面量与 `file.type` 比较，永远返回 `false`。
- 没有文件扩展名形式（`.pdf`/`.docx`）的匹配逻辑。

重写规则，按标准 `<input accept>` 语义匹配：

- `*` / `*/*` → 接受所有文件（通配）。
- `.ext` → 按小写扩展名后缀匹配文件名。
- `group/*` → 按 MIME 组匹配（如 `image/*`）。
- 其它 → 严格等于 `file.type`。

### 3. 重写 `file-viewer` 演示页

`playgrounds/desktop/src/file-viewer/index.vue` 调整：

- 顶部主标题 + 副标题描述 + 两个主要操作（「打开预览」「加入预览」），并额外提供「清空本地文件」按钮，仅当有本地文件时出现。
- 文件列表改为自定义的 `fv-demo__files` 卡片展示，点击行即以当前文件为激活项打开模态预览。
- `UFilePicker` 去除 `accept` 限制（原为 `accept="*"`），默认允许所有本地文件；`onPick` 追加到 `localFiles`，并将 `previewOpen` 置 `true`，直接以模态模式打开新加入的文件。
- `<u-file-viewer v-model="active" v-model:open="previewOpen" :files="files" @error="onError" />` 使用模态模式的双向绑定，替代原先的内嵌实例。
- 追加示例 CSV `sales-summary.csv`（data URI 内联，避免跨域拉取），方便即时体验 sheet 预览。

## 影响范围

- 修改文件: `packages/desktop/src/types/file-viewer.ts`
- 修改文件: `packages/desktop/src/components/file-viewer/file-viewer.vue`
- 修改文件: `packages/desktop/src/components/file-viewer/style.scss`
- 修改文件: `packages/desktop/src/components/file-picker/helper.ts`
- 修改文件: `playgrounds/desktop/src/file-viewer/index.vue`
