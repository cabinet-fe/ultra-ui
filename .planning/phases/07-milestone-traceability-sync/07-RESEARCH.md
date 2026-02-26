# Phase 7: Milestone Traceability Sync - Research

**Researched:** 2026-02-26
**Domain:** 里程碑需求追溯一致性修复（REQUIREMENTS / SUMMARY / VERIFICATION 三源对齐）
**Confidence:** HIGH

## Summary

Phase 7 的本质不是新增产品能力，而是修复里程碑元数据漂移：当前 `UX-01`、`UX-02`、`STAB-01`、`STAB-02` 在历史 `VERIFICATION` 中已被明确标记为满足，但 `REQUIREMENTS.md` 仍为未勾选且 traceability 状态为 `Pending`，同时相关 `SUMMARY` 的 `requirements-completed` 记录不一致，导致跨源对账出现 `partial`。

结合当前仓库与 GSD 工作流实现，最稳妥的实现路径是：以需求 ID 为主键做单次 reconciliation（先收敛“事实源”，再回写“台账源”），并用统一矩阵验证三源一致性。Phase 7 计划应避免扩散到功能代码，聚焦 `.planning/` 文档元数据。

**Primary recommendation:** 用“需求 ID 驱动”的最小改动方案完成对账：先锁定四个目标 ID 的 verification 事实，再同步 `REQUIREMENTS` 状态与对应 `SUMMARY` frontmatter，最后用同一套矩阵验证不再出现 metadata drift 导致的 `partial`。

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| UX-01 | User can trigger variable picker with `@` and insert variables without interrupting typing flow. | `03-VERIFICATION.md` 已标记 `✓ SATISFIED`，Phase 7 需将该事实回写到 REQUIREMENTS 与 SUMMARY 追溯元数据。 |
| UX-02 | User can complete variable selection workflow using keyboard (ArrowUp/ArrowDown/Enter/Escape) with predictable behavior. | `03-VERIFICATION.md` 已标记 `✓ SATISFIED`，需统一三源状态避免 `partial`。 |
| STAB-01 | User input remains stable under external `v-model` sync (no cursor jump, text loss, or overwrite races). | `02-VERIFICATION.md` 已标记 `✓ SATISFIED`，需同步 checklist 与 traceability 状态。 |
| STAB-02 | User can input expressions with IME (Chinese/Japanese/Korean) without composition interruption or corruption. | `02-VERIFICATION.md` 已标记 `✓ SATISFIED`，需同步到 SUMMARY frontmatter 与 REQUIREMENTS 台账。 |

</phase_requirements>

## Standard Stack

### Core
| Library / Tool | Version | Purpose | Why Standard |
|----------------|---------|---------|--------------|
| Markdown (`.planning/*.md`) | N/A | 里程碑与 phase 元数据主存储 | 项目现有治理流程即以 Markdown + frontmatter 为权威文档 |
| YAML frontmatter | N/A | `SUMMARY` 结构化字段（尤其 `requirements-completed`） | GSD 工作流明确依赖 frontmatter 做跨阶段聚合 |
| `gsd-tools.cjs` (`requirements mark-complete`) | repo-local | 批量更新 REQUIREMENTS 勾选与 traceability 状态 | 避免手改遗漏，内置同时改 checkbox + `Pending -> Complete` |
| `gsd-tools.cjs` (`frontmatter get/set`) | repo-local | 稳定读写 `requirements-completed` | 比手工 YAML 编辑更可控，适合可重复校验 |

### Supporting
| Tool | Version | Purpose | When to Use |
|------|---------|---------|-------------|
| Milestone audit matrix (`v0.5.0-MILESTONE-AUDIT.md`) | current snapshot | 提供 `partial` 判定基线与历史缺口证据 | 作为对账前后差异参考 |
| Phase VERIFICATION reports | per-phase | 需求是否满足的事实证据 | 作为回写 REQUIREMENTS/SUMMARY 的依据源 |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| 手动逐行编辑 REQUIREMENTS/SUMMARY | `gsd-tools` 命令更新结构化字段 | 手动编辑更易漏改或格式漂移；命令方式更可复现 |
| 仅更新 REQUIREMENTS，不处理 SUMMARY | 同步更新三源 | 只改单源会继续触发 `partial`，无法满足 Phase 7 成功标准 |

**Installation:**
```bash
# No new dependencies required.
```

## Architecture Patterns

### Recommended Project Structure
```
.planning/
├── REQUIREMENTS.md                                 # checklist + traceability ledger (目标状态)
├── v0.5.0-MILESTONE-AUDIT.md                       # 历史 gap 与 partial 判定依据
└── phases/
    ├── 02-input-stability/02-VERIFICATION.md       # STAB-01/STAB-02 事实源
    ├── 03-variable-picker-interaction/03-VERIFICATION.md  # UX-01/UX-02 事实源
    └── 07-milestone-traceability-sync/
        ├── 07-01-SUMMARY.md                        # 本 phase 的 requirements-completed 对账结果
        └── 07-VERIFICATION.md                       # 对账完成验证与证据链接
```

