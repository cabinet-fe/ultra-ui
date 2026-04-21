# 新增 UFileViewer 组件：多格式文件预览器（xlsx/csv/pdf/video/image/txt/docx）

> 状态: 已执行

## 目标

在 `@veltra/desktop` 新增 `UFileViewer` 组件，支持在同一界面内切换预览一组不同格式的文件：

- **xlsx / csv**：基于字节 VTable（`@visactor/vtable`）的 `ListTable` 渲染；xlsx 解析通过 `@cat-kit/excel`，csv 用内建轻量解析器。
- **pdf**：基于 EmbedPDF Vue 绑定（`@embedpdf/core/vue`、`@embedpdf/engines/vue`、`@embedpdf/plugin-*`）。
- **视频 / 图片**：原生 `<video>` / `<img>`。
- **txt**：文本显示（`<pre>`，按需 chunk）。
- **word**：基于 `docx-preview`。

严格要求：

1. **界面美观**：采用 frontend-skill 的克制/分层/留白/主题色原则，避免卡片堆砌与多余装饰。左侧是文件列表（扁平、单主色强调当前项），右侧是全高预览区域；预览区顶栏仅有文件名 + 类型徽章 + 下载/下一张等必要动作。
2. **界面内切换预览**：单组件、单预览槽，切换文件时仅渲染当前预览器，不保留历史实例。
3. **最大化内存回收**：切换 / 卸载时显式销毁底层实例（VTable `release()`、EmbedPDF engine dispose、docx-preview 容器 innerHTML 清空、Blob ObjectURL `revokeObjectURL`、`AbortController.abort()`）。
4. **性能最大化**：
   - 预览器（previewer）按需 `defineAsyncComponent` 动态导入，主包仅在首次需要时加载对应 chunk。
   - 所有重型依赖（VTable、EmbedPDF、docx-preview、@cat-kit/excel）通过动态 `import()` 引入，不出现在主 barrel。
   - CSV/XLSX 超过阈值（默认 5 万行）时仅截取前 N 行并提示（避免 OOM）。
   - 切换时 `AbortController` 中止正在进行的 fetch 与解析。
   - 使用 `shallowRef` 存放实例引用，避免 Vue 深度响应式代理。

## 内容

> 本计划在 `@veltra/desktop` 新增 1 个主组件（`UFileViewer`）+ 6 个私有预览器子组件 + 1 个 playground 演示页；并在 `@veltra/desktop` 与 `playgrounds/desktop` 的 `package.json` 添加依赖。

### 1. 依赖安装与构建配置

#### 1.1 `packages/desktop/package.json`

在 `dependencies` 中按字典序新增以下条目：

- `@cat-kit/excel: ^1.0.1`
- `@embedpdf/core: ^1`
- `@embedpdf/engines: ^1`
- `@embedpdf/plugin-document-manager: ^1`
- `@embedpdf/plugin-viewport: ^1`
- `@embedpdf/plugin-scroll: ^1`
- `@embedpdf/plugin-render: ^1`
- `@visactor/vtable: ^1`
- `docx-preview: ^0.3`

版本号以 `bun add` 实际安装的最新稳定版为准（执行安装时替换为精确的 caret 版本号）。

#### 1.2 `packages/desktop/tsdown.config.ts`

在 `deps.neverBundle` 数组中新增以上全部包名，确保 `tsdown` 打包时把它们视作外部依赖（与现有 codemirror / lexical 的处理一致）。

#### 1.3 安装命令

在仓库根：

```bash
bun add -D -w=false \
  @cat-kit/excel \
  @visactor/vtable \
  docx-preview \
  @embedpdf/core \
  @embedpdf/engines \
  @embedpdf/plugin-document-manager \
  @embedpdf/plugin-viewport \
  @embedpdf/plugin-scroll \
  @embedpdf/plugin-render \
  --filter @veltra/desktop
```

> 实际以 bun workspaces 语法为准：`bun add <pkg> --filter @veltra/desktop`。安装后提交 `bun.lock`。

### 2. 类型定义 `packages/desktop/src/types/file-viewer.ts`

新建文件，导出：

