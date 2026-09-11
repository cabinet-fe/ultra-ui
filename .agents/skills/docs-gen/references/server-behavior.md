# 服务端机制与文档对策

文档推送后由 docs-server 建索引，使用者的 AI 经 `docs-search` 技能检索。本文列出服务端**当前实现**的每条行为及其对文档写法的要求。写 frontmatter、定 keywords、分章节、定文档粒度前先读本文。

机制来源（docs-server 仓库）：`docs-server/internal/search/tokenize.go`、`search.go`、`section.go`、`write.go`；`docs-server/internal/ingest/frontmatter.go`、`ingest.go`。服务端这些文件改动后必须同步本文。

## 读者 AI 的消费流程

使用者的 AI 只有四种操作，它看到的字段只有下面这些：

1. `libraries` → `{"libraries":[{"slug":"request","documents":12},{"slug":"ui-core","documents":8}]}`
2. `search --q <关键词> [--library <slug>] [--limit 1~50]` → 缺省最多 20 条，按相关度降序，无分页：

   ```json
   {"results":[{"library":"request","path":"apis/request.md","title":"Request HTTP 请求客户端","description":"…","snippet":"…401 时<mark>刷新 token</mark>并重放…","sections":["快速上手","API 签名","参数说明"]}]}
   ```

   AI 只凭 `title` + `description` + `snippet`（64 token 的高亮片段，中文约 30 字）决定打开哪一篇；`sections` 列出该文档全部 `## ` 章节名，AI 可据此直接按章节取，不必先拉全文。
3. `get --library <slug> --path <path> [--section <章节名>]` →

   ```json
   {"library":"request","path":"apis/request.md","title":"…","description":"…","keywords":["…"],"aliases":["…"],"sections":["快速上手","API 签名","参数说明"],"content":"…"}
   ```

   带 `--section` 时 `content` 只含该 `## ` 章节，AI 看不到章节外的任何内容（包括 H1 后的概述与其他章节的 import）。
4. `toc --library <slug> --path <path>` → 与 `get` 相同但**无 `content` 字段**：只取元数据与章节列表，供 AI 先看结构再按章节取。

`--library` 指定了不存在的库时，search / get / list 均返回 404 `library_not_found`，与「库存在但无命中」的空结果区分。

结论：**title / keywords / description（以及文档路径）决定能否被打开；章节自包含决定打开后能否直接照做。**

## 索引与排序

| 机制 | 当前实现 | 文档对策 |
| --- | --- | --- |
| 索引列与权重 | FTS5 五列 bm25 加权：`title` 10.0、`keywords`（aliases 与 keywords 合并成一列）10.0、`path` 5.0、`description` 3.0、`content` 1.0。正文含代码块与标题一起入索引 | 想被搜到的词写进 title / keywords / aliases；路径（目录 + 文件名）自动可检索；正文重复堆词权重只有 1.0，无效 |
| 长度归一化 | bm25 按文档长度归一化，长文中每个词的权重被稀释 | 单篇 100~500 行；全库 API 塞一篇会让所有词互相稀释 |
| 中文分词 | CJK 连续段拆成单字 + 相邻二元组；查询中的中文词转成连续二元组短语，要求该子串在原文**连续出现**（`快速开始` 只命中含「快速开始」的文本，不命中「快速地开始」） | keywords 用开发者会原样输入的 2~6 字短语；同义写法分别列出（`虚拟滚动`、`虚拟列表`），不写长句 |
| 英文分词 | 字母/数字连续段为一个 token，大小写不敏感；`-` `_` `.` 空格与标点是分隔符。文档路径按同一规则整串入索引（`compositions/use-dnd.md` → `compositions`、`use`、`dnd`、`md`） | 标识符按源码原样写（`rowKey`、`skipErrorHandler`），一个标识符就是一个可命中 token；`row_key` 会被拆成 `row`、`key`。按文件名检索（`use-dnd`）命中路径词元，文件名要能表达主题 |
| 查询停用词 | 查询里的 如何 / 怎么 / 怎样 / 什么 / 哪个 / 哪些 / 请问 / 使用 / 可以 / 能够 / 进行 / 关于 / 对于 / 通过 / 如果 / 这个 / 一个 / 没有 等词，以及 的 / 了 / 吗 / 呢 / 吧 等单字助词在**词边界**被去掉（不做全串子串替换，「使用率」「使用者」等复合词保留）；`在X中` → `X` | keywords 只写实体与动宾核心（`分页`、`行内编辑`），不写 `如何使用分页`；疑问词与虚词进 keywords 是浪费 |
| AND → OR 降级 | 多词查询先要求全部词命中同一篇（任意列，含 path）；结果为 0 才降级为任一词命中 | 一篇文档的 title + keywords 要覆盖「组件名 + 场景词」的组合（`Table` + `分页`），让多词查询在精确的 AND 阶段就命中；文件名与目录词元同样参与这一组合 |
| 跨库检索 | 不带 `--library` 时全库混排 | 指南类 title 也带库名（`ui-core 安装与初始化`），避免与其他库的「安装」同名互相淹没 |
| 高亮片段 | 从命中最好的列取 64 token；命中 title / keywords 时片段可能只是标题或关键词串，只命中 path 时片段是原始路径加高亮（`guide/<mark>installation</mark>.md`） | `description` 是 AI 判断相关性的主要依据，写「是什么 + 解决什么 + 关键能力」；正文 H1 后的首段写成精确概述，它常被当作片段 |

