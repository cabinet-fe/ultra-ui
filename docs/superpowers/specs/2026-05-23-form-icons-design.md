# Spec: Form Icons Redesign & Additions (Geometric Outline Style)

This spec defines the visual redesign and additions of form-system icons in the `@veltra/icons` package, keeping them rounded, clean, and highly legible at `16x16` viewport size.

## Visual Design System Specs
1. **Grid size**: `16x16` viewbox.
2. **Stroke width**: Uniform `1.2px` stroke for consistent visual weight.
3. **Corner rounding**: `1.5px` to `2px` border-radius (`rx` and `ry`) for rectangular outlines, `stroke-linecap="round"` and `stroke-linejoin="round"` for smooth round ends.
4. **Simplification**: Single-line outline representations, removing all double lines, nested boxes, and complex grid structures.

---

## Icon Specifications

### Group 1: Base Input Fields (基础输入框类)

#### 1. Input (`input.svg`)
* **Description**: A rounded rectangle representing a text field with a single round vertical cursor.
* **Markup**:
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
  <rect x="1" y="4" width="14" height="8" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.2"/>
  <path d="M4 6v4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
</svg>
```

#### 2. Textarea (`textarea.svg`)
* **Description**: A larger rounded rectangle with two horizontal lines indicating multi-line text lines.
* **Markup**:
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
  <rect x="1" y="2" width="14" height="12" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.2"/>
  <path d="M4 5.5h8M4 8.5h5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
</svg>
```

#### 3. Select (`select.svg`)
* **Description**: A rounded rectangle with a clean downward chevron arrow on the right.
* **Markup**:
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
  <rect x="1" y="4" width="14" height="8" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.2"/>
  <path d="m10.5 7.5 1.5 1.5 1.5-1.5" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

#### 4. Password Input (`password-input.svg`) [NEW]
* **Description**: A rounded rectangle with three round filled dots as character masks.
* **Markup**:
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
  <rect x="1" y="4" width="14" height="8" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.2"/>
  <circle cx="5" cy="8" r="1" fill="currentColor"/>
  <circle cx="8" cy="8" r="1" fill="currentColor"/>
  <circle cx="11" cy="8" r="1" fill="currentColor"/>
</svg>
```

#### 5. Number Input (`number-input.svg`)
* **Description**: A rounded rectangle with a vertical divider and micro up/down chevrons on the right.
* **Markup**:
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
  <rect x="1" y="4" width="14" height="8" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.2"/>
  <path d="M11 4v8M12.5 7l1-1.5 1 1.5M12.5 9l1 1.5-1-1.5" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

#### 6. Number Range Input (`number-range-input.svg`) [NEW]
* **Description**: Two parallel half-width input rectangles connected with a dash in the middle.
* **Markup**:
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
  <rect x="1" y="4" width="6" height="8" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.2"/>
  <rect x="9" y="4" width="6" height="8" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.2"/>
  <path d="M7.5 8h1" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
</svg>
```

#### 7. Multi-Select (`multi-select.svg`) [NEW]
* **Description**: A rounded rectangle containing two small sub-tag outline rectangles and a chevron down.
* **Markup**:
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
  <rect x="1" y="4" width="14" height="8" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.2"/>
  <rect x="3" y="6" width="3" height="4" rx="1" fill="none" stroke="currentColor" stroke-width="1"/>
  <rect x="7" y="6" width="3" height="4" rx="1" fill="none" stroke="currentColor" stroke-width="1"/>
  <path d="m11.5 7.5 1 1 1-1" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

---

### Group 2: Selection Controls & Indicators (选择与控制类)

#### 8. Checkbox (`checkbox.svg`)
* **Description**: A rounded square with a smooth, round-cap checkmark inside.
* **Markup**:
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
  <rect x="2" y="2" width="12" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="1.2"/>
  <path d="m5 8 2 2 4-4" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

#### 9. Radio (`radio.svg`)
* **Description**: A round circle outline with a smaller solid circle in the center.
* **Markup**:
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
  <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.2"/>
  <circle cx="8" cy="8" r="2.5" fill="currentColor"/>
</svg>
```

#### 10. Switch (`switch.svg`)
* **Description**: A pill-shaped capsule outline with a smaller solid circle knob active on the right.
* **Markup**:
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
  <rect x="1" y="4" width="14" height="8" rx="4" fill="none" stroke="currentColor" stroke-width="1.2"/>
  <circle cx="11" cy="8" r="2.2" fill="currentColor"/>
</svg>
```

#### 11. Slider (`slider.svg`) [NEW]
* **Description**: A horizontal track line with a small solid circle slider handle centered at one third of the line.
* **Markup**:
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
  <path d="M1.5 8h13" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
  <circle cx="6" cy="8" r="2.2" fill="currentColor"/>