```ts
import type { DeconstructValue } from '@veltra/utils'
import type { ShallowRef } from 'vue'

export type FileViewerKind =
  | 'image'
  | 'video'
  | 'pdf'
  | 'sheet' // xlsx + csv 归一为 sheet
  | 'docx'
  | 'text'

export interface FileViewerItem {
  /** 唯一 id（未提供时内部自动生成） */
  id?: string
  /** 显示名（通常等于文件名） */
  name: string
  /**
   * 文件源：
   * - string: URL（支持 http(s): 与 data: / blob:）
   * - File / Blob / ArrayBuffer / Uint8Array: 二进制原始数据
   */
  src: string | File | Blob | ArrayBuffer | Uint8Array
  /** 文件类型；未提供时根据扩展名推断 */
  kind?: FileViewerKind
  /** MIME type，可选，用于原生 <video> / <img> 精确提示 */
  mime?: string
  /** 文件大小（字节），可选，仅用于展示 */
  size?: number
}

export interface FileViewerProps {
  /** 待预览的文件数组 */
  files: FileViewerItem[]
  /** 激活的文件 id（支持 v-model） */
  modelValue?: string
  /** 侧栏宽度（CSS length），默认 280px；为 0 或 false 时隐藏侧栏 */
  sidebarWidth?: string | number | false
  /**
   * sheet 场景下单个文件最大渲染行数，默认 50000；超限截断并在顶部提示
   * 设为 0 表示不截断
   */
  sheetMaxRows?: number
  /** 是否显示下载按钮，默认 true */
  downloadable?: boolean
}

export interface FileViewerEmits {
  (e: 'update:modelValue', id: string): void
  (e: 'change', file: FileViewerItem): void
  (e: 'error', err: { file: FileViewerItem; error: unknown }): void
}

export interface _FileViewerExposed {
  activeId: ShallowRef<string | undefined>
  /** 切换到指定 id */
  activate: (id: string) => void
  /** 切换到下一个 / 上一个 */
  next: () => void
  prev: () => void
}

export type FileViewerExposed = DeconstructValue<_FileViewerExposed>
```

并在 `packages/desktop/src/types/index.ts` 末尾追加 `export * from './file-viewer'`。

### 3. 组件目录 `packages/desktop/src/components/file-viewer/`

新建以下文件：

```
file-viewer/
├── file-viewer.vue
├── helper.ts
├── previewers/
│   ├── image-previewer.vue
│   ├── video-previewer.vue
│   ├── text-previewer.vue
│   ├── pdf-previewer.vue
│   ├── docx-previewer.vue
│   └── sheet-previewer.vue
├── index.ts
├── style.scss
└── style.ts
```

#### 3.1 `helper.ts`

导出：

- `inferKind(name: string, explicit?: FileViewerKind): FileViewerKind`：按扩展名推断（`jpg/jpeg/png/gif/webp/bmp/svg/avif → image`；`mp4/webm/mov/m4v/ogv → video`；`pdf → pdf`；`xlsx/xlsm/xlsb/csv → sheet`；`docx → docx`；`txt/log/md/json/yml/yaml/xml → text`；否则 `text`）。
- `getExtension(name: string): string`：小写扩展名。
- `toArrayBuffer(src: FileViewerItem['src'], signal?: AbortSignal): Promise<ArrayBuffer>`：统一读取：string 走 `fetch(src, { signal }).then(r => r.arrayBuffer())`，File/Blob 走 `blob.arrayBuffer()`，ArrayBuffer 直返，Uint8Array `.slice().buffer`（复制以免共享底层）。
- `toBlobUrl(src, mime?): { url: string; revoke: () => void }`：string 直接返回 `{ url: src, revoke: noop }`；二进制构造 `new Blob([data], { type })` + `URL.createObjectURL` 并返回 revoke 函数。
- `parseCsv(text: string): string[][]`：**标准 RFC-4180 子集**实现：支持双引号包裹字段（含转义 `""`）、`,` 分隔、`\n` / `\r\n` 换行；不支持自定义分隔符。
- `formatBytes(bytes?: number): string`：`'-' | '1.2 KB' | '3.4 MB'` 之类的人类可读格式。
- `FILE_VIEWER_KIND_LABEL: Record<FileViewerKind, string>`：用于徽章显示（`image → 'IMG'`、`video → 'MP4'`、`pdf → 'PDF'`、`sheet → 'XLS'`、`docx → 'DOC'`、`text → 'TXT'`）。

