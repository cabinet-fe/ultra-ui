# excel — 工作簿模型

## Workbook

```typescript
import { Workbook } from '@cat-kit/excel'

const wb = new Workbook({ creator?, lastModifiedBy?, createdAt?, modifiedAt? })
wb.addWorksheet('Sheet1', { frozenPane?: { ySplit?, xSplit?, topLeftCell? } })
wb.getWorksheet('Sheet1')   // 或按索引
wb.worksheets                // 只读快照
wb.removeWorksheet('Sheet1')
```

## Worksheet

```typescript
sheet.setCell('A1', '产品')
sheet.setCell('B1', 3600, { numberFormat: '#,##0.00' })
sheet.getCell('A1')
sheet.row(1)                 // 1-based
sheet.addRow(['col1', 'col2'])
sheet.setColumn(1, { width: 20, hidden: false })
sheet.getRows() / sheet.getColumns()
sheet.maxRowIndex() / sheet.maxColIndex()
```

## Row

```typescript
row.setCell('A', value, style?)
row.getCell('A')
row.getCells()     // [column, cell][]
row.toValues()     // 值数组，空洞补 null
```

## Cell

```typescript
import { Cell } from '@cat-kit/excel'

// value: string | number | boolean | null | Date | { formula, result? }
// style: { font, fill, border, alignment, numberFormat, protection }
const cell = new Cell(value?, style?)
cell.setValue(42)
cell.setStyle({ numberFormat: '0.00%' })
cell.clone()
```