### Pattern 1: Requirement-ID-Led Reconciliation
**What:** 以 REQ-ID 为主键，对每个目标 ID 同时核对三源：`VERIFICATION`、`SUMMARY requirements-completed`、`REQUIREMENTS checkbox/traceability status`。  
**When to use:** 需求功能已实现，但审计仍出现 metadata drift 或 `partial`。  
**Example:**
```bash
# Source: /home/whj/.claude/get-shit-done/bin/gsd-tools.cjs
# 1) 先把 REQUIREMENTS checklist + traceability status 一次性对齐
node /home/whj/.claude/get-shit-done/bin/gsd-tools.cjs requirements mark-complete UX-01 UX-02 STAB-01 STAB-02
```

### Pattern 2: Frontmatter-as-Contract
**What:** 把 `SUMMARY` 的 `requirements-completed` 当作机器可读契约字段维护，而非“可选备注”。  
**When to use:** 需要通过工作流自动聚合 phase 覆盖度、避免人工判断偏差。  
**Example:**
```bash
# Source: /home/whj/.claude/get-shit-done/templates/summary.md
# 模板明确要求 requirements-completed 为必填字段
node /home/whj/.claude/get-shit-done/bin/gsd-tools.cjs frontmatter get .planning/phases/03-variable-picker-interaction/03-01-SUMMARY.md --field requirements-completed --raw
```

### Anti-Patterns to Avoid
- **单源修复：** 只改 `REQUIREMENTS.md` 不改 `SUMMARY`（或反过来）会继续导致对账 `partial`。  
- **无证据回写：** 未先对齐 `VERIFICATION` 事实就直接改状态，会制造“账面完成、证据缺失”。  
- **把 metadata 漂移当功能 bug 修：** 此 phase 不应触碰业务组件代码，避免引入无关回归。  

## Planning Guidance (Scope / Files / Risks / Validation)

### Scope (in)
- 仅处理四个目标需求：`UX-01`、`UX-02`、`STAB-01`、`STAB-02`。  
- 仅处理里程碑追溯元数据：checklist、traceability status、summary frontmatter、phase verification 对账文本。  

### Scope (out)
- 不改表达式编辑器运行时代码（`ui/components/**`）。  
- 不重做 Phase 2/3 功能验证，仅复用其既有 `VERIFICATION` 结论作为事实源。  

### Files Likely Touched
- `.planning/REQUIREMENTS.md`
- `.planning/phases/07-milestone-traceability-sync/07-01-SUMMARY.md`（新建）
- `.planning/phases/07-milestone-traceability-sync/07-VERIFICATION.md`（新建）
- （可选，取决于实施策略）历史 phase 的 `*-SUMMARY.md`，若决定回填原 phase 级 `requirements-completed`

### Validation Approach
1. 建立四个 REQ-ID 的三源矩阵（verification / summary / requirements）。  
2. 执行回写后重新生成矩阵，确认不再出现因 metadata drift 导致的 `partial`。  
3. 逐条核对成功标准：  
   - checklist + traceability 与 verification 一致；  
   - summary frontmatter 的 `requirements-completed` 一致且可解析；  
   - 跨源 reconciliation 结果稳定。  

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| 批量改需求状态 | 手工逐行改 checkbox + traceability 表格 | `gsd-tools.cjs requirements mark-complete` | 内置双位置同步（勾选 + Pending→Complete），降低漏改概率 |
| 读取/写入 summary frontmatter | 自写脆弱正则处理 YAML | `gsd-tools.cjs frontmatter get/set/merge` | frontmatter 结构化操作更稳定，减少格式破坏 |
| 对账规则自定义发挥 | 临时口径判断 “算不算完成” | 复用审计矩阵口径（passed/listed/checkbox） | 与里程碑审计一致，避免二义性 |

**Key insight:** 本 phase 的难点不是“实现功能”，而是“保证多源状态机一致”。复用既有工具和口径比手写一次性脚本更安全。

## Common Pitfalls

### Pitfall 1: 只更新 REQUIREMENTS，遗漏 SUMMARY
**What goes wrong:** checklist 显示完成，但 reconciliation 仍出现 `partial`。  
**Why it happens:** `requirements-completed` 缺失导致三源链路断开。  
**How to avoid:** 将 `SUMMARY frontmatter` 作为必改项纳入任务 Definition of Done。  
**Warning signs:** 审计表里 `VERIFICATION=passed`，`SUMMARY=missing`。  

### Pitfall 2: 使用 `summary-extract --fields requirements_completed` 作为唯一校验
**What goes wrong:** 命令返回不含目标字段，导致误判为“没有 requirements-completed”。  
**Why it happens:** 当前 `cmdSummaryExtract` 返回字段集中未包含 `requirements_completed`（实测仅返回 `path`）。  
**How to avoid:** 校验阶段改用 `frontmatter get --field requirements-completed` 或直接读取 frontmatter。  
**Warning signs:** `summary-extract` 输出只有 `path`，没有需求数组。  

