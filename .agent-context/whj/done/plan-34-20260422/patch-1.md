# 补齐运行时冒烟与同步 skills 生成文档

## 补丁内容

plan-34 review 指出两点瑕疵，通过本补丁修补：

1. **运行时冒烟覆盖不足**：原 playground 中 `table/index`（3 行）与 `multi-select/index`（60 项）均低于 `u-table` / `u-multi-select` 默认 `virtualThreshold=80`，导致这两个组件的虚拟分支在 playground 无法被触发。对应 plan 步骤 6 要求的"table 大量行、multi-select 大量选项"两类场景实际未跑通。
   - 将 `playgrounds/desktop/src/table/index.vue` 的 `students` 从固定 3 行扩展为基于 3 条种子循环生成的 200 行（保留原列含义 `{ id, name, age, grade, class, score }`，`name` 带 `-{index}` 后缀便于区分）。
   - 将 `playgrounds/desktop/src/multi-select/index.vue` 的 `length: 60` 调整为 `length: 200`。
   - 重新启动 `bun dev` 做冒烟：`table/index` 虚拟分支渲染 200 行、`multi-select/index` 下拉展开 200 个选项均渲染正常；仅出现一次 `debug` 级 `ResizeObserver loop completed with undelivered notifications.`（`@cat-kit/fe` 内部 `ResizeObserver` 的已知良性警告，非 error），无虚拟列表相关错误。

2. **skills 生成文档未同步**：`skills/veltra-compositions/generated/modules/use-virtual.md` 仍展示 `@tanstack/vue-virtual` 旧实现片段与 `Omit<VirtualItem, 'key'>` 旧类型，会误导后续协作者。
   - 执行 `bun tools/skills-sync/sync-veltra-compositions.ts` 重新生成全部 `use-*` 模块镜像，同步更新 `manifest.json`（以及顺带刷新了 `use-fallback-props.md`、`use-user-action.md` 的元数据差异，属于生成物同步范畴）。

## 影响范围

- 修改文件: `playgrounds/desktop/src/table/index.vue`
- 修改文件: `playgrounds/desktop/src/multi-select/index.vue`
- 修改文件: `skills/veltra-compositions/generated/modules/use-virtual.md`
- 修改文件: `skills/veltra-compositions/generated/modules/use-fallback-props.md`
- 修改文件: `skills/veltra-compositions/generated/modules/use-user-action.md`
- 修改文件: `skills/veltra-compositions/generated/manifest.json`
