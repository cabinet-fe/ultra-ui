# 全局类型与质量问题扫荡

> 状态: 已执行

## 目标

对仓库进行全局检查（类型、lint、测试等），在**不修改任何构建/工具配置**（如 `tsconfig.json`、`vite.config.ts`、`tsdown.config.ts` 等）的前提下，修复可明确判定的问题；对存在语义或设计歧义、不宜擅自改动的项，记录到根目录专用待解决歧义文件。

## 内容

1. 运行 `bun run check-types`、`bun run lint`、`bun run test`，汇总错误与警告。
2. 对类型与代码问题逐项处理：能明确修复的直接在业务/源码中修复；不得改动上述配置类文件。
3. 对无法在不确认产品语义或 API 意图下安全修复的项，写入根目录 `待解决歧义.md`（路径、现象、可选方案或疑问），不在源码中擅自修改。
4. 复跑 `check-types`、`lint`、`test` 确认通过或仅余已文档化的歧义项。
5. 更新本计划状态与影响范围。

## 影响范围

- `packages/desktop/package.json`（`exports` 增加 `components/*/style.ts`）
- `packages/utils/src/form/validate.ts`（oxlint 行内忽略 `no-await-in-loop`）
- `packages/styles/scripts/copy-scss.ts`（并行化目录遍历与复制）
- `packages/icons/scripts/format-svg.ts`、`gen-vue-icons.ts`、`gen-icon-barrels.ts`（`toSorted`）
- `packages/icons/src/svg/colorful/index.ts`、`packages/icons/src/svg/normal/index.ts`（非空占位导出）
- `packages/mobile/src/index.ts`（占位类型导出，替代 `export {}`）
- `packages/desktop` 内若干组件与 `tools/cli/export/index.ts`、`tools/cli/rename/types.ts` 的小幅 lint/类型友好修改
- `playgrounds/desktop/src` 多处：修正非法 `@ultra-ui/desktop/components` 根导入、`.scss` → `.style.ts` 侧链、`message-confirm` 导入来源
- `scripts/vitest-run.ts`（新增，恢复 turbo `play-desktop#test` 入口）
- 根目录 `待解决歧义.md`

## 历史补丁