#### 3.2 `previewers/image-previewer.vue`

- Props：`{ file: FileViewerItem }`。
- 逻辑：`const { url, revoke } = toBlobUrl(file.src, file.mime)`，`onBeforeUnmount(revoke)`。
- 模板：居中 `<img>`（`object-fit: contain`），加载中显示 `u-loading`，加载失败触发 `emit('error')`（组件内部通过 `defineEmits<{ (e: 'error', err: unknown): void }>()` 向上冒泡）。
- 支持双击切换 `zoom: contain ↔ actual-size`。

#### 3.3 `previewers/video-previewer.vue`

- Props：同上。
- 模板：`<video controls preload="metadata" :src="url" :type="file.mime">`；`onBeforeUnmount` 时 `video.pause() + video.removeAttribute('src') + video.load()` 并 revoke。

#### 3.4 `previewers/text-previewer.vue`

- Props：同上 + `maxBytes?: number`（默认 2MB）。
- 逻辑：在 `onMounted` 内使用 `AbortController`；通过 `toArrayBuffer` 拿到数据后 `new TextDecoder('utf-8', { fatal: false }).decode(buf.slice(0, maxBytes))`；超限时在文本顶部插入 `⚠ 文件超过 2MB，仅显示前 2MB` 提示。
- 模板：`<u-scroll><pre class="u-file-viewer__text"><code>{{ text }}</code></pre></u-scroll>`；`pre` 使用 `tab-size: 2; font-family: ui-monospace, SFMono-Regular, Menlo, ...`。

#### 3.5 `previewers/pdf-previewer.vue`

依据 EmbedPDF Vue 官方 Getting Started：

```ts
import { usePdfiumEngine } from '@embedpdf/engines/vue'
import { EmbedPDF } from '@embedpdf/core/vue'
import { createPluginRegistration } from '@embedpdf/core'
import { ViewportPluginPackage, Viewport } from '@embedpdf/plugin-viewport/vue'
import { ScrollPluginPackage, Scroller } from '@embedpdf/plugin-scroll/vue'
import {
  DocumentContent,
  DocumentManagerPluginPackage
} from '@embedpdf/plugin-document-manager/vue'
import { RenderLayer, RenderPluginPackage } from '@embedpdf/plugin-render/vue'
```

- Props：`{ file: FileViewerItem }`。
- 逻辑：
  - 通过 `toBlobUrl`（或直接使用 string URL）得到 `pdfUrl`。
  - `const { engine, isLoading } = usePdfiumEngine()`。
  - `const plugins = computed(() => [createPluginRegistration(DocumentManagerPluginPackage, { initialDocuments: [{ url: pdfUrl.value }] }), createPluginRegistration(ViewportPluginPackage), createPluginRegistration(ScrollPluginPackage), createPluginRegistration(RenderPluginPackage)])`。
  - `onBeforeUnmount`：调用 `toBlobUrl` 返回的 revoke。
- 模板：参照官方示例，外层 `div.u-file-viewer__pdf` 占满高度。

> 注意：`usePdfiumEngine()` 会在客户端异步加载 PDFium WASM；首帧显示 `u-loading`。

#### 3.6 `previewers/docx-previewer.vue`

- Props：同上。
- 逻辑：
  - `const { renderAsync } = await import('docx-preview')`。
  - 通过 `toArrayBuffer` 拿到数据，调用 `renderAsync(buffer, containerEl, undefined, { className: 'u-file-viewer__docx-doc', inWrapper: true, ignoreWidth: false, ignoreHeight: false, breakPages: true, experimental: false, useBase64URL: false })`。
  - 组件卸载前：`container.innerHTML = ''`（docx-preview 不暴露 dispose，innerHTML 清空即可释放内部 DOM / Blob 引用；同时 revoke 自建 URL）。
- 模板：`<u-scroll><div ref="container" class="u-file-viewer__docx" /></u-scroll>`。

#### 3.7 `previewers/sheet-previewer.vue`