### Pitfall 3: 回写范围膨胀到功能代码
**What goes wrong:** 为修元数据触发不必要代码改动，增加回归面。  
**Why it happens:** 没有把 phase 目标限定在 `.planning` 文档层。  
**How to avoid:** 任务清单中明确“禁止修改 `ui/components/**`”。  
**Warning signs:** PR/变更集中出现组件逻辑文件改动。  

## Code Examples

Verified patterns from repository/tooling:

### 1) 批量标记需求完成（勾选 + traceability 状态）
```bash
# Source: /home/whj/.claude/get-shit-done/bin/gsd-tools.cjs (cmdRequirementsMarkComplete)
node /home/whj/.claude/get-shit-done/bin/gsd-tools.cjs requirements mark-complete UX-01 UX-02 STAB-01 STAB-02
```

### 2) 读取 summary 中 requirements-completed
```bash
# Source: /home/whj/.claude/get-shit-done/bin/gsd-tools.cjs (frontmatter get)
node /home/whj/.claude/get-shit-done/bin/gsd-tools.cjs frontmatter get .planning/phases/03-variable-picker-interaction/03-01-SUMMARY.md --field requirements-completed --raw
```

### 3) 对账矩阵（建议在 07-VERIFICATION 中固化）
```markdown
| REQ-ID  | Verification | Summary requirements-completed | REQUIREMENTS checkbox | Traceability Status | Final |
|---------|--------------|--------------------------------|-----------------------|---------------------|-------|
| UX-01   | passed       | listed                         | [x]                   | Complete            | satisfied |
| UX-02   | passed       | listed                         | [x]                   | Complete            | satisfied |
| STAB-01 | passed       | listed                         | [x]                   | Complete            | satisfied |
| STAB-02 | passed       | listed                         | [x]                   | Complete            | satisfied |
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| 需求完成主要靠人工同步，多源容易漂移 | 通过 phase 审计矩阵和 frontmatter 契约统一判定 | v0.5.0 audit/gap closure 后 | 可重复检查，但要求 SUMMARY frontmatter 必须准确 |
| 只看 checkbox 判断完成 | 三源交叉（VERIFICATION + SUMMARY + REQUIREMENTS） | audit workflow 引入后 | 降低“账面完成”误判 |

**Deprecated/outdated:**
- 仅依赖 `REQUIREMENTS` 勾选状态作为完成依据：已不足以通过里程碑审计。  

## Open Questions

1. **四个目标 ID 的 `requirements-completed` 应写在 Phase 7 SUMMARY，还是回填到 Phase 2/3 历史 SUMMARY？**
   - What we know: 现有 gap closure 流程将这些 ID traceability 重新映射到 Phase 7。  
   - What's unclear: 团队希望“按原实现 phase 归属”还是“按 gap closure phase 归属”。  
   - Recommendation: 规划阶段先锁定口径；若保持当前映射（Phase 7），优先在 `07-01-SUMMARY.md` 维护这 4 个 ID。  

2. **是否需要追加一次里程碑审计作为 Phase 7 强制验收？**
   - What we know: 成功标准明确要求“cross-source reconciliation 不再 partial（metadata drift）”。  
   - What's unclear: 该项目当前是否在 Phase 完成时自动触发 re-audit。  
   - Recommendation: 在 07-01 验证步骤中显式加入重新对账（必要时执行 `/gsd:audit-milestone`）。  

## Sources

### Primary (HIGH confidence)
- `.planning/ROADMAP.md` - Phase 7 goal/requirements/success criteria
- `.planning/REQUIREMENTS.md` - 当前 checkbox 与 traceability 漂移现状
- `.planning/phases/02-input-stability/02-VERIFICATION.md` - STAB-01/STAB-02 satisfied evidence
- `.planning/phases/03-variable-picker-interaction/03-VERIFICATION.md` - UX-01/UX-02 satisfied evidence
- `.planning/v0.5.0-MILESTONE-AUDIT.md` - INT-02 与 partial 判定背景
- `/home/whj/.claude/get-shit-done/templates/summary.md` - `requirements-completed` 为 REQUIRED 的模板约束
- `/home/whj/.claude/get-shit-done/workflows/audit-milestone.md` - 三源对账口径与状态矩阵
- `/home/whj/.claude/get-shit-done/bin/gsd-tools.cjs` - `requirements mark-complete`/`frontmatter get` 实现

### Secondary (MEDIUM confidence)
- `/home/whj/.claude/get-shit-done/workflows/plan-milestone-gaps.md` - gap closure 对 REQUIREMENTS phase 映射重置策略

### Tertiary (LOW confidence)
- None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - 全部来自仓库内现有工作流/工具实现，无外部假设
- Architecture: HIGH - 由 audit matrix 与当前 phase 文档结构直接推导
- Pitfalls: HIGH - 已通过当前文件状态与命令实测（含 summary-extract 行为）验证

**Research date:** 2026-02-26
**Valid until:** 30 days（流程与文档结构短期稳定）
