# 恢复 tsdown 多入口与 Sass api；同步 plan 正文

## 补丁内容

1. **review 结论**：`tsdown.config.ts` 曾缺失 `src/types/index.ts` 入口，且 Sass 未使用 `api: 'modern-compiler'`，与历史 `HEAD` 及 `plan.md` 描述不一致。仓库中**不存在** `src/install.ts`（`git` 历史中亦无），故 `entry` 不包含 `install`（避免无效路径；`AGENTS.md` 所述 `install` 待源码落地后再加入构建）。
2. **恢复**：`entry` 为 `index` + `types` + `components/**/style.ts`；`css.preprocessorOptions.scss` 恢复 `api: 'modern-compiler'` 与 `NodePackageImporter`；保留 patch-1 的 `treeshake.moduleSideEffects`。
3. **文档**：重写 `plan.md` 的「目标」「内容」，与 patch-1（构建侧修复）及 patch-2 对齐，避免仍描述已放弃的 Sass 全量迁入方案。

## 影响范围

- 修改文件: `packages/desktop/tsdown.config.ts`
- 修改文件: `.agent-context/whj/plan-27/plan.md`
