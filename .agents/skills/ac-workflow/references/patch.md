# patch

基于当前已执行计划创建增量补丁，修复问题或追加变更。

> **前提**：此协议的所有路径和编号均来自上下文脚本输出，禁止自行扫描目录计算编号。
> - 补丁编号使用 `nextPatchNumber`
> - 当前计划路径使用 `currentPlanDir` / `currentPlanFile`

必须附带补丁描述。

## 前置检查

- 描述为空 → 通过 AskUserQuestion 向用户收集需求后继续执行。
- `currentPlanStatus` 为 `null` → 通过 AskUserQuestion 提供选项：1) 创建新计划（推荐） 2) 终止操作，按用户选择执行。
- `currentPlanStatus` 为 `"未执行"` → 通过 AskUserQuestion 提供选项：1) 先执行 implement 再创建补丁（推荐） 2) 终止操作，按用户选择执行。
- 补丁需求与当前计划的关联性不确定 → 通过 AskUserQuestion 提供选项：1) 与当前计划相关，继续创建补丁（推荐） 2) 与当前计划无关，需先归档，按用户选择执行。
- 补丁需求与当前计划完全无关 → 通过 AskUserQuestion 提供选项：1) 运行 `agent-context done` 归档后继续新建计划（推荐） 2) 终止操作，按用户选择执行。
- 补丁不改变计划状态，完成后保持 `已执行`。

## 执行步骤

1. 阅读 `currentPlanFile` 指向的 `plan.md` 与已有 `patch-{number}.md`，了解上下文与历史。
2. 根据描述执行补丁所需的代码变更。
3. 在 `currentPlanDir` 下创建 `patch-{nextPatchNumber}.md`，遵循下方模板。
4. 回写 `plan.md`：
   - `## 历史补丁`：追加 `- patch-{nextPatchNumber}: {补丁名称}`，按编号去重。
   - `## 影响范围`：合并本次变更路径，按路径去重。`.agent-context/` 目录下的文件不计入影响范围。

5. 追问：通过 AskUserQuestion 询问用户是否继续对刚实施完成的计划执行 review 协议。

## patch.md 模板

```markdown
# {补丁名称}

## 补丁内容

{修改了什么、为什么修改}

## 影响范围

- 新增文件: `/path/to/file`
- 修改文件: `/path/to/file`
- 删除文件: `/path/to/file`
```
