# 修复 sample 组件演示页错误

> 状态: 已执行

## 目标

消除 `sample` 应用中 batch-edit、dialog、loading、number-input、number、pop-confirm、progress-nodes、table 等演示页的运行时错误与警告，修正 progress-nodes 样式问题，并在浏览器中验证各页正常。

## 内容

1. 启动 `sample` 开发服务，打开各对应路由，记录控制台报错与堆栈。
2. 根据堆栈定位到 `sample/src` 或 `packages/pc` 中的根因（错误导入、API 变更、类型或 props 不匹配、缺失依赖等），修改最小必要代码。
3. 处理 loading 的 Vue 警告（如 prop/ slot 废弃或类型问题）。
4. 检查 progress-nodes 演示的 SCSS/BEM 或组件用法，修复样式显示异常。
5. 在浏览器中依次访问上述页面确认无错误；本地运行 `bun vitest` 确认测试通过。

## 影响范围

- `package.json`（postinstall `simple-git-hooks`；根 `overrides` 固定 `estree-walker@2.0.2`）
- `bun.lock`
- `packages/pc/package.json`、`sample/package.json`（`@lucide/vue`）
- `AGENTS.md`、`MIGRATION.md`
- `packages/pc/src/**`、`sample/src/**`、`sample/App.vue`（图标导入包名；`number-input` 步进为 Chevron）
- `sample/main.ts`（注册 `vLoading`、引入 loading 样式）
- `sample/src/progress-nodes/index.vue`（标签文案颜色使用主题 `use-var`）
- `packages/pc/src/install.ts`（`UltraUI` 注册 `v-loading` 与 loading 样式）
- `packages/pc/src/components/table/table-foot.vue`（`$n.plus` 合计）
- `packages/pc/src/components/number/number.vue`（`$n.formatter`）
- `packages/pc/src/components/number-input/number-input.vue`（`$n.plus` / `mul` / `div` / `minus`）
- `packages/pc/src/components/number-range-input/number-range-input.vue`（`$n.div`）

## 历史补丁

- patch-1: 迁移 @lucide/vue 与数字输入步进图标
- patch-2: MIGRATION 补充 NumberInput 步进图标说明
- patch-3: sample 启动失败：根 overrides 固定 estree-walker@2.0.2