- Props：`{ file: FileViewerItem; maxRows: number }`。
- 逻辑：
  - 动态 `import('@visactor/vtable')` 得到 `{ ListTable }`。
  - 根据扩展名分流：
    - `csv`：`new TextDecoder().decode(buf)` → `parseCsv(text)` 得到 `string[][]`；首行作为表头 → 构造 `columns = header.map((h, i) => ({ field: 'c' + i, caption: String(h) || 'Column ' + (i + 1) }))`，`records = rows.slice(1).map(row => Object.fromEntries(row.map((v, i) => ['c' + i, v])))`。
    - `xlsx/xlsm/xlsb`：动态 `import('@cat-kit/excel')` → `readWorkbook(buf)` → 取 `workbook.worksheets[0]` → 遍历 `getRows()` → 首行作为表头，其余作为数据；Cell 值通过 `row.toValues()` 转为 `CellValue[]`，再映射为字符串（日期 → `toLocaleString()`；公式值 → `result ?? formula`）。
  - 截断到 `maxRows`（若为 0 则不截断）；若触发截断在顶部状态条文字中显示 `仅显示前 N 行（共 M 行）`。
  - 创建实例：`instance = new ListTable(containerEl, { records, columns, widthMode: 'adaptive', heightMode: 'autoHeight', theme: VTable.themes.ARCO })`（使用 `themes.DEFAULT` 或 `ARCO` 中存在的预设；若当前版本无 ARCO 则 fallback 到 `DEFAULT`）。
  - 监听容器 resize（`ResizeObserver`）→ `instance.resize()`。
  - `onBeforeUnmount`：`observer.disconnect()`、`instance?.release()`。
- 模板：
  ```
  <div class="u-file-viewer__sheet">
    <div v-if="truncated" class="u-file-viewer__sheet-note">{{ truncatedText }}</div>
    <div ref="container" class="u-file-viewer__sheet-stage" />
  </div>
  ```

#### 3.8 `file-viewer.vue`（主组件）

- `defineOptions({ name: 'FileViewer', inheritAttrs: false })`。
- Props：`FileViewerProps`（`withDefaults`：`sidebarWidth='280px'`、`sheetMaxRows=50000`、`downloadable=true`）。
- Emits：`FileViewerEmits`。
- 内部：
  - 用 `normalizedFiles = computed(() => files.map((f, i) => ({ ...f, id: f.id ?? 'file-' + i, kind: inferKind(f.name, f.kind) })))`。
  - `const activeId = defineModel<string | undefined>('modelValue', { default: undefined })`；effect 中若 `activeId` 为空或无效则自动设为第一项的 id。
  - `activeFile = computed(() => normalizedFiles.value.find(f => f.id === activeId.value))`。
  - `PreviewerMap`：`Record<FileViewerKind, () => Promise<Component>>`；通过 `defineAsyncComponent` 包装后得到各 previewer 组件的懒加载引用；主组件用 `<component :is="PreviewerMap[activeFile.kind]" :key="activeFile.id" :file="activeFile" ... />` 渲染；`key` 保证切换时强制销毁+重建，达成内存释放目标。
  - 切换时在容器外层加 `transition name="u-file-viewer-fade"` 渲染淡入淡出。
  - 下载：`handleDownload` 针对 string src 用 `<a :href download>` 跳转；对 Blob/Buffer 构造临时 ObjectURL，触发 `<a>` 点击后 `revokeObjectURL`。
  - Error 冒泡：每个 previewer 的 `@error` 事件 `emit('error', { file, error })`，并在预览区显示错误状态（`u-empty` + 错误描述）。
- 模板（克制布局、单主色强调）：

