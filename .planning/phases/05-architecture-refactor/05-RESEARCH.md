# Phase 5: Architecture Refactor - Research

**Researched:** 2026-02-26
**Domain:** Expression editor internal architecture modularization and extension design
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

No CONTEXT.md exists for this phase.

Planning constraints come from roadmap + completed phases:
- Keep public API compatibility; avoid downstream breakage.
- Phase 5 depends on Phase 4 completed behavior (variable-node drag/drop + fallback controls).
- Focus requirement IDs: ARCH-01, ARCH-02.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ARCH-01 | Developer can identify and modify expression editor responsibilities in modular boundaries (sync, insertion, drag/drop, rendering) without touching unrelated code paths. | Recommends explicit feature boundaries, command-pack split, and dependency direction rules so each responsibility can evolve independently. |
| ARCH-02 | Developer can extend expression editor internals while preserving existing public API compatibility for consumers. | Recommends stable public facade (`props`/`emits`/exports), internal adapter layer, compatibility tests, and extension contracts behind the facade. |
</phase_requirements>

## Summary

Current implementation is functional but architecture boundaries are still implicit: `use-editor.ts` mixes editor lifecycle and model sync, `plain-text.ts` is a large command aggregation point (core text editing + clipboard + drag/drop), `expression-editor.vue` carries orchestration plus insertion and fallback move logic, and `use-context.ts` couples trigger detection with keyboard interception. This makes local changes possible but not yet isolated by design.

Phase 4 established a strong baseline for drag/drop (`use-expression-drag-drop.ts` as shared reorder engine), which should now be generalized into a Phase 5 internal architecture rule: each capability (sync, insertion, drag/drop, rendering) must have a dedicated module boundary and an explicit contract. This preserves behavior while reducing cross-feature edits.

For ARCH-02, the safest strategy is a **facade-first refactor**: keep external contract unchanged (`UExpressionEditor`, `ExpressionEditorProps`, `update:modelValue`) and move internals behind composable/feature adapters. Refactor should be incremental with compatibility tests for parse/serialize, IME safety, picker workflow, and drag/drop parity.

**Primary recommendation:** Execute Phase 5 as an internal “ports-and-adapters” refactor: freeze public API, split feature modules by responsibility, route all state mutations through explicit editor-domain services, and enforce compatibility by regression tests before/after each split.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `lexical` | `^0.40.0` | Editor state, commands, node model | Existing foundation; command/listener APIs already used across all editor responsibilities |
| `@lexical/utils` | `^0.40.0` | listener composition (`mergeRegister`) | Standard cleanup/composition pattern for modular command packs |
| `@lexical/clipboard` | `^0.40.0` | plain-text clipboard interoperability | Already integrated in text pipeline; avoids custom clipboard edge handling |
| `vue` | `^3.5.27` (peer) | Composition API, `provide/inject`, component facade | Existing component model; supports internal modularization without API change |

### Supporting
| Library/Module | Version | Purpose | When to Use |
|----------------|---------|---------|-------------|
| `VariableNode` (`DecoratorNode`) | internal | Variable token rendering + serialization | Rendering/insertion boundary and extensibility anchor |
| `parseContent` | internal | `{variable}` parse -> Lexical nodes | Model sync deserialize boundary |
| `use-expression-drag-drop.ts` | internal | Drag payload/slot/reorder utilities | Drag/drop boundary with shared engine |
| `ExpressionEditorDIKey` | internal | typed dependency boundary to child picker | Keep child integration stable during internal refactor |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Facade-first internal refactor | API-first redesign (new props/events) | Faster internal cleanup, but violates ARCH-02 compatibility target |
| Lexical command-pack modularization | Monolithic `plain-text.ts` continuation | Lower short-term cost, but cannot satisfy isolated-boundary success criteria |
| Typed internal service contracts | Ad-hoc cross-file direct calls | Less upfront structure, but extension points remain implicit and fragile |

**Installation:**
```bash
# No new dependency required for Phase 5.
# Keep existing versions in ui/package.json aligned:
bun add lexical @lexical/utils @lexical/clipboard
```

## Architecture Patterns

### Recommended Project Structure
```
ui/components/expression-editor/
├── expression-editor.vue                 # public facade only (props/emits/wiring)
├── internal/
│   ├── editor-runtime/
│   │   ├── create-editor.ts              # createEditor + node registration
│   │   └── sync-model.ts                 # modelValue<->editorState guards
│   ├── features/
│   │   ├── insertion/
│   │   │   ├── use-insertion.ts          # @ insertion orchestration
│   │   │   └── context-trigger.ts        # selection trigger + key routing
│   │   ├── drag-drop/
│   │   │   ├── command-pack.ts           # DRAGSTART/DRAGOVER/DROP registration
│   │   │   └── reorder-engine.ts         # slot + reorder pure operations
│   │   └── rendering/
│   │       ├── variable-node.tsx         # node rendering/serialization
│   │       └── decorators.tsx            # teleport rendering adapter
│   └── contracts/
│       ├── editor-services.ts            # typed ports between features
│       └── compatibility.ts              # API compatibility assertions
├── parser.ts                             # keep stable parse boundary
└── __test__/                             # behavior + compatibility suites
```

