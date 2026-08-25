# playground dev services（data-entry + DeepSeek AI proxy）

playground 本地参考服务：在线填报单元格存取（SQLite）+ DeepSeek AI 会话代理。报表 DataConnector 已迁至下游，本服务不再提供 `test` / `describe` / `query`。

- 只存在于 playground（devDependencies），**不进任何发布产物**。
- 前端经 vite proxy 访问：填报走 `/report-api`（vite dev 自动转发到本服务）。

## 启动

- **推荐（完整演示）**：`cd playground && bun run dev` — 并行拉起参考服务（Bun，默认 8787，含填报与 `/ai`）与前端（7788）。
- **仅参考服务**：`bun run server`（`server/dev.ts`，Bun 运行；启动时加载 playground/.env）。
- **仅前端**：`bun run dev:web`；填报 / AI 演示需另开 `bun run server`，或改用 `bun run dev`。
- 端口：`REPORT_SERVER_PORT` 覆盖参考服务（默认 8787）。

## DeepSeek AI 代理

`server/deepseek.ts` 是纯 Hono + Web API 实现，由 `server/dev.ts` 挂到 `/ai`；API Key 只由服务端读取，不会下发浏览器。

| 环境变量                  | 默认值                     | 说明                                                 |
| ------------------------- | -------------------------- | ---------------------------------------------------- |
| `DEEPSEEK_API_KEY`        | 空（必填）                 | DeepSeek API Key；为空时兼容回退 `VITE_DEEPSEEK_KEY` |
| `DEEPSEEK_BASE_URL`       | `https://api.deepseek.com` | 上游 base URL                                        |
| `DEEPSEEK_DEFAULT_MODEL`  | `deepseek-v4-flash`        | 请求未传 model 时的默认模型                          |
| `DEEPSEEK_V4_FLASH_MODEL` | `deepseek-v4-flash`        | 前端 id `deepseek-v4-flash` 映射到的上游模型         |
| `DEEPSEEK_V4_PRO_MODEL`   | `deepseek-v4-pro`          | 前端 id `deepseek-v4-pro` 映射到的上游模型           |

- 浏览器端 transport 使用相对路径 `/ai/chat/completions`，vite proxy 原样转发到参考服务。
- 代理按 OpenAI 兼容协议转发 `content` / `reasoning_content` / `tool_calls`，因此 `createOpenAITransport()` 无需改协议。
- 端点不接收、也不返回 API Key；密钥只在服务端拼 `Authorization: Bearer` 时从环境变量读取。

| 端点                        | 请求体                            | 成功                              | 说明                                                            |
| --------------------------- | --------------------------------- | --------------------------------- | --------------------------------------------------------------- |
| `GET /ai`                   | —                                 | 服务文档（不含密钥）              | 会话代理活体文档                                                |
| `GET /ai/models`            | —                                 | `{ object: "list", data: [...] }` | `deepseek-v4-flash` / `deepseek-v4-pro`，含低 / 中 / 高推理等级 |
| `POST /ai/chat/completions` | OpenAI chat.completions 兼容 JSON | SSE 或 JSON                       | 校验 `messages` / `stream` / `model` 后转发 DeepSeek            |

```bash
# 直接冒烟（请先在 playground/.env 配置 DEEPSEEK_API_KEY）
curl -N -X POST http://localhost:8787/ai/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"deepseek-v4-flash","messages":[{"role":"user","content":"你好"}]}'

# 模型列表
curl http://localhost:8787/ai/models
```

## 在线填报

| 端点                                  | 请求体                                    | 成功                  | 说明                                     |
| ------------------------------------- | ----------------------------------------- | --------------------- | ---------------------------------------- |
| `GET /data-entry/forms/:formId/cells` | —                                         | `{ ok: true, cells }` | 读取表单全部已存单元格（sheet/row/col 升序） |
| `PUT /data-entry/forms/:formId/cells` | `{ cells: [{ sheet, row, col, value }] }` | `{ ok: true, saved }` | 批量 upsert；`value` 为 null/'' 删除该格 |

- `sheet` 为 workbook 内 sheet 名（1~128 字符）；`value` 仅接受 JSON 标量（string / number / boolean / null）；row/col 为非负整数；单批上限 10_000 条。
- 存储：SQLite 表 `data_entry_cells`，主键 `(form_id, sheet_key, row_index, col_index)`，与多 sheet 模型同为稀疏按格存储。
- 前端演示页：`src/sheet-data-entry/index.vue`（多 sheet 预算填报：单元格级只读 + 跨表公式 + 提交前校验 + cell-change 防抖自动保存）。
