# 发版内容规范

发版内容写给使用者：这次升级带来什么、要不要改用法、怎么改。库看公共 API；Go 应用看命令、配置、接口和数据格式。内容只写一次，按顺序流转：changeset（无版本工具时直接写 CHANGELOG）→ CHANGELOG → GitHub Release 正文，后两处原样引用前一处。Go 没有 changeset，直接写 CHANGELOG。

## 收集改动

1. 范围：上一个发版 tag 到 `HEAD`（`git log <上个 tag>..HEAD --no-merges`），结合 PR 描述与 diff。没有任何发版 tag 时，用 `交互式提问` 确认第一条说明覆盖哪些提交，不要默认写进全部历史。
2. 只保留使用者能感知的改动：公共导出、类型声明、默认值、报错文案、运行时与 peer 依赖要求、产物格式。内部重构、测试、CI、开发依赖不进发版内容。
3. changesets 项目：逐条对照待消费的 changeset，漏写的补上，写错幅度的改掉。

## 版本幅度

| 改动 | ≥ 1.0.0 | 0.y.z |
| --- | --- | --- |
| 破坏性：删除或重命名导出、改签名、改默认值或行为、收紧类型、提高 Node / peer 依赖下限、改产物格式 | major | minor |
| 新增导出、选项、功能；弃用但不删除 | minor | patch |
| 修 bug、性能优化、放宽类型或依赖范围 | patch | patch |
| 只改文档、测试、CI、开发依赖 | 不发版 | 不发版 |

- 0.y.z 阶段用 major 会直接升到 1.0.0，只在决定发布稳定版时使用。
- 判断不了是否破坏性时按破坏性处理，并用 `交互式提问` 向用户确认一次。
- 预发布版本号：`x.y.z-<标识>.<n>`，标识用 `alpha`、`beta`、`rc` 或 `next`，`n` 从 0 递增。

### Go

幅度仍用上一张表，把「使用者能感知的改动」换成 Go 的发布物：

- 破坏性：模块导出的函数、类型、方法、字段被删除、重命名、改签名或改默认行为；提高 `go` 行（使用者必须换工具链）；应用的命令、配置、对外接口、磁盘数据格式、已发布产物文件名发生不兼容变化。
- 新增：新的导出 API、命令、配置项、接口。
- v0、v1 的模块路径不加版本后缀。v2 及以上路径必须以 `/vN` 结尾，且 N 与主版本一致；这是发版前的代码改动。升到 1.0.0 不加 `/v1`。
- 预发布写成 tag `vX.Y.Z-rc.1`。Go 没有 dist-tag；模块的 `@latest` 不会选中带 `-` 的版本。
- 只改 `internal/`、测试、CI，且使用者无感知：不发版。

## 条目写法

适用于 changeset 正文与手写 CHANGELOG 条目。

- 一条只写一处改动；一个 PR 有多处独立改动就拆成多条（多个 changeset 文件）。
- 动词开头（新增 / 修复 / 移除 / 弃用 / 变更），说清效果，涉及的 API 名用反引号包起来。
- 修复写现象，不写实现：写「修复 `parse` 在空字符串输入时抛出 TypeError」，不写「修复空值判断」。
- 破坏性改动必须带迁移方式：改了什么 → 旧写法 → 新写法（代码块）。major 版本的升级说明也写在条目里，不另写到 Release。
- 禁止：空泛词（「优化」「调整」「若干修复」）、照抄提交信息、文件名与内部函数名。
- 语言沿用项目已有 CHANGELOG；没有 CHANGELOG 时用 `交互式提问` 问一次（中文 / 英文），之后保持一致。

示例（changeset）：

````markdown
---
"@scope/client": major
---

`createClient` 的 `timeout` 单位由秒改为毫秒。

```ts
// 旧
createClient({ timeout: 5 })
// 新
createClient({ timeout: 5000 })
```
````

## CHANGELOG

- changesets 项目：由 `changeset version` 生成到各包目录，结构不要手改；措辞问题在发版前改 changeset 文件。
- 无版本工具：仓库根 `CHANGELOG.md`，最新版本在最上面，发版前写好新版本一节：

```markdown
# Changelog

## 1.3.0 (2026-10-14)

### 破坏性变更

- `createClient` 的 `timeout` 单位由秒改为毫秒：`timeout: 5` 改为 `timeout: 5000`。

### 新增

- `createClient` 新增 `retry` 选项，默认不重试。

### 修复

- 修复 `parse` 在空字符串输入时抛出 TypeError。
```

- 标题 `## <版本> (<YYYY-MM-DD>)`；分类按固定顺序：破坏性变更、新增、变更、弃用、移除、修复、安全，没有内容的分类不写。英文项目用 Breaking Changes / Added / Changed / Deprecated / Removed / Fixed / Security（Keep a Changelog 1.1.0）。
- 已发布版本的段落不再修改（错别字除外）；撤回的坏版本在标题后加 `[YANKED]`。

## GitHub Release 正文

- 正文 = 该版本的 CHANGELOG 段原文，不另写摘要。
- 聚合 Release（整仓 `fixed` 组）：每个包一节，标题 `## <包名>`，下面放该包该版本的 CHANGELOG 段。
- 预发布版本标为 prerelease。

## 发版提交、tag 与 dist-tag

- 提交信息（中文，不加 `[skip ci]`）：
  - 单包或整仓同版本：`chore(release): 发布 v1.3.0`
  - 多包：`chore(release): 发布 @scope/core@1.3.0, @scope/utils@0.4.1`；超过 3 个包时标题写 `chore(release): 发布 5 个包`，正文逐行列出 `<包>@<版本>`
- tag：单包或整仓同版本 `v<版本>`；changesets 多包 `<包名>@<版本>`。都用附注 tag。npm 在发布成功后创建。Go 一律 `v<版本>`（模块索引要求这个前缀），时序见 [go-release.md](go-release.md)：本地检查通过并推送发版提交之后打 tag。多模块仓库的子模块 tag 是 `<目录>/v<版本>`；本技能的脚本契约只覆盖仓库根的一个模块。
- dist-tag（仅 npm）：正式版 `latest`；预发布版取标识（`next`、`beta`、`rc`、`alpha`），禁止用 `latest`；给旧大版本发补丁用 `latest-<major>`（如 `latest-1`），对应的 GitHub Release 不标 Latest（`gh release create --latest=false`）——npm 11+ 拒绝把低于当前 `latest` 的版本隐式标为 `latest`。Go 没有 dist-tag。