```html
<div :class="cls.b">
  <aside v-if="sidebarWidth" :class="cls.e('sidebar')" :style="{ width: sidebarWidthCss }">
    <header :class="cls.e('sidebar-head')">
      <span :class="cls.e('sidebar-title')">文件</span>
      <span :class="cls.e('sidebar-count')">{{ normalizedFiles.length }}</span>
    </header>
    <u-scroll tag="ul" :class="cls.e('list')">
      <li
        v-for="f of normalizedFiles"
        :key="f.id"
        :class="[cls.e('item'), bem.is('active', f.id === activeId)]"
        @click="activate(f.id)"
      >
        <span :class="[cls.e('badge'), cls.em('badge', f.kind)]">{{ label(f.kind) }}</span>
        <span :class="cls.e('item-meta')">
          <span :class="cls.e('item-name')">{{ f.name }}</span>
          <span :class="cls.e('item-size')">{{ formatBytes(f.size) }}</span>
        </span>
      </li>
    </u-scroll>
  </aside>
  <section :class="cls.e('stage')">
    <header :class="cls.e('stage-head')" v-if="activeFile">
      <div :class="cls.e('stage-title')">
        <span :class="[cls.e('badge'), cls.em('badge', activeFile.kind)]"
          >{{ label(activeFile.kind) }}</span
        >
        <span :class="cls.e('stage-name')">{{ activeFile.name }}</span>
      </div>
      <div :class="cls.e('stage-actions')">
        <button :class="cls.e('action')" :disabled="!hasPrev" @click="prev">上一个</button>
        <button :class="cls.e('action')" :disabled="!hasNext" @click="next">下一个</button>
        <button v-if="downloadable" :class="cls.e('action')" @click="download">下载</button>
      </div>
    </header>
    <div :class="cls.e('body')">
      <transition name="u-file-viewer-fade" mode="out-in">
        <component
          :is="currentPreviewer"
          v-if="activeFile"
          :key="activeFile.id"
          :file="activeFile"
          :max-rows="sheetMaxRows"
          @error="handleChildError"
        />
        <u-empty v-else description="暂无可预览文件" />
      </transition>
    </div>
  </section>
</div>
```

- 通过 `defineExpose<FileViewerExposed>({ activeId, activate, next, prev })` 暴露 API。

#### 3.9 `style.scss`

使用 `@veltra/styles` 的 BEM：