### Pattern 1: Public Facade Freeze
**What:** Keep external exports/types/events unchanged; move internal logic out of facade component.
**When to use:** Entire Phase 5 execution.
**Example:**
```typescript
// facade keeps contract stable
defineProps<ExpressionEditorProps>()
defineEmits<{ (e: 'update:modelValue', value: string): void }>()

// internals delegated to modular runtime/features
const runtime = useExpressionEditorRuntime({ props, emit, containerRef })
```

### Pattern 2: Command Packs by Capability
**What:** Split command registration into capability packs (`text-editing`, `clipboard`, `drag-drop`, `context-keys`), each returning cleanup.
**When to use:** Refactoring current `plain-text.ts`.
**Example:**
```typescript
// Source pattern: Lexical registerCommand + remove listener callback
const removeListeners = mergeRegister(
  registerTextEditingCommands(editor),
  registerClipboardCommands(editor),
  registerDragDropCommands(editor, dragDropServices),
  registerContextKeyCommands(editor, contextServices)
)
```

### Pattern 3: Single Mutation Gateway
**What:** Centralize all document mutations behind typed services (`insertVariable`, `reorderVariable`, `replaceModelValue`) called inside `editor.update`.
**When to use:** Insertion, drag/drop, sync refactor.
**Example:**
```typescript
interface EditorMutationService {
  replaceFromModel(value: string): void
  insertVariableAtTrigger(input: InsertVariableInput): boolean
  reorderVariable(input: ReorderInput): boolean
}
```

### Pattern 4: Compatibility Adapter Layer
**What:** Internal features consume adapter contracts, not raw `props` shape or direct component state refs.
**When to use:** Picker, fallback controls, and future extension points.
**Example:**
```typescript
interface ExpressionEditorPublicAdapter {
  getVariables(): VariableItem[]
  emitModelValue(next: string): void
  isEditable(): boolean
}
```

### Pattern 5: Feature Regression as Architecture Contract
**What:** Treat existing behavior suites as non-regression contracts for each boundary.
**When to use:** Every refactor step merge gate.
**Example:**
```typescript
// keep tests mapped to boundaries
// - sync: STAB-01/02
// - parser: STAB-03
// - insertion: UX-01/02
// - drag-drop: UX-03
```

### Anti-Patterns to Avoid
- **Facade leakage:** putting new business logic back into `expression-editor.vue`.
- **Cross-feature mutation:** insertion code directly moving drag-drop nodes or sync flags.
- **Hidden coupling via shared refs:** multiple modules mutating `textNode`/`charPosition` without service boundary.
- **Behavior-only refactor without compatibility guardrails:** no golden tests for pre/post behavior.
- **Public export drift:** changing `ui/components/expression-editor/index.ts` or type surface during internal refactor.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Module lifecycle orchestration | Custom listener registry framework | Lexical `register*` + `mergeRegister` cleanup pattern | Native to current stack; lowers lifecycle bug risk |
| Cross-feature event bus | New global pub/sub for editor internals | Typed feature contracts + direct dependency injection | Keeps dependency graph explicit and testable |
| Manual DOM-render sync layer | DOM-first re-render engine | Lexical node/update model + Vue decorators | Prevents model/DOM divergence |
| API compatibility tracking | Ad-hoc manual review only | Compatibility tests + snapshot/contract checks | Makes ARCH-02 verifiable and repeatable |

**Key insight:** Phase 5 should optimize for **change isolation**, not just file splitting. If dependency direction and mutation gateways are unclear, modular folders alone do not satisfy ARCH-01.

## Common Pitfalls

### Pitfall 1: “Split Files, Keep Coupling”
**What goes wrong:** Code appears modular by folders, but features still read/mutate each other’s internal refs.
**Why it happens:** No explicit internal contracts.
**How to avoid:** Define capability interfaces first, then move implementation.
**Warning signs:** Refactor PR still touches 4+ unrelated files for a single behavior tweak.

### Pitfall 2: Sync Regression During Runtime Split
**What goes wrong:** cursor jump/text overwrite regressions reappear.
**Why it happens:** `changeByUser/changeByModel/lastEmittedValue` guards drift while extracting modules.
**How to avoid:** Preserve guards as a dedicated sync module with parity tests.
**Warning signs:** `v-model` parent updates overwrite user typing intermittently.

### Pitfall 3: Command Priority Drift
**What goes wrong:** picker keyboard handling or enter behavior changes unexpectedly.
**Why it happens:** command packs move without preserving priority/handler ordering.
**How to avoid:** codify priority and propagation expectations in tests.
**Warning signs:** Enter/Arrow behavior differs when picker visible vs hidden.

