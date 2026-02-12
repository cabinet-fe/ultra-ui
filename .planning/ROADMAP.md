# Roadmap: Ultra UI — v0.5.0 重构表达式组件

## Overview

This roadmap delivers the expression editor refactor for milestone v0.5.0. Phases proceed from visual foundation → input stability → interaction polish → drag/drop → architecture refactor, preserving existing public API and avoiding breaking changes for downstream consumers.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3, 4, 5): Planned milestone work
- Decimal phases (e.g., 2.1, 2.2): Urgent insertions (marked with INSERTED)

- [x] **Phase 1: Visual Foundation** — Design tokens and state feedback
- [x] **Phase 2: Input Stability** — Model sync, IME, format compatibility
- [ ] **Phase 3: Variable Picker Interaction** — @ trigger & keyboard
- [ ] **Phase 4: Drag-Drop** — Implement or document
- [ ] **Phase 5: Architecture Refactor** — Modular boundaries, extensibility

## Phase Details

### Phase 1: Visual Foundation

**Goal:** Expression editor visuals align with Ultra UI design language
**Depends on:** Nothing (first phase)
**Requirements:** UI-01, UI-02, UI-03
**Success Criteria** (what must be TRUE):
  1. User can see expression editor using design tokens (color, border, radius, shadow)
  2. User can see distinct visual feedback for default, focus, disabled, and readonly states
  3. User can view variable nodes and variable picker panels without flickering or inconsistency
**Plans:** 1 plan

Plans:
- [x] 01-01: Design tokens, state feedback, variable nodes, picker panel

### Phase 2: Input Stability

**Goal:** User input remains stable under external sync, IME, and format compatibility
**Depends on:** Phase 1
**Requirements:** STAB-01, STAB-02, STAB-03
**Success Criteria** (what must be TRUE):
  1. User can type without cursor jump, text loss, or overwrite when v-model syncs from parent
  2. User can compose IME (Chinese/Japanese/Korean) without interruption or corruption
  3. User can parse, edit, and re-serialize `{variable}` expressions without format break
**Plans:** 3 plans

Plans:
- [x] 02-01: Model sync — equality check, lastEmittedValue guard, SKIP_DOM_SELECTION_TAG
- [x] 02-02: IME safety — isComposing check in PreventDefaultListener
- [x] 02-03: Format compatibility — parser trailing text fix, fixture round-trip tests

### Phase 3: Variable Picker Interaction

**Goal:** Variable picker and keyboard selection work predictably
**Depends on:** Phase 2
**Requirements:** UX-01, UX-02
**Success Criteria** (what must be TRUE):
  1. User can trigger variable picker with `@` and insert variables without interrupting typing flow
  2. User can navigate variable picker with ArrowUp/ArrowDown, confirm with Enter, dismiss with Escape
**Plans:** 1 plan

Plans:
- [ ] 03-01: Command-to-picker wiring, variable picker registration, handleVariableSelect revalidation

### Phase 4: Drag-Drop

**Goal:** Drag/drop behavior is consistent with documented interaction
**Depends on:** Phase 3
**Requirements:** UX-03
**Success Criteria** (what must be TRUE):
  1. User can perform expression drag/drop (or equivalent documented interaction) with behavior matching component documentation
**Plans:** TBD

Plans:
- [ ] 04-01: (TBD during plan-phase)

### Phase 5: Architecture Refactor

**Goal:** Modular internals, extensible without breaking public API
**Depends on:** Phase 4
**Requirements:** ARCH-01, ARCH-02
**Success Criteria** (what must be TRUE):
  1. Developer can modify sync, insertion, drag/drop, or rendering in isolated boundaries without touching unrelated code paths
  2. Developer can extend expression editor internals while preserving existing public API compatibility for consumers
**Plans:** TBD

Plans:
- [ ] 05-01: (TBD during plan-phase)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Visual Foundation | 1/1 | Complete | 2026-02-12 |
| 2. Input Stability | 3/3 | Complete | 2026-02-12 |
| 3. Variable Picker Interaction | 0/1 | Not started | - |
| 4. Drag-Drop | 0/1 | Not started | - |
| 5. Architecture Refactor | 0/1 | Not started | - |