## 章节切片

| 机制 | 当前实现 | 文档对策 |
| --- | --- | --- |
| 章节识别 | 只认行首 `## `（去首尾空白后）；`###` 及以下归属所在 `## `；代码块（三个反引号或 `~~~` 围栏）内的 `##` 不算标题 | 主要分段只用 `## `；`###` 用于章节内小节，不能被单独取回 |
| 章节匹配 | `--section` 忽略大小写与首尾空白，可带或不带 `## ` 前缀；必须与标题全文相等 | 标题用受控词表里的标准名（见 doc-standards.md），不加编号、emoji、锚点 `{#id}`、尾随说明 |
| 未命中 | 返回 404 `section_not_found`，message 列出该文档全部章节名 | 标准名让 AI 第一次就猜对；自创名多一次往返 |
| 切片边界 | 从 `## X` 行到下一个 `## ` 之前（含其中的 `###` 与代码块） | 每个 `## ` 章节自包含：import、前置初始化、示例内引用的变量与类型都写在本章节内；禁止「同上」「见快速上手」 |

## 文档标识

| 机制 | 当前实现 | 文档对策 |
| --- | --- | --- |
| 路径 | `path` = 相对文档目录的路径，含 `.md`（`components/table.md`），是 `get` 的唯一键，也作为独立列（5.0）进索引 | 语义化、小写连字符、稳定，文件名要能表达主题（按名字就能搜到）；重命名等于让所有旧引用失效 |
| 库 slug | `^[a-z0-9-]+$` | `DOCS_LIBRARY` 取包名的 slug 形式（`ui-core`） |

## 推送校验

| 机制 | 当前实现 | 文档对策 |
| --- | --- | --- |
| 原子性 | 任一篇 frontmatter 解析失败，整批不写库；成功则整库覆盖，服务端旧文档全部删除 | 推送前逐篇自检；本地删掉的文件推送后服务端同步消失 |
| 本地校验 | 推送脚本本地按服务端已知拒绝项严格校验（BOM、分隔线行尾空格、重复键、未引号的 `: ` 与 ` #`、引号未闭合、title 缺失/为空/非字符串），一次列出全部文件的全部问题后才发请求 | 本地报错就地修完再推，别指望服务端兜底 |
| frontmatter 边界 | 文件首字节起必须是 `---` 独占一行（`---\n` 或 `---\r\n`）；结尾分隔线是独占一行的 `---` | 无 BOM、无前导空行、分隔线行尾无空格 |
| YAML 解析 | 服务端严格 YAML（yaml.v3）：重复键、未闭合括号报错；值内 `: ` 未加引号报错；值内 ` #` 之后被当注释丢弃 | 值含 `: `、` #`、引号，或以 YAML 指示符（`[` `{` `*` `&` `!` `%` `@` `>` 竖线 引号）开头时用双引号包裹；不写多行标量 |
| 字段 | 只读 `title`（必填非空白）、`description`、`aliases`、`keywords`；其他字段忽略 | `aliases` / `keywords` 三种写法等价：YAML 列表、内联数组 `[a, b]`、逗号分隔字符串（中英文逗号均可） |
| 下架 | `push-docs.mjs --clear` 调 `DELETE /api/v1/libraries/{slug}`（Bearer 鉴权），删除该库全部文档与索引 | 库永久废弃时才用；服务端无法恢复，需用户确认后执行 |