</svg>
```

#### 12. Date Picker (`date-picker.svg`)
* **Description**: A rounded calendar shape with two binder rings at the top, a horizontal line, and four tidy grid dots.
* **Markup**:
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
  <rect x="2" y="3" width="12" height="11" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.2"/>
  <path d="M2 7h12M5 1v3M11 1v3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
  <circle cx="5" cy="9.5" r="0.6" fill="currentColor"/>
  <circle cx="8" cy="9.5" r="0.6" fill="currentColor"/>
  <circle cx="11" cy="9.5" r="0.6" fill="currentColor"/>
  <circle cx="5" cy="12" r="0.6" fill="currentColor"/>
</svg>
```

#### 13. Date Range Picker (`date-range-picker.svg`) [NEW]
* **Description**: A longer calendar shape with three binder rings, a horizontal line, and a pill range highlight inside.
* **Markup**:
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
  <rect x="1" y="3" width="14" height="11" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.2"/>
  <path d="M1 7h14M4 1v3M12 1v3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
  <rect x="4" y="9.5" width="8" height="2" rx="1" fill="currentColor"/>
</svg>
```

---

### Group 3: Complex Trees, Selectors & Containers (结构与容器类)

#### 14. Tree Select (`tree-select.svg`) [NEW]
* **Description**: A tree branch structure on the left with circular nodes, and a chevron down on the right.
* **Markup**:
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
  <path d="M3 2v12M3 6h4M3 11h4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
  <circle cx="9" cy="6" r="1" fill="currentColor"/>
  <circle cx="9" cy="11" r="1" fill="currentColor"/>
  <path d="m12 7.5 1 1 1-1" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

#### 15. Multi Tree Select (`multi-tree-select.svg`) [NEW]
* **Description**: A tree branch structure on the left with checkbox nodes, and a chevron down on the right.
* **Markup**:
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
  <path d="M3 2v12M3 6h3M3 11h3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
  <rect x="7" y="4.5" width="3" height="3" rx="0.5" fill="none" stroke="currentColor" stroke-width="1"/>
  <rect x="7" y="9.5" width="3" height="3" rx="0.5" fill="none" stroke="currentColor" stroke-width="1"/>
  <path d="m12.5 7.5 1 1 1-1" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

#### 16. Cascader (`cascader.svg`)
* **Description**: Two parallel vertical columns representing hierarchical selection list cards, with a chevron right in the first column.
* **Markup**:
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
  <rect x="1" y="2" width="6" height="12" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.2"/>
  <rect x="9" y="2" width="6" height="12" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.2"/>
  <path d="m4 7.5 1 1-1 1" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

#### 17. Table (`table.svg`)
* **Description**: A rounded square outer frame with clean columns and rows.
* **Markup**:
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
  <rect x="1" y="1" width="14" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1.2"/>
  <path d="M1 5h14M1 10h14M5 1v14" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
</svg>
```

#### 18. Form (`form.svg`)
* **Description**: A document outline representing a form sheet containing structured label-input rows and a submit button.
* **Markup**:
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
  <rect x="2" y="1" width="12" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1.2"/>
  <path d="M4 4.5h2M4 8.5h2" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
  <rect x="7" y="3.5" width="5" height="2" rx="0.5" fill="none" stroke="currentColor" stroke-width="1"/>
  <rect x="7" y="7.5" width="5" height="2" rx="0.5" fill="none" stroke="currentColor" stroke-width="1"/>
  <rect x="4" y="11.5" width="8" height="2" rx="1" fill="currentColor"/>
</svg>
```

---

### Group 4: Helper Form Elements (辅助型元素类)

#### 19. Auto Complete (`auto-complete.svg`) [NEW]
* **Description**: A rounded rectangle with a vertical cursor and a small four-point spark on the right.
* **Markup**:
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
  <rect x="1" y="4" width="14" height="8" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.2"/>
  <path d="M4 6v4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
  <path d="M11 7h2M12 6v2" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
</svg>
```

#### 20. File Picker (`file-picker.svg`) [NEW]
* **Description**: A rounded folder silhouette containing a clean upward upload arrow.
* **Markup**:
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
  <path d="M1.5 3.5v9A1.5 1.5 0 0 0 3 14h10a1.5 1.5 0 0 0 1.5-1.5V5a1.5 1.5 0 0 0-1.5-1.5H8L6.5 2H3A1.5 1.5 0 0 0 1.5 3.5z" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M8 6.5v4.5M6 8.5 8 6.5l2 2" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

---

## Verification & Build Plan
1. **SVG Formatter (`bun run icons:format`)**: Run SVGO formatting on the SVGs to ensure they are optimized and clean.
2. **Vue Generation (`bun run icons:gen`)**: Compile standard SVG source files into Vue components and export them under `@veltra/icons/normal`.
3. **Build Packages (`bun run build`)**: Rebuild the whole package using `tsdown` and check that type declarations are generated.
