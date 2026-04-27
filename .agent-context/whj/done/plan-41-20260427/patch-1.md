# 修复 plan-41 装包后 @embedpdf/core 入口丢失（vite ENOENT）

## 补丁内容

### 现象

playgrounds/desktop 的 vite dev server 反复抛出：

```
Error: ENOENT: no such file or directory, open
'/Users/whj/codes/ultra-ui/node_modules/.bun/@embedpdf+core@2.14.1+de83228fa5339e66/node_modules/@embedpdf/core/dist/index.js'
    at extractExportsData (vite/dist/node/chunks/node.js)
    ...
    at async prepareRolldownOptimizerRun
```

随后浏览器一侧因依赖预构建失败而看到加载错误。

### 根因

plan-41 在 `packages/desktop/package.json` 新增 `@codemirror/theme-one-dark` 依赖并执行 `bun install`，bun 在 isolated install 流程里对已有的 `node_modules/.bun/@embedpdf+core@2.14.1+de83228fa5339e66/node_modules/@embedpdf/core/dist/` 做了**部分覆写**，导致：

- `dist/index.cjs`、`dist/index.cjs.map`、`dist/index.js`、`dist/index.js.map` 被截掉一部分（`index.cjs/index.js` 整文件丢失，仅留 `index.js.map` 和 `index.d.ts`），mtime 为本次 `bun install` 触发的 12:23。
- 同版本 `@embedpdf/core@2.14.0`（旧目录）则完整保留 `index.js`，反向印证是这次部分覆写所致。
- bun 没有把 `index.js` 重新解包，直接结束安装，留下半破解状态；vite 的依赖预构建在 `extractExportsData` 阶段读 `index.js` 时立即 ENOENT。

与 plan-41 引入的 `oneDark` 主题代码本身**无关**——是 bun isolated install 的解包瑕疵。

### 修复手段

只做"运维"层面的修复，不改任何项目源码 / 配置：

1. 删除残缺的 bun store 目录：
   `rm -rf node_modules/.bun/@embedpdf+core@2.14.1+de83228fa5339e66`
2. 删除残缺的下游软链：
   `rm -rf packages/desktop/node_modules/@embedpdf/core`
3. 重新执行 `bun install`，由 bun 重新解包到 store 并重建 desktop 包下的软链。验证 `packages/desktop/node_modules/@embedpdf/core/dist/index.js` 已恢复（66k）。
4. 清理 vite 依赖预构建缓存：
   `rm -rf playgrounds/desktop/node_modules/.vite`
   避免 vite 沿用上一次失败留下的 metadata。

完成后 `bun install` 仅打印 "Resolved, downloaded and extracted [0]" 及"2 packages installed"（git hooks 重设），lockfile 不变；`git diff` 与本补丁前一致（仍为 plan-41 自身改动）。

### 复发预防

- 此类问题与 bun 1.3.13 isolated install 的并发解包瑕疵相关。后续若再遇 vite 报 `node_modules/.bun/...dist/index.{js,cjs}` ENOENT，按本补丁路径处理即可：删该 `.bun` 子目录 + 对应包软链 → `bun install` → 清 `.vite` 缓存。
- 不需要改业务代码，也不需要为此调整 plan-41 的实现内容。

## 影响范围

- 未修改任何项目文件（不涉及源码、配置或文档）。
- 仅运行时副作用：`node_modules/.bun/@embedpdf+core@2.14.1+de83228fa5339e66/` 重新解包；`packages/desktop/node_modules/@embedpdf/core` 软链重建；`playgrounds/desktop/node_modules/.vite` 缓存清空。
