---
name: docs-gen
description: >
  只用于库仓库：构建、同步并推送给 AI 读的库文档。用户要求撰写、优化、推送或同步库文档时使用；
  库的公共 API、默认值、报错或行为改动后（含本次会话刚改完代码）也必须使用。检索内部库文档改用 docs-search。
---

# docs-gen 库文档构建与推送

本技能只服务库仓库，做三件事：按标准构建库文档；库代码改动后判定并同步受影响的文档；把整库文档推送到中心服务建全文索引。检索内部库文档用 `docs-search` 技能，不在本技能展开。

```
库维护者 ──push-docs.mjs（HTTP PUT）──▶ docs-server（SQLite FTS5）◀──docs-search── 使用者的 AI
```

## 核心原则

**文档的读者是 AI，不是人。** 使用者的 AI 搜到文档后把它当规格直接照做；写不清的地方它会用开源库的训练知识脑补，产出错误代码。文档只有两个质量指标：

- **指令精确**：每个参数的类型、默认值、必填、取值范围，每个方法的返回与错误，与开源库的差异——全部是确定的事实，没有「通常」「建议」「可能」。
- **示例足够**：每个核心场景都有自包含、可直接运行的示例；指南与场景方案给出端到端的 `## 完整示例`。

文档写法必须配合服务端当前实现：服务端按 title / keywords / aliases / 文档路径 高权重召回，只按 `## ` 切片返回，AI 取回一个章节时看不到其他章节。机制与对策见 `references/server-behavior.md`。

## 参考文件（按需读取，不要一次全读）

| 文件 | 何时读 |
| --- | --- |
| [references/server-behavior.md](references/server-behavior.md) | 写 frontmatter / keywords、分章节、定文档粒度前：服务端如何分词、加权、降级、切片、校验，以及每条机制对应的文档写法 |
| [references/doc-standards.md](references/doc-standards.md) | 撰写或修改任何文档时：frontmatter 硬性规范、文档类型与章节词表、写作规则、示例规则、自检清单 |
| `references/templates/<类型>.md` | 新建文档时只读对应类型的一份：`overview`（index.md）、`api-reference`、`guide`、`recipe`、`troubleshooting`、`migration` |
| [references/golden-sample.md](references/golden-sample.md) | 首次撰写文档前读一次：一篇写满的 API 参考范例，用来对照自己的产出 |
| [references/change-sync.md](references/change-sync.md) | 库代码改动后：确定改动范围、按判定表判断是否影响文档、定位受影响篇目与章节、输出同步报告 |

## 库维护者流程

### 1. 检测配置与环境变量（始终第一步）

进入本技能先做这一步，之后无论走构建、变更同步还是推送都不再重复判断。检测方法：
1. 读仓库根目录 `.pe.jsonc`，确认非敏感配置齐全：
   - `docs_server_url`：文档服务地址，如 `"http://docs.internal:8080"`（结尾斜杠脚本会自动去掉）
   - `docs_push_lib_name`：库 slug：仅小写字母、数字与连字符（`^[a-z0-9-]+$`），取包名的 slug 形式
2. 读仓库根目录 `.env` 与当前 shell 环境，确认敏感配置齐全：
   - `DOCS_TOKEN`：推送令牌，与服务端 `DOCS_PUSH_TOKEN` 一致，向服务管理员索取

- 齐全：直接进入步骤 2。
- 有缺失：引导用户补齐：
  1. 用提问工具向用户逐项询问缺失的值；禁止编造 token、服务地址或库 slug。
  2. 非敏感配置写入仓库根目录 `.pe.jsonc`（已存在则补充或更新相应字段，该文件需提交入 git）。
     示例：
     ```jsonc
     {
       "docs_server_url": "http://docs.internal:8080",
       "docs_push_lib_name": "your-lib"
     }
     ```
  3. 敏感配置写入仓库根目录 `.env`（已存在则只补缺失行，不覆盖已有值）。格式：`DOCS_TOKEN=value`，`=` 两侧不留空格。
  4. 确认 `.gitignore` 已含 `.env`；没有则追加。token 属敏感信息，严禁提交入库。

**严禁复制脚本**：本技能内置推送脚本，命令执行必须始终指向本技能内置脚本绝对路径，严禁在目标仓库根目录或子目录下创建 `scripts/push-docs.mjs` 等任何脚本副本！

### 2. 构建文档

文档放 `agent-docs/`（脚本参数可指定其他目录）。按顺序执行：

