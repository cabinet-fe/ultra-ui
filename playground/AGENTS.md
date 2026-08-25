# AGENTS.md — playground

统一组件与图标预览，调试与演示 Ultra UI。

## 启动

```bash
cd playground
bun run dev        # 参考服务（Bun, 8787：data-entry + /ai）+ 前端（7788）
bun run dev:web    # 仅前端；演示服务需另开 bun run server
bun run server     # 仅参考服务（填报 + DeepSeek 代理，同一端口）
```

## 导航

- 侧栏使用 `UDualNav`：左轨 Icons / Desktop / AI Chat / Sheet；Icons 右栏为「图标库 / 图标组合」；Desktop 右栏为「分类 → 组件」两级导航；AI Chat 右栏为「AI 对话 / AI Orb 活体球」；Sheet 右栏为「基础演示 / 大数据量演示 / 在线填报」
- 导航数据集中在 `nav-config.ts`（`demoMeta`、`buildPlaygroundMenus()`）
- 新增 Desktop 演示页：在 `src/desktop/<component-name>/index.vue` 创建文件，并在 `nav-config.ts` 补充 `demoMeta`
- AI Chat（`@veltra/ai`）与 Sheet（`@veltra/sheet`）为独立顶层入口，不挂在 Desktop 分类下

## 路由

- `src/desktop/<component-name>/index.vue` → `/desktop/<component-name>/index`
- `src/icons/index.vue` → `/icons/index`
- `src/icons/combo/index.vue` → `/icons/combo/index`
- `src/ai-chat/index.vue` → `/ai-chat/index`
- `src/ai-orb/index.vue` → `/ai-orb/index`（UAiOrb 状态 / 瞬时表情 / 尺寸演示）
- `src/sheet/index.vue` → `/sheet/index`
- `src/sheet-big-data/index.vue` → `/sheet-big-data/index`（大数据量演示 + 性能基线）
- `src/sheet-data-entry/index.vue` → `/sheet-data-entry/index`（在线填报：单元格级只读 + 按单元格持久化演示）

由 `import.meta.glob` 分别扫描 `desktop`、`icons`、`ai-chat` 与 `sheet` 目录自动生成；
`src/ai-orb/index.vue`、`src/sheet-big-data/index.vue`、`src/sheet-data-entry/index.vue` 等因 glob 首段为字面段（`./src/sheet/**` 不匹配 `sheet-big-data`），
需在 `router.ts` 显式 `import.meta.glob` 并入 modules
（key 由顶层 `src/<name>/index.vue` 正则提取）。默认重定向 `/` → `/desktop/button/index`。

## Vite 要点

- SCSS：`NodePackageImporter`（仓库根）解析 `pkg:@veltra/styles/...`
- `VeltraUIResolver`（`@veltra/vite`）：desktop / ai / sheet 的 `U*` 组件 + 对应 `style.ts`
- `@veltra/vite` 为本 playground 的 devDependency
- `server/`：参考服务（填报存取 + DeepSeek `/ai` 代理，默认 8787）由 `bun run dev` 并行拉起；`vp build` 不依赖该服务

## 参考服务

`server/` 为 playground 本地参考服务（dev-only，不进发布产物）：

- **在线填报端点**（`src/sheet-data-entry` 演示页使用）：`GET /data-entry/forms/:formId/cells` 读取、`PUT /data-entry/forms/:formId/cells` 批量 upsert（空值删除），SQLite 表 `data_entry_cells` 按 `(form_id, sheet_key, row_index, col_index)` 主键稀疏存储多 sheet 填报数据（`server/data-entry.ts`）
- `bun run dev` 并行启动本服务（默认 8787，含 `/ai`）与前端；亦可 `bun run server` 单独启动（`REPORT_SERVER_PORT` 覆盖）
- 前端经 vite proxy `/report-api` 访问填报端点
- 详见 `server/README.md`

## DeepSeek AI 代理

`server/deepseek.ts` 挂在参考服务的 `/ai`，与填报端点同端口：

