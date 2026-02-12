# Testing Patterns

**Analysis Date:** 2025-02-12

## Test Framework

**Runner:**

- Vitest 4.0.18 (`package.json` devDependencies)
- Config: `vitest.config.ts` at project root

**Config:**

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({ test: { globals: true } })
```

**Run Commands:**

- No `test` or `vitest` script in root `package.json`
- Run via: `bun vitest` or `bunx vitest` (if available)

## Test File Organization

**Location:**

- `ui/tsconfig.json` excludes `**/__test__/**/*`
- `cli/export/index.ts` excludes `__test__` from exports
- No `*.test.*` or `*.spec.*` files found in codebase

**Naming:**

- Expected pattern: `__test__/` directories or `*.test.ts` / `*.spec.ts` (per tsconfig exclude)
- No tests currently implemented

## Test Structure

**Expected pattern (from `designs/08-best-practices.md`):**

```typescript
describe('Button', () => {
  it('应渲染默认按钮', () => {
    const wrapper = mount(Button)
    expect(wrapper.classes()).toContain('u-button')
  })

  it('点击时应触发事件', async () => {
    const wrapper = mount(Button)
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeTruthy()
  })
})
```

**Accessibility testing (per designs):**

```typescript
it('应有正确的 ARIA 属性', () => {
  const wrapper = mount(Button, { props: { disabled: true } })
  expect(wrapper.attributes('aria-disabled')).toBe('true')
})
```

## Mocking

**Framework:** Vitest (built-in `vi`)

**Vue Components:**

- Would use `@vue/test-utils` for `mount` (not in current dependencies)
- No explicit mocking patterns in codebase

**What to Mock:**

- External icons: `@ultra/icon`
- `cat-kit` utilities
- DOM/ResizeObserver if needed

**What NOT to Mock:**

- Internal compositions and utils under test
- Vue reactivity

## Fixtures and Factories

**Test Data:**

- No fixtures or factories found
- Sample data lives in `sample/src/` for demo purposes only

**Location:**

- Consider `ui/__test__/fixtures/` or co-located `__test__/` per component

## Coverage

**Requirements:** None enforced

**View Coverage:**

```bash
bun vitest --coverage
```

(Requires `@vitest/coverage-*` if used)

## Test Types

**Unit Tests:**

- Would target: compositions (`use-model`, `use-pop`), utils (`validate`, `withUnit`), directives
- Components: `mount` + assertions on props, events, classes

**Integration Tests:**

- Not detected

**E2E Tests:**

- Not detected; sample app serves as manual demo

## Vue Testing Setup

**Dependencies:**

- `@vue/test-utils` not in `package.json`
- Add for component tests: `bun add -d @vue/test-utils @vue/compiler-sfc`

**Mounting:**

- Need to provide global components (`UIcon`, etc.) and plugins
- Path alias `@ui/*` must resolve in test env

## Common Patterns (Suggested)

**Async Testing:**

```typescript
it('async behavior', async () => {
  await wrapper.trigger('click')
  await nextTick()
  expect(...).toBe(...)
})
```

**Error Testing:**

```typescript
it('throws on invalid input', () => {
  expect(() => validate(...)).toThrow('expected message')
})
```

**Component Props:**

```typescript
const wrapper = mount(Component, {
  props: { modelValue: '...', disabled: true },
  slots: { default: 'content' }
})
```

## Gaps and Recommendations

**Current state:**

- Vitest is installed and configured
- No test scripts in package.json
- No test files
- No Vue Test Utils or coverage tooling

**Where to add tests:**

- `ui/utils/` (pure functions: `validate`, `withUnit`, `makeBEM`)
- `ui/compositions/` (e.g. `use-model`, `use-pop`)
- `ui/directives/` (logic in `click-outside`, `ripple`)
- `ui/components/*/` (component behavior)

**Suggested next steps:**

1. Add `"test": "vitest"` and `"test:run": "vitest run"` to root `package.json`
2. Add `@vue/test-utils` for component tests
3. Create `ui/__test__/utils/` and add tests for `validate`, `withUnit`, etc.
4. Add test setup file if global mocks or config are needed

---

_Testing analysis: 2025-02-12_