1. **收集事实**：API、签名、默认值、约束、报错文案只从公共导出、类型声明、源码、测试、示例、README、CHANGELOG 取；禁止用训练数据或同类开源库的用法补齐。拿不到的事实向用户确认，不写「可能」。
2. **规划文档集**：按 doc-standards.md「文件组织」「文档类型与章节词表」列出计划表（路径 / 类型 / 覆盖的导出），含 `index.md`。首次建文档时把计划表给用户确认后再写；更新已有文档时只改受影响的篇目。
3. **逐篇撰写**：按 doc-standards.md「文档类型与章节词表」判定类型，只读 `references/templates/` 下对应的一份骨架；frontmatter、章节名、写作规则、示例规则按 doc-standards.md 执行。
4. **逐篇自检**：过 doc-standards.md「自检清单」，不通过的当场改，不留到推送后。

已有文档不合标准（缺 frontmatter 字段、章节名不在词表、示例是片段）时，按标准重写该篇，不做局部修补。

### 3. 执行推送

执行时机：

- 用户明确要求推送/同步文档：直接执行
- 文档发生实质性变更（新增/修改/删除 `.md`）后：主动询问用户是否同步推送
- 推送失败修复后：修复完成即重推
- 重要发布或首次建文档：用 `--verify` 推送，把「可检索验证」结果一并报告

命令（**命令一律在用户仓库根目录执行**，即 `.pe.jsonc` 与 `.env` 所在处；脚本路径写成指向本技能内置脚本的绝对路径；用 Node 内置 `--env-file` 参数加载 `.env`，全平台通用；禁止 `set -a && source` 等 POSIX 专属前缀）：

```bash
node --env-file=.env <本技能绝对路径>/scripts/push-docs.mjs            # 推送（目录默认 agent-docs/）
node --env-file=.env <本技能绝对路径>/scripts/push-docs.mjs --verify   # 推送后逐篇按 title 搜索验证可检索
node --env-file=.env <本技能绝对路径>/scripts/push-docs.mjs --clear    # 下架整库（服务端删除该库全部文档与索引）
```

Node ≥ 24 已内置 `--env-file`；`.env` 与 `.pe.jsonc` 须已存在（步骤 1 保证）。

行为须知：

- 整库覆盖：每次推送全量替换服务端该库全部文档，服务端旧文档会被删除
- 原子性：任一篇校验失败整批不写库；本地校验失败（frontmatter 问题）时不会发出请求，且一次性列出全部文件的全部问题
- `--verify` 推送后逐篇按 title 搜索，任何一篇搜不到即非零退出——推送成功但索引异常时能当场发现，重要发布用带验证的推送
- `--clear` 用于库永久下架：服务端删除该库，`libraries` 列表不再出现；只是想清空重推时**不要**用它，正常推送即可（整库覆盖会同步删除本地已移除的文档）
- 成功输出 `推送成功：库 <slug> 共 <N> 篇文档`，把篇数报告给用户

失败时按报错处理，禁止盲目重试：

| 报错（脚本 stderr） | 原因 | 处理 |
| --- | --- | --- |
| `找不到配置文件：.pe.jsonc` / `配置文件 … 缺少必填字段：…` | `.pe.jsonc` 缺失或缺项 | 回到步骤 1 补齐 `.pe.jsonc` |
| `缺少必填环境变量：DOCS_TOKEN` | `.env` 未加载或缺少 `DOCS_TOKEN` | 回到步骤 1 补齐 `.env`，确认命令带 `--env-file=.env` |
| `无法读取文档目录：…` / `文档目录 … 下没有任何 .md 文件` | 目录参数错或目录为空 | 核对目录参数；确认要下架整库才用 `--clear` |
| `本地校验失败（未发出请求），共 N 处` | 一篇或多篇 frontmatter 不合服务端严格校验（BOM、分隔线行尾空格、重复键、值内未引号的 `: ` 或 ` #`、引号未闭合、title 缺失/为空/非字符串） | 按列出的每一条修对应文件，全部修完再推 |
| `请求推送接口失败：fetch failed（…）` | 服务地址不通（括号内是具体原因） | 核对 `.pe.jsonc` 中的 `docs_server_url` 与网络，向管理员确认 |
| `请求超时` | 服务端无响应 | 停止重试，报给管理员 |
| `HTTP 401` `unauthorized` | token 与服务端 `DOCS_PUSH_TOKEN` 不一致 | 向管理员核对 token，禁止猜 |
| `HTTP 400` `invalid_slug` | `docs_push_lib_name` 不匹配 `^[a-z0-9-]+$` | 改 `.pe.jsonc` 中的 slug |
| `HTTP 400` `invalid_frontmatter` | 本地校验漏网的服务端严格 YAML 错误；message 含出错文档路径 | 只修 message 指出的那篇，对照 server-behavior.md「推送校验」 |
| `验证失败，以下 N 篇推送后搜不到` | `--verify` 模式下服务端分词或索引异常 | 报错原文转述给管理员，勿重推 |
| `HTTP 404`（`--clear` 时） `library_not_found` | 库本就不存在 | 无需处理，向用户确认即可 |
| `HTTP 500` `internal` | 服务端写库失败 | 报错原文转述给管理员 |

