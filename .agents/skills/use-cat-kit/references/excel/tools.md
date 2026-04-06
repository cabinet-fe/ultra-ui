# excel — 地址与日期工具

## 地址

```typescript
import {
  columnToIndex, indexToColumn,
  parseCellAddress, formatCellAddress,
  pixelsToExcelWidth, excelWidthToPixels
} from '@cat-kit/excel'

columnToIndex('AA')          // 27
indexToColumn(27)            // 'AA'
parseCellAddress('C10')      // { row: 10, col: 3 }
formatCellAddress(10, 3)     // 'C10'
pixelsToExcelWidth(140)      // 20
```

列/行 1-based，最大列 16384（XFD），最大行 1048576。

## 日期序列号

```typescript
import { dateToExcelSerial, excelSerialToDate } from '@cat-kit/excel'

dateToExcelSerial(new Date(), 1900)
excelSerialToDate(45000, 1900)
```

## 错误类型

`ExcelParseError`(解析) / `ExcelWriteError`(写入) / `ExcelSchemaError`(结构) / `ExcelValueError`(参数)