- API Key 从 `playground/.env` 的 `DEEPSEEK_API_KEY` 读取（兼容回退 `VITE_DEEPSEEK_KEY`），不下发浏览器
- `POST /ai/chat/completions`：OpenAI 兼容请求转发到 `https://api.deepseek.com/chat/completions`，SSE 中 `content` / `reasoning_content` / `tool_calls` 原样透传
- `GET /ai/models`：返回前端选择器模型 `deepseek-v4-flash` / `deepseek-v4-pro`（含低 / 中 / 高推理等级与默认等级）
- 前端 `src/ai-chat/index.vue` 已用 `createOpenAITransport({ endpoint: '/ai/chat/completions' })` 接入，两个模型均配置 `reasoningLevels`；默认 transport 将选中等级写入 `reasoning_effort`
- vite proxy 使用正则 `^/ai(?:/|$)` → 参考服务，只代理 `/ai` 与 `/ai/*`，避免前缀匹配把 `/ai-chat` 页面路由也代理走
- 上游地址 / 模型映射可经 `DEEPSEEK_BASE_URL` / `DEEPSEEK_V4_FLASH_MODEL` / `DEEPSEEK_V4_PRO_MODEL` 覆盖

## 结构

```
App.vue
main.ts           # normalize + router
router.ts
nav-config.ts     # 导航分类与中英文元数据
vite.config.ts
src/desktop/<name>/index.vue
src/icons/index.vue           # 图标库预览
src/icons/combo/index.vue     # 图标组合预览
src/ai-chat/index.vue         # @veltra/ai 对话组件预览（真实 Open-Meteo 天气终结工具卡片 weather-card.vue + 右侧面板后台页 admin-panel.vue（表单/图表/列表，renderTo: 'panel'）+ 待发送队列演示）
src/ai-orb/index.vue          # UAiOrb 活体球预览（生命状态 / 瞬时表情 / 尺寸）
src/sheet/index.vue           # @veltra/sheet 电子表格预览（数据结构观察区 JSON 区块懒渲染 + 超 1 万行截断：避免 65 万 span 的整页布局/绘制秒级卡顿；完整数据走复制/放大，不受截断影响）
src/sheet-big-data/index.vue  # @veltra/sheet 大数据量演示（Phase 6：10 万行写入/渲染/查找/导出 + 样式池去重）
src/sheet-data-entry/index.vue # 在线填报演示（年度预算：多 sheet 走内置标签栏；明细表为「编制项目 × 部门金额」矩阵 + 行列合计公式，汇总页跨表公式联动；提交前校验标红定位 + 提交后整表锁定；单元格级只读 setRangeReadonly/setCellReadonly；按「sheet+格」防抖保存到 /report-api/data-entry）
```

## 浏览器调试

改 UI 后优先用浏览器工具验证；若 dev server 已在跑，先探测 7788 再决定是否启动。

## 依赖

- **dependencies**：`@cat-kit/core`、`@cat-kit/fe`、`@veltra/ai`、`@veltra/compositions`、`@veltra/desktop`、`@veltra/directives`、`@veltra/icons`、`@veltra/sheet`、`@veltra/sheet-core`、`@veltra/styles`、`@veltra/utils`、`vue`、`vue-router`
- **devDependencies**：`@veltra/vite`；参考服务：`hono`、`@hono/node-server`

## 验证

```bash
# 仓库根
bun run lint
bun run build

# 本 playground
cd playground && vp dev      # 交互验证
cd playground && vp build    # 生产构建
```

## 大数据量演示页（Phase 6）

`src/sheet-big-data/index.vue`（nav-config `sheet-big-data`，Sheet 顶层菜单「大数据量演示」）：

- 规模 1 万 / 5 万 / 10 万行 × 12 列 + seed（默认 42）；mulberry32 seeded PRNG，同 seed 数据完全一致（可复现压测）。
- 流程：生成 items → `sheet.setCells(items)` 一次批量写入（单 undo 单元，初始化 `history.clear()` 不进 undo）→ 挂载 USheet。**写入先于挂载**（cell-change 无订阅者 → 耗时 = 纯模型路径），渲染由 VTable 一次性构建 records——「批量写入」与「首次渲染」分开计时（`performance.now()` + 双 rAF）。
- 样式池压测：每格 20 色循环填充（先 `stylePool.intern` 取 StyleId），面板展示池条目 ≪ 单元格数与去重率。
- 冒烟：冻结首行（`setFrozen(1,0)`）、查找计时（`findAll`，数据每 997 行埋 `NEEDLE-{row}`）、导出 xlsx（`exportWorkbookXlsx` + Blob 下载，计时 + 体积）。
- 实测基线见 `packages/sheet/AGENTS.md`「大数据量（Phase 6）」小节。