monorepo 多包：一仓库多包时可配置不同配置文件（如 `--config=.pe.ui.jsonc`）与不同文档目录，逐包执行 `node --env-file=.env <本技能绝对路径>/scripts/push-docs.mjs --config=.pe.ui.jsonc <该包文档目录>`；各包文档目录互不嵌套，推送互不影响。

可选：接入 CI（GitHub Actions）让文档随主干自动同步：

```yaml
- run: node <本技能绝对路径>/scripts/push-docs.mjs
  env:
    DOCS_TOKEN: ${{ secrets.DOCS_TOKEN }}
```

## 变更同步（库代码改动后）

库代码改了，文档必须跟上。触发条件（满足其一即执行，不等用户提）：

- 本次会话刚改完库代码（用户让改的也算），收尾前执行
- 用户说改了 / 发布了 / 重构了库，或要求「同步文档」「文档是否过期」
- 用户给出提交范围、tag 或 PR

步骤（判定表、命令、报告格式见 `references/change-sync.md`）：

1. **定范围**：用户指定范围 > 本会话改动 > 工作区未提交改动 > `agent-docs/` 最后一次提交以来的源码改动
2. **判影响**：读每条 diff 正文对照判定表；只有公共导出可达的改动才影响文档，内部实现、测试、CI、依赖升级一律不影响
3. **定位**：`agent-docs/index.md` `## 模块速查` 查导出名对应篇目；`rg` 标识符或旧报错原文找出所有引用它的篇目
4. **更新**：只改受影响章节，改完的篇目过 doc-standards.md 自检清单；增删篇目同步 `index.md` 速查表
5. **报告**：输出变更同步报告；无一条影响也要报告并写理由，判定不了的标「待确认」向用户提问。有实质变更则进入「3. 执行推送」

`agent-docs/` 不存在时不走本节，走「2. 构建文档」。

## 检查清单

- [ ] 已执行步骤 1 配置与环境变量检测：`.pe.jsonc`（`docs_server_url`、`docs_push_lib_name`）与 `.env`（`DOCS_TOKEN`）齐全，`.env` 已加入 `.gitignore`
- [ ] 始终直接调用技能内置脚本，未在目标仓库创建 `push-docs.mjs` 副本
- [ ] 事实全部来自源码 / 类型声明 / 测试 / CHANGELOG，无猜测
- [ ] 每篇过完 doc-standards.md 自检清单：frontmatter 四字段、章节词表、参数五要素、示例自包含、差异标注
- [ ] 指南与场景方案有 `## 完整示例`；API 参考 `## 典型示例` 2~3 个
- [ ] 库代码改动后：已按 change-sync.md 判定影响面并输出同步报告，受影响篇目已更新
- [ ] 推送成功后向用户报告推送篇数；`--verify` 模式一并报告可检索验证结果

## 反模式

- 在目标仓库根目录下创建 `scripts/push-docs.mjs` 等脚本副本（必须始终直接执行技能内置脚本）
- 把敏感配置 `DOCS_TOKEN` 写入 `.pe.jsonc`、代码、示例或提交入库（敏感信息仅限放在 `.env`）
- 把非敏感配置 `docs_server_url` 或 `docs_push_lib_name` 写入 `.env`（非敏感配置须放在 `.pe.jsonc` 提交入库）
- 用训练数据或开源同类库的用法补齐本库 API
- 示例写片段：`// ...`、`// 同上`、省略 import、使用未定义变量
- 章节间互相引用（「见快速上手」）——AI 单取一章时看不到
- 自创章节名（`## Props`、`## 用法`）而不用词表
- 模糊词：通常、建议、可能、等等
- 编造或猜测 `DOCS_TOKEN`、服务地址、库 slug
- 推送失败后不看报错盲目重试
- 未经用户确认擅自提交 `.env`
- 文档塞满内部实现细节与敏感信息
- 全库 API 塞一篇大文档，或为微函数单独建文件
- 库公共 API 已变却不查 `agent-docs/`；只看文件名不读 diff 就判定「不影响」；判定不了的改动不提问直接跳过
- 在本技能内展开检索安装或查询步骤（检索交给 `docs-search`）