```scss
@use 'pkg:@veltra/styles/mixins' as m;
@use 'pkg:@veltra/styles/functions' as fn;

@include m.b(file-viewer) {
  display: flex;
  width: 100%;
  height: 100%;
  min-height: 480px;
  background: fn.use-var(bg-color, top);
  color: fn.use-var(text-color, main);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 0 fn.use-var(border, color);

  @include m.e(sidebar) {
    display: flex;
    flex-direction: column;
    border-right: 1px solid fn.use-var(border, color);
    background: fn.use-var(bg-color, middle);
    flex-shrink: 0;
  }

  @include m.e(sidebar-head) {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    padding: 18px 20px 12px;
    font-weight: 600;
    letter-spacing: 0.02em;
    color: fn.use-var(text-color, title);
  }

  @include m.e(sidebar-count) {
    font-size: 12px;
    color: fn.use-var(text-color, second);
  }

  @include m.e(list) {
    flex: 1;
    min-height: 0;
    padding: 4px 8px 16px;
  }

  @include m.e(item) {
    display: flex;
    gap: 12px;
    align-items: center;
    padding: 10px 12px;
    margin: 2px 0;
    border-radius: 8px;
    cursor: pointer;
    transition:
      background 0.18s ease,
      color 0.18s ease;

    &:hover {
      background: fn.use-var(bg-color, hover);
    }

    @include m.is(active) {
      background: color-mix(in srgb, #{fn.use-var(color, primary)} 12%, transparent);
      color: fn.use-var(color, primary);
    }
  }

  @include m.e(item-meta) {
    display: flex;
    flex-direction: column;
    min-width: 0;
    gap: 2px;
  }

  @include m.e(item-name) {
    font-size: 13px;
    line-height: 1.4;
    @include m.ellipsis;
  }

  @include m.e(item-size) {
    font-size: 11px;
    color: fn.use-var(text-color, second);
  }

  @include m.e(badge) {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 28px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.04em;
    color: #fff;
    background: fn.use-var(text-color, placeholder);

    @include m.em(badge, image) {
      background: #0ea5e9;
    }
    @include m.em(badge, video) {
      background: #ef4444;
    }
    @include m.em(badge, pdf) {
      background: #dc2626;
    }
    @include m.em(badge, sheet) {
      background: #16a34a;
    }
    @include m.em(badge, docx) {
      background: #2563eb;
    }
    @include m.em(badge, text) {
      background: #64748b;
    }
  }

  @include m.e(stage) {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
  }

  @include m.e(stage-head) {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 14px 22px;
    border-bottom: 1px solid fn.use-var(border, color);
    background: fn.use-var(bg-color, top);
  }

  @include m.e(stage-title) {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
  }

  @include m.e(stage-name) {
    font-size: 14px;
    font-weight: 600;
    @include m.ellipsis;
  }

  @include m.e(stage-actions) {
    display: flex;
    gap: 8px;
  }

  @include m.e(action) {
    height: 30px;
    padding: 0 12px;
    border-radius: 6px;
    border: 1px solid fn.use-var(border, color);
    background: transparent;
    color: inherit;
    font-size: 12px;
    cursor: pointer;
    transition:
      background 0.18s,
      border-color 0.18s,
      color 0.18s;

    &:not(:disabled):hover {
      border-color: fn.use-var(color, primary);
      color: fn.use-var(color, primary);
    }

    &:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }
  }

  @include m.e(body) {
    position: relative;
    flex: 1;
    min-height: 0;
    background: fn.use-var(bg-color, bottom);
  }

  // 子预览器通用容器
  @include m.e(image) {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;

    img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      user-select: none;
      transition: transform 0.3s ease;
    }
  }

  @include m.e(video) {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #000;

    video {
      max-width: 100%;
      max-height: 100%;
    }
  }

  @include m.e(text) {
    height: 100%;
    padding: 0;
  }

  @include m.e(text-pre) {
    margin: 0;
    padding: 20px 24px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 12.5px;
    line-height: 1.55;
    white-space: pre;
    tab-size: 2;
  }

  @include m.e(pdf) {
    width: 100%;
    height: 100%;
  }

  @include m.e(docx) {
    padding: 24px;
  }

  @include m.e(sheet) {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  @include m.e(sheet-note) {
    padding: 8px 16px;
    font-size: 12px;
    color: fn.use-var(text-color, second);
    background: fn.use-var(bg-color, middle);
    border-bottom: 1px solid fn.use-var(border, color);
  }

  @include m.e(sheet-stage) {
    flex: 1;
    min-height: 0;
  }

  @include m.e(loading) {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: fn.use-var(text-color, second);
    font-size: 13px;
  }
}

.u-file-viewer-fade-enter-active,
.u-file-viewer-fade-leave-active {
  transition:
    opacity 0.22s ease,
    transform 0.22s ease;
}

.u-file-viewer-fade-enter-from,
.u-file-viewer-fade-leave-to {
  opacity: 0;
  transform: translateY(6px);
}
```

#### 3.10 `style.ts`

```ts
import '../scroll/style'
import '../empty/style'
import '../loading/style'
import './style.scss'
```

#### 3.11 `index.ts`

```ts
export { default as UFileViewer } from './file-viewer.vue'
```

### 4. 组件导出

- `packages/desktop/src/components/index.ts` 末尾追加 `export * from './file-viewer'`。
- `packages/desktop/src/types/index.ts` 末尾追加 `export * from './file-viewer'`。

### 5. Playground 演示页

新建 `playgrounds/desktop/src/file-viewer/index.vue`：

- 顶部放一个 `CustomCard` 或直接一个标题 + 描述。
- `<u-file-picker multiple @pick="onPick">` 允许用户本地选择；默认提供一组远端样例文件（hard-coded URL 数组：包含一个小图、一个 mp4 样例、一段 PDF 样例、一个 txt 样例；xlsx/docx 样例可通过 `file-picker` 补齐，或使用在线可达的 github raw 文件）。
- 一个高度 `72vh` 的容器承载 `<u-file-viewer :files="files" v-model="active" />`。
- 下方一个"样例资源"说明：列出当前演示文件的来源链接。

默认远端样例列表（公开可达，CORS 支持；若不可达以空列表回退）：

