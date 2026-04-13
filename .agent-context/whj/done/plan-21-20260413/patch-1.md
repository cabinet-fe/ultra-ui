# @veltra/vite 通用 devDependencies 上收至仓库根

## 补丁内容

`packages/vite` 的 `devDependencies` 中含 `@types/node`、`tsdown`、`typescript`、`unplugin-vue-components`，与仓库「通用工具依赖集中在根 `package.json`」的惯例不一致（与子包仅保留 workspace/包特有依赖的做法对齐，参考 `@veltra/utils` 等包）。

将 `@types/node`、`unplugin-vue-components` 加入根 `devDependencies`（根已有 `tsdown`、`typescript`）；从 `@veltra/vite` 中移除上述通用项，仅保留构建解析器所需的 `@veltra/desktop`。`peerDependencies` 不变，宿主仍须自行安装 `unplugin-vue-components`。

## 影响范围

- 修改文件: `/Users/whj/codes/ultra-ui/package.json`
- 修改文件: `/Users/whj/codes/ultra-ui/packages/vite/package.json`
