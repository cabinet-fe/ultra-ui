# generated — npm typings 镜像

本目录由脚本生成，**勿手改**。内容来自各包 typings：优先 `node_modules/@cat-kit/<name>/dist`，否则 `packages/<name>/dist`（cat-kit 单仓）。

- 生成：仓库根 `bun run sync-use-cat-kit-api`；cat-kit 单仓可加 `-- --build` 先本地构建再复制
- 入口：各包从 `<pkg>/index.d.ts` 读起（如 `core/index.d.ts`）
- 元数据：`manifest.json`