```ts
const sampleFiles: FileViewerItem[] = [
  { name: 'Mountains.jpg', src: 'https://picsum.photos/id/1018/1600/900', kind: 'image' },
  {
    name: 'BigBuckBunny.mp4',
    src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    kind: 'video'
  },
  { name: 'Ebook.pdf', src: 'https://snippet.embedpdf.com/ebook.pdf', kind: 'pdf' },
  {
    name: 'Readme.txt',
    src:
      'data:text/plain;charset=utf-8,' +
      encodeURIComponent(
        'Ultra UI File Viewer\n====================\n\n- Preview images, videos, PDFs, DOCX, XLSX/CSV and TXT files.\n- Memory-conscious, switches destroy the previous previewer.\n- Built on VTable, EmbedPDF, docx-preview.\n'
      ),
    kind: 'text'
  }
]
```

页面提供一个 `添加到预览` 的 `u-file-picker`（`multiple`, `accept="*"`），回调里直接 `files.value = [...files.value, ...pickedFiles.map(f => ({ name: f.name, src: f, size: f.size, mime: f.type }))]`。

### 6. 开发服务器交付验证

严格按以下顺序执行，任何一步失败需定位并修复再继续下一步：

1. 在仓库根运行 `bun install` 确保新依赖落地。
2. 在仓库根运行 `bun run check-types`（通过 turbo 触发各包 `tsc --noEmit`）。
3. 启动 `cd playgrounds/desktop && bun dev` 或直接在根 `bun dev --filter play-desktop`，端口 `7788`。
4. 使用 cursor-ide-browser MCP 访问 `http://localhost:7788/file-viewer/index`：
   - 确认侧栏展示 4 个样例文件；
   - 点击每一项，确认对应预览器加载并渲染（图片、视频、PDF、TXT 四项均展示内容）；
   - 捕获 `browser_take_screenshot` 与 `browser_console_messages`，验证无报错（EmbedPDF 首次加载的 WASM fetch 应成功，无 404 / CORS / `SyntaxError`）；
   - 使用 `browser_snapshot` 检查 DOM 结构：切换 PDF → TXT 后，原 PDF 容器应被销毁（不再出现在 DOM 中）。
5. 如有浏览器控制台报错或渲染异常，逐项修复后重新执行第 4 步。

## 影响范围

- `packages/desktop/package.json`：新增 `@cat-kit/excel`、`@embedpdf/core`、`@embedpdf/engines`、`@embedpdf/plugin-document-manager`、`@embedpdf/plugin-render`、`@embedpdf/plugin-scroll`、`@embedpdf/plugin-viewport`、`@visactor/vtable`、`docx-preview` 依赖
- `packages/desktop/tsdown.config.ts`：将上述依赖列入 `deps.neverBundle`
- `packages/desktop/src/types/file-viewer.ts`：新增类型定义（补丁 1 扩展模态相关 props/emits）
- `packages/desktop/src/types/index.ts`：导出 `file-viewer` 类型
- `packages/desktop/src/components/file-picker/helper.ts`：补丁 1 修正 `matchAccept` 对通配符与扩展名的匹配
- `packages/desktop/src/components/file-viewer/file-viewer.vue`：主组件（补丁 1 增加模态模式、关闭按钮、ESC/背景点击、body 滚动锁）
- `packages/desktop/src/components/file-viewer/helper.ts`：工具函数
- `packages/desktop/src/components/file-viewer/previewers/image-previewer.vue`
- `packages/desktop/src/components/file-viewer/previewers/video-previewer.vue`
- `packages/desktop/src/components/file-viewer/previewers/text-previewer.vue`
- `packages/desktop/src/components/file-viewer/previewers/pdf-previewer.vue`
- `packages/desktop/src/components/file-viewer/previewers/docx-previewer.vue`
- `packages/desktop/src/components/file-viewer/previewers/sheet-previewer.vue`
- `packages/desktop/src/components/file-viewer/style.scss`（补丁 1 新增 `is-modal` 全屏布局、backdrop 遮罩、modal 过渡、icon 关闭按钮样式）
- `packages/desktop/src/components/file-viewer/style.ts`
- `packages/desktop/src/components/file-viewer/index.ts`
- `packages/desktop/src/components/index.ts`：导出 `file-viewer` 组件
- `playgrounds/desktop/src/file-viewer/index.vue`：演示页（补丁 1 改为模态打开 + 修复加入预览）
- `bun.lock`：依赖锁定

## 历史补丁

- patch-1: 为 UFileViewer 增加全屏模态模式并修复 UFilePicker 通配符匹配
