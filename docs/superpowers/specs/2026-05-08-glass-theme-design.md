# Glass Theme Design Spec

## Overview

Implement a new "Glassmorphism" theme (`glass`) for the Ultra UI component library. The theme balances modern aesthetic trends with enterprise-grade usability, focusing on subtle blurs and vibrant accent colors.

## Design Decisions

1. **Visual Tone**: Subtle Glass. Restrained use of transparency to ensure text readability while providing a modern, airy feel.
2. **Background Filters**:
   - `blur(12px)` for a soft frosted glass effect.
   - `saturate(150%)` to bring out the vibrance of the content underneath the glass elements.
3. **Color Palette**:
   - Primary: High-saturation vibrant blue (`#3B82F6`) to pop against the translucent backgrounds.
   - Other semantic colors (success, warning, danger, info) should also lean towards high saturation for consistency.
4. **Shadow & Border**:
   - Borders: Very light borders (`#e2e8f0` in light mode, `#27272a` in dark mode) to define edges without being heavy.
   - Shadows: Large blur radius with very low opacity (e.g., `rgba(0, 0, 0, 0.04)`, `blur: 16px`) to emphasize the floating, lightweight nature of glass.

## Technical Architecture

1. **File Location**: `@packages/styles/src/theme/glass.ts`
2. **Implementation**:
   - Export `glassLightTheme` derived from `lightTheme.new(...)`.
   - Export `glassDarkTheme` derived from `glassLightTheme.new(...)`.
3. **Integration**: Update `@packages/styles/src/theme/index.ts` to export `glassLightTheme` and `glassDarkTheme`.

## Implementation Steps

1. Create `glass.ts` with the new theme definitions.
2. Update `index.ts` to export the new themes.
3. (Optional) Provide a simple test or verify the generated CSS vars to ensure correct token derivation.