### Pitfall 4: Compatibility Break by Internal Convenience
**What goes wrong:** external consumers break after internal refactor despite “no API intent.”
**Why it happens:** accidental changes to exported component/type paths or event semantics.
**How to avoid:** add API compatibility checks at package export + type + behavior levels.
**Warning signs:** sample/demo usage requires updates unrelated to new features.

### Pitfall 5: Rendering and Data Contracts Diverge
**What goes wrong:** Variable label/type display and serialized text drift apart.
**Why it happens:** rendering changes in `VariableNode` not aligned with parser/sync contracts.
**How to avoid:** lock serialization invariants (`getTextContent`, parse round-trip) in tests.
**Warning signs:** `{variable}` round-trip changes after rendering-only edits.

## Code Examples

Verified patterns from official and in-repo sources:

### Modular command registration with cleanup
```typescript
// Source: Lexical command docs + current registerPlainText pattern
const remove = editor.registerCommand(
  SOME_COMMAND,
  payload => {
    // capability-local handling
    return true
  },
  COMMAND_PRIORITY_EDITOR
)

// teardown
remove()
```

### Typed provide/inject boundary for child integrations
```typescript
// Source: Vue 3 provide/inject docs + current ExpressionEditorDIKey usage
const key = Symbol() as InjectionKey<EditorFacadeContext>
provide(key, context)
const injected = inject(key)
```

### Refactor-safe mutation gateway
```typescript
// all mutations run via editor.update + service methods
editor.update(() => {
  mutationService.insertVariableAtTrigger(input)
})
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Monolithic command registration | Capability-oriented command packs | Phase 5 target | Enables isolated edits for sync/insertion/drag-drop |
| Component-level orchestration + feature logic mixed | Public facade + internal runtime/features | Phase 5 target | Keeps API stable while allowing internals to evolve |
| Implicit extension points by direct imports | Explicit feature contracts/adapters | Phase 5 target | Safe extensibility without downstream API churn |

**Deprecated/outdated:**
- Treating `plain-text.ts` as a permanent all-in-one extension point.
- Relying on cross-module mutable refs as de facto contracts.

## Open Questions

1. **Phase 5 extension scope**
   - What we know: ARCH-02 requires extensible internals without API break.
   - What's unclear: whether “extension” means internal team-only plugin points or future third-party customization.
   - Recommendation: default to internal extension contracts only in v0.5.0; postpone third-party plugin API.

2. **Compatibility assertion depth**
   - What we know: public API must remain stable.
   - What's unclear: whether compatibility gate should include generated `.d.ts` snapshot checks.
   - Recommendation: include at least export-surface + behavior compatibility tests in this phase; type snapshot can be optional follow-up.

3. **Render boundary ownership**
   - What we know: `VariableNode` currently owns display text and serialization text coupling.
   - What's unclear: whether label/type formatting should stay in node or move to render adapter.
   - Recommendation: keep serialization responsibility in node, move display formatting policy to dedicated renderer helper.

## Sources

### Primary (HIGH confidence)
- Context7 `/facebook/lexical`:
  - Commands: `editor.registerCommand` and cleanup pattern
  - Listeners: `registerUpdateListener` and waterfall warning
  - Nodes: custom `DecoratorNode` structure and serialization lifecycle
- Context7 `/vuejs/docs`:
  - Composition API `provide` / `inject`
  - `InjectionKey` typing pattern for stable dependency contracts
- Project source of truth:
  - `ui/components/expression-editor/expression-editor.vue`
  - `ui/components/expression-editor/use-editor.ts`
  - `ui/components/expression-editor/plain-text.ts`
  - `ui/components/expression-editor/use-context.ts`
  - `ui/components/expression-editor/use-expression-drag-drop.ts`
  - `ui/components/expression-editor/nodes/variable-node.tsx`
  - `ui/components/expression-editor/parser.ts`
  - `ui/components/expression-editor/__test__/drag-drop.test.ts`
  - `ui/components/expression-editor/__test__/parser.test.ts`
  - `.planning/ROADMAP.md`
  - `.planning/REQUIREMENTS.md`
  - `.planning/phases/04-drag-drop/04-VERIFICATION.md`

### Secondary (MEDIUM confidence)
- `.planning/phases/03-variable-picker-interaction/03-RESEARCH.md` (historical implementation context)
- `.planning/phases/04-drag-drop/04-RESEARCH.md` (decision rationale continuity)

### Tertiary (LOW confidence)
- None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - versions and core APIs verified in `ui/package.json` and Context7 docs.
- Architecture: HIGH - boundary recommendations directly derived from current coupling hotspots and official command/composable patterns.
- Pitfalls: HIGH - risks are evidenced by existing guard-sensitive code paths and known command/listener coupling points.

**Research date:** 2026-02-26
**Valid until:** 30 days (stack APIs stable; re-check if Lexical major upgrade happens)
